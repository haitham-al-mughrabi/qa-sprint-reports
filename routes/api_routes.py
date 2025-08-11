"""
API routes for data management (portfolios, projects, testers, team members)
"""
from flask import Blueprint, request, jsonify
from models import db, Portfolio, Project, Tester, TeamMember
from auth import login_required, approved_user_required

api_bp = Blueprint('api_routes', __name__)


# Portfolio API Routes
@api_bp.route('/api/portfolios', methods=['GET', 'POST'])
@login_required
@approved_user_required
def manage_portfolios():
    if request.method == 'GET':
        portfolios = Portfolio.query.all()
        return jsonify([{'id': p.id, 'name': p.name, 'description': p.description} for p in portfolios])

    elif request.method == 'POST':
        try:
            data = request.get_json()
            if not data or not data.get('name'):
                return jsonify({'error': 'Portfolio name is required'}), 400

            portfolio = Portfolio(name=data['name'], description=data.get('description', ''))
            db.session.add(portfolio)
            db.session.commit()
            return jsonify({'id': portfolio.id, 'name': portfolio.name, 'description': portfolio.description}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


@api_bp.route('/api/portfolios/<int:portfolio_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
@approved_user_required
def manage_portfolio(portfolio_id):
    portfolio = Portfolio.query.get_or_404(portfolio_id)

    if request.method == 'GET':
        return jsonify({
            'id': portfolio.id,
            'name': portfolio.name,
            'description': portfolio.description,
            'createdAt': portfolio.createdAt.isoformat() if portfolio.createdAt else None,
            'projects_count': len(portfolio.projects)
        })

    elif request.method == 'PUT':
        data = request.get_json()

        # Check if name is being changed and if new name already exists
        if data.get('name') != portfolio.name:
            existing_portfolio = Portfolio.query.filter_by(name=data['name']).first()
            if existing_portfolio:
                return jsonify({'error': 'Portfolio with this name already exists'}), 400

        portfolio.name = data.get('name', portfolio.name)
        portfolio.description = data.get('description', portfolio.description)
        db.session.commit()
        return jsonify({
            'id': portfolio.id,
            'name': portfolio.name,
            'description': portfolio.description
        })

    elif request.method == 'DELETE':
        # Check if portfolio has projects
        if portfolio.projects:
            return jsonify({'error': 'Cannot delete portfolio with existing projects'}), 400

        db.session.delete(portfolio)
        db.session.commit()
        return jsonify({'message': 'Portfolio deleted successfully'}), 200


@api_bp.route('/api/portfolios/<int:portfolio_id>/projects', methods=['GET'])
@login_required
@approved_user_required
def get_portfolio_projects(portfolio_id):
    """Get all projects for a specific portfolio"""
    projects = Project.query.filter_by(portfolio_id=portfolio_id).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description
    } for p in projects])


# Projects API Routes
@api_bp.route('/api/projects', methods=['GET', 'POST'])
@login_required
@approved_user_required
def manage_projects():
    if request.method == 'GET':
        projects = Project.query.all()
        return jsonify([{
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'portfolio_id': p.portfolio_id,
            'portfolio_name': p.portfolio.name if p.portfolio else None
        } for p in projects])

    elif request.method == 'POST':
        try:
            data = request.get_json()
            if not data or not data.get('name'):
                return jsonify({'error': 'Project name is required'}), 400

            project = Project(
                name=data['name'],
                description=data.get('description', ''),
                portfolio_id=data.get('portfolio_id') if data.get('portfolio_id') else None
            )
            db.session.add(project)
            db.session.commit()
            return jsonify({
                'id': project.id,
                'name': project.name,
                'description': project.description,
                'portfolio_id': project.portfolio_id,
                'portfolio_name': project.portfolio.name if project.portfolio else None
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


@api_bp.route('/api/projects/<int:project_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
@approved_user_required
def manage_project(project_id):
    project = Project.query.get_or_404(project_id)

    if request.method == 'GET':
        return jsonify({
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'portfolio_id': project.portfolio_id,
            'portfolio_name': project.portfolio.name if project.portfolio else None
        })

    elif request.method == 'PUT':
        data = request.get_json()
        project.name = data.get('name', project.name)
        project.description = data.get('description', project.description)
        project.portfolio_id = data.get('portfolio_id', project.portfolio_id)
        db.session.commit()
        return jsonify({'id': project.id, 'name': project.name})

    elif request.method == 'DELETE':
        db.session.delete(project)
        db.session.commit()
        return jsonify({'message': 'Project deleted successfully'}), 200


@api_bp.route('/api/projects/without-portfolio', methods=['GET'])
@login_required
@approved_user_required
def get_projects_without_portfolio():
    """Get all projects that are not linked to any portfolio"""
    projects = Project.query.filter_by(portfolio_id=None).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description
    } for p in projects])


