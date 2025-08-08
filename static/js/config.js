// static/js/config.js
// Configuration and Global Variables

// --- Global variables ---
let currentSection = 0;
let editingReportId = null;
let currentPage = 1;
const reportsPerPage = 10;
let allReportsCache = []; // Cache for all reports to avoid re-fetching
let dashboardStatsCache = null; // Cache for dashboard statistics with structure: {data: object, cacheTime: number}
// Auto-save functionality
let autoSaveTimeout = null;

// Report type management
let currentReportType = 'sprint'; // Default to sprint for backward compatibility

// Constants for localStorage keys
const FORM_DATA_KEY = 'qaReportFormData';
const FORM_ARRAYS_KEY = 'qaReportArrayData';
const CACHE_DURATION = 300000; // 5 minutes in milliseconds

// Form-specific variables
let requestData = [];
let buildData = [];
let testerData = [];
let teamMemberData = [];
let qaNoteFieldsData = []; // New: for custom QA note fields
let qaNotesData = [];
let evaluationData = [];
let bugsData = []; // New: for automation report bugs
let performanceScenarios = []; // New: for performance test scenarios
let httpRequestsOverview = []; // New: for HTTP requests overview
let servicesData = [];
let modulesData = [];

// Chart variables
let userStoriesChart = null;
let testCasesChart = null;
let issuesPriorityChart = null;
let issuesStatusChart = null;
let enhancementsChart = null;
let automationTestCasesChart = null;
let automationPercentageChart = null;
let automationStabilityChart = null;
let scoreColumnCount = 0; // Not directly used in this version but kept for consistency
let weightReasonVisible = false; // Not directly used in this version but kept for consistency

// --- API Communication ---
const API_URL = '/api/reports';
const DASHBOARD_API_URL = '/api/dashboard/stats';

// Make global variables accessible
window.currentSection = currentSection;
window.editingReportId = editingReportId;
window.currentPage = currentPage;
window.reportsPerPage = reportsPerPage;
window.allReportsCache = allReportsCache;
window.dashboardStatsCache = dashboardStatsCache;
window.autoSaveTimeout = autoSaveTimeout;
window.currentReportType = currentReportType;
window.FORM_DATA_KEY = FORM_DATA_KEY;
window.FORM_ARRAYS_KEY = FORM_ARRAYS_KEY;
window.CACHE_DURATION = CACHE_DURATION;
window.requestData = requestData;
window.buildData = buildData;
window.testerData = testerData;
window.teamMemberData = teamMemberData;
window.qaNoteFieldsData = qaNoteFieldsData;
window.qaNotesData = qaNotesData;
window.evaluationData = evaluationData;
window.bugsData = bugsData;
window.performanceScenarios = performanceScenarios;
window.httpRequestsOverview = httpRequestsOverview;
window.servicesData = servicesData;
window.modulesData = modulesData;
window.userStoriesChart = userStoriesChart;
window.testCasesChart = testCasesChart;
window.issuesPriorityChart = issuesPriorityChart;
window.issuesStatusChart = issuesStatusChart;
window.enhancementsChart = enhancementsChart;
window.automationTestCasesChart = automationTestCasesChart;
window.automationPercentageChart = automationPercentageChart;
window.automationStabilityChart = automationStabilityChart;
window.scoreColumnCount = scoreColumnCount;
window.weightReasonVisible = weightReasonVisible;
window.API_URL = API_URL;
window.DASHBOARD_API_URL = DASHBOARD_API_URL;