#!/usr/bin/env python3
"""
Database migration script for multi-report types feature.
This script adds new fields to the Report table to support multiple report types.
"""

import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

# Add the current directory to the path so we can import from app.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def create_app():
    """Create Flask app for migration"""
    app = Flask(__name__)
    
    # Database configuration
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'reports.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    return app

def run_migration():
    """Run the database migration"""
    app = create_app()
    db = SQLAlchemy(app)
    
    with app.app_context():
        try:
            print("Starting database migration for multi-report types...")
            
            # Add new columns to the Report table
            migration_queries = [
                # Add report type field with default 'sprint' for existing records
                "ALTER TABLE report ADD COLUMN reportType VARCHAR(20) DEFAULT 'sprint' NOT NULL",
                
                # Add environment field for performance reports
                "ALTER TABLE report ADD COLUMN environment VARCHAR(100)",
                
                # Performance Report specific fields - Test Summary Section 1
                "ALTER TABLE report ADD COLUMN userLoad VARCHAR(100)",
                "ALTER TABLE report ADD COLUMN responseTime VARCHAR(100)",
                "ALTER TABLE report ADD COLUMN requestVolume VARCHAR(100)",
                "ALTER TABLE report ADD COLUMN errorRate VARCHAR(100)",
                "ALTER TABLE report ADD COLUMN slowestResponse VARCHAR(100)",
                "ALTER TABLE report ADD COLUMN fastestResponse VARCHAR(100)",
                "ALTER TABLE report ADD COLUMN numberOfUsers VARCHAR(100)",
                "ALTER TABLE report ADD COLUMN executionDuration VARCHAR(100)",
                
                # Performance Report specific fields - Test Summary Section 2
                "ALTER TABLE report ADD COLUMN maxThroughput VARCHAR(100)",
                "ALTER TABLE report ADD COLUMN httpFailures VARCHAR(100)",
                "ALTER TABLE report ADD COLUMN avgResponseTime VARCHAR(100)",
                "ALTER TABLE report ADD COLUMN responseTime95Percent VARCHAR(100)",
                
                # Performance Report JSON fields for complex data
                "ALTER TABLE report ADD COLUMN performanceCriteriaResults TEXT DEFAULT '[]'",
                "ALTER TABLE report ADD COLUMN performanceScenarios TEXT DEFAULT '[]'",
                "ALTER TABLE report ADD COLUMN httpRequestsOverview TEXT DEFAULT '[]'",
                
                # Automation Report specific fields
                "ALTER TABLE report ADD COLUMN coveredServices TEXT",
                "ALTER TABLE report ADD COLUMN coveredModules TEXT",
                "ALTER TABLE report ADD COLUMN bugsData TEXT DEFAULT '[]'",
                
                # Make sprintNumber nullable for performance reports
                # Note: SQLite doesn't support ALTER COLUMN, so we'll handle this in the application logic
            ]
            
            for query in migration_queries:
                try:
                    print(f"Executing: {query}")
                    db.session.execute(text(query))
                    db.session.commit()
                    print("✓ Success")
                except Exception as e:
                    if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                        print(f"⚠ Column already exists, skipping: {e}")
                    else:
                        print(f"✗ Error: {e}")
                        db.session.rollback()
                        raise
            
            # Create index on reportType for better performance
            try:
                print("Creating index on reportType...")
                db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_report_type ON report(reportType)"))
                db.session.commit()
                print("✓ Index created successfully")
            except Exception as e:
                print(f"⚠ Index creation warning: {e}")
            
            print("\n✅ Migration completed successfully!")
            print("All existing reports have been set to type 'sprint' by default.")
            print("New fields have been added to support Performance and Automation reports.")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            db.session.rollback()
            sys.exit(1)

if __name__ == "__main__":
    run_migration()