# utils/email_utils.py
from services.email_service import email_service
from app import User
import json

def get_admin_emails():
    """Get list of admin email addresses"""
    try:
        admin_users = User.query.filter_by(is_admin=True, is_approved=True).all()
        return [admin.email for admin in admin_users]
    except Exception as e:
        print(f"Error getting admin emails: {e}")
        return []

def get_project_stakeholder_emails(report):
    """Get stakeholder emails for a specific project/report"""
    emails = []
    
    try:
        # Add team members from report
        team_members = json.loads(report.teamMemberData or '[]')
        for member in team_members:
            if member.get('email'):
                emails.append(member['email'])
        
        # Add testers from report
        testers = json.loads(report.testerData or '[]')
        for tester in testers:
            if tester.get('email'):
                emails.append(tester['email'])
        
        # Remove duplicates
        emails = list(set(emails))
        
    except Exception as e:
        print(f"Error getting project stakeholder emails: {e}")
    
    return emails

def send_weekly_report_summary():
    """Send weekly summary of all reports (can be used with a scheduler)"""
    try:
        from datetime import datetime, timedelta
        from app import Report
        
        # Get reports from last week
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_reports = Report.query.filter(Report.createdAt >= week_ago).all()
        
        if not recent_reports:
            return
        
        admin_emails = get_admin_emails()
        if not admin_emails:
            return
        
        # Create summary email
        subject = "Weekly Test Reports Summary"
        
        template = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Weekly Test Reports Summary</h2>
                
                <p>Here's a summary of test reports created in the last 7 days:</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>Summary:</strong><br>
                    Total Reports: {len(recent_reports)}<br>
                    Period: {week_ago.strftime('%Y-%m-%d')} to {datetime.utcnow().strftime('%Y-%m-%d')}
                </div>
                
                <h3>Recent Reports:</h3>
                <ul>
        """
        
        for report in recent_reports:
            template += f"""
                    <li>
                        <strong>{report.portfolioName} - {report.projectName}</strong><br>
                        Sprint {report.sprintNumber} | Status: {report.testingStatus}<br>
                        Created: {report.createdAt.strftime('%Y-%m-%d %H:%M')}
                    </li>
            """
        
        template += """
                </ul>
                
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                    This is an automated weekly summary from the Test Reports System.
                </p>
            </div>
        </body>
        </html>
        """
        
        for admin_email in admin_emails:
            email_service.send_email(admin_email, subject, template)
            
    except Exception as e:
        print(f"Error sending weekly summary: {e}")

def send_project_status_change_notification(project_name, portfolio_name, old_status, new_status):
    """Send notification when project status changes"""
    try:
        admin_emails = get_admin_emails()
        if admin_emails:
            details = f"Status changed from '{old_status}' to '{new_status}'"
            email_service.send_project_status_update(
                project_name, 
                portfolio_name, 
                new_status, 
                admin_emails, 
                details
            )
    except Exception as e:
        print(f"Error sending status change notification: {e}")