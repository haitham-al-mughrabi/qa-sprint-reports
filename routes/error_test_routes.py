"""
Error testing routes - for development/testing purposes only
"""
from flask import Blueprint, abort, render_template

error_test_bp = Blueprint('error_test', __name__)

@error_test_bp.route('/test-404')
def test_404():
    """Test 404 error page"""
    abort(404)

@error_test_bp.route('/test-500')
def test_500():
    """Test 500 error page"""
    # Intentionally cause a server error
    raise Exception("This is a test server error")

@error_test_bp.route('/test-403')
def test_403():
    """Test 403 error page"""
    abort(403)

@error_test_bp.route('/test-401')
def test_401():
    """Test 401 error page"""
    abort(401)

@error_test_bp.route('/test-generic/<int:code>')
def test_generic(code):
    """Test generic error page with custom code"""
    abort(code)

@error_test_bp.route('/error-test')
def error_test_page():
    """Error testing page"""
    return render_template('errors/error-test.html')