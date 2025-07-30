# test_data_creation.py
"""
Script to create sample test data for the Enhanced QA Reports System
Run this script after setting up the database to populate with sample reports.
"""

import requests
import json
from datetime import datetime, timedelta
import random

# Configuration
BASE_URL = "http://localhost:5000"
API_URL = f"{BASE_URL}/api/reports"

# Sample data pools
PORTFOLIOS = [
    "web-platform", "mobile-app", "api-services", 
    "desktop-app", "data-analytics", "cloud-infrastructure"
]

PROJECTS = [
    "project-alpha", "project-beta", "project-gamma", 
    "project-delta", "project-epsilon", "project-zeta"
]

TESTING_STATUSES = [
    "passed", "passed-with-issues", "failed", 
    "blocked", "cancelled", "deferred", "not-testable"
]

TESTER_NAMES = [
    "Alice Johnson", "Bob Smith", "Carol Davis", 
    "David Wilson", "Eva Brown", "Frank Miller"
]

REQUEST_IDS = [
    "REQ-001", "REQ-002", "REQ-003", "REQ-004", "REQ-005"
]

ENVIRONMENTS = ["Development", "Staging", "UAT", "Production"]

def generate_random_date(days_back=30):
    """Generate a random date within the last 'days_back' days"""
    base_date = datetime.now() - timedelta(days=days_back)
    random_days = random.randint(0, days_back)
    date = base_date + timedelta(days=random_days)
    return date.strftime("%d-%m-%Y")

def generate_test_summary():
    """Generate realistic test summary text"""
    summaries = [
        "Comprehensive testing completed for current sprint functionality. All critical user journeys validated with automated and manual testing approaches.",
        "Sprint testing focused on API integration and user interface improvements. Performance testing conducted across multiple environments.",
        "End-to-end testing performed with emphasis on security validation and cross-browser compatibility. Database migration testing included.",
        "User acceptance testing completed with stakeholder feedback incorporated. Accessibility testing performed to ensure WCAG compliance.",
        "Integration testing for new features completed successfully. Load testing performed to validate system performance under peak conditions."
    ]
    return random.choice(summaries)


def generate_custom_fields():
    """Generate sample custom fields data"""
    custom_fields = {}
    
    # Add some sample custom fields
    if random.choice([True, False]):
        custom_fields["custom_client_feedback"] = random.choice([
            "Excellent user experience", "Good functionality with minor issues", 
            "Meets requirements", "Exceeds expectations"
        ])
    
    if random.choice([True, False]):
        custom_fields["custom_automation_coverage"] = f"{random.randint(60, 95)}%"
    
    if random.choice([True, False]):
        custom_fields["custom_risk_assessment"] = random.choice([
            "Low Risk", "Medium Risk", "High Risk"
        ])
    
    return custom_fields

