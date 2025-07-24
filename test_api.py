#!/usr/bin/env python3
"""
Test script to verify the updated API functionality
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def test_portfolio_creation():
    """Test portfolio creation"""
    print("Testing portfolio creation...")
    data = {
        "name": "Test Portfolio",
        "description": "A test portfolio for validation"
    }
    response = requests.post(f"{BASE_URL}/api/portfolios", json=data)
    print(f"Portfolio creation status: {response.status_code}")
    if response.status_code == 200:
        portfolio = response.json()
        print(f"Created portfolio: {portfolio}")
        return portfolio['id']
    return None

def test_project_creation(portfolio_id=None):
    """Test project creation with and without portfolio"""
    print("Testing project creation...")
    
    # Project with portfolio
    if portfolio_id:
        data = {
            "name": "Test Project with Portfolio",
            "description": "A test project linked to portfolio",
            "portfolio_id": portfolio_id
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=data)
        print(f"Project with portfolio creation status: {response.status_code}")
        if response.status_code == 201:
            project = response.json()
            print(f"Created project with portfolio: {project}")
    
    # Project without portfolio
    data = {
        "name": "Test Project without Portfolio", 
        "description": "A test project without portfolio"
    }
    response = requests.post(f"{BASE_URL}/api/projects", json=data)
    print(f"Project without portfolio creation status: {response.status_code}")
    if response.status_code == 201:
        project = response.json()
        print(f"Created project without portfolio: {project}")
        return project['id']
    return None

def test_tester_creation():
    """Test tester creation"""
    print("Testing tester creation...")
    data = {
        "name": "Test Tester",
        "email": "test.tester@example.com"
    }
    response = requests.post(f"{BASE_URL}/api/testers", json=data)
    print(f"Tester creation status: {response.status_code}")
    if response.status_code == 201:
        tester = response.json()
        print(f"Created tester: {tester}")
        return tester['id']
    return None

def test_tester_project_assignment(tester_id, project_id):
    """Test assigning testers to projects"""
    print("Testing tester-project assignment...")
    data = {
        "project_ids": [project_id]
    }
    response = requests.post(f"{BASE_URL}/api/testers/{tester_id}/projects", json=data)
    print(f"Tester-project assignment status: {response.status_code}")
    if response.status_code == 200:
        print("Successfully assigned tester to project")

def test_report_creation_with_qa_notes(portfolio_name, project_name):
    """Test report creation with multiple QA notes"""
    print("Testing report creation with QA notes...")
    
    qa_notes_data = [
        {"note": "First QA note - UI testing completed"},
        {"note": "Second QA note - Performance tests need attention"},
        {"note": "Third QA note - Security validation passed"}
    ]
    
    data = {
        "portfolioName": portfolio_name,
        "projectName": project_name,
        "sprintNumber": 1,
        "cycleNumber": 1,
        "releaseNumber": "1.0",
        "reportVersion": "1.0",
        "reportDate": "24-07-2025",
        "testSummary": "Test summary",
        "testingStatus": "passed",
        "qaNotesText": "General QA notes text",
        "qaNotesData": qa_notes_data,
        "testerData": [{"name": "Test Tester", "email": "test.tester@example.com"}],
        "teamMemberData": []
    }
    
    response = requests.post(f"{BASE_URL}/api/reports", json=data)
    print(f"Report creation status: {response.status_code}")
    if response.status_code == 201:
        report = response.json()
        print(f"Created report with QA notes: {len(report.get('qaNotesData', []))} notes")
        return report['id']
    else:
        print(f"Error: {response.text}")
    return None

def test_latest_project_data(portfolio_name, project_name):
    """Test retrieving latest project data"""
    print("Testing latest project data retrieval...")
    response = requests.get(f"{BASE_URL}/api/projects/{portfolio_name}/{project_name}/latest-data")
    print(f"Latest project data status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Latest data has data: {data.get('hasData')}")
        if data.get('hasData'):
            latest = data.get('latestData', {})
            suggested = data.get('suggestedValues', {})
            print(f"Latest sprint: {latest.get('sprintNumber')}, Suggested next: {suggested.get('sprintNumber')}")
            print(f"Latest release: {latest.get('releaseNumber')}")

def main():
    """Run all tests"""
    print("Starting API functionality tests...")
    
    # Test portfolio creation
    portfolio_id = test_portfolio_creation()
    time.sleep(0.5)
    
    # Test project creation
    project_id = test_project_creation(portfolio_id)
    time.sleep(0.5)
    
    # Test tester creation
    tester_id = test_tester_creation()
    time.sleep(0.5)
    
    # Test tester-project assignment
    if tester_id and project_id:
        test_tester_project_assignment(tester_id, project_id)
        time.sleep(0.5)
    
    # Test report creation with QA notes
    report_id = test_report_creation_with_qa_notes("Test Portfolio", "Test Project without Portfolio")
    time.sleep(0.5)
    
    # Test latest project data
    test_latest_project_data("Test Portfolio", "Test Project without Portfolio")
    
    print("All tests completed!")

if __name__ == "__main__":
    main()