@api_bp.route('/api/projects/by-portfolio/<int:portfolio_id>', methods=['GET'])
@login_required
@approved_user_required
def get_projects_by_portfolio(portfolio_id):
    """Get all projects for a specific portfolio (alternative endpoint for frontend compatibility)"""
    projects = Project.query.filter_by(portfolio_id=portfolio_id).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description
    } for p in projects])


# Testers API Routes
@api_bp.route('/api/testers', methods=['GET', 'POST'])
@login_required
@approved_user_required
def manage_testers():
    if request.method == 'GET':
        testers = Tester.query.all()
        return jsonify([{
            'id': t.id,
            'name': t.name,
            'email': t.email,
            'is_automation_engineer': t.is_automation_engineer,
            'is_manual_engineer': t.is_manual_engineer,
            'is_performance_tester': t.is_performance_tester,
            'is_security_tester': t.is_security_tester,
            'is_api_tester': t.is_api_tester,
            'is_mobile_tester': t.is_mobile_tester,
            'is_web_tester': t.is_web_tester,
            'is_accessibility_tester': t.is_accessibility_tester,
            'is_usability_tester': t.is_usability_tester,
            'is_test_lead': t.is_test_lead,
            'role_types': t.role_types,
            'role_display': t.role_display,
            'project_ids': [p.id for p in t.projects],
            'createdAt': t.createdAt.isoformat() if t.createdAt else None
        } for t in testers])

    elif request.method == 'POST':
        data = request.get_json()

        if not data or not data.get('name') or not data.get('email'):
            return jsonify({'error': 'Name and email are required'}), 400

        # Check if email already exists
        existing_tester = Tester.query.filter_by(email=data['email']).first()
        if existing_tester:
            return jsonify({'error': 'Tester with this email already exists'}), 400

        tester = Tester(
            name=data['name'],
            email=data['email'],
            is_automation_engineer=data.get('is_automation_engineer', False),
            is_manual_engineer=data.get('is_manual_engineer', False),
            is_performance_tester=data.get('is_performance_tester', False),
            is_security_tester=data.get('is_security_tester', False),
            is_api_tester=data.get('is_api_tester', False),
            is_mobile_tester=data.get('is_mobile_tester', False),
            is_web_tester=data.get('is_web_tester', False),
            is_accessibility_tester=data.get('is_accessibility_tester', False),
            is_usability_tester=data.get('is_usability_tester', False),
            is_test_lead=data.get('is_test_lead', False)
        )

        # Handle project assignments
        project_ids = data.get('project_ids', [])
        if project_ids:
            projects = Project.query.filter(Project.id.in_(project_ids)).all()
            tester.projects = projects

        db.session.add(tester)
        db.session.commit()

        return jsonify({
            'id': tester.id,
            'name': tester.name,
            'email': tester.email,
            'is_automation_engineer': tester.is_automation_engineer,
            'is_manual_engineer': tester.is_manual_engineer,
            'is_performance_tester': tester.is_performance_tester,
            'is_security_tester': tester.is_security_tester,
            'is_api_tester': tester.is_api_tester,
            'is_mobile_tester': tester.is_mobile_tester,
            'is_web_tester': tester.is_web_tester,
            'is_accessibility_tester': tester.is_accessibility_tester,
            'is_usability_tester': tester.is_usability_tester,
            'is_test_lead': tester.is_test_lead,
            'role_types': tester.role_types,
            'role_display': tester.role_display,
            'project_ids': [p.id for p in tester.projects]
        }), 201


