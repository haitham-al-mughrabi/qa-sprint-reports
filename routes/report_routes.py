"""
Report management routes
"""
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, render_template
from models import db, Report, Project
from auth import login_required, approved_user_required
from services.email_service import email_service

report_bp = Blueprint('report_routes', __name__)


@report_bp.route('/reports')
@login_required
@approved_user_required
def reports_page():
    """Serves the reports management HTML page."""
    return render_template('reports/reports.html')


@report_bp.route('/report-types')
@login_required
@approved_user_required
def report_types_page():
    """Serves the report types selection page."""
    try:
        return render_template('reports/report_types.html')
    except:
        return "Report types template not found", 404


@report_bp.route('/sprint-report')
@login_required
@approved_user_required
def sprint_report_page():
    """Serves the sprint report creation page."""
    try:
        return render_template('reports/sprint_report.html')
    except:
        return "Sprint report template not found", 404


@report_bp.route('/manual-report')
@login_required
@approved_user_required
def manual_report_page():
    """Serves the manual report creation page."""
    try:
        return render_template('reports/manual_report.html')
    except:
        return "Manual report template not found", 404


@report_bp.route('/automation-report')
@login_required
@approved_user_required
def automation_report_page():
    """Serves the automation report creation page."""
    try:
        return render_template('reports/automation_report.html')
    except:
        return "Automation report template not found", 404


@report_bp.route('/performance-report')
@login_required
@approved_user_required
def performance_report_page():
    """Serves the performance report creation page."""
    try:
        return render_template('reports/performance_report.html')
    except:
        return "Performance report template not found", 404


@report_bp.route('/create-report')
@login_required
@approved_user_required
def create_report_page():
    """Serves the create/edit report HTML page."""
    return render_template('reports/create_report.html')


@report_bp.route('/report/<int:report_id>')
@login_required
@approved_user_required
def view_report(report_id):
    """Serves the report view page."""
    return render_template('reports/view_report.html', report_id=report_id)


@report_bp.route('/api/reports', methods=['GET'])
@login_required
@approved_user_required
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


@report_bp.route('/api/reports/<int:report_id>', methods=['GET'])
@login_required
@approved_user_required
def get_report(report_id):
    """Fetches a specific report by ID."""
    report = Report.query.get_or_404(report_id)
    return jsonify(report.to_dict())


