"""
Report model definition
"""
import json
from datetime import datetime
from . import db


class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Cover Information
    portfolioName = db.Column(db.String(100), nullable=False)
    projectName = db.Column(db.String(100), nullable=False)
    sprintNumber = db.Column(db.Integer, nullable=False)
    reportVersion = db.Column(db.String(50))
    reportName = db.Column(db.String(255))  # New field for custom report name
    reportType = db.Column(db.String(50), default='sprint')  # Report type: sprint, manual, automation
    cycleNumber = db.Column(db.Integer)
    releaseNumber = db.Column(db.String(50))  # Add missing releaseNumber field
    reportDate = db.Column(db.String(50))
    testEnvironment = db.Column(db.String(50))  # Add testEnvironment field

    # Test Summary
    testSummary = db.Column(db.Text)
    testingStatus = db.Column(db.String(50))

    # Dynamic data stored as JSON strings
    requestData = db.Column(db.Text, default='[]')
    buildData = db.Column(db.Text, default='[]')
    testerData = db.Column(db.Text, default='[]')
    teamMemberData = db.Column(db.Text, default='[]')  # New field for team member data

    # User Stories Data (detailed breakdown)
    totalUserStories = db.Column(db.Integer, default=0)
    passedUserStories = db.Column(db.Integer, default=0)
    passedWithIssuesUserStories = db.Column(db.Integer, default=0)
    failedUserStories = db.Column(db.Integer, default=0)
    blockedUserStories = db.Column(db.Integer, default=0)
    cancelledUserStories = db.Column(db.Integer, default=0)
    deferredUserStories = db.Column(db.Integer, default=0)
    notTestableUserStories = db.Column(db.Integer, default=0)

    # Test Cases Data (detailed breakdown)
    totalTestCases = db.Column(db.Integer, default=0)
    passedTestCases = db.Column(db.Integer, default=0)
    passedWithIssuesTestCases = db.Column(db.Integer, default=0)
    failedTestCases = db.Column(db.Integer, default=0)
    blockedTestCases = db.Column(db.Integer, default=0)
    cancelledTestCases = db.Column(db.Integer, default=0)
    deferredTestCases = db.Column(db.Integer, default=0)
    notTestableTestCases = db.Column(db.Integer, default=0)

    # Issues Data (detailed breakdown)
    totalIssues = db.Column(db.Integer, default=0)  # Total by priority
    totalIssuesByStatus = db.Column(db.Integer, default=0)  # Total by status
    criticalIssues = db.Column(db.Integer, default=0)
    highIssues = db.Column(db.Integer, default=0)
    mediumIssues = db.Column(db.Integer, default=0)
    lowIssues = db.Column(db.Integer, default=0)
    newIssues = db.Column(db.Integer, default=0)
    fixedIssues = db.Column(db.Integer, default=0)
    notFixedIssues = db.Column(db.Integer, default=0)
    reopenedIssues = db.Column(db.Integer, default=0)
    deferredIssues = db.Column(db.Integer, default=0)
    deferredOldBugsIssues = db.Column(db.Integer, default=0)  # New field for deferred (old bugs)
    
    # New totals for the two sub-sections
    totalIssuesOpenStatus = db.Column(db.Integer, default=0)  # Total for open issues (New, Re-opened, Deferred old bugs)
    totalIssuesResolutionStatus = db.Column(db.Integer, default=0)  # Total for resolution issues (Fixed, Not Fixed)

    # Enhancements Data (detailed breakdown)
    totalEnhancements = db.Column(db.Integer, default=0)
    newEnhancements = db.Column(db.Integer, default=0)
    implementedEnhancements = db.Column(db.Integer, default=0)
    existsEnhancements = db.Column(db.Integer, default=0)

    # Testing Metrics (calculated fields)
    userStoriesMetric = db.Column(db.Integer, default=0)  # Auto-calculated from user stories
    testCasesMetric = db.Column(db.Integer, default=0)   # Auto-calculated from test cases
    issuesMetric = db.Column(db.Integer, default=0)      # Auto-calculated from issues
    enhancementsMetric = db.Column(db.Integer, default=0)  # Auto-calculated from enhancements

    # QA Notes
    qaNotesData = db.Column(db.Text, default='[]')  # Store multiple QA notes as JSON array
    qaNoteFieldsData = db.Column(db.Text, default='[]')  # Store custom QA note fields as JSON array

    # Automation Report Specific Fields
    covered_services = db.Column(db.Text, default='[]')
    covered_modules = db.Column(db.Text, default='[]')
    bugs = db.Column(db.Text, default='[]')

    # Automation Regression Data
    # Section 1: Test Cases (auto-calculated from existing test cases)
    automationPassedTestCases = db.Column(db.Integer, default=0)
    automationFailedTestCases = db.Column(db.Integer, default=0)
    automationSkippedTestCases = db.Column(db.Integer, default=0)
    automationTotalTestCases = db.Column(db.Integer, default=0)  # Auto-calculated

    # Section 2: Percentages (auto-calculated from section 1)
    automationPassedPercentage = db.Column(db.Float, default=0.0)
    automationFailedPercentage = db.Column(db.Float, default=0.0)
    automationSkippedPercentage = db.Column(db.Float, default=0.0)

    # Section 3: Test Stability
    automationStableTests = db.Column(db.Integer, default=0)
    automationFlakyTests = db.Column(db.Integer, default=0)
    automationStabilityTotal = db.Column(db.Integer, default=0)  # Auto-calculated
    automationStablePercentage = db.Column(db.Float, default=0.0)
    automationFlakyPercentage = db.Column(db.Float, default=0.0)

    # Performance Report Specific Fields
    # Test Objective & Scope
    testObjective = db.Column(db.Text)
    testScope = db.Column(db.Text)
    
    # Test Details
    numberOfUsers = db.Column(db.Integer, default=0)
    executionDuration = db.Column(db.String(100))
    
    # Test Summary Table Data
    userLoad = db.Column(db.String(100))
    responseTime = db.Column(db.String(100))
    requestVolume = db.Column(db.String(100))
    errorRate = db.Column(db.String(100))
    slowest = db.Column(db.String(100))
    fastest = db.Column(db.String(100))
    
    # Test Criteria
    totalRequests = db.Column(db.Integer, default=0)
    failedRequests = db.Column(db.Integer, default=0)
    failureRate = db.Column(db.Float, default=0.0)  # Auto-calculated
    statusCodes = db.Column(db.Text, default='[]')  # JSON array
    averageResponse = db.Column(db.String(100))
    averageResponseUnit = db.Column(db.String(20), default='ms')
    maxResponse = db.Column(db.String(100))
    maxResponseUnit = db.Column(db.String(20), default='ms')
    
    # Performance Test Scenarios (JSON array)
    performanceScenarios = db.Column(db.Text, default='[]')
    
    # HTTP Requests Status Overview (JSON array)
    httpRequestsData = db.Column(db.Text, default='[]')

    # Evaluation Data
    involvementScore = db.Column(db.Integer, default=0)
    involvementReason = db.Column(db.Text)
    requirementsQualityScore = db.Column(db.Integer, default=0)
    requirementsQualityReason = db.Column(db.Text)
    qaPlanReviewScore = db.Column(db.Integer, default=0)
    qaPlanReviewReason = db.Column(db.Text)
    uxScore = db.Column(db.Integer, default=0)
    uxReason = db.Column(db.Text)
    cooperationScore = db.Column(db.Integer, default=0)
    cooperationReason = db.Column(db.Text)
    criticalBugsScore = db.Column(db.Integer, default=0)
    criticalBugsReason = db.Column(db.Text)
    highBugsScore = db.Column(db.Integer, default=0)
    highBugsReason = db.Column(db.Text)
    mediumBugsScore = db.Column(db.Integer, default=0)
    mediumBugsReason = db.Column(db.Text)
    lowBugsScore = db.Column(db.Integer, default=0)
    lowBugsReason = db.Column(db.Text)
    finalEvaluationScore = db.Column(db.Integer, default=0)

    # Metadata
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def calculate_totals(self):
        """Calculate all total fields automatically"""
        # Calculate User Stories total
        self.totalUserStories = (
            (self.passedUserStories or 0) +
            (self.passedWithIssuesUserStories or 0) +
            (self.failedUserStories or 0) +
            (self.blockedUserStories or 0) +
            (self.cancelledUserStories or 0) +
            (self.deferredUserStories or 0) +
            (self.notTestableUserStories or 0)
        )
        self.userStoriesMetric = self.totalUserStories

        # Calculate Test Cases total
        self.totalTestCases = (
            (self.passedTestCases or 0) +
            (self.passedWithIssuesTestCases or 0) +
            (self.failedTestCases or 0) +
            (self.blockedTestCases or 0) +
            (self.cancelledTestCases or 0) +
            (self.deferredTestCases or 0) +
            (self.notTestableTestCases or 0)
        )
        self.testCasesMetric = self.totalTestCases

        # Calculate Issues total (by priority)
        self.totalIssues = (
            (self.criticalIssues or 0) +
            (self.highIssues or 0) +
            (self.mediumIssues or 0) +
            (self.lowIssues or 0)
        )
        self.issuesMetric = self.totalIssues

        # Calculate Issues total (by status) - original total
        self.totalIssuesByStatus = (
            (self.newIssues or 0) +
            (self.fixedIssues or 0) +
            (self.notFixedIssues or 0) +
            (self.reopenedIssues or 0) +
            (self.deferredIssues or 0) +
            (self.deferredOldBugsIssues or 0)
        )
        
        # Calculate new sub-section totals
        self.totalIssuesOpenStatus = (
            (self.newIssues or 0) +
            (self.reopenedIssues or 0) +
            (self.deferredOldBugsIssues or 0)
        )
        
        self.totalIssuesResolutionStatus = (
            (self.fixedIssues or 0) +
            (self.notFixedIssues or 0)
        )

        # Calculate Enhancements total
        self.totalEnhancements = (
            (self.newEnhancements or 0) +
            (self.implementedEnhancements or 0) +
            (self.existsEnhancements or 0)
        )
        self.enhancementsMetric = self.totalEnhancements

        # Calculate Automation Regression totals and percentages
        self.automationTotalTestCases = (
            (self.automationPassedTestCases or 0) +
            (self.automationFailedTestCases or 0) +
            (self.automationSkippedTestCases or 0)
        )

        # Calculate automation test percentages
        if self.automationTotalTestCases > 0:
            self.automationPassedPercentage = round(((self.automationPassedTestCases or 0) / self.automationTotalTestCases) * 100, 2)
            self.automationFailedPercentage = round(((self.automationFailedTestCases or 0) / self.automationTotalTestCases) * 100, 2)
            self.automationSkippedPercentage = round(((self.automationSkippedTestCases or 0) / self.automationTotalTestCases) * 100, 2)
        else:
            self.automationPassedPercentage = 0.0
            self.automationFailedPercentage = 0.0
            self.automationSkippedPercentage = 0.0

        # Calculate automation stability totals and percentages
        self.automationStabilityTotal = (
            (self.automationStableTests or 0) +
            (self.automationFlakyTests or 0)
        )

        if self.automationStabilityTotal > 0:
            self.automationStablePercentage = round(((self.automationStableTests or 0) / self.automationStabilityTotal) * 100, 2)
            self.automationFlakyPercentage = round(((self.automationFlakyTests or 0) / self.automationStabilityTotal) * 100, 2)
        else:
            self.automationStablePercentage = 0.0
            self.automationFlakyPercentage = 0.0
        
        # Calculate final evaluation score
        self.finalEvaluationScore = (
            (self.involvementScore or 0) +
            (self.requirementsQualityScore or 0) +
            (self.qaPlanReviewScore or 0) +
            (self.uxScore or 0) +
            (self.cooperationScore or 0) +
            (self.criticalBugsScore or 0) +
            (self.highBugsScore or 0) +
            (self.mediumBugsScore or 0) +
            (self.lowBugsScore or 0)
        )
        
        # Calculate performance report failure rate
        if self.totalRequests and self.totalRequests > 0:
            self.failureRate = round(((self.failedRequests or 0) / self.totalRequests) * 100, 2)
        else:
            self.failureRate = 0.0

    def to_dict(self):
        """Converts the Report object to a dictionary for JSON serialization."""
        return {
            'id': self.id,
            'portfolioName': self.portfolioName,
            'projectName': self.projectName,
            'sprintNumber': self.sprintNumber,
            'reportVersion': self.reportVersion,
            'reportName': self.reportName,
            'reportType': self.reportType,
            'cycleNumber': self.cycleNumber,
            'releaseNumber': self.releaseNumber,
            'reportDate': self.reportDate,
            'testEnvironment': self.testEnvironment,
            'testSummary': self.testSummary,
            'testingStatus': self.testingStatus,

            # Dynamic data
            'requestData': json.loads(self.requestData or '[]'),
            'buildData': json.loads(self.buildData or '[]'),
            'testerData': json.loads(self.testerData or '[]'),
            'teamMemberData': json.loads(self.teamMemberData or '[]'),

            # User Stories
            'totalUserStories': self.totalUserStories,
            'passedUserStories': self.passedUserStories,
            'passedWithIssuesUserStories': self.passedWithIssuesUserStories,
            'failedUserStories': self.failedUserStories,
            'blockedUserStories': self.blockedUserStories,
            'cancelledUserStories': self.cancelledUserStories,
            'deferredUserStories': self.deferredUserStories,
            'notTestableUserStories': self.notTestableUserStories,

            # Test Cases
            'totalTestCases': self.totalTestCases,
            'passedTestCases': self.passedTestCases,
            'passedWithIssuesTestCases': self.passedWithIssuesTestCases,
            'failedTestCases': self.failedTestCases,
            'blockedTestCases': self.blockedTestCases,
            'cancelledTestCases': self.cancelledTestCases,
            'deferredTestCases': self.deferredTestCases,
            'notTestableTestCases': self.notTestableTestCases,

            # Issues
            'totalIssues': self.totalIssues,
            'totalIssuesByStatus': self.totalIssuesByStatus,
            'criticalIssues': self.criticalIssues,
            'highIssues': self.highIssues,
            'mediumIssues': self.mediumIssues,
            'lowIssues': self.lowIssues,
            'newIssues': self.newIssues,
            'fixedIssues': self.fixedIssues,
            'notFixedIssues': self.notFixedIssues,
            'reopenedIssues': self.reopenedIssues,
            'deferredIssues': self.deferredIssues,
            'deferredOldBugsIssues': self.deferredOldBugsIssues,
            'totalIssuesOpenStatus': self.totalIssuesOpenStatus,
            'totalIssuesResolutionStatus': self.totalIssuesResolutionStatus,

            # Enhancements
            'totalEnhancements': self.totalEnhancements,
            'newEnhancements': self.newEnhancements,
            'implementedEnhancements': self.implementedEnhancements,
            'existsEnhancements': self.existsEnhancements,

            # Metrics
            'userStoriesMetric': self.userStoriesMetric,
            'testCasesMetric': self.testCasesMetric,
            'issuesMetric': self.issuesMetric,
            'enhancementsMetric': self.enhancementsMetric,
            'qaNotesData': json.loads(self.qaNotesData or '[]'),
            'qaNoteFieldsData': json.loads(self.qaNoteFieldsData or '[]'),

            # Automation Report Specific Fields
            'covered_services': json.loads(self.covered_services or '[]'),
            'covered_modules': json.loads(self.covered_modules or '[]'),
            'bugs': json.loads(self.bugs or '[]'),

            # Automation Regression Data
            'automationPassedTestCases': self.automationPassedTestCases,
            'automationFailedTestCases': self.automationFailedTestCases,
            'automationSkippedTestCases': self.automationSkippedTestCases,
            'automationTotalTestCases': self.automationTotalTestCases,
            'automationPassedPercentage': self.automationPassedPercentage,
            'automationFailedPercentage': self.automationFailedPercentage,
            'automationSkippedPercentage': self.automationSkippedPercentage,
            'automationStableTests': self.automationStableTests,
            'automationFlakyTests': self.automationFlakyTests,
            'automationStabilityTotal': self.automationStabilityTotal,
            'automationStablePercentage': self.automationStablePercentage,
            'automationFlakyPercentage': self.automationFlakyPercentage,

            # Performance Report Data
            'testObjective': self.testObjective,
            'testScope': self.testScope,
            'numberOfUsers': self.numberOfUsers,
            'executionDuration': self.executionDuration,
            'userLoad': self.userLoad,
            'responseTime': self.responseTime,
            'requestVolume': self.requestVolume,
            'errorRate': self.errorRate,
            'slowest': self.slowest,
            'fastest': self.fastest,
            'totalRequests': self.totalRequests,
            'failedRequests': self.failedRequests,
            'failureRate': self.failureRate,
            'statusCodes': json.loads(self.statusCodes or '[]'),
            'averageResponse': self.averageResponse,
            'averageResponseUnit': self.averageResponseUnit,
            'maxResponse': self.maxResponse,
            'maxResponseUnit': self.maxResponseUnit,
            'performanceScenarios': json.loads(self.performanceScenarios or '[]'),
            'httpRequestsData': json.loads(self.httpRequestsData or '[]'),

            # Evaluation Data
            'involvementScore': self.involvementScore,
            'involvementReason': self.involvementReason,
            'requirementsQualityScore': self.requirementsQualityScore,
            'requirementsQualityReason': self.requirementsQualityReason,
            'qaPlanReviewScore': self.qaPlanReviewScore,
            'qaPlanReviewReason': self.qaPlanReviewReason,
            'uxScore': self.uxScore,
            'uxReason': self.uxReason,
            'cooperationScore': self.cooperationScore,
            'cooperationReason': self.cooperationReason,
            'criticalBugsScore': self.criticalBugsScore,
            'criticalBugsReason': self.criticalBugsReason,
            'highBugsScore': self.highBugsScore,
            'highBugsReason': self.highBugsReason,
            'mediumBugsScore': self.mediumBugsScore,
            'mediumBugsReason': self.mediumBugsReason,
            'lowBugsScore': self.lowBugsScore,
            'lowBugsReason': self.lowBugsReason,
            'finalEvaluationScore': self.finalEvaluationScore,

            # Metadata
            'createdAt': self.createdAt.isoformat() if self.createdAt else None,
            'updatedAt': self.updatedAt.isoformat() if self.updatedAt else None,
        }