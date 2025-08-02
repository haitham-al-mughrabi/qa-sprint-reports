# Sprint Reports System - Authentication Guide

## Overview
The Sprint Reports System now includes a complete authentication and authorization system with user management capabilities.

## Features Added

### 1. User Authentication
- **Login System**: Secure login with email and password
- **Registration System**: New users can register with approval workflow
- **Password Encryption**: All passwords are encrypted using bcrypt
- **Session Management**: Secure session handling with Flask-Login

### 2. User Roles
- **User Role**: Can access all reporting features
- **Admin Role**: Can access all features plus user management

### 3. Account Approval System
- New registrations require admin approval
- Users cannot login until their account is approved
- Admins can approve/reject user accounts

### 4. User Management (Admin Only)
- View all users in the system
- Approve pending user accounts
- Toggle user roles between 'user' and 'admin'
- Delete user accounts
- View detailed user information

## Default Admin Account
When you first run the application, a default admin account is created:
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: admin
- **Status**: approved

**⚠️ IMPORTANT**: Change this password immediately after first login!

## New Pages

### Authentication Pages
- `/login` - User login page
- `/register` - User registration page

### Admin Pages
- `/user-management` - User management dashboard (admin only)
- `/user-details/<id>` - Individual user details (admin only)

## Navigation Updates
All existing pages now include:
- User information display in navigation
- Logout button
- User Management link (for admins only)

## Database Schema
New `User` table with the following fields:
- `id` - Primary key
- `first_name` - User's first name
- `last_name` - User's last name
- `email` - Unique email address
- `password_hash` - Encrypted password
- `role` - User role ('user' or 'admin')
- `is_approved` - Account approval status
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

## Security Features
- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- CSRF protection on forms
- Secure password validation

## API Endpoints
New authentication API endpoints:
- `POST /api/users/<id>/approve` - Approve user account
- `POST /api/users/<id>/toggle-role` - Toggle user role
- `DELETE /api/users/<id>` - Delete user account

## Usage Instructions

### For New Users
1. Visit `/register` to create an account
2. Fill in your details (first name, last name, email, password)
3. Wait for admin approval
4. Once approved, login at `/login`

### For Admins
1. Login with admin credentials
2. Access "User Management" from the navigation
3. Approve pending users
4. Manage user roles and accounts

### For Existing Systems
- All existing functionality remains unchanged
- All pages now require authentication
- Users must login to access any features

## Installation Requirements
The following new dependencies are required:
- flask-login>=0.6.3
- flask-wtf>=1.2.1
- wtforms>=3.1.2
- bcrypt>=4.1.3

Install with:
```bash
pip install flask-login flask-wtf wtforms bcrypt
```

## Configuration
Update your `pyproject.toml` dependencies section to include the new packages.

## Security Considerations
1. Change the default admin password immediately
2. Use a strong SECRET_KEY in production
3. Consider implementing password complexity requirements
4. Regular security audits recommended
5. Monitor user access logs

## Troubleshooting
- If you forget the admin password, you can reset it by running the app with database recreation
- Check browser console for any JavaScript errors on auth pages
- Ensure all required dependencies are installed
- Verify database permissions for user table creation