@report_bp.route('/api/reports', methods=['POST'])
@login_required
@approved_user_required
def create_report():
    """Creates a new report."""
    try:
        data = request.get_json()

        # Create new report instance
        report = Report()

        # Set basic fields
        report.portfolioName = data.get('portfolioName', '')
        report.projectName = data.get('projectName', '')
        report.sprintNumber = int(data.get('sprintNumber', 1)) if data.get('sprintNumber') else 1
        report.reportVersion = data.get('reportVersion', '1.0')
        report.reportName = data.get('reportName', '')
        report.reportType = data.get('reportType', 'sprint')
        report.cycleNumber = int(data.get('cycleNumber', 1)) if data.get('cycleNumber') else 1
        report.releaseNumber = data.get('releaseNumber', '1.0')
        report.reportDate = data.get('reportDate', '')
        report.testEnvironment = data.get('testEnvironment', '')
        report.testSummary = data.get('testSummary', '')
        report.testingStatus = data.get('testingStatus', 'pending')

        # Set dynamic data as JSON strings
        report.requestData = json.dumps(data.get('requestData', []))
        report.buildData = json.dumps(data.get('buildData', []))
        report.testerData = json.dumps(data.get('testerData', []))
        report.teamMemberData = json.dumps(data.get('teamMemberData', []))

        # Set user stories data
        report.passedUserStories = data.get('passedUserStories', 0)
        report.passedWithIssuesUserStories = data.get('passedWithIssuesUserStories', 0)
        report.failedUserStories = data.get('failedUserStories', 0)
        report.blockedUserStories = data.get('blockedUserStories', 0)
        report.cancelledUserStories = data.get('cancelledUserStories', 0)
        report.deferredUserStories = data.get('deferredUserStories', 0)
        report.notTestableUserStories = data.get('notTestableUserStories', 0)

        # Set test cases data
        report.passedTestCases = data.get('passedTestCases', 0)
        report.passedWithIssuesTestCases = data.get('passedWithIssuesTestCases', 0)
        report.failedTestCases = data.get('failedTestCases', 0)
        report.blockedTestCases = data.get('blockedTestCases', 0)
        report.cancelledTestCases = data.get('cancelledTestCases', 0)
        report.deferredTestCases = data.get('deferredTestCases', 0)
        report.notTestableTestCases = data.get('notTestableTestCases', 0)

        # Set issues data
        report.criticalIssues = data.get('criticalIssues', 0)
        report.highIssues = data.get('highIssues', 0)
        report.mediumIssues = data.get('mediumIssues', 0)
        report.lowIssues = data.get('lowIssues', 0)
        report.newIssues = data.get('newIssues', 0)
        report.fixedIssues = data.get('fixedIssues', 0)
        report.notFixedIssues = data.get('notFixedIssues', 0)
        report.reopenedIssues = data.get('reopenedIssues', 0)
        report.deferredIssues = data.get('deferredIssues', 0)

        # Set enhancements data
        report.newEnhancements = data.get('newEnhancements', 0)
        report.implementedEnhancements = data.get('implementedEnhancements', 0)
        report.existsEnhancements = data.get('existsEnhancements', 0)

        # Set QA notes data
        report.qaNotesData = json.dumps(data.get('qaNotesData', []))
        report.qaNoteFieldsData = json.dumps(data.get('qaNoteFieldsData', []))

        # Set automation report specific data
        report.covered_services = json.dumps(data.get('covered_services', []))
        report.covered_modules = json.dumps(data.get('covered_modules', []))
        report.bugs = json.dumps(data.get('bugs', []))

        # Set automation regression data
        report.automationPassedTestCases = data.get('automationPassedTestCases', 0)
        report.automationFailedTestCases = data.get('automationFailedTestCases', 0)
        report.automationSkippedTestCases = data.get('automationSkippedTestCases', 0)
        report.automationStableTests = data.get('automationStableTests', 0)
        report.automationFlakyTests = data.get('automationFlakyTests', 0)

        # Set performance report specific data
        report.testObjective = data.get('testObjective', '')
        report.testScope = data.get('testScope', '')
        report.numberOfUsers = data.get('numberOfUsers', 0)
        report.executionDuration = data.get('executionDuration', '')
        report.userLoad = data.get('userLoad', '')
        report.responseTime = data.get('responseTime', '')
        report.requestVolume = data.get('requestVolume', '')
        report.errorRate = data.get('errorRate', '')
        report.slowest = data.get('slowest', '')
        report.fastest = data.get('fastest', '')
        report.totalRequests = data.get('totalRequests', 0)
        report.failedRequests = data.get('failedRequests', 0)
        report.statusCodes = json.dumps(data.get('statusCodes', []))
        report.averageResponse = data.get('averageResponse', '')
        report.averageResponseUnit = data.get('averageResponseUnit', 'ms')
        report.maxResponse = data.get('maxResponse', '')
        report.maxResponseUnit = data.get('maxResponseUnit', 'ms')
        report.performanceScenarios = json.dumps(data.get('performanceScenarios', []))
        report.httpRequestsData = json.dumps(data.get('httpRequestsData', []))

        # Set evaluation data
        report.involvementScore = data.get('involvementScore', 0)
        report.involvementReason = data.get('involvementReason', '')
        report.requirementsQualityScore = data.get('requirementsQualityScore', 0)
        report.requirementsQualityReason = data.get('requirementsQualityReason', '')
        report.qaPlanReviewScore = data.get('qaPlanReviewScore', 0)
        report.qaPlanReviewReason = data.get('qaPlanReviewReason', '')
        report.uxScore = data.get('uxScore', 0)
        report.uxReason = data.get('uxReason', '')
        report.cooperationScore = data.get('cooperationScore', 0)
        report.cooperationReason = data.get('cooperationReason', '')
        report.criticalBugsScore = data.get('criticalBugsScore', 0)
        report.criticalBugsReason = data.get('criticalBugsReason', '')
        report.highBugsScore = data.get('highBugsScore', 0)
        report.highBugsReason = data.get('highBugsReason', '')
        report.mediumBugsScore = data.get('mediumBugsScore', 0)
        report.mediumBugsReason = data.get('mediumBugsReason', '')
        report.lowBugsScore = data.get('lowBugsScore', 0)
        report.lowBugsReason = data.get('lowBugsReason', '')

        # Calculate totals and save
        report.calculate_totals()
        db.session.add(report)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Report created successfully',
            'report': report.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to create report: {str(e)}'}), 500


