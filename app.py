# app.py
# Import necessary libraries
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
import json
import os
from datetime import datetime

# --- App & Database Configuration ---
app = Flask(__name__, template_folder='.', static_folder='static')
# Define the absolute path for the database file
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'reports.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Database Model Definition ---
class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    # Cover Information
    portfolioName = db.Column(db.String(100), nullable=False)
    projectName = db.Column(db.String(100), nullable=False)
    sprintNumber = db.Column(db.Integer, nullable=False)
    reportVersion = db.Column(db.String(50))
    reportName = db.Column(db.String(255)) # New field for custom report name
    cycleNumber = db.Column(db.Integer)
    releaseNumber = db.Column(db.String(50)) # Add missing releaseNumber field
    reportDate = db.Column(db.String(50))
    
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
    qaNotesText = db.Column(db.Text)
    qaNotesData = db.Column(db.Text, default='[]')  # Store multiple QA notes as JSON array
    qaNoteFieldsData = db.Column(db.Text, default='[]')  # Store custom QA note fields as JSON array
    
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

    def to_dict(self):
        """Converts the Report object to a dictionary for JSON serialization."""
        return {
            'id': self.id,
            'portfolioName': self.portfolioName,
            'projectName': self.projectName,
            'sprintNumber': self.sprintNumber,
            'reportVersion': self.reportVersion,
            'reportName': self.reportName,
            'cycleNumber': self.cycleNumber,
            'releaseNumber': self.releaseNumber,
            'reportDate': self.reportDate,
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
            'qaNotesText': self.qaNotesText,
            'qaNotesData': json.loads(self.qaNotesData or '[]'),
            'qaNoteFieldsData': json.loads(self.qaNoteFieldsData or '[]'),
            
            # Metadata
            'createdAt': self.createdAt.isoformat() if self.createdAt else None,
            'updatedAt': self.updatedAt.isoformat() if self.updatedAt else None,
        }

# --- API Routes ---

@app.route('/')
def index():
    """Serves the main HTML landing page."""
    return render_template('dashboard.html')

@app.route('/dashboard')
def dashboard_page():
    """Serves the dashboard HTML page."""
    return render_template('dashboard.html')

@app.route('/reports')
def reports_page():
    """Serves the reports management HTML page."""
    return render_template('reports.html')

@app.route('/create-report')
def create_report_page():
    """Serves the create/edit report HTML page."""
    return render_template('create_report.html')

