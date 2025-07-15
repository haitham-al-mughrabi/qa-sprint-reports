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
    cycleNumber = db.Column(db.Integer)
    reportDate = db.Column(db.String(50))
    
    # Test Summary
    testSummary = db.Column(db.Text)
    testingStatus = db.Column(db.String(50))
    
    # Dynamic data stored as JSON strings
    requestData = db.Column(db.Text, default='[]')
    buildData = db.Column(db.Text, default='[]')
    testerData = db.Column(db.Text, default='[]')
    
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
    
    # Evaluation Data
    evaluationData = db.Column(db.Text, default='{}')  # JSON for flexible evaluation criteria
    evaluationTotalScore = db.Column(db.Float, default=0.0)
    
    # Project Evaluation Data
    projectEvaluationData = db.Column(db.Text, default='{}')  # JSON for project evaluation
    projectEvaluationTotalScore = db.Column(db.Float, default=0.0)
    
    # Testing Metrics (calculated fields)
    userStoriesMetric = db.Column(db.Integer, default=0)  # Auto-calculated from user stories
    testCasesMetric = db.Column(db.Integer, default=0)   # Auto-calculated from test cases
    issuesMetric = db.Column(db.Integer, default=0)      # Auto-calculated from issues
    enhancementsMetric = db.Column(db.Integer, default=0) # Auto-calculated from enhancements
    evaluationMetric = db.Column(db.String(255))
    qaNotesMetric = db.Column(db.Integer, default=0)
    
    # QA Notes
    qaNotesText = db.Column(db.Text)
    
    # Custom Fields (JSON storage for flexibility)
    customFields = db.Column(db.Text, default='{}')
    
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

    def calculate_evaluation_scores(self):
        """Calculate evaluation total scores"""
        try:
            # Calculate Evaluation Total Score
            evaluation_data = json.loads(self.evaluationData or '{}')
            eval_total = 0
            eval_count = 0
            for key, value in evaluation_data.items():
                if key.endswith('_score') and value:
                    try:
                        eval_total += float(value)
                        eval_count += 1
                    except (ValueError, TypeError):
                        pass
            self.evaluationTotalScore = eval_total / eval_count if eval_count > 0 else 0
            
            # Calculate Project Evaluation Total Score
            project_eval_data = json.loads(self.projectEvaluationData or '{}')
            proj_total = 0
            proj_count = 0
            for key, value in project_eval_data.items():
                if key.endswith('_score') and value:
                    try:
                        proj_total += float(value)
                        proj_count += 1
                    except (ValueError, TypeError):
                        pass
            self.projectEvaluationTotalScore = proj_total / proj_count if proj_count > 0 else 0
            
        except json.JSONDecodeError:
            self.evaluationTotalScore = 0
            self.projectEvaluationTotalScore = 0

    def to_dict(self):
        """Converts the Report object to a dictionary for JSON serialization."""
        return {
            'id': self.id,
            'portfolioName': self.portfolioName,
            'projectName': self.projectName,
            'sprintNumber': self.sprintNumber,
            'reportVersion': self.reportVersion,
            'cycleNumber': self.cycleNumber,
            'reportDate': self.reportDate,
            'testSummary': self.testSummary,
            'testingStatus': self.testingStatus,
            
            # Dynamic data
            'requestData': json.loads(self.requestData or '[]'),
            'buildData': json.loads(self.buildData or '[]'),
            'testerData': json.loads(self.testerData or '[]'),
            
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
            
            # Evaluation
            'evaluationData': json.loads(self.evaluationData or '{}'),
            'evaluationTotalScore': self.evaluationTotalScore,
            'projectEvaluationData': json.loads(self.projectEvaluationData or '{}'),
            'projectEvaluationTotalScore': self.projectEvaluationTotalScore,
            
            # Metrics
            'userStoriesMetric': self.userStoriesMetric,
            'testCasesMetric': self.testCasesMetric,
            'issuesMetric': self.issuesMetric,
            'enhancementsMetric': self.enhancementsMetric,
            'evaluationMetric': self.evaluationMetric,
            'qaNotesMetric': self.qaNotesMetric,
            'qaNotesText': self.qaNotesText,
            
            # Custom Fields
            'customFields': json.loads(self.customFields or '{}'),
            
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
    """Fetches all reports from the database."""
    reports = Report.query.order_by(Report.id.desc()).all()
    return jsonify([report.to_dict() for report in reports])

@app.route('/api/reports/<int:report_id>', methods=['GET'])
def get_report(report_id):
    """Fetches a specific report by ID."""
    report = Report.query.get_or_404(report_id)
    return jsonify(report.to_dict())

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics for all projects and individual projects."""
    reports = Report.query.all()
    
    # Overall stats
    total_reports = len(reports)
    completed_reports = len([r for r in reports if r.testingStatus == 'passed'])
    in_progress_reports = len([r for r in reports if r.testingStatus == 'passed-with-issues'])
    pending_reports = total_reports - completed_reports - in_progress_reports
    
    # Aggregate metrics
    total_user_stories = sum(r.totalUserStories or 0 for r in reports)
    total_test_cases = sum(r.totalTestCases or 0 for r in reports)
    total_issues = sum(r.totalIssues or 0 for r in reports)
    total_enhancements = sum(r.totalEnhancements or 0 for r in reports)
    avg_evaluation_score = sum(r.evaluationTotalScore or 0 for r in reports) / len(reports) if reports else 0
    avg_project_evaluation_score = sum(r.projectEvaluationTotalScore or 0 for r in reports) / len(reports) if reports else 0
    
    # Project-specific metrics
    projects = {}
    for report in reports:
        project_key = f"{report.portfolioName}_{report.projectName}"
        if project_key not in projects:
            projects[project_key] = {
                'portfolioName': report.portfolioName,
                'projectName': report.projectName,
                'totalReports': 0,
                'totalUserStories': 0,
                'totalTestCases': 0,
                'totalIssues': 0,
                'totalEnhancements': 0,
                'avgEvaluationScore': 0,
                'avgProjectEvaluationScore': 0,
                'lastReportDate': None,
                'testingStatus': 'pending'
            }
        
        project = projects[project_key]
        project['totalReports'] += 1
        project['totalUserStories'] += report.totalUserStories or 0
        project['totalTestCases'] += report.totalTestCases or 0
        project['totalIssues'] += report.totalIssues or 0
        project['totalEnhancements'] += report.totalEnhancements or 0
        project['avgEvaluationScore'] += report.evaluationTotalScore or 0
        project['avgProjectEvaluationScore'] += report.projectEvaluationTotalScore or 0
        
        if not project['lastReportDate'] or report.reportDate > project['lastReportDate']:
            project['lastReportDate'] = report.reportDate
            project['testingStatus'] = report.testingStatus
    
    # Calculate averages for projects
    for project in projects.values():
        if project['totalReports'] > 0:
            project['avgEvaluationScore'] /= project['totalReports']
            project['avgProjectEvaluationScore'] /= project['totalReports']
    
    return jsonify({
        'overall': {
            'totalReports': total_reports,
            'completedReports': completed_reports,
            'inProgressReports': in_progress_reports,
            'pendingReports': pending_reports,
            'totalUserStories': total_user_stories,
            'totalTestCases': total_test_cases,
            'totalIssues': total_issues,
            'totalEnhancements': total_enhancements,
            'avgEvaluationScore': round(avg_evaluation_score, 2),
            'avgProjectEvaluationScore': round(avg_project_evaluation_score, 2)
        },
        'projects': list(projects.values())
    })

@app.route('/api/reports', methods=['POST'])
def create_report():
    """Creates a new report and saves it to the database."""
    data = request.get_json()
    
    new_report = Report(
        portfolioName=data.get('portfolioName'),
        projectName=data.get('projectName'),
        sprintNumber=data.get('sprintNumber'),
        reportVersion=data.get('reportVersion'),
        cycleNumber=data.get('cycleNumber'),
        reportDate=data.get('reportDate'),
        testSummary=data.get('testSummary'),
        testingStatus=data.get('testingStatus'),
        
        # Dynamic data
        requestData=json.dumps(data.get('requestData', [])),
        buildData=json.dumps(data.get('buildData', [])),
        testerData=json.dumps(data.get('testerData', [])),
        
        # User Stories
        passedUserStories=data.get('passedUserStories', 0),
        passedWithIssuesUserStories=data.get('passedWithIssuesUserStories', 0),
        failedUserStories=data.get('failedUserStories', 0),
        blockedUserStories=data.get('blockedUserStories', 0),
        cancelledUserStories=data.get('cancelledUserStories', 0),
        deferredUserStories=data.get('deferredUserStories', 0),
        notTestableUserStories=data.get('notTestableUserStories', 0),
        
        # Test Cases
        passedTestCases=data.get('passedTestCases', 0),
        passedWithIssuesTestCases=data.get('passedWithIssuesTestCases', 0),
        failedTestCases=data.get('failedTestCases', 0),
        blockedTestCases=data.get('blockedTestCases', 0),
        cancelledTestCases=data.get('cancelledTestCases', 0),
        deferredTestCases=data.get('deferredTestCases', 0),
        notTestableTestCases=data.get('notTestableTestCases', 0),
        
        # Issues
        criticalIssues=data.get('criticalIssues', 0),
        highIssues=data.get('highIssues', 0),
        mediumIssues=data.get('mediumIssues', 0),
        lowIssues=data.get('lowIssues', 0),
        newIssues=data.get('newIssues', 0),
        fixedIssues=data.get('fixedIssues', 0),
        notFixedIssues=data.get('notFixedIssues', 0),
        reopenedIssues=data.get('reopenedIssues', 0),
        deferredIssues=data.get('deferredIssues', 0),
        
        # Enhancements
        newEnhancements=data.get('newEnhancements', 0),
        implementedEnhancements=data.get('implementedEnhancements', 0),
        existsEnhancements=data.get('existsEnhancements', 0),
        
        # Evaluation
        evaluationData=json.dumps(data.get('evaluationData', {})),
        projectEvaluationData=json.dumps(data.get('projectEvaluationData', {})),
        
        # Other metrics
        evaluationMetric=data.get('evaluationMetric'),
        qaNotesMetric=data.get('qaNotesMetric', 0),
        qaNotesText=data.get('qaNotesText'),
        
        # Custom Fields
        customFields=json.dumps(data.get('customFields', {}))
    )
    
    # Calculate totals and scores
    new_report.calculate_totals()
    new_report.calculate_evaluation_scores()
    
    db.session.add(new_report)
    db.session.commit()
    
    return jsonify(new_report.to_dict()), 201

class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    projects = db.relationship('Project', backref='portfolio', lazy=True)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolio.id'), nullable=False)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

class Tester(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

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

# Add API routes for CRUD operations
@app.route('/api/portfolios', methods=['GET', 'POST'])
def manage_portfolios():
    if request.method == 'GET':
        portfolios = Portfolio.query.all()
        return jsonify([{'id': p.id, 'name': p.name, 'description': p.description} for p in portfolios])
    
    elif request.method == 'POST':
        data = request.get_json()
        portfolio = Portfolio(name=data['name'], description=data.get('description', ''))
        db.session.add(portfolio)
        db.session.commit()
        return jsonify({'id': portfolio.id, 'name': portfolio.name})

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
        data = request.get_json()
        project = Project(
            name=data['name'], 
            description=data.get('description', ''),
            portfolio_id=data['portfolio_id']
        )
        db.session.add(project)
        db.session.commit()
        return jsonify({
            'id': project.id, 
            'name': project.name,
            'portfolio_id': project.portfolio_id
        }), 201

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

# Testers API Routes
@app.route('/api/testers', methods=['GET', 'POST'])
def manage_testers():
    if request.method == 'GET':
        testers = Tester.query.all()
        return jsonify([{
            'id': t.id,
            'name': t.name,
            'email': t.email,
            'createdAt': t.createdAt.isoformat() if t.createdAt else None
        } for t in testers])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Check if email already exists
        existing_tester = Tester.query.filter_by(email=data['email']).first()
        if existing_tester:
            return jsonify({'error': 'Tester with this email already exists'}), 400
        
        tester = Tester(
            name=data['name'],
            email=data['email']
        )
        db.session.add(tester)
        db.session.commit()
        return jsonify({
            'id': tester.id,
            'name': tester.name,
            'email': tester.email
        }), 201

@app.route('/api/testers/<int:tester_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_tester(tester_id):
    tester = Tester.query.get_or_404(tester_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': tester.id,
            'name': tester.name,
            'email': tester.email,
            'createdAt': tester.createdAt.isoformat() if tester.createdAt else None
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        # Check if email is being changed and if new email already exists
        if data.get('email') != tester.email:
            existing_tester = Tester.query.filter_by(email=data['email']).first()
            if existing_tester:
                return jsonify({'error': 'Tester with this email already exists'}), 400
        
        tester.name = data.get('name', tester.name)
        tester.email = data.get('email', tester.email)
        db.session.commit()
        return jsonify({
            'id': tester.id,
            'name': tester.name,
            'email': tester.email
        })
    
    elif request.method == 'DELETE':
        db.session.delete(tester)
        db.session.commit()
        return jsonify({'message': 'Tester deleted successfully'}), 200

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
        'testers': [{'id': t.id, 'name': t.name, 'email': t.email} for t in testers],
        'team_members': [{'id': tm.id, 'name': tm.name, 'email': tm.email, 'role': tm.role} for tm in team_members]
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
                  'cycleNumber', 'reportDate', 'testSummary', 'testingStatus',
                  'passedUserStories', 'passedWithIssuesUserStories', 'failedUserStories',
                  'blockedUserStories', 'cancelledUserStories', 'deferredUserStories', 
                  'notTestableUserStories', 'passedTestCases', 'passedWithIssuesTestCases',
                  'failedTestCases', 'blockedTestCases', 'cancelledTestCases', 
                  'deferredTestCases', 'notTestableTestCases', 'criticalIssues',
                  'highIssues', 'mediumIssues', 'lowIssues', 'newIssues', 'fixedIssues',
                  'notFixedIssues', 'reopenedIssues', 'deferredIssues', 'newEnhancements',
                  'implementedEnhancements', 'existsEnhancements', 'evaluationMetric',
                  'qaNotesMetric', 'qaNotesText']:
        if field in data:
            setattr(report, field, data[field])
    
    # Update JSON fields
    if 'requestData' in data:
        report.requestData = json.dumps(data['requestData'])
    if 'buildData' in data:
        report.buildData = json.dumps(data['buildData'])
    if 'testerData' in data:
        report.testerData = json.dumps(data['testerData'])
    if 'evaluationData' in data:
        report.evaluationData = json.dumps(data['evaluationData'])
    if 'projectEvaluationData' in data:
        report.projectEvaluationData = json.dumps(data['projectEvaluationData'])
    if 'customFields' in data:
        report.customFields = json.dumps(data['customFields'])

    # Recalculate totals and scores
    report.calculate_totals()
    report.calculate_evaluation_scores()
    
    db.session.commit()
    return jsonify(report.to_dict())

@app.route('/api/reports/<int:id>', methods=['DELETE'])
def delete_report(id):
    """Deletes a report by its ID."""
    report = Report.query.get_or_404(id)
    db.session.delete(report)
    db.session.commit()
    return jsonify({'message': 'Report deleted successfully'}), 200

if __name__ == '__main__':
    with app.app_context():
        # This will create the database file and the 'report' table if they don't exist.
        db.create_all()
    app.run(debug=True)