@report_bp.route('/api/reports/<int:report_id>', methods=['PUT'])
@login_required
@approved_user_required
def update_report(report_id):
    """Updates an existing report."""
    try:
        report = Report.query.get_or_404(report_id)
        data = request.get_json()

        # Update basic fields
        report.portfolioName = data.get('portfolioName', report.portfolioName)
        report.projectName = data.get('projectName', report.projectName)
        report.sprintNumber = int(data.get('sprintNumber', report.sprintNumber)) if data.get('sprintNumber') else report.sprintNumber
        report.reportVersion = data.get('reportVersion', report.reportVersion)
        report.reportName = data.get('reportName', report.reportName)
        report.reportType = data.get('reportType', report.reportType)
        report.cycleNumber = int(data.get('cycleNumber', report.cycleNumber)) if data.get('cycleNumber') else report.cycleNumber
        report.releaseNumber = data.get('releaseNumber', report.releaseNumber)
        report.reportDate = data.get('reportDate', report.reportDate)
        report.testEnvironment = data.get('testEnvironment', report.testEnvironment)
        report.testSummary = data.get('testSummary', report.testSummary)
        report.testingStatus = data.get('testingStatus', report.testingStatus)

        # Update dynamic data
        if 'requestData' in data:
            report.requestData = json.dumps(data['requestData'])
        if 'buildData' in data:
            report.buildData = json.dumps(data['buildData'])
        if 'testerData' in data:
            report.testerData = json.dumps(data['testerData'])
        if 'teamMemberData' in data:
            report.teamMemberData = json.dumps(data['teamMemberData'])

        # Update user stories data
        report.passedUserStories = data.get('passedUserStories', report.passedUserStories)
        report.passedWithIssuesUserStories = data.get('passedWithIssuesUserStories', report.passedWithIssuesUserStories)
        report.failedUserStories = data.get('failedUserStories', report.failedUserStories)
        report.blockedUserStories = data.get('blockedUserStories', report.blockedUserStories)
        report.cancelledUserStories = data.get('cancelledUserStories', report.cancelledUserStories)
        report.deferredUserStories = data.get('deferredUserStories', report.deferredUserStories)
        report.notTestableUserStories = data.get('notTestableUserStories', report.notTestableUserStories)

        # Update test cases data
        report.passedTestCases = data.get('passedTestCases', report.passedTestCases)
        report.passedWithIssuesTestCases = data.get('passedWithIssuesTestCases', report.passedWithIssuesTestCases)
        report.failedTestCases = data.get('failedTestCases', report.failedTestCases)
        report.blockedTestCases = data.get('blockedTestCases', report.blockedTestCases)
        report.cancelledTestCases = data.get('cancelledTestCases', report.cancelledTestCases)
        report.deferredTestCases = data.get('deferredTestCases', report.deferredTestCases)
        report.notTestableTestCases = data.get('notTestableTestCases', report.notTestableTestCases)

        # Update issues data
        report.criticalIssues = data.get('criticalIssues', report.criticalIssues)
        report.highIssues = data.get('highIssues', report.highIssues)
        report.mediumIssues = data.get('mediumIssues', report.mediumIssues)
        report.lowIssues = data.get('lowIssues', report.lowIssues)
        report.newIssues = data.get('newIssues', report.newIssues)
        report.fixedIssues = data.get('fixedIssues', report.fixedIssues)
        report.notFixedIssues = data.get('notFixedIssues', report.notFixedIssues)
        report.reopenedIssues = data.get('reopenedIssues', report.reopenedIssues)
        report.deferredIssues = data.get('deferredIssues', report.deferredIssues)

        # Update enhancements data
        report.newEnhancements = data.get('newEnhancements', report.newEnhancements)
        report.implementedEnhancements = data.get('implementedEnhancements', report.implementedEnhancements)
        report.existsEnhancements = data.get('existsEnhancements', report.existsEnhancements)

        # Update QA notes data
        if 'qaNotesData' in data:
            report.qaNotesData = json.dumps(data['qaNotesData'])
        if 'qaNoteFieldsData' in data:
            report.qaNoteFieldsData = json.dumps(data['qaNoteFieldsData'])

        # Update automation report specific data
        if 'covered_services' in data:
            report.covered_services = json.dumps(data['covered_services'])
        if 'covered_modules' in data:
            report.covered_modules = json.dumps(data['covered_modules'])
        if 'bugs' in data:
            report.bugs = json.dumps(data['bugs'])

        # Update automation regression data
        report.automationPassedTestCases = data.get('automationPassedTestCases', report.automationPassedTestCases)
        report.automationFailedTestCases = data.get('automationFailedTestCases', report.automationFailedTestCases)
        report.automationSkippedTestCases = data.get('automationSkippedTestCases', report.automationSkippedTestCases)
        report.automationStableTests = data.get('automationStableTests', report.automationStableTests)
        report.automationFlakyTests = data.get('automationFlakyTests', report.automationFlakyTests)

        # Update performance report specific data
        report.testObjective = data.get('testObjective', report.testObjective)
        report.testScope = data.get('testScope', report.testScope)
        report.numberOfUsers = data.get('numberOfUsers', report.numberOfUsers)
        report.executionDuration = data.get('executionDuration', report.executionDuration)
        report.userLoad = data.get('userLoad', report.userLoad)
        report.responseTime = data.get('responseTime', report.responseTime)
        report.requestVolume = data.get('requestVolume', report.requestVolume)
        report.errorRate = data.get('errorRate', report.errorRate)
        report.slowest = data.get('slowest', report.slowest)
        report.fastest = data.get('fastest', report.fastest)
        report.totalRequests = data.get('totalRequests', report.totalRequests)
        report.failedRequests = data.get('failedRequests', report.failedRequests)
        if 'statusCodes' in data:
            report.statusCodes = json.dumps(data['statusCodes'])
        report.averageResponse = data.get('averageResponse', report.averageResponse)
        report.averageResponseUnit = data.get('averageResponseUnit', report.averageResponseUnit)
        report.maxResponse = data.get('maxResponse', report.maxResponse)
        report.maxResponseUnit = data.get('maxResponseUnit', report.maxResponseUnit)
        if 'performanceScenarios' in data:
            report.performanceScenarios = json.dumps(data['performanceScenarios'])
        if 'httpRequestsData' in data:
            report.httpRequestsData = json.dumps(data['httpRequestsData'])

        # Update evaluation data
        report.involvementScore = data.get('involvementScore', report.involvementScore)
        report.involvementReason = data.get('involvementReason', report.involvementReason)
        report.requirementsQualityScore = data.get('requirementsQualityScore', report.requirementsQualityScore)
        report.requirementsQualityReason = data.get('requirementsQualityReason', report.requirementsQualityReason)
        report.qaPlanReviewScore = data.get('qaPlanReviewScore', report.qaPlanReviewScore)
        report.qaPlanReviewReason = data.get('qaPlanReviewReason', report.qaPlanReviewReason)
        report.uxScore = data.get('uxScore', report.uxScore)
        report.uxReason = data.get('uxReason', report.uxReason)
        report.cooperationScore = data.get('cooperationScore', report.cooperationScore)
        report.cooperationReason = data.get('cooperationReason', report.cooperationReason)
        report.criticalBugsScore = data.get('criticalBugsScore', report.criticalBugsScore)
        report.criticalBugsReason = data.get('criticalBugsReason', report.criticalBugsReason)
        report.highBugsScore = data.get('highBugsScore', report.highBugsScore)
        report.highBugsReason = data.get('highBugsReason', report.highBugsReason)
        report.mediumBugsScore = data.get('mediumBugsScore', report.mediumBugsScore)
        report.mediumBugsReason = data.get('mediumBugsReason', report.mediumBugsReason)
        report.lowBugsScore = data.get('lowBugsScore', report.lowBugsScore)
        report.lowBugsReason = data.get('lowBugsReason', report.lowBugsReason)

        # Recalculate totals and save
        report.calculate_totals()
        report.updatedAt = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Report updated successfully',
            'report': report.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update report: {str(e)}'}), 500


