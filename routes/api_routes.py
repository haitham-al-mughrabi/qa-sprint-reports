from flask import request, jsonify
from models.schemas import db, Report, User, Portfolio, Project, Tester, TeamMember, PasswordResetRequest, DashboardStats, PortfolioStats, ProjectStats, tester_project_association
from routes.auth_routes import login_required, approved_user_required, admin_required
from services.email_service import email_service
from utils.helpers import convert_date_to_storage_format, parse_release, increment_release
from datetime import datetime
from sqlalchemy import func
import json
import re

def update_stats_cache():
    """Update cached statistics for better dashboard performance"""
    try:
        # Overall dashboard stats
        stats = DashboardStats.query.first()
        if not stats:
            stats = DashboardStats()
            db.session.add(stats)

        # Calculate overall stats
        all_reports = Report.query.all()
        stats.total_reports = len(all_reports)
        stats.completed_reports = len([r for r in all_reports if r.testingStatus == 'Completed'])
        stats.in_progress_reports = len([r for r in all_reports if r.testingStatus == 'In Progress'])
        stats.pending_reports = len([r for r in all_reports if r.testingStatus == 'Pending'])
        
        stats.total_user_stories = sum(r.totalUserStories or 0 for r in all_reports)
        stats.total_test_cases = sum(r.totalTestCases or 0 for r in all_reports)
        stats.total_issues = sum(r.totalIssues or 0 for r in all_reports)
        stats.total_enhancements = sum(r.totalEnhancements or 0 for r in all_reports)
        stats.last_updated = datetime.utcnow()

        # Portfolio stats
        portfolios = Portfolio.query.all()
        for portfolio in portfolios:
            portfolio_stats = PortfolioStats.query.filter_by(portfolio_id=portfolio.id).first()
            if not portfolio_stats:
                portfolio_stats = PortfolioStats(portfolio_id=portfolio.id, portfolio_name=portfolio.name)
                db.session.add(portfolio_stats)
            
            portfolio_reports = [r for r in all_reports if r.portfolioName == portfolio.name]
            portfolio_stats.total_reports = len(portfolio_reports)
            portfolio_stats.total_projects = len(portfolio.projects)
            portfolio_stats.total_user_stories = sum(r.totalUserStories or 0 for r in portfolio_reports)
            portfolio_stats.total_test_cases = sum(r.totalTestCases or 0 for r in portfolio_reports)
            portfolio_stats.total_issues = sum(r.totalIssues or 0 for r in portfolio_reports)
            portfolio_stats.total_enhancements = sum(r.totalEnhancements or 0 for r in portfolio_reports)
            portfolio_stats.last_report_date = max((r.reportDate for r in portfolio_reports), default=None)
            portfolio_stats.last_updated = datetime.utcnow()

        # Project stats
        projects = Project.query.all()
        for project in projects:
            project_stats = ProjectStats.query.filter_by(project_id=project.id).first()
            if not project_stats:
                project_stats = ProjectStats(
                    project_id=project.id,
                    portfolio_id=project.portfolio_id,
                    portfolio_name=project.portfolio.name if project.portfolio else 'No Portfolio',
                    project_name=project.name
                )
                db.session.add(project_stats)
            
            project_reports = [r for r in all_reports if r.projectName == project.name]
            project_stats.total_reports = len(project_reports)
            project_stats.total_user_stories = sum(r.totalUserStories or 0 for r in project_reports)
            project_stats.total_test_cases = sum(r.totalTestCases or 0 for r in project_reports)
            project_stats.total_issues = sum(r.totalIssues or 0 for r in project_reports)
            project_stats.total_enhancements = sum(r.totalEnhancements or 0 for r in project_reports)
            project_stats.last_report_date = max((r.reportDate for r in project_reports), default=None)
            project_stats.latest_testing_status = project_reports[-1].testingStatus if project_reports else None
            project_stats.last_updated = datetime.utcnow()

        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error updating stats cache: {e}")
        return False


