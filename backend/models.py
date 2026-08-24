import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Upload(Base):
    __tablename__ = "uploads"
    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(String(100), default="admin")
    status = Column(String(20), default="draft")  # draft | published | archived | failed
    errors_count = Column(Integer, default=0)
    warnings_count = Column(Integer, default=0)
    error_details = Column(Text, default="[]")  # JSON string of errors/warnings

    gender_metrics = relationship("GenderMetric", back_populates="upload", cascade="all, delete-orphan")
    engagement_metrics = relationship("EngagementMetric", back_populates="upload", cascade="all, delete-orphan")
    volunteering_metrics = relationship("VolunteeringMetric", back_populates="upload", cascade="all, delete-orphan")
    esg_courses_metrics = relationship("EsgCoursesMetric", back_populates="upload", cascade="all, delete-orphan")


class Setting(Base):
    __tablename__ = "settings"
    key = Column(String(100), primary_key=True)
    value = Column(Text, default="")


class GenderMetric(Base):
    __tablename__ = "gender_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    upload_id = Column(Integer, ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    faculty = Column(String(255), nullable=False)
    group_type = Column(String(50), nullable=False)  # student | staff
    male_pct = Column(Float, nullable=False)
    female_pct = Column(Float, nullable=False)
    other_pct = Column(Float, nullable=True)
    women_leadership_pct = Column(Float, nullable=True)
    pay_gap_pct = Column(Float, nullable=True)

    upload = relationship("Upload", back_populates="gender_metrics")


class EngagementMetric(Base):
    __tablename__ = "engagement_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    upload_id = Column(Integer, ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    faculty = Column(String(255), nullable=False)
    satisfaction_pct = Column(Float, nullable=False)
    nps = Column(Float, nullable=True)
    club_participation_pct = Column(Float, nullable=True)
    avg_activities_per_student = Column(Float, nullable=True)

    upload = relationship("Upload", back_populates="engagement_metrics")


class VolunteeringMetric(Base):
    __tablename__ = "volunteering_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    upload_id = Column(Integer, ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    faculty = Column(String(255), nullable=False)
    volunteers_students = Column(Integer, nullable=False)
    volunteers_staff = Column(Integer, nullable=False)
    total_hours = Column(Float, nullable=False)
    projects_count = Column(Integer, nullable=False)
    top_direction = Column(String(255), nullable=True)

    upload = relationship("Upload", back_populates="volunteering_metrics")


class EsgCoursesMetric(Base):
    __tablename__ = "esg_courses_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    upload_id = Column(Integer, ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    faculty = Column(String(255), nullable=False)
    courses_count = Column(Integer, nullable=False)
    esg_students_pct = Column(Float, nullable=True)
    green_program_students = Column(Integer, nullable=True)

    upload = relationship("Upload", back_populates="esg_courses_metrics")
