from flask import render_template, session
from routes.auth_routes import login_required, approved_user_required

def init_main_routes(app):
    
    @app.route('/')
    def index():
        if 'user_id' in session:
            return render_template('dashboard.html')
        return render_template('index.html')

    @app.route('/dashboard')
    @login_required
    @approved_user_required
    def dashboard_page():
        return render_template('dashboard.html')

    @app.route('/reports')
    @login_required
    @approved_user_required
    def reports_page():
        return render_template('reports.html')

    @app.route('/reports_type')
    @login_required
    @approved_user_required
    def reports_type():
        return render_template('reports_type.html')

    @app.route('/create-report')
    @login_required
    @approved_user_required
    def create_report_page():
        return render_template('create_report.html')

    @app.route('/create_report.html')
    @login_required
    @approved_user_required
    def create_report_html():
        return render_template('create_report.html')

    @app.route('/create_report')
    @login_required
    @approved_user_required
    def create_report_alt():
        return render_template('create_report.html')

    @app.route('/view-report')
    @login_required
    @approved_user_required
    def view_report_page():
        return render_template('view_report.html')

    @app.route('/report/<int:report_id>')
    @login_required
    @approved_user_required
    def view_report(report_id):
        return render_template('view_report.html', report_id=report_id)

    @app.route('/manage')
    @login_required
    @approved_user_required
    def manage_data():
        return render_template('manage_data.html')

    @app.route('/project-statistics')
    @login_required
    @approved_user_required
    def project_statistics():
        return render_template('project_statistics.html')

    @app.route('/user-management')
    @login_required
    @approved_user_required
    def user_management():
        return render_template('user_management.html')

    @app.route('/user-details')
    @login_required
    @approved_user_required
    def user_details():
        return render_template('user_details.html')


    # Test route to check if routing is working
    @app.route('/test')
    def test_route():
        return "Test route is working!"

    # Simple routes for testing without authentication
    @app.route('/test-profile')
    def test_profile():
        return render_template('profile.html')

    @app.route('/test-create-report')
    def test_create_report():
        return render_template('create_report.html')

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        return render_template('500.html'), 500

    @app.errorhandler(403)
    def forbidden_error(error):
        return render_template('403.html'), 403

    # Test error routes for development
    @app.route('/test-404')
    def test_404():
        from flask import abort
        abort(404)

    @app.route('/test-500')
    def test_500():
        from flask import abort
        abort(500)

    @app.route('/test-403')
    def test_403():
        from flask import abort
        abort(403)

    # Maintenance page route
    @app.route('/maintenance')
    def maintenance():
        return render_template('maintenance.html')

    # Pending approval page route
    @app.route('/pending-approval')
    def pending_approval():
        return render_template('pending_approval.html')