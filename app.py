from flask import Flask
import os
from dotenv import load_dotenv

# Import our models and database
from models.schemas import db
from services.email_service import email_service
from utils.helpers import migrate_database

# Import route modules
from routes.main_routes import init_main_routes
from routes.auth_routes import init_auth_routes
from routes.api_routes import init_api_routes
from routes.admin_routes import init_admin_routes

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

# Initialize route modules
init_main_routes(app)
init_auth_routes(app)
init_api_routes(app)
init_admin_routes(app)

# Create database tables
with app.app_context():
    migrate_database()

if __name__ == '__main__':
    app.run(debug=True)