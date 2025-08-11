"""
Admin and user management routes
"""
import re
from datetime import datetime
from flask import Blueprint, request, jsonify, render_template, session
from models import db, User, PasswordResetRequest
from auth import login_required, admin_required, approved_user_required
from services.email_service import email_service

admin_bp = Blueprint('admin_routes', __name__)


@admin_bp.route('/user-management')
@login_required
@admin_required
def user_management_page():
    """Serves the user management HTML page."""
    return render_template('user_management.html')


@admin_bp.route('/profile')
@login_required
@approved_user_required
def profile_page():
    """Serves the user profile HTML page."""
    user = User.query.get(session['user_id'])
    return render_template('profile.html', user=user)


@admin_bp.route('/user-details')
@login_required
@admin_required
def user_details_page():
    """Serves the user details HTML page."""
    return render_template('user_details.html')


@admin_bp.route('/manage-data')
@login_required
@admin_required
def manage_data_page():
    """Serves the data management HTML page."""
    return render_template('manage_data.html')


@admin_bp.route('/manage')
@login_required
@admin_required
def manage_redirect():
    """Redirect /manage to /manage-data for backward compatibility"""
    from flask import redirect, url_for
    return redirect(url_for('admin_routes.manage_data_page'))


@admin_bp.route('/api/auth/profile', methods=['GET'])
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


@admin_bp.route('/api/users', methods=['GET'])
@login_required
@admin_required
def get_users():
    """Get all users with pagination and search"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search_query = request.args.get('search', '', type=str)

        query = User.query

        if search_query:
            search_term = f"%{search_query}%"
            query = query.filter(
                db.or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.username.ilike(search_term)
                )
            )

        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        users = pagination.items

        return jsonify({
            'users': [user.to_dict() for user in users],
            'total': pagination.total,
            'page': page,
            'totalPages': pagination.pages,
            'hasNext': pagination.has_next,
            'hasPrev': pagination.has_prev
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch users: {str(e)}'}), 500


@admin_bp.route('/api/users/<int:user_id>', methods=['GET'])
@login_required
@admin_required
def get_user(user_id):
    """Get a specific user by ID"""
    try:
        user = User.query.get_or_404(user_id)
        return jsonify({
            'success': True,
            'user': user.to_dict()
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch user: {str(e)}'}), 500


@admin_bp.route('/api/users/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_user(user_id):
    """Update user information"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()

        # Update basic fields
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.username = data.get('username', user.username)
        user.is_admin = data.get('is_admin', user.is_admin)
        user.is_approved = data.get('is_approved', user.is_approved)
        user.is_active = data.get('is_active', user.is_active)

        # Update email if changed
        new_email = data.get('email', user.email)
        if new_email != user.email:
            # Check if new email already exists
            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user:
                return jsonify({'success': False, 'message': 'Email already exists'}), 400
            user.email = new_email

        # Update phone number if provided
        new_phone = data.get('phone_number', user.phone_number)
        if new_phone != user.phone_number:
            if new_phone:
                clean_phone = re.sub(r'[^\d+]', '', new_phone)
                if not user.validate_phone_number(clean_phone):
                    return jsonify({'success': False, 'message': 'Invalid phone number format'}), 400
                
                # Check if phone number already exists
                existing_user = User.query.filter_by(phone_number=clean_phone).first()
                if existing_user and existing_user.id != user.id:
                    return jsonify({'success': False, 'message': 'Phone number already exists'}), 400
                user.phone_number = clean_phone
            else:
                user.phone_number = None

        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'user': user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update user: {str(e)}'}), 500


@admin_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(user_id):
    """Delete a user"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Prevent deleting the current admin user
        if user.id == session['user_id']:
            return jsonify({'success': False, 'message': 'Cannot delete your own account'}), 400

        db.session.delete(user)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete user: {str(e)}'}), 500


@admin_bp.route('/api/users/<int:user_id>/approve', methods=['POST'])
@login_required
@admin_required
def approve_user(user_id):
    """Approve a user account"""
    try:
        user = User.query.get_or_404(user_id)
        user.is_approved = True
        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User approved successfully',
            'user': user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to approve user: {str(e)}'}), 500


@admin_bp.route('/api/users/<int:user_id>/toggle-admin', methods=['POST'])
@login_required
@admin_required
def toggle_admin(user_id):
    """Toggle admin status for a user"""
    try:
        user = User.query.get_or_404(user_id)
        user.is_admin = not user.is_admin
        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'User admin status {"enabled" if user.is_admin else "disabled"}',
            'user': user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update admin status: {str(e)}'}), 500


@admin_bp.route('/api/users/<int:user_id>/toggle-active', methods=['POST'])
@login_required
@admin_required
def toggle_active(user_id):
    """Toggle active status for a user"""
    try:
        user = User.query.get_or_404(user_id)
        user.is_active = not user.is_active
        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'User {"activated" if user.is_active else "deactivated"}',
            'user': user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update user status: {str(e)}'}), 500


@admin_bp.route('/api/users/<int:user_id>/password', methods=['PUT'])
@login_required
@admin_required
def update_user_password(user_id):
    """Update a user's password (admin only)"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        new_password = data.get('new_password', '')
        if not new_password:
            return jsonify({'success': False, 'message': 'New password is required'}), 400

        # Validate password strength
        is_valid, message = user.validate_password_strength(new_password)
        if not is_valid:
            return jsonify({'success': False, 'message': message}), 400

        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Password updated successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update password: {str(e)}'}), 500


