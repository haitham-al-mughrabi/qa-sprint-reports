"""
Dashboard and statistics routes
"""
import json
from datetime import datetime
from flask import Blueprint, render_template, jsonify
from sqlalchemy import func
from models import db, Report, Project, User
from auth import login_required, approved_user_required

dashboard_bp = Blueprint('dashboard_routes', __name__)


@dashboard_bp.route('/dashboard')
@login_required
@approved_user_required
def dashboard_page():
    """Serves the dashboard HTML page."""
    return render_template('dashboard.html')


@dashboard_bp.route('/project-statistics')
@login_required
@approved_user_required
def project_statistics_page():
    """Serves the project statistics HTML page."""
    return render_template('project_statistics.html')


@dashboard_bp.route('/api/dashboard/stats', methods=['GET'])
@login_required
@approved_user_required
def get_dashboard_stats():
    """Get dashboard statistics for all projects and individual projects."""
    try:
        # Use optimized database queries instead of loading all data into memory
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
            func.sum(Report.newEnhancements).label('new_enhancements'),
            func.sum(Report.implementedEnhancements).label('implemented_enhancements'),
            func.sum(Report.existsEnhancements).label('exists_enhancements'),
            func.sum(Report.automationTotalTestCases).label('total_automation_test_cases'),
            func.sum(Report.automationPassedTestCases).label('automation_passed_test_cases'),
            func.sum(Report.automationFailedTestCases).label('automation_failed_test_cases'),
            func.sum(Report.automationSkippedTestCases).label('automation_skipped_test_cases'),
            func.sum(Report.automationStableTests).label('automation_stable_tests'),
            func.sum(Report.automationFlakyTests).label('automation_flaky_tests'),
        ).first()

        overall_stats = {
            'totalReports': total_reports or 0,
            'completedReports': completed_reports or 0,
            'inProgressReports': in_progress_reports or 0,
            'pendingReports': pending_reports or 0,
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
            'newEnhancements': aggregate_result.new_enhancements or 0,
            'implementedEnhancements': aggregate_result.implemented_enhancements or 0,
            'existsEnhancements': aggregate_result.exists_enhancements or 0,
            'automationTotalTestCases': aggregate_result.total_automation_test_cases or 0,
            'automationPassedTestCases': aggregate_result.automation_passed_test_cases or 0,
            'automationFailedTestCases': aggregate_result.automation_failed_test_cases or 0,
            'automationSkippedTestCases': aggregate_result.automation_skipped_test_cases or 0,
            'automationStableTests': aggregate_result.automation_stable_tests or 0,
            'automationFlakyTests': aggregate_result.automation_flaky_tests or 0,
        }

        # Get project-specific metrics directly from reports
        project_stats = db.session.query(
            Report.portfolioName,
            Report.projectName,
            func.count(Report.id).label('totalReports'),
            func.max(Report.reportDate).label('lastReportDate'),
            # User Stories - ALL fields
            func.sum(Report.totalUserStories).label('totalUserStories'),
            func.sum(Report.passedUserStories).label('passedUserStories'),
            func.sum(Report.passedWithIssuesUserStories).label('passedWithIssuesUserStories'),
            func.sum(Report.failedUserStories).label('failedUserStories'),
            func.sum(Report.blockedUserStories).label('blockedUserStories'),
            func.sum(Report.cancelledUserStories).label('cancelledUserStories'),
            func.sum(Report.deferredUserStories).label('deferredUserStories'),
            func.sum(Report.notTestableUserStories).label('notTestableUserStories'),
            # Test Cases - ALL fields
            func.sum(Report.totalTestCases).label('totalTestCases'),
            func.sum(Report.passedTestCases).label('passedTestCases'),
            func.sum(Report.passedWithIssuesTestCases).label('passedWithIssuesTestCases'),
            func.sum(Report.failedTestCases).label('failedTestCases'),
            func.sum(Report.blockedTestCases).label('blockedTestCases'),
            func.sum(Report.cancelledTestCases).label('cancelledTestCases'),
            func.sum(Report.deferredTestCases).label('deferredTestCases'),
            func.sum(Report.notTestableTestCases).label('notTestableTestCases'),
            # Issues - ALL fields
            func.sum(Report.totalIssues).label('totalIssues'),
            func.sum(Report.criticalIssues).label('criticalIssues'),
            func.sum(Report.highIssues).label('highIssues'),
            func.sum(Report.mediumIssues).label('mediumIssues'),
            func.sum(Report.lowIssues).label('lowIssues'),
            func.sum(Report.newIssues).label('newIssues'),
            func.sum(Report.fixedIssues).label('fixedIssues'),
            func.sum(Report.notFixedIssues).label('notFixedIssues'),
            func.sum(Report.reopenedIssues).label('reopenedIssues'),
            func.sum(Report.deferredIssues).label('deferredIssues'),
            # Enhancements - ALL fields
            func.sum(Report.totalEnhancements).label('totalEnhancements'),
            func.sum(Report.newEnhancements).label('newEnhancements'),
            func.sum(Report.implementedEnhancements).label('implementedEnhancements'),
            func.sum(Report.existsEnhancements).label('existsEnhancements'),
            # Automation - ALL fields
            func.sum(Report.automationTotalTestCases).label('automationTotalTests'),
            func.sum(Report.automationPassedTestCases).label('automationPassedTests'),
            func.sum(Report.automationFailedTestCases).label('automationFailedTests'),
            func.sum(Report.automationSkippedTestCases).label('automationSkippedTests'),
            func.sum(Report.automationStableTests).label('automationStableTests'),
            func.sum(Report.automationFlakyTests).label('automationFlakyTests'),
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

        # Create projects dictionary with detailed data
        projects_data = []
        for stat in project_stats:
            # Calculate success rates
            total_user_stories = stat.totalUserStories or 0
            total_test_cases = stat.totalTestCases or 0
            total_issues = stat.totalIssues or 0
            automation_total = stat.automationTotalTests or 0

            user_stories_success_rate = 0
            if total_user_stories > 0:
                successful_user_stories = (stat.passedUserStories or 0) + (stat.passedWithIssuesUserStories or 0)
                user_stories_success_rate = round((successful_user_stories / total_user_stories) * 100, 1)

            test_cases_success_rate = 0
            if total_test_cases > 0:
                successful_test_cases = (stat.passedTestCases or 0) + (stat.passedWithIssuesTestCases or 0)
                test_cases_success_rate = round((successful_test_cases / total_test_cases) * 100, 1)

            issues_resolution_rate = 0
            if total_issues > 0:
                issues_resolution_rate = round(((stat.fixedIssues or 0) / total_issues) * 100, 1)

            automation_pass_rate = 0
            if automation_total > 0:
                automation_pass_rate = round(((stat.automationPassedTests or 0) / automation_total) * 100, 1)

            # Determine risk level
            risk_level = 'Low'
            if (stat.criticalIssues or 0) > 0:
                risk_level = 'High'
            elif (stat.highIssues or 0) > 0:
                risk_level = 'Medium'

            # Get testing status
            testing_status = 'pending'
            for status in latest_statuses:
                if status.portfolioName == stat.portfolioName and status.projectName == stat.projectName:
                    testing_status = status.testingStatus
                    break

            projects_data.append({
                'portfolioName': stat.portfolioName,
                'projectName': stat.projectName,
                'totalReports': stat.totalReports or 0,
                'lastReportDate': stat.lastReportDate,
                'testingStatus': testing_status,
                'riskLevel': risk_level,

                # TOTALS - Main counts
                'totalUserStories': total_user_stories,
                'totalTestCases': total_test_cases,
                'totalIssues': total_issues,
                'totalEnhancements': stat.totalEnhancements or 0,

                # USER STORIES - Complete breakdown
                'passedUserStories': stat.passedUserStories or 0,
                'passedWithIssuesUserStories': stat.passedWithIssuesUserStories or 0,
                'failedUserStories': stat.failedUserStories or 0,
                'blockedUserStories': stat.blockedUserStories or 0,
                'cancelledUserStories': stat.cancelledUserStories or 0,
                'deferredUserStories': stat.deferredUserStories or 0,
                'notTestableUserStories': stat.notTestableUserStories or 0,
                'userStoriesSuccessRate': user_stories_success_rate,

                # TEST CASES - Complete breakdown
                'passedTestCases': stat.passedTestCases or 0,
                'passedWithIssuesTestCases': stat.passedWithIssuesTestCases or 0,
                'failedTestCases': stat.failedTestCases or 0,
                'blockedTestCases': stat.blockedTestCases or 0,
                'cancelledTestCases': stat.cancelledTestCases or 0,
                'deferredTestCases': stat.deferredTestCases or 0,
                'notTestableTestCases': stat.notTestableTestCases or 0,
                'testCasesSuccessRate': test_cases_success_rate,

                # ISSUES - By Priority
                'criticalIssues': stat.criticalIssues or 0,
                'highIssues': stat.highIssues or 0,
                'mediumIssues': stat.mediumIssues or 0,
                'lowIssues': stat.lowIssues or 0,

                # ISSUES - By Status
                'newIssues': stat.newIssues or 0,
                'fixedIssues': stat.fixedIssues or 0,
                'notFixedIssues': stat.notFixedIssues or 0,
                'reopenedIssues': stat.reopenedIssues or 0,
                'deferredIssues': stat.deferredIssues or 0,
                'issuesResolutionRate': issues_resolution_rate,

                # ENHANCEMENTS - Complete breakdown
                'newEnhancements': stat.newEnhancements or 0,
                'implementedEnhancements': stat.implementedEnhancements or 0,
                'existsEnhancements': stat.existsEnhancements or 0,

                # AUTOMATION - Complete breakdown
                'automationTotalTests': automation_total,
                'automationPassedTests': stat.automationPassedTests or 0,
                'automationFailedTests': stat.automationFailedTests or 0,
                'automationSkippedTests': stat.automationSkippedTests or 0,
                'automationStableTests': stat.automationStableTests or 0,
                'automationFlakyTests': stat.automationFlakyTests or 0,
                'automationPassRate': automation_pass_rate
            })

        return jsonify({
            'overall': overall_stats,
            'projects': projects_data
        })

    except Exception as e:
        print(f"Dashboard stats error: {e}")
        return jsonify({'error': 'Failed to fetch dashboard statistics'}), 500


@dashboard_bp.route('/api/project-stats/<int:project_id>', methods=['GET'])
@login_required
@approved_user_required
def get_project_stats(project_id):
    """Get all statistics for a specific project."""
    try:
        project = Project.query.get_or_404(project_id)

        # Make the query case-insensitive and trim whitespace
        project_name = project.name.strip()

        # First try exact match
        reports = Report.query.filter(Report.projectName == project_name).all()

        # If no matches, try case-insensitive search
        if not reports:
            reports = Report.query.filter(Report.projectName.ilike(f'%{project_name}%')).all()

        # If still no matches, try trimming and normalizing whitespace
        if not reports:
            all_reports = Report.query.all()
            reports = [r for r in all_reports if r.projectName and r.projectName.strip().lower() == project_name.lower()]

        if not reports:
            # Return empty stats instead of 404
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
                    'implementedEnhancements': 0,
                    'totalAutomationTestCases': 0,
                    'automationPassedTestCases': 0,
                    'automationFailedTestCases': 0,
                    'automationSkippedTestCases': 0,
                    'automationStableTests': 0,
                    'automationFlakyTests': 0,
                    'automationPassRate': 0,
                    'automationStabilityRate': 0
                },
                'charts': {
                    'userStories': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': []}]},
                    'testCases': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': []}]},
                    'issuesPriority': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': []}]},
                    'issuesStatus': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': []}]},
                    'automationTestCases': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': []}]},
                    'automationStability': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': []}]}
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

        # Calculate automation regression stats
        total_automation_test_cases = sum(r.automationTotalTestCases or 0 for r in reports)
        automation_passed_test_cases = sum(r.automationPassedTestCases or 0 for r in reports)
        automation_failed_test_cases = sum(r.automationFailedTestCases or 0 for r in reports)
        automation_skipped_test_cases = sum(r.automationSkippedTestCases or 0 for r in reports)
        automation_stable_tests = sum(r.automationStableTests or 0 for r in reports)
        automation_flaky_tests = sum(r.automationFlakyTests or 0 for r in reports)

        # Calculate automation rates
        automation_pass_rate = (automation_passed_test_cases / total_automation_test_cases * 100) if total_automation_test_cases > 0 else 0
        automation_stability_rate = (automation_stable_tests / (automation_stable_tests + automation_flaky_tests) * 100) if (automation_stable_tests + automation_flaky_tests) > 0 else 0

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
                quarter_key = f"{report_date.year}-Q{(report_date.month - 1) // 3 + 1}"
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
            },
            'automationTestCases': {
                'labels': ['Passed', 'Failed', 'Skipped'],
                'datasets': [{
                    'data': [
                        automation_passed_test_cases,
                        automation_failed_test_cases,
                        automation_skipped_test_cases
                    ],
                    'backgroundColor': ['#28a745', '#dc3545', '#ffc107'],
                    'borderWidth': 3,
                    'borderColor': 'var(--surface)'
                }]
            },
            'automationStability': {
                'labels': ['Stable', 'Flaky'],
                'datasets': [{
                    'data': [
                        automation_stable_tests,
                        automation_flaky_tests
                    ],
                    'backgroundColor': ['#28a745', '#fd7e14'],
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
                'implementedEnhancements': implemented_enhancements,
                'totalAutomationTestCases': total_automation_test_cases,
                'automationPassedTestCases': automation_passed_test_cases,
                'automationFailedTestCases': automation_failed_test_cases,
                'automationSkippedTestCases': automation_skipped_test_cases,
                'automationStableTests': automation_stable_tests,
                'automationFlakyTests': automation_flaky_tests,
                'automationPassRate': round(automation_pass_rate, 2),
                'automationStabilityRate': round(automation_stability_rate, 2)
            },
            'charts': chart_data,
            'testers': testers,
            'reports': [r.to_dict() for r in reports],
            'time_stats': {
                'monthly': monthly_stats,
                'quarterly': quarterly_stats
            }
        })

    except Exception as e:
        print(f"Project stats error: {e}")
        return jsonify({'error': 'Failed to fetch project statistics'}), 500