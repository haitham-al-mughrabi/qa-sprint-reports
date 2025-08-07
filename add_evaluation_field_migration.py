#!/usr/bin/env python3
"""
Migration script to add evaluationData field to the Report model
This script adds the evaluationData column to existing reports database
"""

import sqlite3
import os
import json
from datetime import datetime

def add_evaluation_field():
    """Add evaluationData field to the Report table"""
    
    # Get the database path
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, 'reports.db')
    
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}")
        return False
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the column already exists
        cursor.execute("PRAGMA table_info(report)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'evaluationData' in columns:
            print("evaluationData column already exists in the report table")
            conn.close()
            return True
        
        # Add the evaluationData column
        print("Adding evaluationData column to report table...")
        cursor.execute("""
            ALTER TABLE report 
            ADD COLUMN evaluationData TEXT DEFAULT '[]'
        """)
        
        # Commit the changes
        conn.commit()
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(report)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'evaluationData' in columns:
            print("✅ Successfully added evaluationData column to report table")
            
            # Update existing reports to have empty evaluation data
            cursor.execute("UPDATE report SET evaluationData = '[]' WHERE evaluationData IS NULL")
            conn.commit()
            
            print("✅ Updated existing reports with empty evaluation data")
            return True
        else:
            print("❌ Failed to add evaluationData column")
            return False
            
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    finally:
        if conn:
            conn.close()

def main():
    """Main function to run the migration"""
    print("=" * 60)
    print("EVALUATION FIELD MIGRATION")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = add_evaluation_field()
    
    print()
    if success:
        print("✅ Migration completed successfully!")
        print("The evaluationData field has been added to the Report model.")
        print("Sprint and Manual reports can now use the Evaluation section.")
    else:
        print("❌ Migration failed!")
        print("Please check the error messages above and try again.")
    
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()