@app.route('/report/<int:report_id>')
def view_report(report_id):
    """Serves the report view page."""
    return render_template('view_report.html', report_id=report_id)

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Fetches reports from the database with pagination and search."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search_query = request.args.get('search', '', type=str)

    query = Report.query

    if search_query:
        search_term = f"%{search_query}%"
        query = query.filter(
            db.or_(
                Report.portfolioName.ilike(search_term),
                Report.projectName.ilike(search_term),
                Report.sprintNumber.ilike(search_term),
                Report.reportVersion.ilike(search_term)
            )
        )

    pagination = query.order_by(Report.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
    reports = pagination.items
    
    return jsonify({
        'reports': [report.to_dict() for report in reports],
        'total': pagination.total,
        'page': page,
        'totalPages': pagination.pages,
        'hasNext': pagination.has_next,
        'hasPrev': pagination.has_prev
    })

@app.route('/api/reports/<int:report_id>', methods=['GET'])
def get_report(report_id):
    """Fetches a specific report by ID."""
    report = Report.query.get_or_404(report_id)
    return jsonify(report.to_dict())

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics for all projects and individual projects."""
    # Use optimized database queries instead of loading all data into memory
    from sqlalchemy import func
    
    # Get overall stats with single queries
    total_reports = db.session.query(func.count(Report.id)).scalar()
    completed_reports = db.session.query(func.count(Report.id)).filter(Report.testingStatus == 'passed').scalar()
    in_progress_reports = db.session.query(func.count(Report.id)).filter(Report.testingStatus == 'passed-with-issues').scalar()
    pending_reports = total_reports - completed_reports - in_progress_reports
    
    # Get aggregate metrics with database aggregation
    aggregate_result = db.session.query(
        func.sum(Report.totalUserStories).label('total_user_stories'),
        func.sum(Report.passedUserStories).label('passed_user_stories'),
        func.sum(Report.passedWithIssuesUserStories).label('passed_with_issues_user_stories'),
        func.sum(Report.failedUserStories).label('failed_user_stories'),
        func.sum(Report.blockedUserStories).label('blocked_user_stories'),
        func.sum(Report.cancelledUserStories).label('cancelled_user_stories'),
        func.sum(Report.deferredUserStories).label('deferred_user_stories'),
        func.sum(Report.notTestableUserStories).label('not_testable_user_stories'),
        func.sum(Report.totalTestCases).label('total_test_cases'),
        func.sum(Report.passedTestCases).label('passed_test_cases'),
        func.sum(Report.passedWithIssuesTestCases).label('passed_with_issues_test_cases'),
        func.sum(Report.failedTestCases).label('failed_test_cases'),
        func.sum(Report.blockedTestCases).label('blocked_test_cases'),
        func.sum(Report.cancelledTestCases).label('cancelled_test_cases'),
        func.sum(Report.deferredTestCases).label('deferred_test_cases'),
        func.sum(Report.notTestableTestCases).label('not_testable_test_cases'),
        func.sum(Report.totalIssues).label('total_issues'),
        func.sum(Report.criticalIssues).label('critical_issues'),
        func.sum(Report.highIssues).label('high_issues'),
        func.sum(Report.mediumIssues).label('medium_issues'),
        func.sum(Report.lowIssues).label('low_issues'),
        func.sum(Report.newIssues).label('new_issues'),
        func.sum(Report.fixedIssues).label('fixed_issues'),
        func.sum(Report.notFixedIssues).label('not_fixed_issues'),
        func.sum(Report.reopenedIssues).label('reopened_issues'),
        func.sum(Report.deferredIssues).label('deferred_issues'),
        func.sum(Report.totalEnhancements).label('total_enhancements'),
    ).first()
    
    # Project-specific metrics using optimized query
    project_stats = db.session.query(
        Report.portfolioName,
        Report.projectName,
        func.count(Report.id).label('totalReports'),
        func.sum(Report.totalUserStories).label('totalUserStories'),
        func.sum(Report.totalTestCases).label('totalTestCases'),
        func.sum(Report.totalIssues).label('totalIssues'),
        func.sum(Report.totalEnhancements).label('totalEnhancements'),
        func.max(Report.reportDate).label('lastReportDate')
    ).group_by(Report.portfolioName, Report.projectName).all()
    
    # Get latest testing status for each project
    latest_reports_subquery = db.session.query(
        Report.portfolioName,
        Report.projectName,
        Report.testingStatus,
        func.row_number().over(
            partition_by=[Report.portfolioName, Report.projectName],
            order_by=Report.reportDate.desc()
        ).label('rn')
    ).subquery()
    
    latest_statuses = db.session.query(
        latest_reports_subquery.c.portfolioName,
        latest_reports_subquery.c.projectName,
        latest_reports_subquery.c.testingStatus
    ).filter(latest_reports_subquery.c.rn == 1).all()
    
    # Create projects dictionary with optimized data
    projects = {}
    for stat in project_stats:
        project_key = f"{stat.portfolioName}_{stat.projectName}"
        projects[project_key] = {
            'portfolioName': stat.portfolioName,
            'projectName': stat.projectName,
            'totalReports': stat.totalReports or 0,
            'totalUserStories': stat.totalUserStories or 0,
            'totalTestCases': stat.totalTestCases or 0,
            'totalIssues': stat.totalIssues or 0,
            'totalEnhancements': stat.totalEnhancements or 0,
            'lastReportDate': stat.lastReportDate,
            'testingStatus': 'pending'  # Will be updated below
        }
    
    # Update with latest testing statuses
    for status in latest_statuses:
        project_key = f"{status.portfolioName}_{status.projectName}"
        if project_key in projects:
            projects[project_key]['testingStatus'] = status.testingStatus
    
    return jsonify({
        'overall': {
            'totalReports': total_reports,
            'completedReports': completed_reports,
            'inProgressReports': in_progress_reports,
            'pendingReports': pending_reports,
            'totalUserStories': aggregate_result.total_user_stories or 0,
            'passedUserStories': aggregate_result.passed_user_stories or 0,
            'passedWithIssuesUserStories': aggregate_result.passed_with_issues_user_stories or 0,
            'failedUserStories': aggregate_result.failed_user_stories or 0,
            'blockedUserStories': aggregate_result.blocked_user_stories or 0,
            'cancelledUserStories': aggregate_result.cancelled_user_stories or 0,
            'deferredUserStories': aggregate_result.deferred_user_stories or 0,
            'notTestableUserStories': aggregate_result.not_testable_user_stories or 0,
            'totalTestCases': aggregate_result.total_test_cases or 0,
            'passedTestCases': aggregate_result.passed_test_cases or 0,
            'passedWithIssuesTestCases': aggregate_result.passed_with_issues_test_cases or 0,
            'failedTestCases': aggregate_result.failed_test_cases or 0,
            'blockedTestCases': aggregate_result.blocked_test_cases or 0,
            'cancelledTestCases': aggregate_result.cancelled_test_cases or 0,
            'deferredTestCases': aggregate_result.deferred_test_cases or 0,
            'notTestableTestCases': aggregate_result.not_testable_test_cases or 0,
            'totalIssues': aggregate_result.total_issues or 0,
            'criticalIssues': aggregate_result.critical_issues or 0,
            'highIssues': aggregate_result.high_issues or 0,
            'mediumIssues': aggregate_result.medium_issues or 0,
            'lowIssues': aggregate_result.low_issues or 0,
            'newIssues': aggregate_result.new_issues or 0,
            'fixedIssues': aggregate_result.fixed_issues or 0,
            'notFixedIssues': aggregate_result.not_fixed_issues or 0,
            'reopenedIssues': aggregate_result.reopened_issues or 0,
            'deferredIssues': aggregate_result.deferred_issues or 0,
            'totalEnhancements': aggregate_result.total_enhancements or 0,
        },
        'projects': list(projects.values())
    })

@app.route('/api/reports', methods=['POST'])
def create_report():
    """Creates a new report and saves it to the database."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['portfolioName', 'projectName', 'sprintNumber']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        new_report = Report(
            portfolioName=data.get('portfolioName'),
            projectName=data.get('projectName'),
            sprintNumber=int(data.get('sprintNumber') or 0),
            reportVersion=data.get('reportVersion'),
            reportName=data.get('reportName'), # New field
            cycleNumber=int(data.get('cycleNumber') or 0),
            releaseNumber=data.get('releaseNumber'), # Add releaseNumber field
            reportDate=data.get('reportDate'),
            testSummary=data.get('testSummary'),
            testingStatus=data.get('testingStatus'),
            
            # Dynamic data
            requestData=json.dumps(data.get('requestData', [])),
            buildData=json.dumps(data.get('buildData', [])),
            testerData=json.dumps(data.get('testerData', [])),
            teamMemberData=json.dumps(data.get('teamMemberData', [])), # New field
            
            # User Stories
            passedUserStories=int(data.get('passedUserStories') or 0),
            passedWithIssuesUserStories=int(data.get('passedWithIssuesUserStories') or 0),
            failedUserStories=int(data.get('failedUserStories') or 0),
            blockedUserStories=int(data.get('blockedUserStories') or 0),
            cancelledUserStories=int(data.get('cancelledUserStories') or 0),
            deferredUserStories=int(data.get('deferredUserStories') or 0),
            notTestableUserStories=int(data.get('notTestableUserStories') or 0),
            
            # Test Cases
            passedTestCases=int(data.get('passedTestCases') or 0),
            passedWithIssuesTestCases=int(data.get('passedWithIssuesTestCases') or 0),
            failedTestCases=int(data.get('failedTestCases') or 0),
            blockedTestCases=int(data.get('blockedTestCases') or 0),
            cancelledTestCases=int(data.get('cancelledTestCases') or 0),
            deferredTestCases=int(data.get('deferredTestCases') or 0),
            notTestableTestCases=int(data.get('notTestableTestCases') or 0),
            
            # Issues
            criticalIssues=int(data.get('criticalIssues') or 0),
            highIssues=int(data.get('highIssues') or 0),
            mediumIssues=int(data.get('mediumIssues') or 0),
            lowIssues=int(data.get('lowIssues') or 0),
            newIssues=int(data.get('newIssues') or 0),
            fixedIssues=int(data.get('fixedIssues') or 0),
            notFixedIssues=int(data.get('notFixedIssues') or 0),
            reopenedIssues=int(data.get('reopenedIssues') or 0),
            deferredIssues=int(data.get('deferredIssues') or 0),
            
            # Enhancements
            newEnhancements=int(data.get('newEnhancements') or 0),
            implementedEnhancements=int(data.get('implementedEnhancements') or 0),
            existsEnhancements=int(data.get('existsEnhancements') or 0),
            
            # Other metrics
            qaNotesText=data.get('qaNotesText'),
            qaNotesData=json.dumps(data.get('qaNotesData', [])),
            qaNoteFieldsData=json.dumps(data.get('qaNoteFieldsData', [])),
            
        )
        
        # Calculate totals and scores
        new_report.calculate_totals()
        
        db.session.add(new_report)
        db.session.commit()
        
        return jsonify(new_report.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating report: {str(e)}")
        return jsonify({'error': f'Failed to create report: {str(e)}'}), 500

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

# --- Statistical Cache Models ---
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

# Add API routes for CRUD operations
@app.route('/api/portfolios', methods=['GET', 'POST'])
def manage_portfolios():
    if request.method == 'GET':
        portfolios = Portfolio.query.all()
        return jsonify([{'id': p.id, 'name': p.name, 'description': p.description} for p in portfolios])
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            if not data or not data.get('name'):
                return jsonify({'error': 'Portfolio name is required'}), 400
            
            portfolio = Portfolio(name=data['name'], description=data.get('description', ''))
            db.session.add(portfolio)
            db.session.commit()
            return jsonify({'id': portfolio.id, 'name': portfolio.name, 'description': portfolio.description}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

# Projects API Routes
@app.route('/api/projects', methods=['GET', 'POST'])
def manage_projects():
    if request.method == 'GET':
        projects = Project.query.all()
        return jsonify([{
            'id': p.id, 
            'name': p.name, 
            'description': p.description,
            'portfolio_id': p.portfolio_id,
            'portfolio_name': p.portfolio.name if p.portfolio else None
        } for p in projects])
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            if not data or not data.get('name'):
                return jsonify({'error': 'Project name is required'}), 400
            
            project = Project(
                name=data['name'], 
                description=data.get('description', ''),
                portfolio_id=data.get('portfolio_id') if data.get('portfolio_id') else None
            )
            db.session.add(project)
            db.session.commit()
            return jsonify({
                'id': project.id, 
                'name': project.name,
                'description': project.description,
                'portfolio_id': project.portfolio_id,
                'portfolio_name': project.portfolio.name if project.portfolio else None
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_project(project_id):
    project = Project.query.get_or_404(project_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'portfolio_id': project.portfolio_id,
            'portfolio_name': project.portfolio.name if project.portfolio else None
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        project.name = data.get('name', project.name)
        project.description = data.get('description', project.description)
        project.portfolio_id = data.get('portfolio_id', project.portfolio_id)
        db.session.commit()
        return jsonify({'id': project.id, 'name': project.name})
    
    elif request.method == 'DELETE':
        db.session.delete(project)
        db.session.commit()
        return jsonify({'message': 'Project deleted successfully'}), 200

@app.route('/api/portfolios/<int:portfolio_id>/projects', methods=['GET'])
def get_portfolio_projects(portfolio_id):
    """Get all projects for a specific portfolio"""
    projects = Project.query.filter_by(portfolio_id=portfolio_id).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description
    } for p in projects])

@app.route('/api/projects/without-portfolio', methods=['GET'])
def get_projects_without_portfolio():
    """Get all projects that are not linked to any portfolio"""
    projects = Project.query.filter_by(portfolio_id=None).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description
    } for p in projects])

