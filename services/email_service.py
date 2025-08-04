# services/email_service.py
from flask import current_app, render_template_string, url_for
from flask_mail import Mail, Message
from config.email_config import EmailConfig
import logging
from datetime import datetime

class EmailService:
    """Service for handling email operations"""
    
    def __init__(self, app=None):
        self.mail = None
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize email service with Flask app"""
        # Configure Flask-Mail settings
        app.config['MAIL_SERVER'] = EmailConfig.MAIL_SERVER
        app.config['MAIL_PORT'] = EmailConfig.MAIL_PORT
        app.config['MAIL_USE_TLS'] = EmailConfig.MAIL_USE_TLS
        app.config['MAIL_USE_SSL'] = EmailConfig.MAIL_USE_SSL
        app.config['MAIL_USERNAME'] = EmailConfig.MAIL_USERNAME
        app.config['MAIL_PASSWORD'] = EmailConfig.MAIL_PASSWORD
        app.config['MAIL_DEFAULT_SENDER'] = EmailConfig.MAIL_DEFAULT_SENDER
        
        self.mail = Mail(app)
    
    def send_email(self, to, subject, template, **kwargs):
        """Send email with template"""
        if not EmailConfig.is_configured():
            logging.warning("Email not configured. Skipping email send.")
            return False
        
        try:
            msg = Message(
                subject=EmailConfig.MAIL_SUBJECT_PREFIX + subject,
                recipients=[to] if isinstance(to, str) else to,
                html=template,
                sender=EmailConfig.MAIL_DEFAULT_SENDER
            )
            
            self.mail.send(msg)
            logging.info(f"Email sent successfully to {to}")
            return True
            
        except Exception as e:
            logging.error(f"Failed to send email to {to}: {str(e)}")
            return False
    
    def send_user_registration_notification(self, user, admin_emails):
        """Send notification to admins about new user registration"""
        subject = "New User Registration Pending Approval"
        
        template = """
        <html>
        <body style="font-family: 'Poppins', sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 30px; border: 1px solid #334155;">
                <h2 style="color: #3b82f6; font-size: 24px; margin-bottom: 20px; text-align: center;">New User Registration</h2>
                <p style="color: #94a3b8; line-height: 1.6;">A new user has registered and is pending approval:</p>
                <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
                    <strong style="color: #f1f5f9;">User Details:</strong><br>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Name:</strong> {{ user.get_full_name() }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Email:</strong> {{ user.email }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Phone:</strong> {{ user.phone_number or 'Not provided' }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Registration Date:</strong> {{ user.created_at.strftime('%Y-%m-%d %H:%M') }}</p>
                </div>
                <p style="color: #94a3b8; line-height: 1.6;">Please log in to the admin panel to approve or reject this registration.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{{ url_for('user_management', _external=True) }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                        Go to User Management
                    </a>
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">
                    This is an automated message from the Test Reports System.
                </p>
            </div>
        </body>
        </html>
        """
        
        rendered_template = render_template_string(template, user=user)
        
        for admin_email in admin_emails:
            self.send_email(admin_email, subject, rendered_template)
    
    def send_user_approval_notification(self, user):
        """Send notification to user about account approval"""
        subject = "Account Approved - Welcome to Test Reports System"
        
        template = """
        <html>
        <body style="font-family: 'Poppins', sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 30px; border: 1px solid #334155;">
                <h2 style="color: #22c55e; font-size: 24px; margin-bottom: 20px; text-align: center;">Account Approved!</h2>
                <p style="color: #94a3b8; line-height: 1.6;">Dear {{ user.get_full_name() }},</p>
                <p style="color: #94a3b8; line-height: 1.6;">Great news! Your account has been approved and you now have access to the Test Reports System.</p>
                <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                    <strong style="color: #f1f5f9;">Account Details:</strong><br>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Email:</strong> {{ user.email }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Status:</strong> Active and Approved</p>
                </div>
                <p style="color: #94a3b8; line-height: 1.6;">You can now log in and start using the system to manage your test reports.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{{ url_for('login', _external=True) }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                        Login Now
                    </a>
                </div>
                <p style="color: #94a3b8; line-height: 1.6;">If you have any questions, please don't hesitate to contact the administrator.</p>
                <p style="color: #94a3b8; line-height: 1.6;">Best regards,<br>Test Reports System Team</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">
                    This is an automated message from the Test Reports System.
                </p>
            </div>
        </body>
        </html>
        """
        
        rendered_template = render_template_string(template, user=user)
        self.send_email(user.email, subject, rendered_template)
    
    def send_password_reset_request_notification(self, reset_request, admin_emails):
        """Send notification to admins about password reset request"""
        subject = "Password Reset Request Pending Approval"
        
        template = """
        <html>
        <body style="font-family: 'Poppins', sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 30px; border: 1px solid #334155;">
                <h2 style="color: #ef4444; font-size: 24px; margin-bottom: 20px; text-align: center;">Password Reset Request</h2>
                <p style="color: #94a3b8; line-height: 1.6;">A user has requested a password reset and is awaiting approval:</p>
                <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
                    <strong style="color: #f1f5f9;">Request Details:</strong><br>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>User:</strong> {{ reset_request.user.get_full_name() }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Email:</strong> {{ reset_request.user.email }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Request Date:</strong> {{ reset_request.created_at.strftime('%Y-%m-%d %H:%M') }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Expires:</strong> {{ reset_request.expires_at.strftime('%Y-%m-%d %H:%M') }}</p>
                </div>
                <p style="color: #94a3b8; line-height: 1.6;">Please log in to the admin panel to approve or reject this password reset request.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{{ url_for('user_management', _external=True) }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                        Go to User Management
                    </a>
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">
                    This is an automated message from the Test Reports System.
                </p>
            </div>
        </body>
        </html>
        """
        
        rendered_template = render_template_string(template, reset_request=reset_request)
        
        for admin_email in admin_emails:
            self.send_email(admin_email, subject, rendered_template)
    
    def send_password_reset_approved_notification(self, reset_request, reset_url):
        """Send notification to user about approved password reset"""
        subject = "Password Reset Approved"
        
        template = """
        <html>
        <body style="font-family: 'Poppins', sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 30px; border: 1px solid #334155;">
                <h2 style="color: #22c55e; font-size: 24px; margin-bottom: 20px; text-align: center;">Password Reset Approved</h2>
                <p style="color: #94a3b8; line-height: 1.6;">Dear {{ reset_request.user.get_full_name() }},</p>
                <p style="color: #94a3b8; line-height: 1.6;">Your password reset request has been approved. You can now reset your password using the link below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ reset_url }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #94a3b8; line-height: 1.6;"><strong>Important:</strong> This link will expire on {{ reset_request.expires_at.strftime('%Y-%m-%d at %H:%M') }}.</p>
                <p style="color: #94a3b8; line-height: 1.6;">If you didn't request this password reset, please contact the administrator immediately.</p>
                <p style="color: #94a3b8; line-height: 1.6;">Best regards,<br>Test Reports System Team</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">
                    This is an automated message from the Test Reports System.
                </p>
            </div>
        </body>
        </html>
        """
        
        rendered_template = render_template_string(template, reset_request=reset_request, reset_url=reset_url)
        self.send_email(reset_request.user.email, subject, rendered_template)
    
    def send_report_notification(self, report, recipients, report_url=None):
        """Send notification about new or updated report"""
        subject = f"Test Report: {report.projectName} - Sprint {report.sprintNumber}"
        
        template = """
        <html>
        <body style="font-family: 'Poppins', sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 30px; border: 1px solid #334155;">
                <h2 style="color: #3b82f6; font-size: 24px; margin-bottom: 20px; text-align: center;">Test Report Available</h2>
                <p style="color: #94a3b8; line-height: 1.6;">A test report has been created/updated and is ready for review:</p>
                <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
                    <strong style="color: #f1f5f9;">Report Details:</strong><br>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Portfolio:</strong> {{ report.portfolioName }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Project:</strong> {{ report.projectName }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Sprint:</strong> {{ report.sprintNumber }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Status:</strong> {{ report.testingStatus }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Date:</strong> {{ report.reportDate }}</p>
                    {% if report.reportName %}<p style="color: #94a3b8; margin: 5px 0;"><strong>Report Name:</strong> {{ report.reportName }}</p>{% endif %}
                </div>
                <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
                    <strong style="color: #f1f5f9;">Summary:</strong><br>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Total User Stories:</strong> {{ report.totalUserStories }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Total Test Cases:</strong> {{ report.totalTestCases }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Total Issues:</strong> {{ report.totalIssues }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Total Enhancements:</strong> {{ report.totalEnhancements }}</p>
                </div>
                {% if report_url %}
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ report_url }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                        View Report
                    </a>
                </div>
                {% endif %}
                <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">
                    This is an automated message from the Test Reports System.
                </p>
            </div>
        </body>
        </html>
        """
        
        rendered_template = render_template_string(template, report=report, report_url=report_url)
        
        for recipient in recipients:
            self.send_email(recipient, subject, rendered_template)
    
    def send_project_status_update(self, project_name, portfolio_name, status, recipients, details=None):
        """Send project status update notification"""
        subject = f"Project Status Update: {project_name}"
        
        template = """
        <html>
        <body style="font-family: 'Poppins', sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 30px; border: 1px solid #334155;">
                <h2 style="color: #3b82f6; font-size: 24px; margin-bottom: 20px; text-align: center;">Project Status Update</h2>
                <p style="color: #94a3b8; line-height: 1.6;">The status of a project has been updated:</p>
                <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
                    <strong style="color: #f1f5f9;">Project Details:</strong><br>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Portfolio:</strong> {{ portfolio_name }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Project:</strong> {{ project_name }}</p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>New Status:</strong> <span style="color: {% if status == 'passed' %}#22c55e{% elif status == 'passed-with-issues' %}#eab308{% else %}#ef4444{% endif %};">{{ status.title() }}</span></p>
                    <p style="color: #94a3b8; margin: 5px 0;"><strong>Updated:</strong> {{ datetime.now().strftime('%Y-%m-%d %H:%M') }}</p>
                </div>
                {% if details %}
                <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
                    <strong style="color: #f1f5f9;">Additional Details:</strong><br>
                    <p style="color: #94a3b8; line-height: 1.6;">{{ details }}</p>
                </div>
                {% endif %}
                <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">
                    This is an automated message from the Test Reports System.
                </p>
            </div>
        </body>
        </html>
        """
        
        rendered_template = render_template_string(
            template, 
            project_name=project_name, 
            portfolio_name=portfolio_name, 
            status=status, 
            details=details,
            datetime=datetime
        )
        
        for recipient in recipients:
            self.send_email(recipient, subject, rendered_template)

# Global email service instance
email_service = EmailService()