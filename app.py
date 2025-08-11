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