# Testers API Routes
@app.route('/api/testers', methods=['GET', 'POST'])
def manage_testers():
    if request.method == 'GET':
        testers = Tester.query.all()
        return jsonify([{
            'id': t.id,
            'name': t.name,
            'email': t.email,
            'is_automation_engineer': t.is_automation_engineer,
            'is_manual_engineer': t.is_manual_engineer,
            'is_performance_tester': t.is_performance_tester,
            'is_security_tester': t.is_security_tester,
            'is_api_tester': t.is_api_tester,
            'is_mobile_tester': t.is_mobile_tester,
            'is_web_tester': t.is_web_tester,
            'is_accessibility_tester': t.is_accessibility_tester,
            'is_usability_tester': t.is_usability_tester,
            'is_test_lead': t.is_test_lead,
            'role_types': t.role_types,
            'role_display': t.role_display,
            'project_ids': [p.id for p in t.projects],
            'createdAt': t.createdAt.isoformat() if t.createdAt else None
        } for t in testers])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        if not data or not data.get('name') or not data.get('email'):
            return jsonify({'error': 'Name and email are required'}), 400
        
        # Check if email already exists
        existing_tester = Tester.query.filter_by(email=data['email']).first()
        if existing_tester:
            return jsonify({'error': 'Tester with this email already exists'}), 400
        
        tester = Tester(
            name=data['name'],
            email=data['email'],
            is_automation_engineer=data.get('is_automation_engineer', False),
            is_manual_engineer=data.get('is_manual_engineer', False),
            is_performance_tester=data.get('is_performance_tester', False),
            is_security_tester=data.get('is_security_tester', False),
            is_api_tester=data.get('is_api_tester', False),
            is_mobile_tester=data.get('is_mobile_tester', False),
            is_web_tester=data.get('is_web_tester', False),
            is_accessibility_tester=data.get('is_accessibility_tester', False),
            is_usability_tester=data.get('is_usability_tester', False),
            is_test_lead=data.get('is_test_lead', False)
        )
        
        # Handle project assignments
        project_ids = data.get('project_ids', [])
        if project_ids:
            projects = Project.query.filter(Project.id.in_(project_ids)).all()
            tester.projects = projects
        
        db.session.add(tester)
        db.session.commit()
        
        return jsonify({
            'id': tester.id,
            'name': tester.name,
            'email': tester.email,
            'is_automation_engineer': tester.is_automation_engineer,
            'is_manual_engineer': tester.is_manual_engineer,
            'is_performance_tester': tester.is_performance_tester,
            'is_security_tester': tester.is_security_tester,
            'is_api_tester': tester.is_api_tester,
            'is_mobile_tester': tester.is_mobile_tester,
            'is_web_tester': tester.is_web_tester,
            'is_accessibility_tester': tester.is_accessibility_tester,
            'is_usability_tester': tester.is_usability_tester,
            'is_test_lead': tester.is_test_lead,
            'role_types': tester.role_types,
            'role_display': tester.role_display,
            'project_ids': [p.id for p in tester.projects]
        }), 201