def generate_sample_report():
    """Generate a complete sample report"""
    # Basic information
    portfolio = random.choice(PORTFOLIOS)
    project = random.choice(PROJECTS)
    sprint = random.randint(1, 20)
    
    # Generate realistic numbers that will auto-calculate
    user_stories_counts = {
        "passedUserStories": random.randint(5, 25),
        "passedWithIssuesUserStories": random.randint(0, 8),
        "failedUserStories": random.randint(0, 5),
        "blockedUserStories": random.randint(0, 3),
        "cancelledUserStories": random.randint(0, 2),
        "deferredUserStories": random.randint(0, 3),
        "notTestableUserStories": random.randint(0, 2)
    }
    
    test_cases_counts = {
        "passedTestCases": random.randint(20, 80),
        "passedWithIssuesTestCases": random.randint(0, 15),
        "failedTestCases": random.randint(0, 10),
        "blockedTestCases": random.randint(0, 5),
        "cancelledTestCases": random.randint(0, 3),
        "deferredTestCases": random.randint(0, 5),
        "notTestableTestCases": random.randint(0, 3)
    }
    
    issues_counts = {
        "criticalIssues": random.randint(0, 3),
        "highIssues": random.randint(0, 8),
        "mediumIssues": random.randint(0, 15),
        "lowIssues": random.randint(0, 20),
        "newIssues": random.randint(0, 10),
        "fixedIssues": random.randint(5, 25),
        "notFixedIssues": random.randint(0, 8),
        "reopenedIssues": random.randint(0, 3),
        "deferredIssues": random.randint(0, 5)
    }
    
    enhancements_counts = {
        "newEnhancements": random.randint(0, 8),
        "implementedEnhancements": random.randint(0, 12),
        "existsEnhancements": random.randint(0, 5)
    }
    
    # Generate dynamic data
    request_data = []
    for i in range(random.randint(1, 4)):
        request_data.append({
            "id": random.choice(REQUEST_IDS),
            "url": f"https://example.com/request/{random.randint(1000, 9999)}"
        })
    
    build_data = []
    for i in range(random.randint(1, 3)):
        build_data.append({
            "requestId": random.choice(REQUEST_IDS),
            "requestUrl": f"https://build.example.com/{random.randint(100, 999)}",
            "environment": random.choice(ENVIRONMENTS),
            "cycles": str(random.randint(1, 5))
        })
    
    tester_data = []
    for i in range(random.randint(1, 4)):
        tester_data.append({
            "name": random.choice(TESTER_NAMES)
        })
    
    report_data = {
        # Cover Information
        "portfolioName": portfolio,
        "projectName": project,
        "sprintNumber": sprint,
        "reportVersion": f"{random.randint(1, 3)}.{random.randint(0, 9)}",
        "cycleNumber": random.randint(1, 5),
        "reportDate": generate_random_date(),
        
        # Test Summary
        "testSummary": generate_test_summary(),
        "testingStatus": random.choice(TESTING_STATUSES),
        
        # Dynamic Data
        "requestData": request_data,
        "buildData": build_data,
        "testerData": tester_data,
        
        # User Stories (will auto-calculate total)
        **user_stories_counts,
        
        # Test Cases (will auto-calculate total)
        **test_cases_counts,
        
        # Issues (will auto-calculate total)
        **issues_counts,
        
        # Enhancements (will auto-calculate total)
        **enhancements_counts,
        
        # Other metrics
        "qaNotesMetric": random.randint(1, 10),
        "qaNotesData": [
            {"note": f"Sprint {sprint} testing activities completed successfully for {project}."},
            {"note": f"All stakeholders satisfied with the testing coverage and results."},
            {"note": f"Test environment was stable throughout the testing cycle."}
        ],
        
        # Custom Fields
        "customFields": generate_custom_fields()
    }
    
    return report_data

def create_test_reports(count=15):
    """Create multiple test reports"""
    print(f"Creating {count} sample reports...")
    
    created_reports = []
    
    for i in range(count):
        try:
            report_data = generate_sample_report()
            
            response = requests.post(
                API_URL,
                headers={"Content-Type": "application/json"},
                json=report_data
            )
            
            if response.status_code == 201:
                created_report = response.json()
                created_reports.append(created_report)
                print(f"✅ Created report {i+1}: {report_data['portfolioName']} - {report_data['projectName']} Sprint {report_data['sprintNumber']}")
            else:
                print(f"❌ Failed to create report {i+1}: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Error creating report {i+1}: {str(e)}")
    
    print(f"\n🎉 Successfully created {len(created_reports)} out of {count} reports!")
    return created_reports

def test_dashboard_api():
    """Test the dashboard API endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        if response.status_code == 200:
            stats = response.json()
            print("\n📊 Dashboard Statistics:")
            print(f"Total Reports: {stats['overall']['totalReports']}")
            print(f"Total User Stories: {stats['overall']['totalUserStories']}")
            print(f"Total Test Cases: {stats['overall']['totalTestCases']}")
            print(f"Total Issues: {stats['overall']['totalIssues']}")
            print(f"Total Enhancements: {stats['overall']['totalEnhancements']}")
            print(f"Average Evaluation Score: {stats['overall']['avgEvaluationScore']}")
            print(f"Projects Found: {len(stats['projects'])}")
            return True
        else:
            print(f"❌ Dashboard API failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Dashboard API error: {str(e)}")
        return False

def main():
    """Main function to run test data creation"""
    print("🚀 Enhanced QA Reports System - Test Data Creation")
    print("=" * 50)
    
    # Test if the server is running
    try:
        response = requests.get(f"{BASE_URL}/api/reports")
        print("✅ Server is running and accessible")
    except Exception as e:
        print(f"❌ Cannot connect to server at {BASE_URL}")
        print(f"Error: {str(e)}")
        print("Please make sure the Flask app is running with: python app.py")
        return
    
    # Create test reports
    reports = create_test_reports(15)
    
    # Test dashboard API
    if reports:
        test_dashboard_api()
    
    print("\n🎯 Test data creation completed!")
    print(f"You can now access the system at: {BASE_URL}")
    print("\nNext steps:")
    print("1. Open your browser and go to http://localhost:5000")
    print("2. Check the Dashboard for overall statistics")
    print("3. View the Reports page to see all created reports")
    print("4. Try creating a new report with custom fields")
    print("5. Test the export functionality (PDF/Excel)")

if __name__ == "__main__":
    main()