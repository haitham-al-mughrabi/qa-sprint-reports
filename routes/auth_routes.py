from flask import request, jsonify, render_template, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash
from functools import wraps
from datetime import datetime
from models.schemas import db, User, PasswordResetRequest
from services.email_service import email_service
import re

def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))

        user = User.query.get(session['user_id'])
        if not user or not user.is_admin or not user.is_approved:
            flash('Admin privileges required', 'error')
            return redirect(url_for('dashboard_page'))
        return f(*args, **kwargs)
    return decorated_function

def approved_user_required(f):
    """Decorator to require approved user"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))

        user = User.query.get(session['user_id'])
        if not user or not user.is_approved:
            flash('Your account is pending approval', 'warning')
            return redirect(url_for('pending_approval'))
        return f(*args, **kwargs)
    return decorated_function

def init_auth_routes(app):
    
    @app.route('/api/auth/profile', methods=['GET'])
    @login_required
    @approved_user_required
    def get_current_user():
        """Get current user profile information for navigation"""
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        })

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'GET':
            return render_template('login.html')
        
        try:
            data = request.get_json()
            identifier = data.get('email') or data.get('identifier')  # Support both field names
            password = data.get('password')
            
            if not identifier or not password:
                return jsonify({'success': False, 'message': 'Email/Username/Phone and password are required'}), 400
            
            # Find user by email, username, or phone number
            user = User.query.filter(
                (User.email == identifier) |
                (User.username == identifier) |
                (User.phone_number == identifier)
            ).first()
            
            if not user:
                return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
            # Check if user account is active
            if not user.is_active:
                return jsonify({'success': False, 'message': 'Your account has been deactivated. Please contact an administrator.'}), 401
            
            # Check password
            if not user.check_password(password):
                return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
            # Check if user is approved
            if not user.is_approved:
                return jsonify({'success': False, 'message': 'Your account is pending approval. Please wait for an administrator to approve your account.'}), 401
            
            # Login successful
            session['user_id'] = user.id
            session['user_email'] = user.email
            session['user_name'] = user.get_full_name()
            session['is_admin'] = user.is_admin
            
            # Update last login time
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'redirect': url_for('dashboard_page'),
                'user': user.to_dict()
            })
            
        except Exception as e:
            return jsonify({'success': False, 'message': f'Login error: {str(e)}'}), 500

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'GET':
            return render_template('register.html')
        
        try:
            data = request.get_json()
            
            # Required fields
            required_fields = ['email', 'first_name', 'last_name', 'password']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'success': False, 'message': f'{field.replace("_", " ").title()} is required'}), 400
            
            email = data['email'].lower().strip()
            first_name = data['first_name'].strip()
            last_name = data['last_name'].strip()
            password = data['password']
            username = data.get('username', '').strip() if data.get('username') else None
            phone_number = data.get('phone_number', '').strip() if data.get('phone_number') else None
            
            # Validate email format
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                return jsonify({'success': False, 'message': 'Invalid email format'}), 400
            
            # Check if email already exists
            if User.query.filter_by(email=email).first():
                return jsonify({'success': False, 'message': 'Email already registered'}), 400
            
            # Check if username already exists (if provided)
            if username and User.query.filter_by(username=username).first():
                return jsonify({'success': False, 'message': 'Username already taken'}), 400
            
            # Create new user instance for validation
            new_user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                username=username,
                phone_number=phone_number
            )
            
            # Validate password strength
            is_valid, message = new_user.validate_password_strength(password)
            if not is_valid:
                return jsonify({'success': False, 'message': message}), 400
            
            # Validate phone number (if provided)
            if phone_number:
                if not new_user.validate_phone_number(phone_number):
                    return jsonify({'success': False, 'message': 'Invalid phone number format. Please use Saudi format: 05xxxxxxxx, +9665xxxxxxxx, or 009665xxxxxxxx'}), 400
                
                # Check if phone number already exists
                if User.query.filter_by(phone_number=phone_number).first():
                    return jsonify({'success': False, 'message': 'Phone number already registered'}), 400
            
            # Set password and save user
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Registration successful! Your account is pending approval by an administrator.',
                'redirect': url_for('login')
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Registration error: {str(e)}'}), 500

    @app.route('/reset-password', methods=['GET', 'POST'])
    def reset_password():
        if request.method == 'GET':
            return render_template('reset_password.html')
        
        try:
            data = request.get_json()
            email = data.get('email')
            
            if not email:
                return jsonify({'success': False, 'message': 'Email is required'}), 400
            
            # Find user by email
            user = User.query.filter_by(email=email).first()
            
            if not user:
                return jsonify({'success': False, 'message': 'If this email exists in our system, a reset request will be created.'}), 200
            
            # Check if user already has a pending reset request
            existing_request = PasswordResetRequest.query.filter_by(
                user_id=user.id, 
                is_used=False, 
                is_approved=False
            ).first()
            
            if existing_request and not existing_request.is_expired():
                return jsonify({
                    'success': True,
                    'message': 'A password reset request already exists for this account. Please wait for admin approval or contact support.'
                }), 200
            
            # Create new reset request
            reset_request = PasswordResetRequest(user_id=user.id)
            db.session.add(reset_request)
            db.session.commit()
            
            # Send notification email to admins (if email service is configured)
            try:
                admins = User.query.filter_by(is_admin=True, is_approved=True, is_active=True).all()
                if admins and email_service.is_configured():
                    admin_emails = [admin.email for admin in admins]
                    
                    subject = "Password Reset Request - QA Sprint Reports"
                    body = f"""
                    A new password reset request has been submitted.
                    
                    User: {user.get_full_name()} ({user.email})
                    Request ID: {reset_request.id}
                    
                    Please log in to the admin panel to approve or deny this request.
                    """
                    
                    email_service.send_email(admin_emails, subject, body)
            except Exception as email_error:
                print(f"Failed to send admin notification email: {email_error}")
            
            return jsonify({
                'success': True,
                'message': 'Password reset request submitted successfully. An administrator will review your request.'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Reset request error: {str(e)}'}), 500

    @app.route('/reset-password-form', methods=['GET', 'POST'])
    def reset_password_form():
        token = request.args.get('token')
        
        if request.method == 'GET':
            if not token:
                flash('Invalid reset link', 'error')
                return redirect(url_for('login'))
            
            # Validate token
            reset_request = PasswordResetRequest.query.filter_by(token=token, is_used=False).first()
            
            if not reset_request or not reset_request.is_approved or reset_request.is_expired():
                flash('Invalid or expired reset link', 'error')
                return redirect(url_for('login'))
            
            return render_template('reset_password_form.html', token=token)
        
        # POST request - process password reset
        try:
            data = request.get_json()
            new_password = data.get('password')
            confirm_password = data.get('confirm_password')
            
            if not new_password or not confirm_password:
                return jsonify({'success': False, 'message': 'Both password fields are required'}), 400
            
            if new_password != confirm_password:
                return jsonify({'success': False, 'message': 'Passwords do not match'}), 400
            
            # Validate token
            reset_request = PasswordResetRequest.query.filter_by(token=token, is_used=False).first()
            
            if not reset_request or not reset_request.is_approved or reset_request.is_expired():
                return jsonify({'success': False, 'message': 'Invalid or expired reset link'}), 400
            
            user = User.query.get(reset_request.user_id)
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            
            # Validate password strength
            is_valid, message = user.validate_password_strength(new_password)
            if not is_valid:
                return jsonify({'success': False, 'message': message}), 400
            
            # Update password
            user.set_password(new_password)
            user.updated_at = datetime.utcnow()
            
            # Mark reset request as used
            reset_request.is_used = True
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Password reset successfully. You can now log in with your new password.',
                'redirect': url_for('login')
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Password reset error: {str(e)}'}), 500

    @app.route('/profile', methods=['GET', 'POST'])
    @login_required
    @approved_user_required
    def profile():
        if request.method == 'GET':
            user = User.query.get(session['user_id'])
            return render_template('profile.html', user=user)
        
        try:
            user = User.query.get(session['user_id'])
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            
            data = request.get_json()
            
            # Update user information
            if 'first_name' in data:
                user.first_name = data['first_name'].strip()
            if 'last_name' in data:
                user.last_name = data['last_name'].strip()
            if 'username' in data:
                username = data['username'].strip() if data['username'] else None
                if username and username != user.username:
                    # Check if username is already taken
                    existing_user = User.query.filter_by(username=username).first()
                    if existing_user:
                        return jsonify({'success': False, 'message': 'Username already taken'}), 400
                user.username = username
            if 'phone_number' in data:
                phone_number = data['phone_number'].strip() if data['phone_number'] else None
                if phone_number:
                    if not user.validate_phone_number(phone_number):
                        return jsonify({'success': False, 'message': 'Invalid phone number format'}), 400
                    if phone_number != user.phone_number:
                        # Check if phone number is already taken
                        existing_user = User.query.filter_by(phone_number=phone_number).first()
                        if existing_user:
                            return jsonify({'success': False, 'message': 'Phone number already registered'}), 400
                user.phone_number = phone_number
            
            # Handle password change if provided
            if 'current_password' in data and 'new_password' in data:
                if not user.check_password(data['current_password']):
                    return jsonify({'success': False, 'message': 'Current password is incorrect'}), 400
                
                # Validate new password strength
                is_valid, message = user.validate_password_strength(data['new_password'])
                if not is_valid:
                    return jsonify({'success': False, 'message': message}), 400
                
                user.set_password(data['new_password'])
            
            user.updated_at = datetime.utcnow()
            
            # Update session data
            session['user_name'] = user.get_full_name()
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Profile updated successfully',
                'user': user.to_dict()
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Profile update error: {str(e)}'}), 500

    @app.route('/logout')
    def logout():
        session.clear()
        return redirect(url_for('login'))