"""
Email configuration utilities
"""
from flask import jsonify
from config.email_config import EmailConfig


def get_email_config():
    """Get email configuration status"""
    return jsonify({
        'configured': EmailConfig.is_configured(),
        'server': EmailConfig.MAIL_SERVER,
        'port': EmailConfig.MAIL_PORT,
        'use_tls': EmailConfig.MAIL_USE_TLS,
        'username': EmailConfig.MAIL_USERNAME,
        'has_password': bool(EmailConfig.MAIL_PASSWORD)
    })