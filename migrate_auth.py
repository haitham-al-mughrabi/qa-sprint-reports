#!/usr/bin/env python3
"""
Migration script to add authentication to existing Sprint Reports System
"""
from app import app, db, User

def migrate_to_auth():
    """Migrate existing database to include authentication"""
    with app.app_context():
        print("Starting authentication migration...")
        
        # Create all tables (including new User table)
        db.create_all()
        print("✓ Database tables created/updated")
        
        # Check if admin user already exists
        admin_exists = User.query.filter_by(email='admin@example.com').first()
        
        if not admin_exists:
            # Create default admin user
            admin_user = User(
                first_name='Admin',
                last_name='User',
                email='admin@example.com',
                role='admin',
                is_approved=True
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print("✓ Default admin user created")
            print("  Email: admin@example.com")
            print("  Password: admin123")
            print("  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!")
        else:
            print("✓ Admin user already exists")
        
        print("\nMigration completed successfully!")
        print("\nNext steps:")
        print("1. Start the application: python app.py")
        print("2. Login with admin credentials")
        print("3. Change the default admin password")
        print("4. Create additional user accounts as needed")

if __name__ == '__main__':
    migrate_to_auth()