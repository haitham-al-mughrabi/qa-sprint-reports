#!/usr/bin/env python3
"""
Migration script to add missing performance report fields to the database
"""

import sqlite3
from datetime import datetime

def run_migration():
    """Add missing performance report fields to the database"""
    
    # Connect to the database
    conn = sqlite3.connect('reports.db')
    cursor = conn.cursor()
    
    try:
        print(f"Starting migration at {datetime.now()}")
        
        # List of new columns to add
        new_columns = [
            ('testType', 'VARCHAR(100)'),
            ('testTool', 'VARCHAR(100)'),
            ('testObjective', 'TEXT'),
            ('testScope', 'TEXT')
        ]
        
        # Check existing columns first
        cursor.execute("PRAGMA table_info(report)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        
        print(f"Found {len(existing_columns)} existing columns")
        
        # Add each new column if it doesn't exist
        for column_name, column_type in new_columns:
            if column_name not in existing_columns:
                alter_sql = f"ALTER TABLE report ADD COLUMN {column_name} {column_type}"
                print(f"Adding column: {column_name} ({column_type})")
                cursor.execute(alter_sql)
                print(f"✓ Added column: {column_name}")
            else:
                print(f"✓ Column {column_name} already exists")
        
        # Commit the changes
        conn.commit()
        print("✓ Migration completed successfully")
        
        # Verify the new columns were added
        cursor.execute("PRAGMA table_info(report)")
        updated_columns = [row[1] for row in cursor.fetchall()]
        print(f"Database now has {len(updated_columns)} columns")
        
        # Show the new columns
        new_added = [col for col in updated_columns if col not in existing_columns]
        if new_added:
            print(f"Newly added columns: {', '.join(new_added)}")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
        raise
    
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()