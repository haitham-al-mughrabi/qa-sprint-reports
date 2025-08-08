from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import json
import re
import secrets

db = SQLAlchemy()

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Report Type - NEW FIELD for multi-report support
    reportType = db.Column(db.String(20), default='sprint', nullable=False)  # 'sprint', 'manual', 'automation', 'performance'

    # Cover Information
    portfolioName = db.Column(db.String(100), nullable=False)
    projectName = db.Column(db.String(100), nullable=False)
    sprintNumber = db.Column(db.Integer, nullable=True)  # Made nullable for performance reports
    reportVersion = db.Column(db.String(50))
    reportName = db.Column(db.String(255)) # New field for custom report name
    cycleNumber = db.Column(db.Integer)
    releaseNumber = db.Column(db.String(50)) # Add missing releaseNumber field
    reportDate = db.Column(db.String(50))

    # Environment field for all report types
    environment = db.Column(db.String(100))  # For all report types
    testType = db.Column(db.String(100))  # Test type (Load, Stress, Volume, etc.)
    testTool = db.Column(db.String(100))  # Testing tool (JMeter, LoadRunner, K6, etc.)
    testObjective = db.Column(db.Text)  # Test objectives
    testScope = db.Column(db.Text)  # Test scope

    # Test Summary
    testSummary = db.Column(db.Text)
    testingStatus = db.Column(db.String(50))

    # Dynamic data stored as JSON strings
    requestData = db.Column(db.Text, default='[]')
    buildData = db.Column(db.Text, default='[]')
    testerData = db.Column(db.Text, default='[]')
    teamMemberData = db.Column(db.Text, default='[]') # New field for team member data

    # User Stories Data (detailed breakdown)
    totalUserStories = db.Column(db.Integer, default=0)
    passedUserStories = db.Column(db.Integer, default=0)
    passedWithIssuesUserStories = db.Column(db.Integer, default=0)
    failedUserStories = db.Column(db.Integer, default=0)
    blockedUserStories = db.Column(db.Integer, default=0)
    cancelledUserStories = db.Column(db.Integer, default=0)
    deferredUserStories = db.Column(db.Integer, default=0)
    notTestableUserStories = db.Column(db.Integer, default=0)

    # Test Cases Data (detailed breakdown)
    totalTestCases = db.Column(db.Integer, default=0)
    passedTestCases = db.Column(db.Integer, default=0)
    passedWithIssuesTestCases = db.Column(db.Integer, default=0)
    failedTestCases = db.Column(db.Integer, default=0)
    blockedTestCases = db.Column(db.Integer, default=0)
    cancelledTestCases = db.Column(db.Integer, default=0)
    deferredTestCases = db.Column(db.Integer, default=0)
    notTestableTestCases = db.Column(db.Integer, default=0)

    # Issues Data (detailed breakdown)
    totalIssues = db.Column(db.Integer, default=0)
    criticalIssues = db.Column(db.Integer, default=0)
    highIssues = db.Column(db.Integer, default=0)
    mediumIssues = db.Column(db.Integer, default=0)
    lowIssues = db.Column(db.Integer, default=0)
    newIssues = db.Column(db.Integer, default=0)
    fixedIssues = db.Column(db.Integer, default=0)
    notFixedIssues = db.Column(db.Integer, default=0)
    reopenedIssues = db.Column(db.Integer, default=0)
    deferredIssues = db.Column(db.Integer, default=0)

    # Enhancements Data (detailed breakdown)
    totalEnhancements = db.Column(db.Integer, default=0)
    newEnhancements = db.Column(db.Integer, default=0)
    implementedEnhancements = db.Column(db.Integer, default=0)
    existsEnhancements = db.Column(db.Integer, default=0)

    # Testing Metrics (calculated fields)
    userStoriesMetric = db.Column(db.Integer, default=0)  # Auto-calculated from user stories
    testCasesMetric = db.Column(db.Integer, default=0)   # Auto-calculated from test cases
    issuesMetric = db.Column(db.Integer, default=0)      # Auto-calculated from issues
    enhancementsMetric = db.Column(db.Integer, default=0) # Auto-calculated from enhancements

    # QA Notes
    qaNotesData = db.Column(db.Text, default='[]')  # Store multiple QA notes as JSON array
    qaNoteFieldsData = db.Column(db.Text, default='[]')  # Store custom QA note fields as JSON array

    # Performance Report specific fields - Test Summary Section 1
    userLoad = db.Column(db.String(100))
    responseTime = db.Column(db.String(100))
    requestVolume = db.Column(db.String(100))
    errorRate = db.Column(db.String(100))
    slowestResponse = db.Column(db.String(100))
    fastestResponse = db.Column(db.String(100))
    numberOfUsers = db.Column(db.String(100))  # x VUs
    executionDuration = db.Column(db.String(100))

    # Performance Report specific fields - Test Summary Section 2
    maxThroughput = db.Column(db.String(100))
    httpFailures = db.Column(db.String(100))
    avgResponseTime = db.Column(db.String(100))
    responseTime95Percent = db.Column(db.String(100))

    # Performance Report JSON fields for complex data
    performanceCriteriaResults = db.Column(db.Text, default='[]')  # Table data for criteria/results
    performanceScenarios = db.Column(db.Text, default='[]')  # Performance test scenarios
    httpRequestsOverview = db.Column(db.Text, default='[]')  # HTTP requests status overview table

    # Automation Report specific fields
    coveredServices = db.Column(db.Text)  # Text area for services
    coveredModules = db.Column(db.Text)   # Text area for modules and test suites
    bugsData = db.Column(db.Text, default='[]')  # JSON array for bugs (similar to QA notes)

    # Evaluation Section (for Sprint and Manual reports only)
    evaluationData = db.Column(db.Text, default='[]')  # JSON array for evaluation criteria scores

    # Automation Regression Data
    # Section 1: Test Cases (auto-calculated from existing test cases)
    automationPassedTestCases = db.Column(db.Integer, default=0)
    automationFailedTestCases = db.Column(db.Integer, default=0)
    automationSkippedTestCases = db.Column(db.Integer, default=0)
    automationTotalTestCases = db.Column(db.Integer, default=0)  # Auto-calculated

    # Section 2: Percentages (auto-calculated from section 1)
    automationPassedPercentage = db.Column(db.Float, default=0.0)
    automationFailedPercentage = db.Column(db.Float, default=0.0)
    automationSkippedPercentage = db.Column(db.Float, default=0.0)

    # Section 3: Test Stability
    automationStableTests = db.Column(db.Integer, default=0)
    automationFlakyTests = db.Column(db.Integer, default=0)
    automationStabilityTotal = db.Column(db.Integer, default=0)  # Auto-calculated
    automationStablePercentage = db.Column(db.Float, default=0.0)
    automationFlakyPercentage = db.Column(db.Float, default=0.0)

    # Metadata
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def calculate_totals(self):
        """Calculate all total fields automatically"""
        # Calculate User Stories total
        self.totalUserStories = (
            (self.passedUserStories or 0) +
            (self.passedWithIssuesUserStories or 0) +
            (self.failedUserStories or 0) +
            (self.blockedUserStories or 0) +
            (self.cancelledUserStories or 0) +
            (self.deferredUserStories or 0) +
            (self.notTestableUserStories or 0)
        )
        self.userStoriesMetric = self.totalUserStories

        # Calculate Test Cases total
        self.totalTestCases = (
            (self.passedTestCases or 0) +
            (self.passedWithIssuesTestCases or 0) +
            (self.failedTestCases or 0) +
            (self.blockedTestCases or 0) +
            (self.cancelledTestCases or 0) +
            (self.deferredTestCases or 0) +
            (self.notTestableTestCases or 0)
        )
        self.testCasesMetric = self.totalTestCases

        # Calculate Issues total (by priority)
        self.totalIssues = (
            (self.criticalIssues or 0) +
            (self.highIssues or 0) +
            (self.mediumIssues or 0) +
            (self.lowIssues or 0)
        )
        self.issuesMetric = self.totalIssues

        # Calculate Enhancements total
        self.totalEnhancements = (
            (self.newEnhancements or 0) +
            (self.implementedEnhancements or 0) +
            (self.existsEnhancements or 0)
        )
        self.enhancementsMetric = self.totalEnhancements

        # Calculate Automation Regression totals and percentages
        self.automationTotalTestCases = (
            (self.automationPassedTestCases or 0) +
            (self.automationFailedTestCases or 0) +
            (self.automationSkippedTestCases or 0)
        )

        # Calculate automation test percentages
        if self.automationTotalTestCases > 0:
            self.automationPassedPercentage = round(((self.automationPassedTestCases or 0) / self.automationTotalTestCases) * 100, 2)
            self.automationFailedPercentage = round(((self.automationFailedTestCases or 0) / self.automationTotalTestCases) * 100, 2)
            self.automationSkippedPercentage = round(((self.automationSkippedTestCases or 0) / self.automationTotalTestCases) * 100, 2)
        else:
            self.automationPassedPercentage = 0.0
            self.automationFailedPercentage = 0.0
            self.automationSkippedPercentage = 0.0

        # Calculate automation stability totals and percentages
        self.automationStabilityTotal = (
            (self.automationStableTests or 0) +
            (self.automationFlakyTests or 0)
        )

        if self.automationStabilityTotal > 0:
            self.automationStablePercentage = round(((self.automationStableTests or 0) / self.automationStabilityTotal) * 100, 2)
            self.automationFlakyPercentage = round(((self.automationFlakyTests or 0) / self.automationStabilityTotal) * 100, 2)
        else:
            self.automationStablePercentage = 0.0
            self.automationFlakyPercentage = 0.0

    def validate_report_type(self):
        """Validate that the report type is one of the allowed values"""
        allowed_types = ['sprint', 'manual', 'automation', 'performance']
        if self.reportType not in allowed_types:
            return False, f"Invalid report type. Must be one of: {', '.join(allowed_types)}"
        return True, "Valid report type"

    def validate_required_fields(self):
        """Validate required fields based on report type"""
        errors = []
        
        # Common required fields for all report types
        if not self.portfolioName:
            errors.append("Portfolio name is required")
        if not self.projectName:
            errors.append("Project name is required")
        if not self.reportDate:
            errors.append("Report date is required")
        
        # Type-specific validation
        if self.reportType == 'sprint':
            if not self.sprintNumber:
                errors.append("Sprint number is required for Sprint reports")
        elif self.reportType == 'manual':
            if not self.sprintNumber:
                errors.append("Sprint number is required for Manual reports")
        elif self.reportType == 'performance':
            if not self.environment:
                errors.append("Environment is required for Performance reports")
            # Sprint number is optional for performance reports
        # Automation reports can work with or without sprint number
        
        return len(errors) == 0, errors

    def validate_performance_data(self):
        """Validate performance report specific data"""
        if self.reportType != 'performance':
            return True, []
        
        errors = []
        
        # Validate JSON fields
        try:
            if self.performanceCriteriaResults:
                json.loads(self.performanceCriteriaResults)
        except (json.JSONDecodeError, TypeError):
            errors.append("Invalid performance criteria results data")
        
        try:
            if self.performanceScenarios:
                json.loads(self.performanceScenarios)
        except (json.JSONDecodeError, TypeError):
            errors.append("Invalid performance scenarios data")
        
        try:
            if self.httpRequestsOverview:
                json.loads(self.httpRequestsOverview)
        except (json.JSONDecodeError, TypeError):
            errors.append("Invalid HTTP requests overview data")
        
        return len(errors) == 0, errors

    def validate_automation_data(self):
        """Validate automation report specific data"""
        if self.reportType != 'automation':
            return True, []
        
        errors = []
        
        # Validate bugs data JSON
        try:
            if self.bugsData:
                json.loads(self.bugsData)
        except (json.JSONDecodeError, TypeError):
            errors.append("Invalid bugs data")
        
        return len(errors) == 0, errors

    def validate_all(self):
        """Run all validation checks for the report"""
        all_errors = []
        
        # Check report type
        is_valid, message = self.validate_report_type()
        if not is_valid:
            all_errors.append(message)
            return False, all_errors  # Stop if report type is invalid
        
        # Check required fields
        is_valid, errors = self.validate_required_fields()
        if not is_valid:
            all_errors.extend(errors)
        
        # Check performance data
        is_valid, errors = self.validate_performance_data()
        if not is_valid:
            all_errors.extend(errors)
        
        # Check automation data
        is_valid, errors = self.validate_automation_data()
        if not is_valid:
            all_errors.extend(errors)
        
        return len(all_errors) == 0, all_errors

    def to_dict(self):
        """Converts the Report object to a dictionary for JSON serialization."""
        return {
            'id': self.id,
            'reportType': self.reportType,
            'portfolioName': self.portfolioName,
            'projectName': self.projectName,
            'sprintNumber': self.sprintNumber,
            'reportVersion': self.reportVersion,
            'reportName': self.reportName,
            'cycleNumber': self.cycleNumber,
            'releaseNumber': self.releaseNumber,
            'reportDate': self.reportDate,
            'environment': self.environment,
            'testType': self.testType,
            'testTool': self.testTool,
            'testObjective': self.testObjective,
            'testScope': self.testScope,
            'testSummary': self.testSummary,
            'testingStatus': self.testingStatus,

            # Dynamic data
            'requestData': json.loads(self.requestData or '[]'),
            'buildData': json.loads(self.buildData or '[]'),
            'testerData': json.loads(self.testerData or '[]'),
            'teamMemberData': json.loads(self.teamMemberData or '[]'),

            # User Stories
            'totalUserStories': self.totalUserStories,
            'passedUserStories': self.passedUserStories,
            'passedWithIssuesUserStories': self.passedWithIssuesUserStories,
            'failedUserStories': self.failedUserStories,
            'blockedUserStories': self.blockedUserStories,
            'cancelledUserStories': self.cancelledUserStories,
            'deferredUserStories': self.deferredUserStories,
            'notTestableUserStories': self.notTestableUserStories,

            # Test Cases
            'totalTestCases': self.totalTestCases,
            'passedTestCases': self.passedTestCases,
            'passedWithIssuesTestCases': self.passedWithIssuesTestCases,
            'failedTestCases': self.failedTestCases,
            'blockedTestCases': self.blockedTestCases,
            'cancelledTestCases': self.cancelledTestCases,
            'deferredTestCases': self.deferredTestCases,
            'notTestableTestCases': self.notTestableTestCases,

            # Issues
            'totalIssues': self.totalIssues,
            'criticalIssues': self.criticalIssues,
            'highIssues': self.highIssues,
            'mediumIssues': self.mediumIssues,
            'lowIssues': self.lowIssues,
            'newIssues': self.newIssues,
            'fixedIssues': self.fixedIssues,
            'notFixedIssues': self.notFixedIssues,
            'reopenedIssues': self.reopenedIssues,
            'deferredIssues': self.deferredIssues,

            # Enhancements
            'totalEnhancements': self.totalEnhancements,
            'newEnhancements': self.newEnhancements,
            'implementedEnhancements': self.implementedEnhancements,
            'existsEnhancements': self.existsEnhancements,

            # Metrics
            'userStoriesMetric': self.userStoriesMetric,
            'testCasesMetric': self.testCasesMetric,
            'issuesMetric': self.issuesMetric,
            'enhancementsMetric': self.enhancementsMetric,
            'qaNotesData': json.loads(self.qaNotesData or '[]'),
            'qaNoteFieldsData': json.loads(self.qaNoteFieldsData or '[]'),

            # Automation Regression Data
            'automationPassedTestCases': self.automationPassedTestCases,
            'automationFailedTestCases': self.automationFailedTestCases,
            'automationSkippedTestCases': self.automationSkippedTestCases,
            'automationTotalTestCases': self.automationTotalTestCases,
            'automationPassedPercentage': self.automationPassedPercentage,
            'automationFailedPercentage': self.automationFailedPercentage,
            'automationSkippedPercentage': self.automationSkippedPercentage,
            'automationStableTests': self.automationStableTests,
            'automationFlakyTests': self.automationFlakyTests,
            'automationStabilityTotal': self.automationStabilityTotal,
            'automationStablePercentage': self.automationStablePercentage,
            'automationFlakyPercentage': self.automationFlakyPercentage,

            # Performance Report specific fields
            'userLoad': self.userLoad,
            'responseTime': self.responseTime,
            'requestVolume': self.requestVolume,
            'errorRate': self.errorRate,
            'slowestResponse': self.slowestResponse,
            'fastestResponse': self.fastestResponse,
            'numberOfUsers': self.numberOfUsers,
            'executionDuration': self.executionDuration,
            'maxThroughput': self.maxThroughput,
            'httpFailures': self.httpFailures,
            'avgResponseTime': self.avgResponseTime,
            'responseTime95Percent': self.responseTime95Percent,
            'performanceCriteriaResults': json.loads(self.performanceCriteriaResults or '[]'),
            'performanceScenarios': json.loads(self.performanceScenarios or '[]'),
            'httpRequestsOverview': json.loads(self.httpRequestsOverview or '[]'),

            # Automation Report specific fields
            'coveredServices': self.coveredServices,
            'coveredModules': self.coveredModules,
            'bugsData': json.loads(self.bugsData or '[]'),

            # Evaluation Section (Sprint and Manual reports)
            'evaluationData': json.loads(self.evaluationData or '[]'),

            # Metadata
            'createdAt': self.createdAt.isoformat() if self.createdAt else None,
            'updatedAt': self.updatedAt.isoformat() if self.updatedAt else None,
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)

    def get_full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"

    def validate_phone_number(self, phone):
        """Validate Saudi phone number format"""
        if not phone:
            return True  # Phone is optional

        # Remove spaces and special characters
        clean_phone = re.sub(r'[^\d+]', '', phone)

        # Check Saudi phone number patterns
        patterns = [
            r'^05\d{8}$',  # 05xxxxxxxx
            r'^\+9665\d{8}$',  # +9665xxxxxxxx
            r'^009665\d{8}$'  # 009665xxxxxxxx
        ]

        return any(re.match(pattern, clean_phone) for pattern in patterns)

    def validate_password_strength(self, password):
        """Validate password meets security requirements"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"

        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"

        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"

        if not re.search(r'\d', password):
            return False, "Password must contain at least one number"

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"

        return True, "Password is valid"

    def to_dict(self):
        """Convert user to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'phone_number': self.phone_number,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.get_full_name(),
            'is_admin': self.is_admin,
            'is_approved': self.is_approved,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class PasswordResetRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    is_approved = db.Column(db.Boolean, default=False)
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    approved_at = db.Column(db.DateTime)
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'))

    # Define relationships with explicit foreign keys
    user = db.relationship('User', foreign_keys=[user_id], backref='reset_requests')
    approver = db.relationship('User', foreign_keys=[approved_by])

    def __init__(self, user_id):
        self.user_id = user_id
        self.token = secrets.token_urlsafe(32)
        self.expires_at = datetime.utcnow() + timedelta(hours=24)

    def is_expired(self):
        """Check if reset request has expired"""
        return datetime.utcnow() > self.expires_at

    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.get_full_name() if self.user else None,
            'user_email': self.user.email if self.user else None,
            'is_approved': self.is_approved,
            'is_used': self.is_used,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'is_expired': self.is_expired()
        }

class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    projects = db.relationship('Project', backref='portfolio', lazy=True)

# Association table for many-to-many relationship between testers and projects
tester_project_association = db.Table('tester_project',
    db.Column('tester_id', db.Integer, db.ForeignKey('tester.id'), primary_key=True),
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True)
)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolio.id'), nullable=True)  # Allow projects without portfolio
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

    # Many-to-many relationship with testers
    testers = db.relationship('Tester', secondary=tester_project_association, back_populates='projects')

class Tester(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)

    # Expanded tester roles
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

    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

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