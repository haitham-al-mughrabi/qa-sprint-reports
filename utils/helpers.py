import re
from datetime import datetime
from models.schemas import db

def convert_date_to_storage_format(date_string):
    """Convert date from yyyy-mm-dd (HTML5 format) to dd-mm-yyyy (storage format)"""
    if not date_string:
        return date_string
    
    # If already in dd-mm-yyyy format, return as-is
    if re.match(r'^\d{2}-\d{2}-\d{4}$', date_string):
        return date_string
    
    # Convert yyyy-mm-dd to dd-mm-yyyy
    if re.match(r'^\d{4}-\d{2}-\d{2}$', date_string):
        parts = date_string.split('-')
        return f"{parts[2]}-{parts[1]}-{parts[0]}"
    
    return date_string

def migrate_database():
    """Create database tables"""
    try:
        db.create_all()
        print("Database tables created successfully!")
        return True
    except Exception as e:
        print(f"Database migration error: {e}")
        return False

def parse_release(release_str):
    """Parse release version string to extract version numbers"""
    if not release_str:
        return [0, 0, 0]
    
    # Handle different release formats
    release_str = str(release_str).strip()
    
    # Remove 'v' or 'V' prefix if present
    if release_str.lower().startswith('v'):
        release_str = release_str[1:]
    
    # Split by dots and convert to integers
    parts = release_str.split('.')
    version = []
    for part in parts[:3]:  # Only take first 3 parts
        try:
            version.append(int(part))
        except ValueError:
            version.append(0)
    
    # Pad with zeros if needed
    while len(version) < 3:
        version.append(0)
    
    return version

def increment_release(release_str):
    """Increment the patch version of a release string"""
    version = parse_release(release_str)
    version[2] += 1  # Increment patch version
    return f"{version[0]}.{version[1]}.{version[2]}"