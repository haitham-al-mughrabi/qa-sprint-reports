#!/usr/bin/env python3
"""
Test script for the authentication system
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_login_page():
    """Test that login page loads"""
    try:
        response = requests.get(f"{BASE_URL}/login")
        print(f"Login page status: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error accessing login page: {e}")
        return False

def test_dashboard_redirect():
    """Test that dashboard redirects to login when not authenticated"""
    try:
        response = requests.get(f"{BASE_URL}/dashboard", allow_redirects=False)
        print(f"Dashboard redirect status: {response.status_code}")
        return response.status_code == 302
    except Exception as e:
        print(f"Error testing dashboard redirect: {e}")
        return False

def test_admin_login():
    """Test login with default admin credentials"""
    try:
        # First get the login page to establish session
        session = requests.Session()
        login_page = session.get(f"{BASE_URL}/login")
        
        # Attempt login
        login_data = {
            "identifier": "admin@example.com",
            "password": "Admin123!"
        }
        
        response = session.post(
            f"{BASE_URL}/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Admin login status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Login result: {result}")
            return result.get('success', False)
        return False
    except Exception as e:
        print(f"Error testing admin login: {e}")
        return False

def main():
    print("Testing Authentication System")
    print("=" * 40)
    
    # Start the Flask app in background
    import subprocess
    import time
    import os
    
    # Start Flask app
    print("Starting Flask application...")
    process = subprocess.Popen(
        ["python", "app.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for app to start
    time.sleep(3)
    
    try:
        # Run tests
        tests = [
            ("Login page loads", test_login_page),
            ("Dashboard redirects to login", test_dashboard_redirect),
            ("Admin login works", test_admin_login),
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"\nTesting: {test_name}")
            result = test_func()
            results.append((test_name, result))
            print(f"Result: {'PASS' if result else 'FAIL'}")
        
        # Summary
        print("\n" + "=" * 40)
        print("Test Summary:")
        passed = sum(1 for _, result in results if result)
        total = len(results)
        print(f"Passed: {passed}/{total}")
        
        for test_name, result in results:
            status = "PASS" if result else "FAIL"
            print(f"  {test_name}: {status}")
            
    finally:
        # Clean up
        print("\nStopping Flask application...")
        process.terminate()
        process.wait()

if __name__ == "__main__":
    main()