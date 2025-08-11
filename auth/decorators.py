"""
Authentication decorators
"""
from functools import wraps
from flask import session, redirect, url_for, flash, request, jsonify
from models.user import User


def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # Return JSON for API endpoints
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Authentication required'}), 401
            return redirect(url_for('auth_routes.login'))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Authentication required'}), 401
            return redirect(url_for('auth_routes.login'))

        user = User.query.get(session['user_id'])
        if not user or not user.is_admin or not user.is_approved:
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Admin privileges required'}), 403
            flash('Admin privileges required', 'error')
            return redirect(url_for('dashboard_routes.dashboard_page'))
        return f(*args, **kwargs)
    return decorated_function


def approved_user_required(f):
    """Decorator to require approved user"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Authentication required'}), 401
            return redirect(url_for('auth_routes.login'))

        user = User.query.get(session['user_id'])
        if not user or not user.is_approved:
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Account pending approval'}), 403
            flash('Your account is pending approval', 'warning')
            return redirect(url_for('auth_routes.login'))
        return f(*args, **kwargs)
    return decorated_function