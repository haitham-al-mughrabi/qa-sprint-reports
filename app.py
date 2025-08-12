"""
Main Flask application
"""
import os
from flask import Flask
from dotenv import load_dotenv

# Import models and database
from models import db, User
from services.email_service import email_service
from utils.database import migrate_database

# Import route blueprints
from routes import register_blueprints

# Load environment variables from .env file
load_dotenv()

# --- App & Database Configuration ---
app = Flask(__name__, template_folder='pages', static_folder='static')

# Define the absolute path for the database file
basedir = os.path.abspath(os.path.dirname(__file__))
data_dir = os.path.join(basedir, 'data')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(data_dir, 'reports.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

# Initialize database
db.init_app(app)

# Initialize email service
email_service.init_app(app)

# Register all blueprints
register_blueprints(app)

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    from flask import render_template
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    from flask import render_template
    db.session.rollback()
    return render_template('errors/500.html'), 500

@app.errorhandler(403)
def forbidden_error(error):
    from flask import render_template
    return render_template('errors/403.html'), 403

@app.errorhandler(401)
def unauthorized_error(error):
    from flask import render_template
    return render_template('errors/401.html'), 401

# Generic error handler for other HTTP errors
@app.errorhandler(Exception)
def handle_exception(e):
    from flask import render_template
    from werkzeug.exceptions import HTTPException
    
    # Pass through HTTP errors
    if isinstance(e, HTTPException):
        # For HTTP errors not specifically handled above
        if e.code not in [401, 403, 404, 500]:
            return render_template('errors/generic.html', 
                                 error_code=e.code,
                                 error_title=e.name,
                                 error_message=e.description), e.code
        # Let specific handlers handle their errors
        return e
    
    # Handle non-HTTP exceptions
    db.session.rollback()
    return render_template('errors/500.html'), 500

if __name__ == '__main__':
    with app.app_context():
        # Ensure data directory exists
        os.makedirs(data_dir, exist_ok=True)
        
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