@api_bp.route('/api/testers/<int:tester_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
@approved_user_required
def manage_tester(tester_id):
    tester = Tester.query.get_or_404(tester_id)

    if request.method == 'GET':
        return jsonify({
            'id': tester.id,
            'name': tester.name,
            'email': tester.email,
            'is_automation_engineer': tester.is_automation_engineer,
            'is_manual_engineer': tester.is_manual_engineer,
            'is_performance_tester': tester.is_performance_tester,
            'is_security_tester': tester.is_security_tester,
            'is_api_tester': tester.is_api_tester,
            'is_mobile_tester': tester.is_mobile_tester,
            'is_web_tester': tester.is_web_tester,
            'is_accessibility_tester': tester.is_accessibility_tester,
            'is_usability_tester': tester.is_usability_tester,
            'is_test_lead': tester.is_test_lead,
            'role_types': tester.role_types,
            'role_display': tester.role_display,
            'project_ids': [p.id for p in tester.projects],
            'createdAt': tester.createdAt.isoformat() if tester.createdAt else None
        })

    elif request.method == 'PUT':
        try:
            data = request.get_json()

            # Check if email is being changed and if new email already exists
            if data.get('email') != tester.email:
                existing_tester = Tester.query.filter_by(email=data['email']).first()
                if existing_tester:
                    return jsonify({'error': 'Tester with this email already exists'}), 400

            # Update basic fields
            tester.name = data.get('name', tester.name)
            tester.email = data.get('email', tester.email)

            # Update all role fields
            tester.is_automation_engineer = data.get('is_automation_engineer', tester.is_automation_engineer)
            tester.is_manual_engineer = data.get('is_manual_engineer', tester.is_manual_engineer)
            tester.is_performance_tester = data.get('is_performance_tester', tester.is_performance_tester)
            tester.is_security_tester = data.get('is_security_tester', tester.is_security_tester)
            tester.is_api_tester = data.get('is_api_tester', tester.is_api_tester)
            tester.is_mobile_tester = data.get('is_mobile_tester', tester.is_mobile_tester)
            tester.is_web_tester = data.get('is_web_tester', tester.is_web_tester)
            tester.is_accessibility_tester = data.get('is_accessibility_tester', tester.is_accessibility_tester)
            tester.is_usability_tester = data.get('is_usability_tester', tester.is_usability_tester)
            tester.is_test_lead = data.get('is_test_lead', tester.is_test_lead)

            # Update project assignments
            project_ids = data.get('project_ids', [])
            if project_ids is not None:
                projects = Project.query.filter(Project.id.in_(project_ids)).all()
                tester.projects = projects

            db.session.commit()

            return jsonify({
                'id': tester.id,
                'name': tester.name,
                'email': tester.email,
                'is_automation_engineer': tester.is_automation_engineer,
                'is_manual_engineer': tester.is_manual_engineer,
                'is_performance_tester': tester.is_performance_tester,
                'is_security_tester': tester.is_security_tester,
                'is_api_tester': tester.is_api_tester,
                'is_mobile_tester': tester.is_mobile_tester,
                'is_web_tester': tester.is_web_tester,
                'is_accessibility_tester': tester.is_accessibility_tester,
                'is_usability_tester': tester.is_usability_tester,
                'is_test_lead': tester.is_test_lead,
                'role_types': tester.role_types,
                'role_display': tester.role_display,
                'project_ids': [p.id for p in tester.projects]
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    elif request.method == 'DELETE':
        db.session.delete(tester)
        db.session.commit()
        return jsonify({'message': 'Tester deleted successfully'}), 200


@api_bp.route('/api/testers/<int:tester_id>/projects', methods=['GET', 'POST'])
@login_required
@approved_user_required
def manage_tester_projects(tester_id):
    tester = Tester.query.get_or_404(tester_id)

    if request.method == 'GET':
        return jsonify([{
            'id': p.id,
            'name': p.name,
            'portfolio_id': p.portfolio_id,
            'portfolio_name': p.portfolio.name if p.portfolio else None
        } for p in tester.projects])

    elif request.method == 'POST':
        data = request.get_json()
        project_ids = data.get('project_ids', [])

        # Clear existing relationships
        tester.projects.clear()

        # Add new relationships
        for project_id in project_ids:
            project = Project.query.get(project_id)
            if project:
                tester.projects.append(project)

        db.session.commit()
        return jsonify({'message': 'Tester projects updated successfully'}), 200


@api_bp.route('/api/projects/<int:project_id>/testers', methods=['GET'])
@login_required
@approved_user_required
def get_project_testers(project_id):
    """Get all testers assigned to a specific project"""
    project = Project.query.get_or_404(project_id)
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'email': t.email,
        'is_automation_engineer': t.is_automation_engineer,
        'is_manual_engineer': t.is_manual_engineer,
        'role_types': t.role_types,
        'role_display': t.role_display
    } for t in project.testers])


