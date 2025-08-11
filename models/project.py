"""
Project-related models
"""
from datetime import datetime
from . import db


# Association table for many-to-many relationship between testers and projects
tester_project_association = db.Table('tester_project',
    db.Column('tester_id', db.Integer, db.ForeignKey('tester.id'), primary_key=True),
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True)
)


class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship with projects
    projects = db.relationship('Project', backref='portfolio', lazy=True)

    def __repr__(self):
        return f'<Portfolio {self.name}>'


class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolio.id'), nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

    # Many-to-many relationship with testers
    testers = db.relationship('Tester', secondary=tester_project_association, back_populates='projects')

    def __repr__(self):
        return f'<Project {self.name}>'


class Tester(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

    # Role fields
    is_automation_engineer = db.Column(db.Boolean, default=False)
    is_manual_engineer = db.Column(db.Boolean, default=False)
    is_performance_tester = db.Column(db.Boolean, default=False)
    is_security_tester = db.Column(db.Boolean, default=False)
    is_api_tester = db.Column(db.Boolean, default=False)
    is_mobile_tester = db.Column(db.Boolean, default=False)
    is_web_tester = db.Column(db.Boolean, default=False)
    is_accessibility_tester = db.Column(db.Boolean, default=False)
    is_usability_tester = db.Column(db.Boolean, default=False)
    is_test_lead = db.Column(db.Boolean, default=False)

    # Many-to-many relationship with projects
    projects = db.relationship('Project', secondary=tester_project_association, back_populates='testers')

    @property
    def role_types(self):
        """Return list of role types for this tester"""
        roles = []
        if self.is_automation_engineer:
            roles.append('Automation Engineer')
        if self.is_manual_engineer:
            roles.append('Manual Engineer')
        if self.is_performance_tester:
            roles.append('Performance Tester')
        if self.is_security_tester:
            roles.append('Security Tester')
        if self.is_api_tester:
            roles.append('API Tester')
        if self.is_mobile_tester:
            roles.append('Mobile Tester')
        if self.is_web_tester:
            roles.append('Web Tester')
        if self.is_accessibility_tester:
            roles.append('Accessibility Tester')
        if self.is_usability_tester:
            roles.append('Usability Tester')
        if self.is_test_lead:
            roles.append('Test Lead')
        return roles

    @property
    def role_display(self):
        """Return formatted role display string"""
        roles = self.role_types
        if not roles:
            return 'Unspecified'
        return ', '.join(roles)

    def __repr__(self):
        return f'<Tester {self.name}>'


class TeamMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    role = db.Column(db.String(50), nullable=False)  # Updated to allow longer role names
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

    # Add validation for roles
    VALID_ROLES = [
        'Project Owner', 'Project Analyst', 'Project Manager', 'Business Analyst',
        'Technical Lead', 'Scrum Master', 'Product Owner', 'Quality Assurance Lead',
        'DevOps Engineer', 'UI/UX Designer', 'Database Administrator', 'Security Analyst',
        'System Administrator', 'Stakeholder', 'Client Representative'
    ]

    def __init__(self, **kwargs):
        super(TeamMember, self).__init__(**kwargs)
        if self.role not in self.VALID_ROLES:
            raise ValueError(f"Invalid role: {self.role}")

    def __repr__(self):
        return f'<TeamMember {self.name}>'


# Statistical Cache Models
class DashboardStats(db.Model):
    """Cache for overall dashboard statistics"""
    id = db.Column(db.Integer, primary_key=True)
    total_reports = db.Column(db.Integer, default=0)
    completed_reports = db.Column(db.Integer, default=0)
    in_progress_reports = db.Column(db.Integer, default=0)
    pending_reports = db.Column(db.Integer, default=0)
    total_user_stories = db.Column(db.Integer, default=0)
    total_test_cases = db.Column(db.Integer, default=0)
    total_issues = db.Column(db.Integer, default=0)
    total_enhancements = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)


class PortfolioStats(db.Model):
    """Cache for portfolio-level statistics"""
    id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolio.id'), nullable=False)
    portfolio_name = db.Column(db.String(100), nullable=False)
    total_reports = db.Column(db.Integer, default=0)
    total_projects = db.Column(db.Integer, default=0)
    total_user_stories = db.Column(db.Integer, default=0)
    total_test_cases = db.Column(db.Integer, default=0)
    total_issues = db.Column(db.Integer, default=0)
    total_enhancements = db.Column(db.Integer, default=0)
    last_report_date = db.Column(db.String(50))
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)


class ProjectStats(db.Model):
    """Cache for project-level statistics"""
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolio.id'), nullable=False)
    portfolio_name = db.Column(db.String(100), nullable=False)
    project_name = db.Column(db.String(100), nullable=False)
    total_reports = db.Column(db.Integer, default=0)
    total_user_stories = db.Column(db.Integer, default=0)
    total_test_cases = db.Column(db.Integer, default=0)
    total_issues = db.Column(db.Integer, default=0)
    total_enhancements = db.Column(db.Integer, default=0)
    last_report_date = db.Column(db.String(50))
    latest_testing_status = db.Column(db.String(50))
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)