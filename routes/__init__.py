"""
Routes module initialization
"""
from flask import Blueprint

def register_blueprints(app):
    """Register all blueprints with the Flask app"""
    from .auth_routes import auth_bp
    from .dashboard_routes import dashboard_bp
    from .report_routes import report_bp
    from .admin_routes import admin_bp
    from .api_routes import api_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(api_bp)