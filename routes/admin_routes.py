from flask import request, jsonify
from models.schemas import db, User, PasswordResetRequest, Portfolio, Project, Tester, TeamMember, tester_project_association
from routes.auth_routes import login_required, approved_user_required, admin_required
from services.email_service import email_service
from datetime import datetime
from werkzeug.security import generate_password_hash
import json

def init_admin_routes(app):
    
    @app.route('/api/users', methods=['GET'])
    @login_required
    @admin_required
    def get_users():
        try:
            users = User.query.order_by(User.created_at.desc()).all()
            return jsonify({
                'success': True,
                'users': [user.to_dict() for user in users]
            })
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error fetching users: {str(e)}'}), 500

    @app.route('/api/users/<int:user_id>/approve', methods=['POST'])
    @login_required
    @admin_required
    def approve_user(user_id):
        try:
            user = User.query.get_or_404(user_id)
            user.is_approved = True
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'User {user.get_full_name()} has been approved',
                'user': user.to_dict()
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error approving user: {str(e)}'}), 500

    @app.route('/api/users/<int:user_id>/toggle-admin', methods=['POST'])
    @login_required
    @admin_required
    def toggle_admin(user_id):
        try:
            user = User.query.get_or_404(user_id)
            user.is_admin = not user.is_admin
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            action = 'granted' if user.is_admin else 'revoked'
            return jsonify({
                'success': True,
                'message': f'Admin privileges {action} for {user.get_full_name()}',
                'user': user.to_dict()
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error updating admin status: {str(e)}'}), 500

    @app.route('/api/users/<int:user_id>/toggle-active', methods=['POST'])
    @login_required
    @admin_required
    def toggle_active(user_id):
        try:
            user = User.query.get_or_404(user_id)
            user.is_active = not user.is_active
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            status = 'activated' if user.is_active else 'deactivated'
            return jsonify({
                'success': True,
                'message': f'User {user.get_full_name()} has been {status}',
                'user': user.to_dict()
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error updating user status: {str(e)}'}), 500

    @app.route('/api/users/<int:user_id>', methods=['GET'])
    @login_required
    @admin_required
    def get_user_details(user_id):
        try:
            user = User.query.get_or_404(user_id)
            return jsonify({
                'success': True,
                'user': user.to_dict()
            })
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error fetching user: {str(e)}'}), 500

    @app.route('/api/users/<int:user_id>', methods=['PUT'])
    @login_required
    @admin_required
    def update_user(user_id):
        try:
            user = User.query.get_or_404(user_id)
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'message': 'No data provided'}), 400
            
            # Update user fields
            if 'first_name' in data:
                user.first_name = data['first_name'].strip()
            if 'last_name' in data:
                user.last_name = data['last_name'].strip()
            if 'email' in data:
                email = data['email'].lower().strip()
                if email != user.email:
                    # Check if email is already taken
                    existing_user = User.query.filter_by(email=email).first()
                    if existing_user:
                        return jsonify({'success': False, 'message': 'Email already registered'}), 400
                user.email = email
            if 'username' in data:
                username = data['username'].strip() if data['username'] else None
                if username != user.username:
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
            if 'is_admin' in data:
                user.is_admin = bool(data['is_admin'])
            if 'is_approved' in data:
                user.is_approved = bool(data['is_approved'])
            if 'is_active' in data:
                user.is_active = bool(data['is_active'])
            
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'User updated successfully',
                'user': user.to_dict()
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error updating user: {str(e)}'}), 500

    @app.route('/api/users/<int:user_id>/password', methods=['PUT'])
    @login_required
    @admin_required
    def update_user_password(user_id):
        try:
            user = User.query.get_or_404(user_id)
            data = request.get_json()
            
            if not data or 'password' not in data:
                return jsonify({'success': False, 'message': 'Password is required'}), 400
            
            new_password = data['password']
            
            # Validate password strength
            is_valid, message = user.validate_password_strength(new_password)
            if not is_valid:
                return jsonify({'success': False, 'message': message}), 400
            
            # Update password
            user.set_password(new_password)
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Password updated successfully'
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error updating password: {str(e)}'}), 500

    @app.route('/api/users/<int:user_id>/delete', methods=['DELETE'])
    @login_required
    @admin_required
    def delete_user(user_id):
        try:
            user = User.query.get_or_404(user_id)
            
            # Check if user is trying to delete themselves
            from flask import session
            if user_id == session.get('user_id'):
                return jsonify({'success': False, 'message': 'You cannot delete your own account'}), 400
            
            # Check if user is the last admin
            if user.is_admin:
                admin_count = User.query.filter_by(is_admin=True, is_active=True).count()
                if admin_count <= 1:
                    return jsonify({'success': False, 'message': 'Cannot delete the last admin user'}), 400
            
            user_name = user.get_full_name()
            db.session.delete(user)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'User {user_name} has been deleted'
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error deleting user: {str(e)}'}), 500

    @app.route('/api/password-reset-requests', methods=['GET'])
    @login_required
    @admin_required
    def get_password_reset_requests():
        try:
            requests = PasswordResetRequest.query.filter_by(is_used=False).order_by(PasswordResetRequest.created_at.desc()).all()
            return jsonify({
                'success': True,
                'requests': [req.to_dict() for req in requests]
            })
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error fetching reset requests: {str(e)}'}), 500

    @app.route('/api/password-reset-requests/<int:request_id>/approve', methods=['POST'])
    @login_required
    @admin_required
    def approve_password_reset(request_id):
        try:
            from flask import session
            reset_request = PasswordResetRequest.query.get_or_404(request_id)
            
            if reset_request.is_used or reset_request.is_expired():
                return jsonify({'success': False, 'message': 'Reset request is expired or already used'}), 400
            
            reset_request.is_approved = True
            reset_request.approved_at = datetime.utcnow()
            reset_request.approved_by = session['user_id']
            db.session.commit()
            
            # Send reset link to user (if email service is configured)
            try:
                if email_service.is_configured() and reset_request.user:
                    reset_link = f"{request.host_url}reset-password-form?token={reset_request.token}"
                    subject = "Password Reset Approved - QA Sprint Reports"
                    body = f"""
                    Your password reset request has been approved.
                    
                    Please click the link below to reset your password:
                    {reset_link}
                    
                    This link will expire in 24 hours.
                    """
                    
                    email_service.send_email([reset_request.user.email], subject, body)
            except Exception as email_error:
                print(f"Failed to send reset email: {email_error}")
            
            return jsonify({
                'success': True,
                'message': 'Password reset request approved and email sent to user'
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error approving reset request: {str(e)}'}), 500


    @app.route('/api/testers', methods=['GET', 'POST'])
    @login_required
    @approved_user_required
    def manage_testers():
        if request.method == 'GET':
            testers = Tester.query.all()
            tester_list = []
            for tester in testers:
                tester_dict = {
                    'id': tester.id,
                    'name': tester.name,
                    'email': tester.email,
                    'role_display': tester.role_display,
                    'role_types': tester.role_types,
                    'createdAt': tester.createdAt.isoformat() if tester.createdAt else None,
                    'projects': [{'id': p.id, 'name': p.name} for p in tester.projects],
                    'roles': {
                        'is_automation_engineer': tester.is_automation_engineer,
                        'is_manual_engineer': tester.is_manual_engineer,
                        'is_performance_tester': tester.is_performance_tester,
                        'is_security_tester': tester.is_security_tester,
                        'is_api_tester': tester.is_api_tester,
                        'is_mobile_tester': tester.is_mobile_tester,
                        'is_web_tester': tester.is_web_tester,
                        'is_accessibility_tester': tester.is_accessibility_tester,
                        'is_usability_tester': tester.is_usability_tester,
                        'is_test_lead': tester.is_test_lead
                    }
                }
                tester_list.append(tester_dict)
            return jsonify(tester_list)

        elif request.method == 'POST':
            try:
                data = request.get_json()
                
                # Validate required fields
                if not data or not data.get('name') or not data.get('email'):
                    return jsonify({'error': 'Name and email are required'}), 400
                
                # Check if email already exists
                existing_tester = Tester.query.filter_by(email=data['email']).first()
                if existing_tester:
                    return jsonify({'error': 'Email already exists'}), 400
                
                # Create new tester
                tester = Tester(
                    name=data['name'],
                    email=data['email']
                )
                
                # Set role flags
                roles = data.get('roles', {})
                tester.is_automation_engineer = roles.get('is_automation_engineer', False)
                tester.is_manual_engineer = roles.get('is_manual_engineer', False)
                tester.is_performance_tester = roles.get('is_performance_tester', False)
                tester.is_security_tester = roles.get('is_security_tester', False)
                tester.is_api_tester = roles.get('is_api_tester', False)
                tester.is_mobile_tester = roles.get('is_mobile_tester', False)
                tester.is_web_tester = roles.get('is_web_tester', False)
                tester.is_accessibility_tester = roles.get('is_accessibility_tester', False)
                tester.is_usability_tester = roles.get('is_usability_tester', False)
                tester.is_test_lead = roles.get('is_test_lead', False)
                
                db.session.add(tester)
                db.session.commit()
                
                return jsonify({
                    'id': tester.id,
                    'name': tester.name,
                    'email': tester.email,
                    'role_display': tester.role_display,
                    'message': 'Tester created successfully'
                }), 201
                
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    @app.route('/api/testers/<int:tester_id>', methods=['GET', 'PUT', 'DELETE'])
    @login_required
    @approved_user_required
    def manage_tester(tester_id):
        tester = Tester.query.get_or_404(tester_id)
        
        if request.method == 'GET':
            return jsonify({
                'id': tester.id,
                'name': tester.name,
                'email': tester.email,
                'role_display': tester.role_display,
                'role_types': tester.role_types,
                'createdAt': tester.createdAt.isoformat() if tester.createdAt else None,
                'projects': [{'id': p.id, 'name': p.name} for p in tester.projects],
                'roles': {
                    'is_automation_engineer': tester.is_automation_engineer,
                    'is_manual_engineer': tester.is_manual_engineer,
                    'is_performance_tester': tester.is_performance_tester,
                    'is_security_tester': tester.is_security_tester,
                    'is_api_tester': tester.is_api_tester,
                    'is_mobile_tester': tester.is_mobile_tester,
                    'is_web_tester': tester.is_web_tester,
                    'is_accessibility_tester': tester.is_accessibility_tester,
                    'is_usability_tester': tester.is_usability_tester,
                    'is_test_lead': tester.is_test_lead
                }
            })
        elif request.method == 'PUT':
            try:
                data = request.get_json()
                
                # Update basic fields
                if data.get('name'):
                    tester.name = data['name']
                if data.get('email'):
                    # Check if email is already taken by another tester
                    existing_tester = Tester.query.filter_by(email=data['email']).first()
                    if existing_tester and existing_tester.id != tester.id:
                        return jsonify({'error': 'Email already exists'}), 400
                    tester.email = data['email']
                
                # Update role flags
                if 'roles' in data:
                    roles = data['roles']
                    tester.is_automation_engineer = roles.get('is_automation_engineer', False)
                    tester.is_manual_engineer = roles.get('is_manual_engineer', False)
                    tester.is_performance_tester = roles.get('is_performance_tester', False)
                    tester.is_security_tester = roles.get('is_security_tester', False)
                    tester.is_api_tester = roles.get('is_api_tester', False)
                    tester.is_mobile_tester = roles.get('is_mobile_tester', False)
                    tester.is_web_tester = roles.get('is_web_tester', False)
                    tester.is_accessibility_tester = roles.get('is_accessibility_tester', False)
                    tester.is_usability_tester = roles.get('is_usability_tester', False)
                    tester.is_test_lead = roles.get('is_test_lead', False)
                
                db.session.commit()
                return jsonify({'message': 'Tester updated successfully'})
                
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        elif request.method == 'DELETE':
            try:
                db.session.delete(tester)
                db.session.commit()
                return jsonify({'message': 'Tester deleted successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    @app.route('/api/testers/<int:tester_id>/projects', methods=['GET', 'POST'])
    @login_required
    @approved_user_required
    def manage_tester_projects(tester_id):
        tester = Tester.query.get_or_404(tester_id)
        
        if request.method == 'GET':
            return jsonify([{
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'portfolio_name': p.portfolio.name if p.portfolio else None
            } for p in tester.projects])
        elif request.method == 'POST':
            try:
                data = request.get_json()
                project_id = data.get('project_id')
                
                if not project_id:
                    return jsonify({'error': 'Project ID is required'}), 400
                
                project = Project.query.get_or_404(project_id)
                
                if project not in tester.projects:
                    tester.projects.append(project)
                    db.session.commit()
                
                return jsonify({'message': 'Project assigned to tester successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    @app.route('/api/projects/<int:project_id>/testers', methods=['GET'])
    @login_required
    @approved_user_required
    def get_project_testers(project_id):
        try:
            project = Project.query.get_or_404(project_id)
            testers = project.testers
            
            return jsonify([{
                'id': t.id,
                'name': t.name,
                'email': t.email,
                'role_display': t.role_display,
                'role_types': t.role_types
            } for t in testers])
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/team-members', methods=['GET', 'POST'])
    @login_required
    @approved_user_required
    def manage_team_members():
        if request.method == 'GET':
            team_members = TeamMember.query.all()
            return jsonify([{
                'id': tm.id,
                'name': tm.name,
                'email': tm.email,
                'role': tm.role,
                'createdAt': tm.createdAt.isoformat() if tm.createdAt else None
            } for tm in team_members])

        elif request.method == 'POST':
            try:
                data = request.get_json()
                
                # Validate required fields
                if not data or not data.get('name') or not data.get('email') or not data.get('role'):
                    return jsonify({'error': 'Name, email, and role are required'}), 400
                
                # Check if email already exists
                existing_member = TeamMember.query.filter_by(email=data['email']).first()
                if existing_member:
                    return jsonify({'error': 'Email already exists'}), 400
                
                # Validate role
                if data['role'] not in TeamMember.VALID_ROLES:
                    return jsonify({'error': f'Invalid role. Must be one of: {", ".join(TeamMember.VALID_ROLES)}'}), 400
                
                # Create new team member
                team_member = TeamMember(
                    name=data['name'],
                    email=data['email'],
                    role=data['role']
                )
                
                db.session.add(team_member)
                db.session.commit()
                
                return jsonify({
                    'id': team_member.id,
                    'name': team_member.name,
                    'email': team_member.email,
                    'role': team_member.role,
                    'message': 'Team member created successfully'
                }), 201
                
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    @app.route('/api/team-members/<int:member_id>', methods=['GET', 'PUT', 'DELETE'])
    @login_required
    @approved_user_required
    def manage_team_member(member_id):
        team_member = TeamMember.query.get_or_404(member_id)
        
        if request.method == 'GET':
            return jsonify({
                'id': team_member.id,
                'name': team_member.name,
                'email': team_member.email,
                'role': team_member.role,
                'createdAt': team_member.createdAt.isoformat() if team_member.createdAt else None
            })
        elif request.method == 'PUT':
            try:
                data = request.get_json()
                
                # Update basic fields
                if data.get('name'):
                    team_member.name = data['name']
                if data.get('email'):
                    # Check if email is already taken by another team member
                    existing_member = TeamMember.query.filter_by(email=data['email']).first()
                    if existing_member and existing_member.id != team_member.id:
                        return jsonify({'error': 'Email already exists'}), 400
                    team_member.email = data['email']
                if data.get('role'):
                    if data['role'] not in TeamMember.VALID_ROLES:
                        return jsonify({'error': f'Invalid role. Must be one of: {", ".join(TeamMember.VALID_ROLES)}'}), 400
                    team_member.role = data['role']
                
                db.session.commit()
                return jsonify({'message': 'Team member updated successfully'})
                
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        elif request.method == 'DELETE':
            try:
                db.session.delete(team_member)
                db.session.commit()
                return jsonify({'message': 'Team member deleted successfully'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    @app.route('/api/team-members/by-role/<role>', methods=['GET'])
    @login_required
    @approved_user_required
    def get_team_members_by_role(role):
        try:
            team_members = TeamMember.query.filter_by(role=role).all()
            return jsonify([{
                'id': tm.id,
                'name': tm.name,
                'email': tm.email,
                'role': tm.role
            } for tm in team_members])
        except Exception as e:
            return jsonify({'error': str(e)}), 500


    @app.route('/api/email/test', methods=['POST'])
    @login_required
    @admin_required
    def test_email():
        try:
            data = request.get_json()
            test_email = data.get('email')
            
            if not test_email:
                return jsonify({'success': False, 'message': 'Test email address is required'}), 400
            
            if not email_service.is_configured():
                return jsonify({
                    'success': False, 
                    'message': 'Email service is not configured. Please check your email settings.'
                }), 400
            
            # Send test email
            subject = "Test Email - QA Sprint Reports"
            body = """
            This is a test email from QA Sprint Reports application.
            
            If you received this email, the email configuration is working correctly.
            
            Test sent at: {}
            """.format(datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'))
            
            success = email_service.send_email([test_email], subject, body)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': f'Test email sent successfully to {test_email}'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Failed to send test email. Please check your email configuration.'
                }), 500
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Email test error: {str(e)}'
            }), 500

    @app.route('/api/email/config/status', methods=['GET'])
    @login_required
    @admin_required
    def email_config_status():
        try:
            is_configured = email_service.is_configured()
            config_details = email_service.get_config_status()
            
            return jsonify({
                'success': True,
                'is_configured': is_configured,
                'config': config_details
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error checking email config: {str(e)}'
            }), 500

    @app.route('/api/reports/<int:report_id>/send-email', methods=['POST'])
    @login_required
    @approved_user_required
    def send_report_email(report_id):
        try:
            report = Report.query.get_or_404(report_id)
            data = request.get_json()
            
            recipient_emails = data.get('emails', [])
            if not recipient_emails:
                return jsonify({'success': False, 'message': 'Recipient emails are required'}), 400
            
            if not email_service.is_configured():
                return jsonify({'success': False, 'message': 'Email service is not configured'}), 400
            
            # Generate report summary for email
            subject = f"QA Report - {report.portfolioName} / {report.projectName}"
            body = f"""
            QA Sprint Report Summary
            
            Portfolio: {report.portfolioName}
            Project: {report.projectName}
            Report Type: {report.reportType.title()}
            Sprint: {report.sprintNumber if report.sprintNumber else 'N/A'}
            Date: {report.reportDate}
            Status: {report.testingStatus}
            
            Summary:
            - Total User Stories: {report.totalUserStories or 0}
            - Total Test Cases: {report.totalTestCases or 0}  
            - Total Issues: {report.totalIssues or 0}
            - Total Enhancements: {report.totalEnhancements or 0}
            
            View full report: {request.host_url}report/{report.id}
            """
            
            success = email_service.send_email(recipient_emails, subject, body)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': f'Report emailed successfully to {len(recipient_emails)} recipients'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Failed to send email'
                }), 500
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Email sending error: {str(e)}'
            }), 500