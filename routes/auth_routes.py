"""
Authentication routes
"""
import re
from datetime import datetime
from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for, flash
from models import db, User, PasswordResetRequest
from services.email_service import email_service

auth_bp = Blueprint('auth_routes', __name__)


@auth_bp.route('/')
def index():
    """Redirect to login if not authenticated, otherwise to dashboard."""
    if 'user_id' not in session:
        return redirect(url_for('auth_routes.login'))
    return redirect(url_for('dashboard_routes.dashboard_page'))


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Login page and authentication"""
    if request.method == 'GET':
        return render_template('login.html')

    try:
        data = request.get_json()
        identifier = data.get('identifier', '').strip()
        password = data.get('password', '')

        if not identifier or not password:
            return jsonify({'success': False, 'message': 'Please provide login credentials'}), 400

        # Find user by username, email, or phone number
        user = None

        # Check if identifier is email
        if '@' in identifier:
            user = User.query.filter_by(email=identifier).first()
        # Check if identifier is phone number
        elif identifier.startswith('05') or identifier.startswith('+966') or identifier.startswith('00966'):
            clean_phone = re.sub(r'[^\d+]', '', identifier)
            user = User.query.filter_by(phone_number=clean_phone).first()
        # Otherwise, treat as username
        else:
            user = User.query.filter_by(username=identifier).first()

        if not user or not user.check_password(password):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        if not user.is_active:
            return jsonify({'success': False, 'message': 'Account is deactivated'}), 401

        if not user.is_approved:
            return jsonify({'success': False, 'message': 'Account is pending approval'}), 401

        # Check for pending password reset
        pending_reset = PasswordResetRequest.query.filter_by(
            user_id=user.id,
            is_approved=True,
            is_used=False
        ).first()

        if pending_reset and not pending_reset.is_expired():
            session['reset_user_id'] = user.id
            return jsonify({
                'success': True,
                'redirect': '/reset-password-form',
                'message': 'Please set your new password'
            })

        # Successful login
        session['user_id'] = user.id
        user.last_login = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'redirect': '/dashboard',
            'user': user.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'message': 'Login failed'}), 500


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Registration page and user creation"""
    if request.method == 'GET':
        return render_template('register.html')

    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'password']
        for field in required_fields:
            if not data.get(field, '').strip():
                return jsonify({'success': False, 'message': f'{field.replace("_", " ").title()} is required'}), 400

        first_name = data.get('first_name').strip()
        last_name = data.get('last_name').strip()
        email = data.get('email').strip().lower()
        phone_number = data.get('phone_number', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password')

        # Validate email format
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400

        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Email already registered'}), 400

        # Validate phone number if provided
        if phone_number:
            clean_phone = re.sub(r'[^\d+]', '', phone_number)
            if not User().validate_phone_number(clean_phone):
                return jsonify({'success': False, 'message': 'Invalid phone number format'}), 400

            # Check if phone number already exists
            if User.query.filter_by(phone_number=clean_phone).first():
                return jsonify({'success': False, 'message': 'Phone number already registered'}), 400
            phone_number = clean_phone

        # Check if username already exists (if provided)
        if username and User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': 'Username already taken'}), 400

        # Validate password strength
        temp_user = User()
        is_valid, message = temp_user.validate_password_strength(password)
        if not is_valid:
            return jsonify({'success': False, 'message': message}), 400

        # Create new user
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone_number=phone_number if phone_number else None,
            username=username if username else None,
            is_approved=False  # Requires admin approval
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Registration successful! Your account is pending approval.',
            'redirect': '/login'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Registration failed'}), 500


@auth_bp.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    return redirect(url_for('auth_routes.login'))


@auth_bp.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    """Password reset request page"""
    if request.method == 'GET':
        return render_template('reset_password.html')

    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'success': False, 'message': 'Email not found'}), 404

        # Check for existing pending request
        existing_request = PasswordResetRequest.query.filter_by(
            user_id=user.id,
            is_approved=False,
            is_used=False
        ).first()

        if existing_request and not existing_request.is_expired():
            return jsonify({
                'success': False,
                'message': 'Password reset request already pending approval'
            }), 400

        # Create new reset request
        reset_request = PasswordResetRequest(user_id=user.id)
        db.session.add(reset_request)
        db.session.commit()

        # Send notification to admins
        try:
            email_service.send_password_reset_request_notification(user, reset_request)
        except Exception as e:
            print(f"Failed to send email notification: {e}")

        return jsonify({
            'success': True,
            'message': 'Password reset request submitted. Please wait for admin approval.'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to process request'}), 500


@auth_bp.route('/reset-password-form', methods=['GET', 'POST'])
def reset_password_form():
    """Password reset form for approved requests"""
    if request.method == 'GET':
        if 'reset_user_id' not in session:
            return redirect(url_for('auth_routes.login'))
        return render_template('reset_password_form.html')

    try:
        if 'reset_user_id' not in session:
            return jsonify({'success': False, 'message': 'Invalid session'}), 400

        data = request.get_json()
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')

        if not new_password or not confirm_password:
            return jsonify({'success': False, 'message': 'Both password fields are required'}), 400

        if new_password != confirm_password:
            return jsonify({'success': False, 'message': 'Passwords do not match'}), 400

        user = User.query.get(session['reset_user_id'])
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Validate password strength
        is_valid, message = user.validate_password_strength(new_password)
        if not is_valid:
            return jsonify({'success': False, 'message': message}), 400

        # Find and mark the reset request as used
        reset_request = PasswordResetRequest.query.filter_by(
            user_id=user.id,
            is_approved=True,
            is_used=False
        ).first()

        if not reset_request or reset_request.is_expired():
            return jsonify({'success': False, 'message': 'Invalid or expired reset request'}), 400

        # Update password and mark request as used
        user.set_password(new_password)
        reset_request.is_used = True
        db.session.commit()

        # Clear session
        session.pop('reset_user_id', None)

        return jsonify({
            'success': True,
            'message': 'Password updated successfully',
            'redirect': '/login'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to update password'}), 500