@app.route('/api/testers/<int:tester_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_tester(tester_id):
    tester = Tester.query.get_or_404(tester_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': tester.id,
            'name': tester.name,
            'email': tester.email,
            'is_automation_engineer': tester.is_automation_engineer,
            'is_manual_engineer': tester.is_manual_engineer,
            'is_performance_tester': tester.is_performance_tester,
            'is_security_tester': tester.is_security_tester,
            'is_api_tester': tester.is_api_tester,
            'is_mobile_tester': tester.is_mobile_tester,
            'is_web_tester': tester.is_web_tester,
            'is_accessibility_tester': tester.is_accessibility_tester,
            'is_usability_tester': tester.is_usability_tester,
            'is_test_lead': tester.is_test_lead,
            'role_types': tester.role_types,
            'role_display': tester.role_display,
            'project_ids': [p.id for p in tester.projects],
            'createdAt': tester.createdAt.isoformat() if tester.createdAt else None
        })
    
    elif request.method == 'PUT':
        try:
            data = request.get_json()
            
            # Check if email is being changed and if new email already exists
            if data.get('email') != tester.email:
                existing_tester = Tester.query.filter_by(email=data['email']).first()
                if existing_tester:
                    return jsonify({'error': 'Tester with this email already exists'}), 400
            
            # Update basic fields
            tester.name = data.get('name', tester.name)
            tester.email = data.get('email', tester.email)
            
            # Update all role fields
            tester.is_automation_engineer = data.get('is_automation_engineer', tester.is_automation_engineer)
            tester.is_manual_engineer = data.get('is_manual_engineer', tester.is_manual_engineer)
            tester.is_performance_tester = data.get('is_performance_tester', tester.is_performance_tester)
            tester.is_security_tester = data.get('is_security_tester', tester.is_security_tester)
            tester.is_api_tester = data.get('is_api_tester', tester.is_api_tester)
            tester.is_mobile_tester = data.get('is_mobile_tester', tester.is_mobile_tester)
            tester.is_web_tester = data.get('is_web_tester', tester.is_web_tester)
            tester.is_accessibility_tester = data.get('is_accessibility_tester', tester.is_accessibility_tester)
            tester.is_usability_tester = data.get('is_usability_tester', tester.is_usability_tester)
            tester.is_test_lead = data.get('is_test_lead', tester.is_test_lead)
            
            # Update project assignments
            project_ids = data.get('project_ids', [])
            if project_ids is not None:
                projects = Project.query.filter(Project.id.in_(project_ids)).all()
                tester.projects = projects
            
            db.session.commit()
            
            return jsonify({
                'id': tester.id,
                'name': tester.name,
                'email': tester.email,
                'is_automation_engineer': tester.is_automation_engineer,
                'is_manual_engineer': tester.is_manual_engineer,
                'is_performance_tester': tester.is_performance_tester,
                'is_security_tester': tester.is_security_tester,
                'is_api_tester': tester.is_api_tester,
                'is_mobile_tester': tester.is_mobile_tester,
                'is_web_tester': tester.is_web_tester,
                'is_accessibility_tester': tester.is_accessibility_tester,
                'is_usability_tester': tester.is_usability_tester,
                'is_test_lead': tester.is_test_lead,
                'role_types': tester.role_types,
                'role_display': tester.role_display,
                'project_ids': [p.id for p in tester.projects]
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        db.session.delete(tester)
        db.session.commit()
        return jsonify({'message': 'Tester deleted successfully'}), 200

# Tester-Project relationship endpoints
@app.route('/api/testers/<int:tester_id>/projects', methods=['GET', 'POST'])
def manage_tester_projects(tester_id):
    tester = Tester.query.get_or_404(tester_id)
    
    if request.method == 'GET':
        return jsonify([{
            'id': p.id,
            'name': p.name,
            'portfolio_id': p.portfolio_id,
            'portfolio_name': p.portfolio.name if p.portfolio else None
        } for p in tester.projects])
    
    elif request.method == 'POST':
        data = request.get_json()
        project_ids = data.get('project_ids', [])
        
        # Clear existing relationships
        tester.projects.clear()
        
        # Add new relationships
        for project_id in project_ids:
            project = Project.query.get(project_id)
            if project:
                tester.projects.append(project)
        
        db.session.commit()
        return jsonify({'message': 'Tester projects updated successfully'}), 200

@app.route('/api/projects/<int:project_id>/testers', methods=['GET'])
def get_project_testers(project_id):
    """Get all testers assigned to a specific project"""
    project = Project.query.get_or_404(project_id)
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'email': t.email,
        'is_automation_engineer': t.is_automation_engineer,
        'is_manual_engineer': t.is_manual_engineer,
        'role_types': t.role_types,
        'role_display': t.role_display
    } for t in project.testers])

# Team Members API Routes
@app.route('/api/team-members', methods=['GET', 'POST'])
def manage_team_members():
    if request.method == 'GET':
        team_members = TeamMember.query.all()
        return jsonify([{
            'id': tm.id,
            'name': tm.name,
            'email': tm.email,
            'role': tm.role,
            'createdAt': tm.createdAt.isoformat() if tm.createdAt else None
        } for tm in team_members])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Validate role
        if data['role'] not in TeamMember.VALID_ROLES:
            return jsonify({'error': f'Invalid role: {data["role"]}'}), 400
        
        # Check if email already exists
        existing_member = TeamMember.query.filter_by(email=data['email']).first()
        if existing_member:
            return jsonify({'error': 'Team member with this email already exists'}), 400
        
        team_member = TeamMember(
            name=data['name'],
            email=data['email'],
            role=data['role']
        )
        db.session.add(team_member)
        db.session.commit()
        return jsonify({
            'id': team_member.id,
            'name': team_member.name,
            'email': team_member.email,
            'role': team_member.role
        }), 201
        
