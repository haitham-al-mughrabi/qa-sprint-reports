"""
Main Flask application
"""
import os
from flask import Flask, render_template
from dotenv import load_dotenv

# Import models and database
from models import db, User
from services.email_service import email_service
from utils.database import migrate_database
from utils.email_config import get_email_config

# Import route blueprints
from routes import register_blueprints

# Load environment variables from .env file
load_dotenv()

# --- App & Database Configuration ---
app = Flask(__name__, template_folder='.', static_folder='static')

# Define the absolute path for the database file
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'reports.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

# Initialize database
db.init_app(app)

# Initialize email service
email_service.init_app(app)

# Register all blueprints
register_blueprints(app)

# --- Additional Routes (Test/Debug pages) ---
@app.route('/debug-dashboard')
def debug_dashboard_page():
    """Serves the debug dashboard HTML page."""
    try:
        return render_template('debug_dashboard.html')
    except:
        return "Debug dashboard template not found", 404

@app.route('/test-project-metrics')
def test_project_metrics_page():
    """Serves the project metrics test page."""
    try:
        return render_template('test_project_metrics.html')
    except:
        return "Test project metrics template not found", 404

@app.route('/test-complete-dashboard')
def test_complete_dashboard_page():
    """Serves the complete dashboard test page."""
    try:
        return render_template('test_complete_dashboard.html')
    except:
        return "Test complete dashboard template not found", 404

@app.route('/test-general-details')
def test_general_details_page():
    """Serves the general details design test page."""
    try:
        return render_template('test_general_details.html')
    except:
        return "Test general details template not found", 404

@app.route('/test-all-sections')
def test_all_sections_page():
    """Serves the all sections design test page."""
    try:
        return render_template('test_all_sections.html')
    except:
        return "Test all sections template not found", 404

@app.route('/debug-theme')
def debug_theme_page():
    """Serves the theme debug test page."""
    try:
        return render_template('debug_theme.html')
    except:
        return "Debug theme template not found", 404

@app.route('/test-dashboard')
def test_dashboard_page():
    """Serves the dashboard test page."""
    try:
        return render_template('test_dashboard.html')
    except:
        return "Test dashboard template not found", 404

@app.route('/test-dashboard-fix')
def test_dashboard_fix_page():
    """Serves the dashboard fix test page."""
    try:
        return render_template('test_dashboard_fix.html')
    except:
        return "Test dashboard fix template not found", 404

@app.route('/report-types')
def report_types_page():
    """Serves the report types selection page."""
    try:
        return render_template('report_types.html')
    except:
        return "Report types template not found", 404

# Email configuration route
@app.route('/api/email/config', methods=['GET'])
def email_config():
    """Get email configuration status"""
    return get_email_config()

if __name__ == '__main__':
    with app.app_context():
        # This will create the database file and all tables if they don't exist.
        db.create_all()
        # Handle migration for existing databases
        migrate_database(basedir)

        # Create default admin user if no users exist
        if User.query.count() == 0:
            admin_user = User(
                first_name='Admin',
                last_name='User',
                email='admin@example.com',
                username='admin',
                is_admin=True,
                is_approved=True
            )
            admin_user.set_password('Admin123!')
            db.session.add(admin_user)
            db.session.commit()
            print("Default admin user created: admin@example.com / Admin123!")
    
    app.run(debug=True)