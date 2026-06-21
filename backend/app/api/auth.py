from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.db.models import User
from app.db.schemas import UserCreate, UserResponse, UserUpdate, Token
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.logger import logger
from datetime import timedelta

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    import jwt
    from jwt.exceptions import InvalidTokenError
    from app.core.config import settings
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    from app.core.logger import logger
    logger.info("Register endpoint hit")
    result = await db.execute(select(User).where(User.email == user_in.email))
    logger.info("Executed select")
    if result.scalars().first():
        logger.info("User exists")
        raise HTTPException(status_code=400, detail="Email already registered")
        
    logger.info("Hashing password...")
    password_hash = get_password_hash(user_in.password)
    logger.info("Creating user object...")
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=password_hash
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"New user registered: {user.email}")
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not user.password_hash or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_users_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user_in.email and user_in.email != current_user.email:
        result = await db.execute(select(User).where(User.email == user_in.email))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_in.email

    if user_in.name:
        current_user.name = user_in.name

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/github/login")
async def github_login():
    from app.core.config import settings
    from fastapi.responses import RedirectResponse
    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={settings.GITHUB_CLIENT_ID}&scope=user:email"
    return RedirectResponse(github_auth_url)

@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    from app.core.config import settings
    from fastapi.responses import RedirectResponse
    import httpx
    
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code
            }
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail=f"Failed to authenticate with GitHub. Response: {token_data}")
            
        # Get user info
        user_res = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "User-Agent": "Antigravity-AI-Review-Bot"
            }
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch user info from GitHub")
        user_info = user_res.json()
        
        # Get user emails to find the primary one
        email_res = await client.get(
            "https://api.github.com/user/emails",
            headers={
                "Authorization": f"Bearer {access_token}",
                "User-Agent": "Antigravity-AI-Review-Bot"
            }
        )
        if email_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch user emails from GitHub")
            
        emails = email_res.json()
        if not isinstance(emails, list):
            raise HTTPException(status_code=400, detail="Invalid email response from GitHub")
            
        primary_email = next((e["email"] for e in emails if isinstance(e, dict) and e.get("primary")), None)
        
        if not primary_email:
            raise HTTPException(status_code=400, detail="No primary email found on GitHub account")
            
    # Create or update user in DB
    result = await db.execute(select(User).where(User.email == primary_email))
    user = result.scalars().first()
    
    if not user:
        user = User(
            name=user_info.get("name") or user_info.get("login"),
            email=primary_email,
            password_hash="" # OAuth user, no password
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    # Issue JWT
    jwt_token = create_access_token(subject=user.email)
    
    # Redirect back to frontend
    redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}"
    return RedirectResponse(redirect_url)
