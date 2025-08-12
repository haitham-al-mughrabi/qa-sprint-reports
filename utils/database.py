"""
Database utility functions
"""
import sqlite3
import os


def migrate_database(basedir):
    """Handle database migration for new fields"""
    data_dir = os.path.join(basedir, 'data')
    
    # Ensure data directory exists
    os.makedirs(data_dir, exist_ok=True)
    
    db_path = os.path.join(data_dir, 'reports.db')

    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check existing columns in report table
        cursor.execute("PRAGMA table_info(report)")
        columns = [column[1] for column in cursor.fetchall()]

        # Add missing columns to report table
        migrations = [
            ('releaseNumber', 'VARCHAR(50)'),
            ('testEnvironment', 'VARCHAR(50)'),
            ('reportName', 'VARCHAR(255)'),
            ('teamMemberData', 'TEXT DEFAULT "[]"'),
            ('qaNotesData', 'TEXT DEFAULT "[]"'),
            ('qaNoteFieldsData', 'TEXT DEFAULT "[]"'),
            ('automationPassedTestCases', 'INTEGER DEFAULT 0'),
            ('automationFailedTestCases', 'INTEGER DEFAULT 0'),
            ('automationSkippedTestCases', 'INTEGER DEFAULT 0'),
            ('automationTotalTestCases', 'INTEGER DEFAULT 0'),
            ('automationPassedPercentage', 'REAL DEFAULT 0.0'),
            ('automationFailedPercentage', 'REAL DEFAULT 0.0'),
            ('automationSkippedPercentage', 'REAL DEFAULT 0.0'),
            ('automationStableTests', 'INTEGER DEFAULT 0'),
            ('automationFlakyTests', 'INTEGER DEFAULT 0'),
            ('automationStabilityTotal', 'INTEGER DEFAULT 0'),
            ('automationStablePercentage', 'REAL DEFAULT 0.0'),
            ('automationFlakyPercentage', 'REAL DEFAULT 0.0'),
            # Evaluation fields
            ('involvementScore', 'INTEGER DEFAULT 0'),
            ('involvementReason', 'TEXT'),
            ('requirementsQualityScore', 'INTEGER DEFAULT 0'),
            ('requirementsQualityReason', 'TEXT'),
            ('qaPlanReviewScore', 'INTEGER DEFAULT 0'),
            ('qaPlanReviewReason', 'TEXT'),
            ('uxScore', 'INTEGER DEFAULT 0'),
            ('uxReason', 'TEXT'),
            ('cooperationScore', 'INTEGER DEFAULT 0'),
            ('cooperationReason', 'TEXT'),
            ('criticalBugsScore', 'INTEGER DEFAULT 0'),
            ('criticalBugsReason', 'TEXT'),
            ('highBugsScore', 'INTEGER DEFAULT 0'),
            ('highBugsReason', 'TEXT'),
            ('mediumBugsScore', 'INTEGER DEFAULT 0'),
            ('mediumBugsReason', 'TEXT'),
            ('lowBugsScore', 'INTEGER DEFAULT 0'),
            ('lowBugsReason', 'TEXT'),
            ('finalEvaluationScore', 'INTEGER DEFAULT 0'),
            ('totalIssuesByStatus', 'INTEGER DEFAULT 0')
        ]

        for column_name, column_type in migrations:
            if column_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE report ADD COLUMN {column_name} {column_type}")
                    conn.commit()
                    print(f"Added {column_name} column to existing database")
                except sqlite3.Error as e:
                    print(f"Error adding {column_name} column: {e}")

        # Check existing columns in tester table and add role fields
        cursor.execute("PRAGMA table_info(tester)")
        tester_columns = [column[1] for column in cursor.fetchall()]

        tester_migrations = [
            ('is_automation_engineer', 'BOOLEAN DEFAULT 0'),
            ('is_manual_engineer', 'BOOLEAN DEFAULT 0'),
            ('is_performance_tester', 'BOOLEAN DEFAULT 0'),
            ('is_security_tester', 'BOOLEAN DEFAULT 0'),
            ('is_api_tester', 'BOOLEAN DEFAULT 0'),
            ('is_mobile_tester', 'BOOLEAN DEFAULT 0'),
            ('is_web_tester', 'BOOLEAN DEFAULT 0'),
            ('is_accessibility_tester', 'BOOLEAN DEFAULT 0'),
            ('is_usability_tester', 'BOOLEAN DEFAULT 0'),
            ('is_test_lead', 'BOOLEAN DEFAULT 0')
        ]

        for column_name, column_type in tester_migrations:
            if column_name not in tester_columns:
                try:
                    cursor.execute(f"ALTER TABLE tester ADD COLUMN {column_name} {column_type}")
                    conn.commit()
                    print(f"Added {column_name} column to tester table")
                except sqlite3.Error as e:
                    print(f"Error adding {column_name} column to tester table: {e}")

        conn.close()