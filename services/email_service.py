# services/email_service.py
from flask import current_app, render_template_string
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">New User Registration</h2>
                
                <p>A new user has registered and is pending approval:</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>User Details:</strong><br>
                    Name: {{ user.get_full_name() }}<br>
                    Email: {{ user.email }}<br>
                    Phone: {{ user.phone_number or 'Not provided' }}<br>
                    Registration Date: {{ user.created_at.strftime('%Y-%m-%d %H:%M') }}
                </div>
                
                <p>Please log in to the admin panel to approve or reject this registration.</p>
                
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #27ae60;">Account Approved!</h2>
                
                <p>Dear {{ user.get_full_name() }},</p>
                
                <p>Great news! Your account has been approved and you now have access to the Test Reports System.</p>
                
                <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
                    <strong>Account Details:</strong><br>
                    Email: {{ user.email }}<br>
                    Status: Active and Approved
                </div>
                
                <p>You can now log in and start using the system to manage your test reports.</p>
                
                <p>If you have any questions, please don't hesitate to contact the administrator.</p>
                
                <p>Best regards,<br>Test Reports System Team</p>
                
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e74c3c;">Password Reset Request</h2>
                
                <p>A user has requested a password reset and is awaiting approval:</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>Request Details:</strong><br>
                    User: {{ reset_request.user.get_full_name() }}<br>
                    Email: {{ reset_request.user.email }}<br>
                    Request Date: {{ reset_request.created_at.strftime('%Y-%m-%d %H:%M') }}<br>
                    Expires: {{ reset_request.expires_at.strftime('%Y-%m-%d %H:%M') }}
                </div>
                
                <p>Please log in to the admin panel to approve or reject this password reset request.</p>
                
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #27ae60;">Password Reset Approved</h2>
                
                <p>Dear {{ reset_request.user.get_full_name() }},</p>
                
                <p>Your password reset request has been approved. You can now reset your password using the link below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ reset_url }}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p><strong>Important:</strong> This link will expire on {{ reset_request.expires_at.strftime('%Y-%m-%d at %H:%M') }}.</p>
                
                <p>If you didn't request this password reset, please contact the administrator immediately.</p>
                
                <p>Best regards,<br>Test Reports System Team</p>
                
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Test Report Available</h2>
                
                <p>A test report has been created/updated and is ready for review:</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>Report Details:</strong><br>
                    Portfolio: {{ report.portfolioName }}<br>
                    Project: {{ report.projectName }}<br>
                    Sprint: {{ report.sprintNumber }}<br>
                    Status: {{ report.testingStatus }}<br>
                    Date: {{ report.reportDate }}<br>
                    {% if report.reportName %}Report Name: {{ report.reportName }}<br>{% endif %}
                </div>
                
                <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>Summary:</strong><br>
                    Total User Stories: {{ report.totalUserStories }}<br>
                    Total Test Cases: {{ report.totalTestCases }}<br>
                    Total Issues: {{ report.totalIssues }}<br>
                    Total Enhancements: {{ report.totalEnhancements }}
                </div>
                
                {% if report_url %}
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ report_url }}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        View Report
                    </a>
                </div>
                {% endif %}
                
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Project Status Update</h2>
                
                <p>The status of a project has been updated:</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>Project Details:</strong><br>
                    Portfolio: {{ portfolio_name }}<br>
                    Project: {{ project_name }}<br>
                    New Status: <span style="color: {% if status == 'passed' %}#27ae60{% elif status == 'passed-with-issues' %}#f39c12{% else %}#e74c3c{% endif %};">{{ status.title() }}</span><br>
                    Updated: {{ datetime.now().strftime('%Y-%m-%d %H:%M') }}
                </div>
                
                {% if details %}
                <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>Additional Details:</strong><br>
                    {{ details }}
                </div>
                {% endif %}
                
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
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