# config/email_config.py
import os
from dotenv import load_dotenv

class EmailConfig:
    """Email configuration settings"""
    def __init__(self):
        pass
        # Load environment variables from .env file
    load_dotenv()
    
    # SMTP Settings
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
    
    # Authentication
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    
    # Default sender
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', MAIL_USERNAME)
    
    # Application settings
    MAIL_SUBJECT_PREFIX = os.getenv('MAIL_SUBJECT_PREFIX', '[Test Reports] ')
    
    @classmethod
    def is_configured(cls):
        """Check if email is properly configured"""
        return bool(cls.MAIL_USERNAME and cls.MAIL_PASSWORD)