# Team Members API Routes
@api_bp.route('/api/team-members', methods=['GET', 'POST'])
@login_required
@approved_user_required
def manage_team_members():
    if request.method == 'GET':
        team_members = TeamMember.query.all()
        return jsonify([{
            'id': tm.id,
            'name': tm.name,
            'email': tm.email,
            'role': tm.role,
            'createdAt': tm.createdAt.isoformat() if tm.createdAt else None
        } for tm in team_members])

    elif request.method == 'POST':
        data = request.get_json()

        # Validate role
        if data['role'] not in TeamMember.VALID_ROLES:
            return jsonify({'error': f'Invalid role: {data["role"]}'}), 400

        # Check if email already exists
        existing_member = TeamMember.query.filter_by(email=data['email']).first()
        if existing_member:
            return jsonify({'error': 'Team member with this email already exists'}), 400

        team_member = TeamMember(
            name=data['name'],
            email=data['email'],
            role=data['role']
        )
        db.session.add(team_member)
        db.session.commit()
        return jsonify({
            'id': team_member.id,
            'name': team_member.name,
            'email': team_member.email,
            'role': team_member.role
        }), 201


@api_bp.route('/api/team-members/<int:member_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
@approved_user_required
def manage_team_member(member_id):
    team_member = TeamMember.query.get_or_404(member_id)

    if request.method == 'GET':
        return jsonify({
            'id': team_member.id,
            'name': team_member.name,
            'email': team_member.email,
            'role': team_member.role,
            'createdAt': team_member.createdAt.isoformat() if team_member.createdAt else None
        })

    elif request.method == 'PUT':
        data = request.get_json()

        # Check if email is being changed and if new email already exists
        if data.get('email') != team_member.email:
            existing_member = TeamMember.query.filter_by(email=data['email']).first()
            if existing_member:
                return jsonify({'error': 'Team member with this email already exists'}), 400

        team_member.name = data.get('name', team_member.name)
        team_member.email = data.get('email', team_member.email)
        team_member.role = data.get('role', team_member.role)
        db.session.commit()
        return jsonify({
            'id': team_member.id,
            'name': team_member.name,
            'email': team_member.email,
            'role': team_member.role
        })

    elif request.method == 'DELETE':
        db.session.delete(team_member)
        db.session.commit()
        return jsonify({'message': 'Team member deleted successfully'}), 200


@api_bp.route('/api/team-members/by-role/<role>', methods=['GET'])
@login_required
@approved_user_required
def get_team_members_by_role(role):
    """Get team members filtered by role"""
    team_members = TeamMember.query.filter_by(role=role).all()
    return jsonify([{
        'id': tm.id,
        'name': tm.name,
        'email': tm.email,
        'role': tm.role
    } for tm in team_members])


# Utility route to get all data for dropdowns
@api_bp.route('/api/form-data', methods=['GET'])
@login_required
@approved_user_required
def get_form_data():
    """Get all data needed for form dropdowns"""
    portfolios = Portfolio.query.all()
    projects = Project.query.all()
    testers = Tester.query.all()
    team_members = TeamMember.query.all()

    return jsonify({
        'portfolios': [{'id': p.id, 'name': p.name, 'description': p.description} for p in portfolios],
        'projects': [{'id': p.id, 'name': p.name, 'description': p.description, 'portfolio_id': p.portfolio_id} for p in projects],
        'testers': [{'id': t.id, 'name': t.name, 'email': t.email, 'is_automation_engineer': t.is_automation_engineer, 'is_manual_engineer': t.is_manual_engineer, 'role_types': t.role_types, 'role_display': t.role_display} for t in testers],
        'team_members': [{'id': tm.id, 'name': tm.name, 'email': tm.email, 'role': tm.role} for tm in team_members]
    })