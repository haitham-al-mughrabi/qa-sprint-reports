#!/usr/bin/env python3
"""
Migration script to make sprintNumber nullable for performance reports
"""

import sqlite3
import shutil
from datetime import datetime

def run_migration():
    """Make sprintNumber column nullable"""
    
    # Backup the database first
    backup_filename = f'reports_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
    shutil.copy2('reports.db', backup_filename)
    print(f"✓ Created backup: {backup_filename}")
    
    conn = sqlite3.connect('reports.db')
    cursor = conn.cursor()
    
    try:
        print("Starting schema migration...")
        
        # SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        # Step 1: Create new table with correct schema
        cursor.execute('''
            CREATE TABLE report_new (
                id INTEGER PRIMARY KEY,
                portfolioName VARCHAR(100) NOT NULL,
                projectName VARCHAR(100) NOT NULL,
                sprintNumber INTEGER,  -- Make this nullable
                reportVersion VARCHAR(50),
                reportName VARCHAR(255),
                cycleNumber INTEGER,
                releaseNumber VARCHAR(50),
                reportDate VARCHAR(50),
                testSummary TEXT,
                testingStatus VARCHAR(50),
                requestData TEXT,
                buildData TEXT,
                testerData TEXT,
                teamMemberData TEXT,
                totalUserStories INTEGER DEFAULT 0,
                passedUserStories INTEGER DEFAULT 0,
                passedWithIssuesUserStories INTEGER DEFAULT 0,
                failedUserStories INTEGER DEFAULT 0,
                blockedUserStories INTEGER DEFAULT 0,
                cancelledUserStories INTEGER DEFAULT 0,
                deferredUserStories INTEGER DEFAULT 0,
                notTestableUserStories INTEGER DEFAULT 0,
                totalTestCases INTEGER DEFAULT 0,
                passedTestCases INTEGER DEFAULT 0,
                passedWithIssuesTestCases INTEGER DEFAULT 0,
                failedTestCases INTEGER DEFAULT 0,
                blockedTestCases INTEGER DEFAULT 0,
                cancelledTestCases INTEGER DEFAULT 0,
                deferredTestCases INTEGER DEFAULT 0,
                notTestableTestCases INTEGER DEFAULT 0,
                totalIssues INTEGER DEFAULT 0,
                criticalIssues INTEGER DEFAULT 0,
                highIssues INTEGER DEFAULT 0,
                mediumIssues INTEGER DEFAULT 0,
                lowIssues INTEGER DEFAULT 0,
                newIssues INTEGER DEFAULT 0,
                fixedIssues INTEGER DEFAULT 0,
                notFixedIssues INTEGER DEFAULT 0,
                reopenedIssues INTEGER DEFAULT 0,
                deferredIssues INTEGER DEFAULT 0,
                totalEnhancements INTEGER DEFAULT 0,
                newEnhancements INTEGER DEFAULT 0,
                implementedEnhancements INTEGER DEFAULT 0,
                existsEnhancements INTEGER DEFAULT 0,
                userStoriesMetric INTEGER DEFAULT 0,
                testCasesMetric INTEGER DEFAULT 0,
                issuesMetric INTEGER DEFAULT 0,
                enhancementsMetric INTEGER DEFAULT 0,
                qaNotesData TEXT DEFAULT '[]',
                qaNoteFieldsData TEXT DEFAULT '[]',
                automationPassedTestCases INTEGER DEFAULT 0,
                automationFailedTestCases INTEGER DEFAULT 0,
                automationSkippedTestCases INTEGER DEFAULT 0,
                automationTotalTestCases INTEGER DEFAULT 0,
                automationPassedPercentage FLOAT DEFAULT 0.0,
                automationFailedPercentage FLOAT DEFAULT 0.0,
                automationSkippedPercentage FLOAT DEFAULT 0.0,
                automationStableTests INTEGER DEFAULT 0,
                automationFlakyTests INTEGER DEFAULT 0,
                automationStabilityTotal INTEGER DEFAULT 0,
                automationStablePercentage FLOAT DEFAULT 0.0,
                automationFlakyPercentage FLOAT DEFAULT 0.0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                reportType VARCHAR(20) NOT NULL DEFAULT 'sprint',
                environment VARCHAR(100),
                userLoad VARCHAR(100),
                responseTime VARCHAR(100),
                requestVolume VARCHAR(100),
                errorRate VARCHAR(100),
                slowestResponse VARCHAR(100),
                fastestResponse VARCHAR(100),
                numberOfUsers VARCHAR(100),
                executionDuration VARCHAR(100),
                maxThroughput VARCHAR(100),
                httpFailures VARCHAR(100),
                avgResponseTime VARCHAR(100),
                responseTime95Percent VARCHAR(100),
                performanceCriteriaResults TEXT DEFAULT '[]',
                performanceScenarios TEXT DEFAULT '[]',
                httpRequestsOverview TEXT DEFAULT '[]',
                coveredServices TEXT,
                coveredModules TEXT,
                bugsData TEXT DEFAULT '[]',
                testType VARCHAR(100),
                testTool VARCHAR(100),
                testObjective TEXT,
                testScope TEXT
            )
        ''')
        print("✓ Created new table with correct schema")
        
        # Step 2: Copy data from old table to new table
        cursor.execute('''
            INSERT INTO report_new SELECT * FROM report
        ''')
        print("✓ Copied existing data to new table")
        
        # Step 3: Drop old table
        cursor.execute('DROP TABLE report')
        print("✓ Dropped old table")
        
        # Step 4: Rename new table
        cursor.execute('ALTER TABLE report_new RENAME TO report')
        print("✓ Renamed new table to 'report'")
        
        # Commit the changes
        conn.commit()
        print("✓ Migration completed successfully")
        
        # Verify the schema
        cursor.execute("PRAGMA table_info(report)")
        columns = cursor.fetchall()
        sprint_col = next((col for col in columns if col[1] == 'sprintNumber'), None)
        
        if sprint_col and sprint_col[3] == 0:  # 0 means nullable = True
            print("✓ sprintNumber is now nullable")
        else:
            print("❌ Migration may have failed - sprintNumber constraint not updated")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
        raise
    
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()