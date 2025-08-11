"""
Database models initialization
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models to ensure they are registered
from .report import Report
from .user import User, PasswordResetRequest
from .project import Portfolio, Project, Tester, TeamMember, DashboardStats, PortfolioStats, ProjectStats

__all__ = [
    'db',
    'Report',
    'User', 'PasswordResetRequest',
    'Portfolio', 'Project', 'Tester', 'TeamMember',
    'DashboardStats', 'PortfolioStats', 'ProjectStats'
]