@app.route('/api/team-members/<int:member_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_team_member(member_id):
    team_member = TeamMember.query.get_or_404(member_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': team_member.id,
            'name': team_member.name,
            'email': team_member.email,
            'role': team_member.role,
            'createdAt': team_member.createdAt.isoformat() if team_member.createdAt else None
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        # Check if email is being changed and if new email already exists
        if data.get('email') != team_member.email:
            existing_member = TeamMember.query.filter_by(email=data['email']).first()
            if existing_member:
                return jsonify({'error': 'Team member with this email already exists'}), 400
        
        team_member.name = data.get('name', team_member.name)
        team_member.email = data.get('email', team_member.email)
        team_member.role = data.get('role', team_member.role)
        db.session.commit()
        return jsonify({
            'id': team_member.id,
            'name': team_member.name,
            'email': team_member.email,
            'role': team_member.role
        })
    
    elif request.method == 'DELETE':
        db.session.delete(team_member)
        db.session.commit()
        return jsonify({'message': 'Team member deleted successfully'}), 200

@app.route('/api/team-members/by-role/<role>', methods=['GET'])
def get_team_members_by_role(role):
    """Get team members filtered by role"""
    team_members = TeamMember.query.filter_by(role=role).all()
    return jsonify([{
        'id': tm.id,
        'name': tm.name,
        'email': tm.email,
        'role': tm.role
    } for tm in team_members])

# Portfolio API Routes (Complete the previous one)
@app.route('/api/portfolios/<int:portfolio_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_portfolio(portfolio_id):
    portfolio = Portfolio.query.get_or_404(portfolio_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': portfolio.id,
            'name': portfolio.name,
            'description': portfolio.description,
            'createdAt': portfolio.createdAt.isoformat() if portfolio.createdAt else None,
            'projects_count': len(portfolio.projects)
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        # Check if name is being changed and if new name already exists
        if data.get('name') != portfolio.name:
            existing_portfolio = Portfolio.query.filter_by(name=data['name']).first()
            if existing_portfolio:
                return jsonify({'error': 'Portfolio with this name already exists'}), 400
        
        portfolio.name = data.get('name', portfolio.name)
        portfolio.description = data.get('description', portfolio.description)
        db.session.commit()
        return jsonify({
            'id': portfolio.id,
            'name': portfolio.name,
            'description': portfolio.description
        })
    
    elif request.method == 'DELETE':
        # Check if portfolio has projects
        if portfolio.projects:
            return jsonify({'error': 'Cannot delete portfolio with existing projects'}), 400
        
        db.session.delete(portfolio)
        db.session.commit()
        return jsonify({'message': 'Portfolio deleted successfully'}), 200

# Utility route to get all data for dropdowns
@app.route('/api/form-data', methods=['GET'])
def get_form_data():
    """Get all data needed for form dropdowns"""
    portfolios = Portfolio.query.all()
    projects = Project.query.all()
    testers = Tester.query.all()
    team_members = TeamMember.query.all()
    
    return jsonify({
        'portfolios': [{'id': p.id, 'name': p.name} for p in portfolios],
        'projects': [{'id': p.id, 'name': p.name, 'portfolio_id': p.portfolio_id} for p in projects],
        'testers': [{'id': t.id, 'name': t.name, 'email': t.email, 'is_automation_engineer': t.is_automation_engineer, 'is_manual_engineer': t.is_manual_engineer, 'role_types': t.role_types, 'role_display': t.role_display} for t in testers],
        'team_members': [{'id': tm.id, 'name': tm.name, 'email': tm.email, 'role': tm.role} for tm in team_members]
    })

@app.route('/api/projects/<portfolio_name>/<project_name>/latest-data', methods=['GET'])
def get_latest_project_data(portfolio_name, project_name):
    """Get latest report data for a specific project to auto-populate new reports"""
    try:
        # Get all reports for this project to find the highest values
        all_reports = Report.query.filter_by(
            portfolioName=portfolio_name,
            projectName=project_name
        ).all()
        
        if not all_reports:
            # No previous reports - return default values
            from datetime import datetime
            today = datetime.now().strftime('%d-%m-%Y')
            
            # Get project to find assigned testers
            project = Project.query.filter_by(name=project_name).first()
            project_testers = []
            if project:
                project_testers = [{'id': t.id, 'name': t.name, 'email': t.email, 'is_automation_engineer': t.is_automation_engineer, 'is_manual_engineer': t.is_manual_engineer, 'role_types': t.role_types, 'role_display': t.role_display} for t in project.testers]
            
            return jsonify({
                'hasData': False,
                'defaultValues': {
                    'sprintNumber': 1,
                    'cycleNumber': 1,
                    'releaseNumber': '1.0',
                    'reportVersion': '1.0', 
                    'reportDate': today,
                    'testerData': project_testers,
                    'teamMembers': []
                }
            })
        
        # Find the highest sprint, cycle, and release numbers
        max_sprint = max((r.sprintNumber or 0) for r in all_reports)
        max_cycle = max((r.cycleNumber or 0) for r in all_reports)
        
        # For release number, we need to parse and find the highest version
        release_numbers = [r.releaseNumber for r in all_reports if r.releaseNumber]
        latest_release = '1.0'
        if release_numbers:
            # Simple version comparison - assumes format like "1.0", "1.1", "2.0"
            try:
                latest_release = max(release_numbers, key=lambda v: tuple(map(int, v.split('.'))))
            except:
                latest_release = release_numbers[-1]  # fallback to last one
        
        # Get the latest report for other data
        latest_report = max(all_reports, key=lambda r: r.id)
        
        # Parse existing data
        tester_data = json.loads(latest_report.testerData or '[]')
        request_data = json.loads(latest_report.requestData or '[]') 
        build_data = json.loads(latest_report.buildData or '[]')
        team_member_data = json.loads(latest_report.teamMemberData or '[]')
        qa_notes_data = json.loads(latest_report.qaNotesData or '[]')
        qa_note_fields_data = json.loads(latest_report.qaNoteFieldsData or '[]')
        
        # Get project to find assigned testers (merge with existing tester data)
        project = Project.query.filter_by(name=project_name).first()
        if project:
            # Get assigned testers that might not be in the latest report
            assigned_testers = [{'id': t.id, 'name': t.name, 'email': t.email, 'is_automation_engineer': t.is_automation_engineer, 'is_manual_engineer': t.is_manual_engineer} for t in project.testers]
            
            # Merge with existing tester data (avoid duplicates)
            existing_emails = {t.get('email') for t in tester_data}
            for assigned_tester in assigned_testers:
                if assigned_tester['email'] not in existing_emails:
                    tester_data.append(assigned_tester)
        
        return jsonify({
            'hasData': True,
            'latestData': {
                'sprintNumber': max_sprint,
                'cycleNumber': max_cycle,
                'releaseNumber': latest_release,
                'reportVersion': latest_report.reportVersion or '1.0',
                'reportDate': latest_report.reportDate,
                'testerData': tester_data,
                'teamMembers': team_member_data,
                'requestData': request_data,
                'buildData': build_data,
                'qaNotesData': qa_notes_data,
                'qaNoteFieldsData': qa_note_fields_data
            },
            'suggestedValues': {
                'sprintNumber': max_sprint + 1,
                'cycleNumber': 1,  # Default cycle number is always 1 as per requirement
                'releaseNumber': latest_release,
                'reportVersion': latest_report.reportVersion or '1.0'
            }
        })
        
    except Exception as e:
        print(f"Error getting latest project data: {e}")
        from datetime import datetime
        today = datetime.now().strftime('%d-%m-%Y')
        return jsonify({
            'hasData': False,
            'defaultValues': {
                'sprintNumber': 1,
                'cycleNumber': 1,
                'releaseNumber': '1.0',
                'reportVersion': '1.0',
                'reportDate': today,
                'testerData': [],
                'teamMembers': []
            }
        })

# Add route for manage data page
@app.route('/manage')
def manage_data_page():
    """Serves the manage data page."""
    return render_template('manage_data.html')

# Similar routes for projects, testers, team members

@app.route('/api/reports/<int:id>', methods=['PUT'])
def update_report(id):
    """Updates an existing report by its ID."""
    report = Report.query.get_or_404(id)
    data = request.get_json()

    # Update fields
    for field in ['portfolioName', 'projectName', 'sprintNumber', 'reportVersion', 
                  'reportName', 'cycleNumber', 'releaseNumber', 'reportDate', 'testSummary', 'testingStatus',
                  'passedUserStories', 'passedWithIssuesUserStories', 'failedUserStories',
                  'blockedUserStories', 'cancelledUserStories', 'deferredUserStories', 
                  'notTestableUserStories', 'passedTestCases', 'passedWithIssuesTestCases',
                  'failedTestCases', 'blockedTestCases', 'cancelledTestCases', 
                  'deferredTestCases', 'notTestableTestCases', 'criticalIssues',
                  'highIssues', 'mediumIssues', 'lowIssues', 'newIssues', 'fixedIssues',
                  'notFixedIssues', 'reopenedIssues', 'deferredIssues', 'newEnhancements',
                  'implementedEnhancements', 'existsEnhancements', 'qaNotesText']:
        if field in data:
            setattr(report, field, data[field])
    
    # Update JSON fields
    if 'requestData' in data:
        report.requestData = json.dumps(data['requestData'])
    if 'buildData' in data:
        report.buildData = json.dumps(data['buildData'])
    if 'testerData' in data:
        report.testerData = json.dumps(data['testerData'])
    if 'teamMemberData' in data:
        report.teamMemberData = json.dumps(data['teamMemberData'])
    if 'qaNotesData' in data:
        report.qaNotesData = json.dumps(data['qaNotesData'])
    if 'qaNoteFieldsData' in data:
        report.qaNoteFieldsData = json.dumps(data['qaNoteFieldsData'])


    # Recalculate totals and scores
    report.calculate_totals()
    
    db.session.commit()
    return jsonify(report.to_dict())

@app.route('/api/reports/<int:id>', methods=['DELETE'])
def delete_report(id):
    """Deletes a report by its ID."""
    report = Report.query.get_or_404(id)
    db.session.delete(report)
    db.session.commit()
    return jsonify({'message': 'Report deleted successfully'}), 200

# --- Statistical Cache Update Functions ---
def update_stats_cache():
    """Update all statistical cache tables"""
    from sqlalchemy import func
    try:
        # Update Dashboard Stats
        dashboard_stats = DashboardStats.query.first()
        if not dashboard_stats:
            dashboard_stats = DashboardStats()
            db.session.add(dashboard_stats)
        
        # Calculate overall stats
        total_reports = db.session.query(func.count(Report.id)).scalar()
        completed_reports = db.session.query(func.count(Report.id)).filter(Report.testingStatus == 'passed').scalar()
        in_progress_reports = db.session.query(func.count(Report.id)).filter(Report.testingStatus == 'passed-with-issues').scalar()
        
        aggregate_result = db.session.query(
            func.sum(Report.totalUserStories).label('total_user_stories'),
            func.sum(Report.totalTestCases).label('total_test_cases'),
            func.sum(Report.totalIssues).label('total_issues'),
            func.sum(Report.totalEnhancements).label('total_enhancements')
        ).first()
        
        dashboard_stats.total_reports = total_reports
        dashboard_stats.completed_reports = completed_reports or 0
        dashboard_stats.in_progress_reports = in_progress_reports or 0
        dashboard_stats.pending_reports = total_reports - (completed_reports or 0) - (in_progress_reports or 0)
        dashboard_stats.total_user_stories = aggregate_result.total_user_stories or 0
        dashboard_stats.total_test_cases = aggregate_result.total_test_cases or 0
        dashboard_stats.total_issues = aggregate_result.total_issues or 0
        dashboard_stats.total_enhancements = aggregate_result.total_enhancements or 0
        dashboard_stats.last_updated = datetime.utcnow()
        
        # Update Portfolio Stats
        portfolios = Portfolio.query.all()
        for portfolio in portfolios:
            portfolio_stats = PortfolioStats.query.filter_by(portfolio_id=portfolio.id).first()
            if not portfolio_stats:
                portfolio_stats = PortfolioStats(portfolio_id=portfolio.id, portfolio_name=portfolio.name)
                db.session.add(portfolio_stats)
            
            # Get stats for this portfolio
            portfolio_aggregate = db.session.query(
                func.count(Report.id).label('total_reports'),
                func.sum(Report.totalUserStories).label('total_user_stories'),
                func.sum(Report.totalTestCases).label('total_test_cases'),
                func.sum(Report.totalIssues).label('total_issues'),
                func.sum(Report.totalEnhancements).label('total_enhancements'),
                func.max(Report.reportDate).label('last_report_date')
            ).filter(Report.portfolioName == portfolio.name).first()
            
            project_count = Project.query.filter_by(portfolio_id=portfolio.id).count()
            
            portfolio_stats.portfolio_name = portfolio.name
            portfolio_stats.total_reports = portfolio_aggregate.total_reports or 0
            portfolio_stats.total_projects = project_count
            portfolio_stats.total_user_stories = portfolio_aggregate.total_user_stories or 0
            portfolio_stats.total_test_cases = portfolio_aggregate.total_test_cases or 0
            portfolio_stats.total_issues = portfolio_aggregate.total_issues or 0
            portfolio_stats.total_enhancements = portfolio_aggregate.total_enhancements or 0
            portfolio_stats.last_report_date = portfolio_aggregate.last_report_date
            portfolio_stats.last_updated = datetime.utcnow()
        
        # Update Project Stats
        projects = Project.query.all()
        for project in projects:
            project_stats = ProjectStats.query.filter_by(project_id=project.id).first()
            if not project_stats:
                project_stats = ProjectStats(
                    project_id=project.id, 
                    portfolio_id=project.portfolio_id,
                    portfolio_name=project.portfolio.name,
                    project_name=project.name
                )
                db.session.add(project_stats)
            
            # Get stats for this project
            project_aggregate = db.session.query(
                func.count(Report.id).label('total_reports'),
                func.sum(Report.totalUserStories).label('total_user_stories'),
                func.sum(Report.totalTestCases).label('total_test_cases'),
                func.sum(Report.totalIssues).label('total_issues'),
                func.sum(Report.totalEnhancements).label('total_enhancements'),
                func.max(Report.reportDate).label('last_report_date')
            ).filter(Report.portfolioName == project.portfolio.name, Report.projectName == project.name).first()
            
            # Get latest testing status
            latest_report = Report.query.filter_by(
                portfolioName=project.portfolio.name, 
                projectName=project.name
            ).order_by(Report.reportDate.desc()).first()
            
            project_stats.portfolio_name = project.portfolio.name
            project_stats.project_name = project.name
            project_stats.total_reports = project_aggregate.total_reports or 0
            project_stats.total_user_stories = project_aggregate.total_user_stories or 0
            project_stats.total_test_cases = project_aggregate.total_test_cases or 0
            project_stats.total_issues = project_aggregate.total_issues or 0
            project_stats.total_enhancements = project_aggregate.total_enhancements or 0
            project_stats.last_report_date = project_aggregate.last_report_date
            project_stats.latest_testing_status = latest_report.testingStatus if latest_report else 'pending'
            project_stats.last_updated = datetime.utcnow()
        
        db.session.commit()
        print("Statistics cache updated successfully")
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating stats cache: {e}")

# Optimized API endpoints
@app.route('/api/portfolios/minimal', methods=['GET'])
def get_portfolios_minimal():
    """Get minimal portfolio data for fast loading"""
    portfolios = Portfolio.query.with_entities(Portfolio.id, Portfolio.name).all()
    return jsonify([{'id': p.id, 'name': p.name} for p in portfolios])

@app.route('/api/projects/by-portfolio/<int:portfolio_id>', methods=['GET'])
def get_projects_by_portfolio(portfolio_id):
    """Get projects for a specific portfolio - optimized for dropdowns"""
    projects = Project.query.filter_by(portfolio_id=portfolio_id).with_entities(Project.id, Project.name).all()
    return jsonify([{'id': p.id, 'name': p.name} for p in projects])

@app.route('/api/portfolios/<int:portfolio_id>/projects/detailed', methods=['GET'])
def get_portfolio_projects_detailed(portfolio_id):
    """Get detailed projects for a specific portfolio including testers"""
    projects = Project.query.filter_by(portfolio_id=portfolio_id).all()
    result = []
    for p in projects:
        result.append({
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'testers': [{'id': t.id, 'name': t.name, 'email': t.email, 'is_automation_engineer': t.is_automation_engineer, 'is_manual_engineer': t.is_manual_engineer, 'role_types': t.role_types, 'role_display': t.role_display} for t in p.testers]
        })
    return jsonify(result)

@app.route('/api/dashboard/stats/cached', methods=['GET'])
def get_cached_dashboard_stats():
    """Get dashboard statistics from cache tables"""
    try:
        # Try to get from cache first
        dashboard_stats = DashboardStats.query.first()
        if not dashboard_stats:
            # If no cache exists, update it
            update_stats_cache()
            dashboard_stats = DashboardStats.query.first()
        
        # Get project stats from cache
        project_stats = ProjectStats.query.all()
        
        overall_stats = {
            'totalReports': dashboard_stats.total_reports,
            'completedReports': dashboard_stats.completed_reports,
            'inProgressReports': dashboard_stats.in_progress_reports,
            'pendingReports': dashboard_stats.pending_reports,
            'totalUserStories': dashboard_stats.total_user_stories,
            'totalTestCases': dashboard_stats.total_test_cases,
            'totalIssues': dashboard_stats.total_issues,
            'totalEnhancements': dashboard_stats.total_enhancements        }
        
        projects_data = []
        for ps in project_stats:
            projects_data.append({
                'portfolioName': ps.portfolio_name,
                'projectName': ps.project_name,
                'totalReports': ps.total_reports,
                'totalUserStories': ps.total_user_stories,
                'totalTestCases': ps.total_test_cases,
                'totalIssues': ps.total_issues,
                'totalEnhancements': ps.total_enhancements,
                'lastReportDate': ps.last_report_date,
                'testingStatus': ps.latest_testing_status
            })
        
        return jsonify({
            'overall': overall_stats,
            'projects': projects_data
        })
        
    except Exception as e:
        # Fallback to original method if cache fails
        print(f"Cache retrieval failed, falling back to original method: {e}")
        return get_dashboard_stats()

@app.route('/project-statistics')
def project_statistics_page():
    """Serves the project statistics HTML page."""
    return render_template('project_statistics.html')

@app.route('/api/project-stats/<int:project_id>', methods=['GET'])
def get_project_stats(project_id):
    """Get all statistics for a specific project."""
    print(f"Requesting stats for project ID: {project_id}")
    project = Project.query.get_or_404(project_id)
    print(f"Fetching stats for project: {project.name}")
    
    # Debug: check all reports and their project names
    all_reports = Report.query.all()
    print(f"Total reports in database: {len(all_reports)}")
    for r in all_reports:
        print(f"Report ID: {r.id}, Project Name: {r.projectName}")
    
    reports = Report.query.filter_by(projectName=project.name).all()
    print(f"Found {len(reports)} reports for project name: {project.name}")

    if not reports:
        print(f"No reports found for project ID: {project_id}, project name: {project.name}")
        # Instead of returning 404, return empty stats
        return jsonify({
            'overall': {
                'totalReports': 0,
                'totalUserStories': 0,
                'totalTestCases': 0,
                'totalIssues': 0,
                'totalEnhancements': 0,
                'lastRelease': 'N/A',
                'latestReleaseNumber': 'N/A',
                'userStorySuccessRate': 0,
                'testCaseSuccessRate': 0,
                'issueFixRate': 0,
                'enhancementCompletionRate': 0,
                'passedUserStories': 0,
                'passedTestCases': 0,
                'fixedIssues': 0,
                'implementedEnhancements': 0
            },
            'charts': {
                'userStories': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': []}]},
                'testCases': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': []}]},
                'issuesPriority': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': []}]},
                'issuesStatus': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': []}]}
            },
            'testers': [],
            'reports': [],
            'time_stats': {'monthly': {}, 'quarterly': {}}
        })

    # Calculate overall stats
    total_reports = len(reports)
    total_user_stories = sum(r.totalUserStories for r in reports)
    total_test_cases = sum(r.totalTestCases for r in reports)
    total_issues = sum(r.totalIssues for r in reports)
    total_enhancements = sum(r.totalEnhancements for r in reports)
    last_release = reports[-1].reportVersion if reports else 'N/A'
    latest_release_number = reports[-1].releaseNumber if reports else 'N/A'
    
    # Calculate success rates
    passed_user_stories = sum(r.passedUserStories for r in reports)
    passed_test_cases = sum(r.passedTestCases for r in reports)
    fixed_issues = sum(r.fixedIssues for r in reports)
    implemented_enhancements = sum(r.implementedEnhancements for r in reports)
    
    user_story_success_rate = (passed_user_stories / total_user_stories * 100) if total_user_stories > 0 else 0
    test_case_success_rate = (passed_test_cases / total_test_cases * 100) if total_test_cases > 0 else 0
    issue_fix_rate = (fixed_issues / total_issues * 100) if total_issues > 0 else 0
    enhancement_completion_rate = (implemented_enhancements / total_enhancements * 100) if total_enhancements > 0 else 0
    
    # Get unique testers
    testers = []
    tester_emails = set()
    for r in reports:
        for tester in json.loads(r.testerData):
            if tester['email'] not in tester_emails:
                testers.append(tester)
                tester_emails.add(tester['email'])

    # Time-based stats
    monthly_stats = {}
    quarterly_stats = {}
    for r in reports:
        try:
            report_date = datetime.strptime(r.reportDate, '%d-%m-%Y')
            month_key = report_date.strftime('%Y-%m')
            quarter_key = f"{report_date.year}-Q{ (report_date.month - 1) // 3 + 1 }"
            monthly_stats[month_key] = monthly_stats.get(month_key, 0) + 1
            quarterly_stats[quarter_key] = quarterly_stats.get(quarter_key, 0) + 1
        except (ValueError, TypeError):
            continue

    # Prepare data for charts
    chart_data = {
        'userStories': {
            'labels': ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
            'datasets': [{
                'data': [
                    sum(r.passedUserStories for r in reports),
                    sum(r.passedWithIssuesUserStories for r in reports),
                    sum(r.failedUserStories for r in reports),
                    sum(r.blockedUserStories for r in reports),
                    sum(r.cancelledUserStories for r in reports),
                    sum(r.deferredUserStories for r in reports),
                    sum(r.notTestableUserStories for r in reports)
                ],
                'backgroundColor': ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E', '#2196F3', '#673AB7', '#00BCD4'],
                'borderWidth': 3,
                'borderColor': 'var(--surface)'
            }]
        },
        'testCases': {
            'labels': ['Passed', 'Passed with Issues', 'Failed', 'Blocked', 'Cancelled', 'Deferred', 'Not Testable'],
            'datasets': [{
                'data': [
                    sum(r.passedTestCases for r in reports),
                    sum(r.passedWithIssuesTestCases for r in reports),
                    sum(r.failedTestCases for r in reports),
                    sum(r.blockedTestCases for r in reports),
                    sum(r.cancelledTestCases for r in reports),
                    sum(r.deferredTestCases for r in reports),
                    sum(r.notTestableTestCases for r in reports)
                ],
                'backgroundColor': ['#8BC34A', '#FFEB3B', '#E91E63', '#607D8B', '#9C27B0', '#FF5722', '#795548'],
                'borderWidth': 3,
                'borderColor': 'var(--surface)'
            }]
        },
        'issuesPriority': {
            'labels': ['Critical', 'High', 'Medium', 'Low'],
            'datasets': [{
                'data': [
                    sum(r.criticalIssues for r in reports),
                    sum(r.highIssues for r in reports),
                    sum(r.mediumIssues for r in reports),
                    sum(r.lowIssues for r in reports)
                ],
                'backgroundColor': ['#F44336', '#FF9800', '#FFC107', '#4CAF50'],
                'borderWidth': 3,
                'borderColor': 'var(--surface)'
            }]
        },
        'issuesStatus': {
            'labels': ['New', 'Fixed', 'Not Fixed', 'Re-opened', 'Deferred'],
            'datasets': [{
                'data': [
                    sum(r.newIssues for r in reports),
                    sum(r.fixedIssues for r in reports),
                    sum(r.notFixedIssues for r in reports),
                    sum(r.reopenedIssues for r in reports),
                    sum(r.deferredIssues for r in reports)
                ],
                'backgroundColor': ['#2196F3', '#4CAF50', '#E91E63', '#FF5722', '#673AB7'],
                'borderWidth': 3,
                'borderColor': 'var(--surface)'
            }]
        }
    }

    return jsonify({
        'overall': {
            'totalReports': total_reports,
            'totalUserStories': total_user_stories,
            'totalTestCases': total_test_cases,
            'totalIssues': total_issues,
            'totalEnhancements': total_enhancements,
            'lastRelease': last_release,
            'latestReleaseNumber': latest_release_number,
            'userStorySuccessRate': round(user_story_success_rate, 2),
            'testCaseSuccessRate': round(test_case_success_rate, 2),
            'issueFixRate': round(issue_fix_rate, 2),
            'enhancementCompletionRate': round(enhancement_completion_rate, 2),
            'passedUserStories': passed_user_stories,
            'passedTestCases': passed_test_cases,
            'fixedIssues': fixed_issues,
            'implementedEnhancements': implemented_enhancements
        },
        'charts': chart_data,
        'testers': testers,
        'reports': [r.to_dict() for r in reports],
        'time_stats': {
            'monthly': monthly_stats,
            'quarterly': quarterly_stats
        }
    })



def migrate_database():
    """Handle database migration for new fields"""
    import sqlite3
    import os
    
    db_path = os.path.join(basedir, 'reports.db')
    
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check existing columns in report table
        cursor.execute("PRAGMA table_info(report)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add missing columns to report table
        migrations = [
            ('releaseNumber', 'VARCHAR(50)'),
            ('qaNotesData', 'TEXT DEFAULT "[]"'),
            ('qaNoteFieldsData', 'TEXT DEFAULT "[]"')
        ]
        
        for column_name, column_type in migrations:
            if column_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE report ADD COLUMN {column_name} {column_type}")
                    conn.commit()
                    print(f"Added {column_name} column to existing database")
                except sqlite3.Error as e:
                    print(f"Error adding {column_name} column: {e}")
        
        # Check existing columns in tester table and add role fields
        cursor.execute("PRAGMA table_info(tester)")
        tester_columns = [column[1] for column in cursor.fetchall()]
        
        tester_migrations = [
            ('is_automation_engineer', 'BOOLEAN DEFAULT 0'),
            ('is_manual_engineer', 'BOOLEAN DEFAULT 0'),
            ('is_performance_tester', 'BOOLEAN DEFAULT 0'),
            ('is_security_tester', 'BOOLEAN DEFAULT 0'),
            ('is_api_tester', 'BOOLEAN DEFAULT 0'),
            ('is_mobile_tester', 'BOOLEAN DEFAULT 0'),
            ('is_web_tester', 'BOOLEAN DEFAULT 0'),
            ('is_accessibility_tester', 'BOOLEAN DEFAULT 0'),
            ('is_usability_tester', 'BOOLEAN DEFAULT 0'),
            ('is_test_lead', 'BOOLEAN DEFAULT 0')
        ]
        
        for column_name, column_type in tester_migrations:
            if column_name not in tester_columns:
                try:
                    cursor.execute(f"ALTER TABLE tester ADD COLUMN {column_name} {column_type}")
                    conn.commit()
                    print(f"Added {column_name} column to tester table")
                except sqlite3.Error as e:
                    print(f"Error adding {column_name} column to tester table: {e}")
        
        conn.close()

if __name__ == '__main__':
    with app.app_context():
        # This will create the database file and the 'report' table if they don't exist.
        db.create_all()
        # Handle migration for existing databases
        migrate_database()
    app.run(debug=True, port=5000)

