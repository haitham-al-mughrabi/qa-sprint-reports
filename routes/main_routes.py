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