@report_bp.route('/api/reports/<int:report_id>', methods=['DELETE'])
@login_required
@approved_user_required
def delete_report(report_id):
    """Deletes a report."""
    try:
        report = Report.query.get_or_404(report_id)
        db.session.delete(report)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Report deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete report: {str(e)}'}), 500


@report_bp.route('/api/projects/<portfolio_name>/<project_name>/latest-data', methods=['GET'])
@login_required
@approved_user_required
def get_latest_project_data(portfolio_name, project_name):
    """Get latest report data for a specific project to auto-populate new reports"""
    try:
        # Get all reports for this project to find the highest values (case-insensitive)
        all_reports = Report.query.filter(
            db.func.lower(Report.portfolioName) == portfolio_name.lower(),
            db.func.lower(Report.projectName) == project_name.lower()
        ).all()

        if not all_reports:
            # No previous reports - return default values
            today = datetime.now().strftime('%d-%m-%Y')

            # Get project to find assigned testers (case-insensitive)
            project = Project.query.filter(db.func.lower(Project.name) == project_name.lower()).first()
            project_testers = []
            if project:
                project_testers = [{
                    'id': t.id, 'name': t.name, 'email': t.email,
                    'is_automation_engineer': t.is_automation_engineer,
                    'is_manual_engineer': t.is_manual_engineer,
                    'role_types': t.role_types,
                    'role_display': t.role_display
                } for t in project.testers]

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

        # Sort reports by ID to get chronological order (latest by creation time)
        sorted_reports = sorted(all_reports, key=lambda r: r.id)
        latest_report = sorted_reports[-1]  # Get the most recently created report
        second_latest = sorted_reports[-2] if len(sorted_reports) > 1 else None

        # Find the highest sprint number across all reports
        max_sprint = max((r.sprintNumber or 0) for r in all_reports)
        
        # Get reports with the highest sprint number
        max_sprint_reports = [r for r in all_reports if (r.sprintNumber or 0) == max_sprint]
        
        # Find the highest cycle number among reports with the highest sprint
        max_cycle_in_max_sprint = max((r.cycleNumber or 0) for r in max_sprint_reports)
        
        # Get the latest report with max sprint and max cycle
        latest_max_report = None
        for r in sorted(max_sprint_reports, key=lambda x: x.id, reverse=True):
            if (r.cycleNumber or 0) == max_cycle_in_max_sprint:
                latest_max_report = r
                break
        
        if not latest_max_report:
            latest_max_report = latest_report

        # Current values from the latest report with highest sprint/cycle
        current_sprint = int(latest_max_report.sprintNumber or 1)
        current_cycle = int(latest_max_report.cycleNumber or 1)
        current_release = latest_max_report.releaseNumber or '1.0'
        
        # Parse release numbers for comparison
        def parse_release(release_str):
            try:
                parts = str(release_str).split('.')
                return (int(parts[0]), int(parts[1]) if len(parts) > 1 else 0)
            except:
                return (1, 0)
        
        def increment_release(release_str):
            try:
                parts = str(release_str).split('.')
                major = int(parts[0])
                minor = int(parts[1]) if len(parts) > 1 else 0
                return f"{major}.{minor + 1}"
            except:
                return "1.1"
        
        # Calculate suggested values based on the requirements
        if second_latest:
            # Use chronological order for comparison
            prev_sprint = int(second_latest.sprintNumber or 1)
            prev_cycle = int(second_latest.cycleNumber or 1)
            prev_release = second_latest.releaseNumber or '1.0'
            
            current_rel_parsed = parse_release(current_release)
            prev_rel_parsed = parse_release(prev_release)
            
            # Logic based on requirements analysis:
            if current_sprint == prev_sprint:
                # Same sprint number - increment cycle
                suggested_sprint = current_sprint
                suggested_cycle = current_cycle + 1
                # Use the first report's release number (prev_release in this case)
                suggested_release = prev_release
            elif current_sprint > prev_sprint:
                # Sprint increased - increment sprint, reset cycle to 1
                suggested_sprint = current_sprint + 1
                suggested_cycle = 1
                # Check if release also increased
                if current_rel_parsed > prev_rel_parsed:
                    # Release increased - increment the current release
                    suggested_release = increment_release(current_release)
                else:
                    # Release same - use the first report's release
                    suggested_release = prev_release
            else:
                # Edge case: current sprint is lower than previous
                # Use the highest sprint number found + 1
                suggested_sprint = max_sprint + 1
                suggested_cycle = 1
                # Use the release from the report with the highest sprint
                highest_sprint_report = None
                for r in all_reports:
                    if (r.sprintNumber or 0) == max_sprint:
                        highest_sprint_report = r
                        break
                suggested_release = highest_sprint_report.releaseNumber if highest_sprint_report else current_release
        else:
            # Only one report exists - increment sprint
            suggested_sprint = current_sprint + 1
            suggested_cycle = 1
            suggested_release = current_release

        # Parse existing data
        tester_data = json.loads(latest_report.testerData or '[]')
        team_member_data = json.loads(latest_report.teamMemberData or '[]')

        # Get project to find assigned testers (merge with existing tester data) (case-insensitive)
        project = Project.query.filter(db.func.lower(Project.name) == project_name.lower()).first()
        if project:
            # Get assigned testers that might not be in the latest report
            assigned_testers = [{
                'id': t.id, 'name': t.name, 'email': t.email,
                'is_automation_engineer': t.is_automation_engineer,
                'is_manual_engineer': t.is_manual_engineer
            } for t in project.testers]

            # Merge with existing tester data (avoid duplicates)
            existing_emails = {t.get('email') for t in tester_data}
            for assigned_tester in assigned_testers:
                if assigned_tester['email'] not in existing_emails:
                    tester_data.append(assigned_tester)

        return jsonify({
            'hasData': True,
            'latestData': {
                'sprintNumber': current_sprint,
                'cycleNumber': current_cycle,
                'releaseNumber': current_release,
                'reportVersion': latest_report.reportVersion or '1.0',
                'reportDate': latest_report.reportDate,
                'testerData': tester_data,
                'teamMembers': team_member_data
            },
            'suggestedValues': {
                'sprintNumber': suggested_sprint,
                'cycleNumber': suggested_cycle,
                'releaseNumber': suggested_release
            }
        })

    except Exception as e:
        return jsonify({'error': f'Failed to fetch project data: {str(e)}'}), 500


@report_bp.route('/api/reports/<int:report_id>/send-email', methods=['POST'])
@login_required
@approved_user_required
def send_report_email(report_id):
    """Send a specific report via email"""
    try:
        data = request.get_json()
        recipients = data.get('recipients', [])

        if not recipients:
            return jsonify({'success': False, 'message': 'No recipients specified'}), 400

        report = Report.query.get_or_404(report_id)
        report_url = f"{request.host_url}report/{report_id}"

        email_service.send_report_notification(report, recipients, report_url)

        return jsonify({'success': True, 'message': f'Report sent to {len(recipients)} recipients'})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to send report: {str(e)}'}), 500