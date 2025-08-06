# Design Document

## Overview

This design transforms the existing single-report QA system into a multi-report type system supporting four distinct report types: Sprint Report, Manual Report, Automation Report, and Performance Report. The design maintains backward compatibility while introducing new data structures and UI components for each report type.

## Architecture

### Database Schema Changes

The current `Report` model will be extended with:
- `report_type` field (ENUM: 'sprint', 'manual', 'automation', 'performance')
- New fields specific to Performance Reports
- Conditional field validation based on report type

### Report Type Structure

#### Sprint Report (Existing)
- Maintains all current sections and functionality
- Serves as the baseline for other report types
- All existing fields remain unchanged

#### Manual Report
- Inherits most Sprint Report sections
- Excludes: Automation Regression section
- Includes: All other sections (General Details, Test Summary, Additional Info, User Stories, Test Cases, Issues Analysis, Enhancements, QA Notes)

#### Automation Report
- Focused structure for automation testing
- Includes: General Details, Test Summary & Status, Additional Information, Regression Test Results (renamed from Automation Regression), QA Automation Notes (renamed from QA Notes)
- New sections: Covered Services and Modules, Bugs
- Excludes: User Stories, Test Cases, Issues Analysis, Enhancements

#### Performance Report
- Completely different structure focused on performance metrics
- Custom General Details with performance-specific fields
- Test Summary with two subsections for different metrics
- Performance Test Scenarios (dynamic list)
- HTTP Requests Status Overview (tabular data)

## Components and Interfaces

### Frontend Components

#### Report Type Selection
- New page: `reports_type.html` (already exists)
- Four card-based options for report type selection
- Navigation to create report with type parameter

#### Dynamic Form Rendering
- Enhanced `create_report.html` with conditional section rendering
- JavaScript-based section visibility control based on report type
- Dynamic form validation per report type

#### Report Viewing
- Enhanced `view_report.html` with conditional section display
- Type-specific rendering logic
- Conditional chart and table generation

### Backend API Changes

#### Report Model Extensions
```python
# New fields to add to Report model
report_type = db.Column(db.String(20), default='sprint', nullable=False)

# Performance Report specific fields
user_load = db.Column(db.String(100))
response_time = db.Column(db.String(100))
request_volume = db.Column(db.String(100))
error_rate = db.Column(db.String(100))
slowest_response = db.Column(db.String(100))
fastest_response = db.Column(db.String(100))
number_of_users = db.Column(db.String(100))
execution_duration = db.Column(db.String(100))
max_throughput = db.Column(db.String(100))
http_failures = db.Column(db.String(100))
avg_response_time = db.Column(db.String(100))
response_time_95_percent = db.Column(db.String(100))

# JSON fields for complex data
performance_criteria_results = db.Column(db.Text, default='[]')  # Table data
performance_scenarios = db.Column(db.Text, default='[]')  # Scenarios list
http_requests_overview = db.Column(db.Text, default='[]')  # HTTP requests table

# Automation Report specific fields
covered_services = db.Column(db.Text)  # Text area for services
covered_modules = db.Column(db.Text)   # Text area for modules
bugs_data = db.Column(db.Text, default='[]')  # JSON array for bugs (similar to QA notes)
```

#### API Endpoint Modifications
- Enhanced `/api/reports` POST endpoint with type-specific validation
- Modified report retrieval to include type information
- Type-specific field serialization in `to_dict()` method

## Data Models

### Report Type Enum
```python
REPORT_TYPES = {
    'sprint': 'Sprint Report',
    'manual': 'Manual Report', 
    'automation': 'Automation Report',
    'performance': 'Performance Report'
}
```

### Performance Report Data Structures

#### Performance Criteria Results Table
```json
[
  {
    "criteria": "Number of users",
    "result": "100"
  },
  {
    "criteria": "Total number of requests", 
    "result": "10000"
  }
]
```

#### Performance Test Scenarios
```json
[
  {
    "scenario_name": "Login Load Test",
    "users": "50",
    "steps": "1. Navigate to login\n2. Enter credentials\n3. Submit form"
  }
]
```

#### HTTP Requests Overview
```json
[
  {
    "request_endpoint": "/api/login",
    "status": "200",
    "count": "1500", 
    "avg_time": "250ms"
  }
]
```

### Automation Report Data Structures

#### Covered Services and Modules
- `covered_services`: Plain text field
- `covered_modules`: Plain text field

#### Bugs Data
```json
[
  {
    "id": "bug_1",
    "title": "Bug Title",
    "description": "Bug description",
    "severity": "High",
    "status": "Open"
  }
]
```

## Error Handling

### Validation Rules
- Report type validation on creation/update
- Conditional field validation based on report type
- Required field validation per report type
- Data type validation for performance metrics

### Error Responses
- Type-specific validation error messages
- Clear indication of missing required fields per report type
- Graceful handling of invalid report type requests

## Testing Strategy

### Unit Tests
- Report model validation for each report type
- API endpoint testing with different report types
- Data serialization/deserialization testing

### Integration Tests
- End-to-end report creation flow for each type
- Report viewing functionality for each type
- Database migration testing for new fields

### Frontend Tests
- Form rendering for each report type
- Section visibility logic testing
- Dynamic field validation testing

## Migration Strategy

### Database Migration
1. Add new fields to Report table
2. Set default report_type='sprint' for existing reports
3. Add indexes for report_type field for performance

### Backward Compatibility
- All existing reports automatically become Sprint Reports
- Existing API endpoints remain functional
- Current frontend continues to work with Sprint Reports

### Deployment Plan
1. Deploy database migrations
2. Deploy backend changes with feature flags
3. Deploy frontend changes
4. Enable new report types gradually

## UI/UX Design Considerations

### Report Type Selection
- Clear visual distinction between report types
- Descriptive cards with icons and brief descriptions
- Easy navigation back to selection from create form

### Form Sections
- Conditional rendering based on report type
- Consistent styling across all report types
- Clear section labeling and progress indication

### Performance Report Specific UI
- Dynamic table management for criteria results
- Scenario management with add/remove functionality
- HTTP requests table with sortable columns

### Automation Report Specific UI
- Text areas for services and modules
- Bug management similar to QA notes
- Renamed sections with appropriate icons

## Performance Considerations

### Database Optimization
- Indexes on report_type field
- Efficient queries with type filtering
- JSON field optimization for complex data

### Frontend Performance
- Lazy loading of type-specific components
- Efficient DOM manipulation for dynamic sections
- Caching of report type configurations

### API Performance
- Type-specific serialization to reduce payload size
- Efficient validation logic
- Proper HTTP status codes for type-related errors