def init_api_routes(app):
    
    @app.route('/api/reports', methods=['GET'])
    @login_required
    @approved_user_required
    def get_reports():
        try:
            reports = Report.query.order_by(Report.createdAt.desc()).all()
            return jsonify({
                'success': True,
                'reports': [report.to_dict() for report in reports],
                'total': len(reports)
            })
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error fetching reports: {str(e)}'}), 500

    @app.route('/api/reports/<int:report_id>', methods=['GET'])
    @login_required
    @approved_user_required
    def get_report(report_id):
        report = Report.query.get_or_404(report_id)
        return jsonify({'success': True, 'report': report.to_dict()})

    @app.route('/api/dashboard/stats', methods=['GET'])
    @login_required
    @approved_user_required
    def get_dashboard_stats():
        try:
            # Get all reports for detailed analysis
            all_reports = Report.query.all()
            
            # Basic counts
            total_reports = len(all_reports)
            completed_reports = len([r for r in all_reports if r.testingStatus == 'Completed'])
            in_progress_reports = len([r for r in all_reports if r.testingStatus == 'In Progress'])
            pending_reports = len([r for r in all_reports if r.testingStatus == 'Pending'])
            
            # Get portfolio and project data
            portfolio_data = {}
            project_data = {}
            
            for report in all_reports:
                portfolio = report.portfolioName
                project = report.projectName
                
                # Initialize portfolio data if not exists
                if portfolio not in portfolio_data:
                    portfolio_data[portfolio] = {
                        'name': portfolio,
                        'total_reports': 0,
                        'projects': set(),
                        'total_user_stories': 0,
                        'total_test_cases': 0,
                        'total_issues': 0,
                        'total_enhancements': 0,
                        'latest_report_date': None,
                        'project_details': {}
                    }
                
                # Update portfolio data
                portfolio_data[portfolio]['total_reports'] += 1
                portfolio_data[portfolio]['projects'].add(project)
                portfolio_data[portfolio]['total_user_stories'] += report.totalUserStories or 0
                portfolio_data[portfolio]['total_test_cases'] += report.totalTestCases or 0
                portfolio_data[portfolio]['total_issues'] += report.totalIssues or 0
                portfolio_data[portfolio]['total_enhancements'] += report.totalEnhancements or 0
                
                # Update latest report date
                if portfolio_data[portfolio]['latest_report_date'] is None or (report.reportDate and report.reportDate > portfolio_data[portfolio]['latest_report_date']):
                    portfolio_data[portfolio]['latest_report_date'] = report.reportDate
                
                # Initialize project data within portfolio
                if project not in portfolio_data[portfolio]['project_details']:
                    portfolio_data[portfolio]['project_details'][project] = {
                        'name': project,
                        'total_reports': 0,
                        'total_user_stories': 0,
                        'total_test_cases': 0,
                        'total_issues': 0,
                        'total_enhancements': 0,
                        'latest_report_date': None,
                        'latest_testing_status': None
                    }
                
                # Update project data
                project_info = portfolio_data[portfolio]['project_details'][project]
                project_info['total_reports'] += 1
                project_info['total_user_stories'] += report.totalUserStories or 0
                project_info['total_test_cases'] += report.totalTestCases or 0
                project_info['total_issues'] += report.totalIssues or 0
                project_info['total_enhancements'] += report.totalEnhancements or 0
                project_info['latest_testing_status'] = report.testingStatus
                
                if project_info['latest_report_date'] is None or (report.reportDate and report.reportDate > project_info['latest_report_date']):
                    project_info['latest_report_date'] = report.reportDate
                
                # Also store in project_data for direct access
                project_key = f"{portfolio}|{project}"
                project_data[project_key] = project_info.copy()
                project_data[project_key]['portfolio_name'] = portfolio
            
            # Convert sets to counts for portfolios
            for portfolio in portfolio_data.values():
                portfolio['total_projects'] = len(portfolio['projects'])
                portfolio['projects'] = list(portfolio['projects'])
            
            # Prepare response
            response_data = {
                'success': True,
                'overview': {
                    'total_reports': total_reports,
                    'completed_reports': completed_reports,
                    'in_progress_reports': in_progress_reports,
                    'pending_reports': pending_reports,
                    'total_portfolios': len(portfolio_data),
                    'total_projects': len(project_data),
                    'total_user_stories': sum(r.totalUserStories or 0 for r in all_reports),
                    'total_test_cases': sum(r.totalTestCases or 0 for r in all_reports),
                    'total_issues': sum(r.totalIssues or 0 for r in all_reports),
                    'total_enhancements': sum(r.totalEnhancements or 0 for r in all_reports)
                },
                'portfolios': list(portfolio_data.values()),
                'projects': list(project_data.values()),
                'report_types': {
                    'sprint': len([r for r in all_reports if r.reportType == 'sprint']),
                    'manual': len([r for r in all_reports if r.reportType == 'manual']),
                    'automation': len([r for r in all_reports if r.reportType == 'automation']),
                    'performance': len([r for r in all_reports if r.reportType == 'performance'])
                }
            }
            
            return jsonify(response_data)
            
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error fetching dashboard stats: {str(e)}'}), 500

    @app.route('/api/reports', methods=['POST'])
    @login_required
    @approved_user_required
    def create_report():
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'message': 'No data provided'}), 400
            
            # Convert date format if needed
            if 'reportDate' in data:
                data['reportDate'] = convert_date_to_storage_format(data['reportDate'])
            
            # Create new report
            report = Report()
            
            # Set basic fields
            for field in ['portfolioName', 'projectName', 'sprintNumber', 'reportVersion', 
                         'reportName', 'cycleNumber', 'releaseNumber', 'reportDate', 
                         'environment', 'testType', 'testTool', 'testObjective', 'testScope',
                         'testSummary', 'testingStatus', 'reportType']:
                if field in data:
                    setattr(report, field, data[field])
            
            # Handle JSON fields
            json_fields = ['requestData', 'buildData', 'testerData', 'teamMemberData', 
                          'qaNotesData', 'qaNoteFieldsData', 'performanceCriteriaResults',
                          'performanceScenarios', 'httpRequestsOverview', 'bugsData', 'evaluationData']
            
            for field in json_fields:
                if field in data:
                    if isinstance(data[field], (list, dict)):
                        setattr(report, field, json.dumps(data[field]))
                    else:
                        setattr(report, field, data[field])
            
            # Handle integer fields
            integer_fields = ['totalUserStories', 'passedUserStories', 'passedWithIssuesUserStories',
                            'failedUserStories', 'blockedUserStories', 'cancelledUserStories',
                            'deferredUserStories', 'notTestableUserStories', 'totalTestCases',
                            'passedTestCases', 'passedWithIssuesTestCases', 'failedTestCases',
                            'blockedTestCases', 'cancelledTestCases', 'deferredTestCases',
                            'notTestableTestCases', 'totalIssues', 'criticalIssues', 'highIssues',
                            'mediumIssues', 'lowIssues', 'newIssues', 'fixedIssues', 'notFixedIssues',
                            'reopenedIssues', 'deferredIssues', 'totalEnhancements', 'newEnhancements',
                            'implementedEnhancements', 'existsEnhancements', 'automationPassedTestCases',
                            'automationFailedTestCases', 'automationSkippedTestCases', 'automationStableTests',
                            'automationFlakyTests']
            
            for field in integer_fields:
                if field in data:
                    value = data[field]
                    setattr(report, field, int(value) if value is not None and str(value).strip() != '' else 0)
            
            # Handle string fields
            string_fields = ['userLoad', 'responseTime', 'requestVolume', 'errorRate', 'slowestResponse',
                           'fastestResponse', 'numberOfUsers', 'executionDuration', 'maxThroughput',
                           'httpFailures', 'avgResponseTime', 'responseTime95Percent', 'coveredServices',
                           'coveredModules']
            
            for field in string_fields:
                if field in data:
                    setattr(report, field, data[field])
            
            # Validate the report
            is_valid, errors = report.validate_all()
            if not is_valid:
                return jsonify({'success': False, 'message': 'Validation failed', 'errors': errors}), 400
            
            # Calculate totals
            report.calculate_totals()
            
            # Save to database
            db.session.add(report)
            db.session.commit()
            
            # Update stats cache
            update_stats_cache()
            
            return jsonify({
                'success': True,
                'message': 'Report created successfully',
                'report': report.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error creating report: {str(e)}'}), 500

    @app.route('/api/reports/<int:id>', methods=['PUT'])
    @login_required
    @approved_user_required
    def update_report(id):
        try:
            report = Report.query.get_or_404(id)
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'message': 'No data provided'}), 400
            
            # Convert date format if needed
            if 'reportDate' in data:
                data['reportDate'] = convert_date_to_storage_format(data['reportDate'])
            
            # Update basic fields
            for field in ['portfolioName', 'projectName', 'sprintNumber', 'reportVersion', 
                         'reportName', 'cycleNumber', 'releaseNumber', 'reportDate', 
                         'environment', 'testType', 'testTool', 'testObjective', 'testScope',
                         'testSummary', 'testingStatus', 'reportType']:
                if field in data:
                    setattr(report, field, data[field])
            
            # Handle JSON fields
            json_fields = ['requestData', 'buildData', 'testerData', 'teamMemberData', 
                          'qaNotesData', 'qaNoteFieldsData', 'performanceCriteriaResults',
                          'performanceScenarios', 'httpRequestsOverview', 'bugsData', 'evaluationData']
            
            for field in json_fields:
                if field in data:
                    if isinstance(data[field], (list, dict)):
                        setattr(report, field, json.dumps(data[field]))
                    else:
                        setattr(report, field, data[field])
            
            # Handle integer fields
            integer_fields = ['totalUserStories', 'passedUserStories', 'passedWithIssuesUserStories',
                            'failedUserStories', 'blockedUserStories', 'cancelledUserStories',
                            'deferredUserStories', 'notTestableUserStories', 'totalTestCases',
                            'passedTestCases', 'passedWithIssuesTestCases', 'failedTestCases',
                            'blockedTestCases', 'cancelledTestCases', 'deferredTestCases',
                            'notTestableTestCases', 'totalIssues', 'criticalIssues', 'highIssues',
                            'mediumIssues', 'lowIssues', 'newIssues', 'fixedIssues', 'notFixedIssues',
                            'reopenedIssues', 'deferredIssues', 'totalEnhancements', 'newEnhancements',
                            'implementedEnhancements', 'existsEnhancements', 'automationPassedTestCases',
                            'automationFailedTestCases', 'automationSkippedTestCases', 'automationStableTests',
                            'automationFlakyTests']
            
            for field in integer_fields:
                if field in data:
                    value = data[field]
                    setattr(report, field, int(value) if value is not None and str(value).strip() != '' else 0)
            
            # Handle string fields
            string_fields = ['userLoad', 'responseTime', 'requestVolume', 'errorRate', 'slowestResponse',
                           'fastestResponse', 'numberOfUsers', 'executionDuration', 'maxThroughput',
                           'httpFailures', 'avgResponseTime', 'responseTime95Percent', 'coveredServices',
                           'coveredModules']
            
            for field in string_fields:
                if field in data:
                    setattr(report, field, data[field])
            
            # Validate the report
            is_valid, errors = report.validate_all()
            if not is_valid:
                return jsonify({'success': False, 'message': 'Validation failed', 'errors': errors}), 400
            
            # Calculate totals and update timestamp
            report.calculate_totals()
            report.updatedAt = datetime.utcnow()
            
            db.session.commit()
            
            # Update stats cache
            update_stats_cache()
            
            return jsonify({
                'success': True,
                'message': 'Report updated successfully',
                'report': report.to_dict()
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error updating report: {str(e)}'}), 500

    @app.route('/api/reports/<int:id>', methods=['DELETE'])
    def delete_report(id):
        report = Report.query.get_or_404(id)
        db.session.delete(report)
        db.session.commit()
        
        # Update stats cache
        update_stats_cache()
        
        return jsonify({'success': True, 'message': 'Report deleted successfully'})

    @app.route('/api/portfolios/minimal', methods=['GET'])
    @login_required
    @approved_user_required
    def get_portfolios_minimal():
        portfolios = Portfolio.query.all()
        return jsonify([{'id': p.id, 'name': p.name} for p in portfolios])

    @app.route('/api/projects/by-portfolio/<int:portfolio_id>', methods=['GET'])
    @login_required
    @approved_user_required
    def get_projects_by_portfolio(portfolio_id):
        projects = Project.query.filter_by(portfolio_id=portfolio_id).all()
        return jsonify([{'id': p.id, 'name': p.name} for p in projects])

    @app.route('/api/portfolios/<int:portfolio_id>/projects/detailed', methods=['GET'])
    @login_required
    @approved_user_required
    def get_portfolio_projects_detailed(portfolio_id):
        try:
            portfolio = Portfolio.query.get_or_404(portfolio_id)
            projects = Project.query.filter_by(portfolio_id=portfolio_id).all()
            
            project_details = []
            for project in projects:
                project_details.append({
                    'id': project.id,
                    'name': project.name,
                    'description': project.description
                })
            
            return jsonify({
                'success': True,
                'portfolio': portfolio.name,
                'projects': project_details
            })
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/dashboard/stats/cached', methods=['GET'])
    @login_required
    @approved_user_required
    def get_cached_dashboard_stats():
        try:
            # Update cache first
            update_stats_cache()
            
            # Get cached stats
            dashboard_stats = DashboardStats.query.first()
            portfolio_stats = PortfolioStats.query.all()
            project_stats = ProjectStats.query.all()
            
            # Prepare response
            response_data = {
                'success': True,
                'overview': {
                    'total_reports': dashboard_stats.total_reports if dashboard_stats else 0,
                    'completed_reports': dashboard_stats.completed_reports if dashboard_stats else 0,
                    'in_progress_reports': dashboard_stats.in_progress_reports if dashboard_stats else 0,
                    'pending_reports': dashboard_stats.pending_reports if dashboard_stats else 0,
                    'total_user_stories': dashboard_stats.total_user_stories if dashboard_stats else 0,
                    'total_test_cases': dashboard_stats.total_test_cases if dashboard_stats else 0,
                    'total_issues': dashboard_stats.total_issues if dashboard_stats else 0,
                    'total_enhancements': dashboard_stats.total_enhancements if dashboard_stats else 0,
                    'last_updated': dashboard_stats.last_updated.isoformat() if dashboard_stats and dashboard_stats.last_updated else None
                },
                'portfolios': [{
                    'name': ps.portfolio_name,
                    'total_reports': ps.total_reports,
                    'total_projects': ps.total_projects,
                    'total_user_stories': ps.total_user_stories,
                    'total_test_cases': ps.total_test_cases,
                    'total_issues': ps.total_issues,
                    'total_enhancements': ps.total_enhancements,
                    'latest_report_date': ps.last_report_date
                } for ps in portfolio_stats],
                'projects': [{
                    'portfolio_name': ps.portfolio_name,
                    'name': ps.project_name,
                    'total_reports': ps.total_reports,
                    'total_user_stories': ps.total_user_stories,
                    'total_test_cases': ps.total_test_cases,
                    'total_issues': ps.total_issues,
                    'total_enhancements': ps.total_enhancements,
                    'latest_report_date': ps.last_report_date,
                    'latest_testing_status': ps.latest_testing_status
                } for ps in project_stats]
            }
            
            return jsonify(response_data)
            
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error fetching cached stats: {str(e)}'}), 500

    @app.route('/api/project-stats/<int:project_id>', methods=['GET'])
    @login_required
    @approved_user_required
    def get_project_stats(project_id):
        try:
            project = Project.query.get_or_404(project_id)
            
            # Get all reports for this project
            reports = Report.query.filter_by(projectName=project.name).all()
            
            if not reports:
                return jsonify({
                    'success': True,
                    'project': {
                        'id': project.id,
                        'name': project.name,
                        'portfolio_name': project.portfolio.name if project.portfolio else 'No Portfolio'
                    },
                    'stats': {
                        'total_reports': 0,
                        'sprint_reports': 0,
                        'manual_reports': 0,
                        'automation_reports': 0,
                        'performance_reports': 0,
                        'completed_reports': 0,
                        'in_progress_reports': 0,
                        'pending_reports': 0,
                        'total_user_stories': 0,
                        'total_test_cases': 0,
                        'total_issues': 0,
                        'total_enhancements': 0
                    },
                    'trends': {
                        'reports_by_month': [],
                        'testing_status_trend': [],
                        'metrics_trend': []
                    }
                })
            
            # Calculate basic stats
            total_reports = len(reports)
            sprint_reports = len([r for r in reports if r.reportType == 'sprint'])
            manual_reports = len([r for r in reports if r.reportType == 'manual'])
            automation_reports = len([r for r in reports if r.reportType == 'automation'])
            performance_reports = len([r for r in reports if r.reportType == 'performance'])
            
            completed_reports = len([r for r in reports if r.testingStatus == 'Completed'])
            in_progress_reports = len([r for r in reports if r.testingStatus == 'In Progress'])
            pending_reports = len([r for r in reports if r.testingStatus == 'Pending'])
            
            total_user_stories = sum(r.totalUserStories or 0 for r in reports)
            total_test_cases = sum(r.totalTestCases or 0 for r in reports)
            total_issues = sum(r.totalIssues or 0 for r in reports)
            total_enhancements = sum(r.totalEnhancements or 0 for r in reports)
            
            # Trends analysis
            reports_by_month = {}
            testing_status_trend = []
            metrics_trend = []
            
            # Sort reports by date for trend analysis
            sorted_reports = sorted([r for r in reports if r.reportDate], 
                                  key=lambda x: datetime.strptime(x.reportDate, '%d-%m-%Y'))
            
            for report in sorted_reports:
                try:
                    report_date = datetime.strptime(report.reportDate, '%d-%m-%Y')
                    month_key = report_date.strftime('%Y-%m')
                    
                    # Reports by month
                    if month_key not in reports_by_month:
                        reports_by_month[month_key] = 0
                    reports_by_month[month_key] += 1
                    
                    # Testing status trend
                    testing_status_trend.append({
                        'date': report.reportDate,
                        'status': report.testingStatus,
                        'reportType': report.reportType
                    })
                    
                    # Metrics trend
                    metrics_trend.append({
                        'date': report.reportDate,
                        'user_stories': report.totalUserStories or 0,
                        'test_cases': report.totalTestCases or 0,
                        'issues': report.totalIssues or 0,
                        'enhancements': report.totalEnhancements or 0,
                        'reportType': report.reportType
                    })
                except ValueError:
                    # Skip reports with invalid date format
                    continue
            
            # Convert reports by month to list format
            reports_by_month_list = [
                {'month': month, 'count': count}
                for month, count in sorted(reports_by_month.items())
            ]
            
            return jsonify({
                'success': True,
                'project': {
                    'id': project.id,
                    'name': project.name,
                    'portfolio_name': project.portfolio.name if project.portfolio else 'No Portfolio',
                    'description': project.description
                },
                'stats': {
                    'total_reports': total_reports,
                    'sprint_reports': sprint_reports,
                    'manual_reports': manual_reports,
                    'automation_reports': automation_reports,
                    'performance_reports': performance_reports,
                    'completed_reports': completed_reports,
                    'in_progress_reports': in_progress_reports,
                    'pending_reports': pending_reports,
                    'total_user_stories': total_user_stories,
                    'total_test_cases': total_test_cases,
                    'total_issues': total_issues,
                    'total_enhancements': total_enhancements
                },
                'trends': {
                    'reports_by_month': reports_by_month_list,
                    'testing_status_trend': testing_status_trend[-10:],  # Last 10 reports
                    'metrics_trend': metrics_trend[-10:]  # Last 10 reports
                }
            })
            
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error fetching project stats: {str(e)}'}), 500

    @app.route('/api/form-data', methods=['GET'])
    @login_required
    @approved_user_required
    def get_form_data():
        """Get all data needed for report creation forms"""
        try:
            portfolios = Portfolio.query.all()
            projects = Project.query.all()
            testers = Tester.query.all()
            team_members = TeamMember.query.all()
            
            return jsonify({
                'success': True,
                'portfolios': [{'id': p.id, 'name': p.name, 'description': p.description} for p in portfolios],
                'projects': [{
                    'id': p.id, 
                    'name': p.name, 
                    'description': p.description,
                    'portfolio_id': p.portfolio_id,
                    'portfolio_name': p.portfolio.name if p.portfolio else None
                } for p in projects],
                'testers': [{
                    'id': t.id, 
                    'name': t.name, 
                    'email': t.email, 
                    'roles': t.role_types
                } for t in testers],
                'team_members': [{
                    'id': tm.id, 
                    'name': tm.name, 
                    'email': tm.email, 
                    'role': tm.role
                } for tm in team_members]
            })
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error fetching form data: {str(e)}'}), 500

    @app.route('/api/projects/<portfolio_name>/<project_name>/latest-data', methods=['GET'])
    @login_required
    @approved_user_required
    def get_latest_project_data(portfolio_name, project_name):
        """Get the latest data for a specific project to pre-populate forms"""
        try:
            # Get the latest report for this portfolio/project combination
            latest_report = Report.query.filter_by(
                portfolioName=portfolio_name,
                projectName=project_name
            ).order_by(Report.createdAt.desc()).first()
            
            if not latest_report:
                return jsonify({
                    'success': True,
                    'data': {
                        'next_sprint_number': 1,
                        'next_release_number': '1.0.0',
                        'testers': [],
                        'team_members': [],
                        'build_data': []
                    }
                })
            
            # Calculate next sprint number
            next_sprint_number = (latest_report.sprintNumber or 0) + 1
            
            # Calculate next release number
            next_release_number = increment_release(latest_report.releaseNumber or '1.0.0')
            
            # Get the latest tester and team member data
            try:
                testers = json.loads(latest_report.testerData or '[]')
            except (json.JSONDecodeError, TypeError):
                testers = []
            
            try:
                team_members = json.loads(latest_report.teamMemberData or '[]')
            except (json.JSONDecodeError, TypeError):
                team_members = []
            
            try:
                build_data = json.loads(latest_report.buildData or '[]')
            except (json.JSONDecodeError, TypeError):
                build_data = []
            
            return jsonify({
                'success': True,
                'data': {
                    'latest_sprint_number': latest_report.sprintNumber,
                    'next_sprint_number': next_sprint_number,
                    'latest_release_number': latest_report.releaseNumber,
                    'next_release_number': next_release_number,
                    'latest_report_date': latest_report.reportDate,
                    'latest_environment': latest_report.environment,
                    'latest_testing_status': latest_report.testingStatus,
                    'testers': testers,
                    'team_members': team_members,
                    'build_data': build_data
                }
            })
            
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error fetching latest project data: {str(e)}'}), 500

    @app.route('/api/portfolios', methods=['GET', 'POST'])
    @login_required
    @approved_user_required
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

    @app.route('/api/projects', methods=['GET', 'POST'])
    @login_required
    @approved_user_required
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
    @login_required
    @approved_user_required
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
            try:
                data = request.get_json()
                if data.get('name'):
                    project.name = data['name']
                if 'description' in data:
                    project.description = data['description']
                if 'portfolio_id' in data:
                    project.portfolio_id = data['portfolio_id'] if data['portfolio_id'] else None
                db.session.commit()
                return jsonify({'message': 'Project updated successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        elif request.method == 'DELETE':
            try:
                db.session.delete(project)
                db.session.commit()
                return jsonify({'message': 'Project deleted successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    @app.route('/api/portfolios/<int:portfolio_id>/projects', methods=['GET'])
    @login_required
    @approved_user_required
    def get_portfolio_projects(portfolio_id):
        try:
            portfolio = Portfolio.query.get_or_404(portfolio_id)
            projects = Project.query.filter_by(portfolio_id=portfolio_id).all()
            return jsonify([{
                'id': p.id,
                'name': p.name,
                'description': p.description
            } for p in projects])
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/projects/without-portfolio', methods=['GET'])
    @login_required
    @approved_user_required
    def get_projects_without_portfolio():
        try:
            projects = Project.query.filter_by(portfolio_id=None).all()
            return jsonify([{
                'id': p.id,
                'name': p.name,
                'description': p.description
            } for p in projects])
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/portfolios/<int:portfolio_id>', methods=['GET', 'PUT', 'DELETE'])
    @login_required
    @approved_user_required
    def manage_portfolio(portfolio_id):
        portfolio = Portfolio.query.get_or_404(portfolio_id)
        
        if request.method == 'GET':
            return jsonify({
                'id': portfolio.id,
                'name': portfolio.name,
                'description': portfolio.description,
                'createdAt': portfolio.createdAt.isoformat() if portfolio.createdAt else None,
                'projects': [{
                    'id': p.id,
                    'name': p.name,
                    'description': p.description
                } for p in portfolio.projects]
            })
        elif request.method == 'PUT':
            try:
                data = request.get_json()
                if data.get('name'):
                    portfolio.name = data['name']
                if 'description' in data:
                    portfolio.description = data['description']
                db.session.commit()
                return jsonify({'message': 'Portfolio updated successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        elif request.method == 'DELETE':
            try:
                # Check if portfolio has projects
                if portfolio.projects:
                    return jsonify({'error': 'Cannot delete portfolio that contains projects'}), 400
                
                db.session.delete(portfolio)
                db.session.commit()
                return jsonify({'message': 'Portfolio deleted successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500