import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SAEnum, JSON, Text, Uuid
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    DEVELOPER = "developer"
    LEAD = "lead"
    ADMIN = "admin"

class Provider(str, enum.Enum):
    GITHUB = "github"
    GITLAB = "gitlab"
    BITBUCKET = "bitbucket"

class ReviewStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class Severity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class IssueCategory(str, enum.Enum):
    BUG = "bug"
    SECURITY = "security"
    PERFORMANCE = "performance"
    MAINTAINABILITY = "maintainability"

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True) # Nullable for OAuth users
    role = Column(SAEnum(UserRole), default=UserRole.DEVELOPER)
    oauth_provider = Column(String, nullable=True)
    oauth_id = Column(String, nullable=True)
    github_access_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    repositories = relationship("Repository", back_populates="owner_user")

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    repo_name = Column(String, nullable=False)
    provider = Column(SAEnum(Provider), default=Provider.GITHUB)
    owner = Column(String, nullable=False) # e.g., GitHub organization or user
    webhook_secret = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner_user = relationship("User", back_populates="repositories")
    reviews = relationship("Review", back_populates="repository")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = Column(Uuid(as_uuid=True), ForeignKey("repositories.id"))
    pr_number = Column(Integer, nullable=False)
    pr_title = Column(String, nullable=True)
    status = Column(SAEnum(ReviewStatus), default=ReviewStatus.PENDING)
    severity_summary = Column(JSON, nullable=True) # e.g. {"critical": 0, "high": 2}
    review_text = Column(Text, nullable=True)
    ai_model = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    repository = relationship("Repository", back_populates="reviews")
    issues = relationship("Issue", back_populates="review")
    chat_messages = relationship("ChatMessage", back_populates="review")

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(Uuid(as_uuid=True), ForeignKey("reviews.id"))
    filename = Column(String, nullable=False)
    severity = Column(SAEnum(Severity), nullable=False)
    category = Column(SAEnum(IssueCategory), nullable=False)
    description = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=True)

    review = relationship("Review", back_populates="issues")

class ChatRole(str, enum.Enum):
    USER = "user"
    AI = "ai"

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(Uuid(as_uuid=True), ForeignKey("reviews.id"))
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    review = relationship("Review", back_populates="chat_messages")