@admin_bp.route('/api/password-reset-requests', methods=['GET'])
@login_required
@admin_required
def get_password_reset_requests():
    """Get all password reset requests"""
    try:
        requests = PasswordResetRequest.query.filter_by(is_used=False).order_by(
            PasswordResetRequest.created_at.desc()
        ).all()

        return jsonify({
            'success': True,
            'requests': [req.to_dict() for req in requests]
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch requests: {str(e)}'}), 500


@admin_bp.route('/api/password-reset-requests/<int:request_id>/approve', methods=['POST'])
@login_required
@admin_required
def approve_password_reset_request(request_id):
    """Approve a password reset request"""
    try:
        reset_request = PasswordResetRequest.query.get_or_404(request_id)
        
        if reset_request.is_expired():
            return jsonify({'success': False, 'message': 'Reset request has expired'}), 400

        if reset_request.is_approved:
            return jsonify({'success': False, 'message': 'Request already approved'}), 400

        reset_request.is_approved = True
        reset_request.approved_at = datetime.utcnow()
        reset_request.approved_by = session['user_id']
        db.session.commit()

        # Send notification to user
        try:
            email_service.send_password_reset_approval_notification(reset_request.user, reset_request)
        except Exception as e:
            print(f"Failed to send approval email: {e}")

        return jsonify({
            'success': True,
            'message': 'Password reset request approved'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to approve request: {str(e)}'}), 500


@admin_bp.route('/api/password-reset-requests/<int:request_id>/reject', methods=['POST'])
@login_required
@admin_required
def reject_password_reset_request(request_id):
    """Reject a password reset request"""
    try:
        reset_request = PasswordResetRequest.query.get_or_404(request_id)
        
        if reset_request.is_approved:
            return jsonify({'success': False, 'message': 'Request already approved'}), 400

        db.session.delete(reset_request)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Password reset request rejected'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to reject request: {str(e)}'}), 500


@admin_bp.route('/api/profile', methods=['PUT'])
@login_required
@approved_user_required
def update_profile():
    """Update current user's profile"""
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        data = request.get_json()

        # Update basic fields
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.username = data.get('username', user.username)

        # Update email if changed
        new_email = data.get('email', user.email)
        if new_email != user.email:
            # Check if new email already exists
            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user:
                return jsonify({'success': False, 'message': 'Email already exists'}), 400
            user.email = new_email

        # Update phone number if provided
        new_phone = data.get('phone_number', user.phone_number)
        if new_phone != user.phone_number:
            if new_phone:
                clean_phone = re.sub(r'[^\d+]', '', new_phone)
                if not user.validate_phone_number(clean_phone):
                    return jsonify({'success': False, 'message': 'Invalid phone number format'}), 400
                
                # Check if phone number already exists
                existing_user = User.query.filter_by(phone_number=clean_phone).first()
                if existing_user and existing_user.id != user.id:
                    return jsonify({'success': False, 'message': 'Phone number already exists'}), 400
                user.phone_number = clean_phone
            else:
                user.phone_number = None

        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update profile: {str(e)}'}), 500


@admin_bp.route('/api/profile/change-password', methods=['POST'])
@login_required
@approved_user_required
def change_password():
    """Change current user's password"""
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')

        if not current_password or not new_password or not confirm_password:
            return jsonify({'success': False, 'message': 'All password fields are required'}), 400

        if not user.check_password(current_password):
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 400

        if new_password != confirm_password:
            return jsonify({'success': False, 'message': 'New passwords do not match'}), 400

        # Validate password strength
        is_valid, message = user.validate_password_strength(new_password)
        if not is_valid:
            return jsonify({'success': False, 'message': message}), 400

        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to change password: {str(e)}'}), 500