// --- Global variables ---
let currentSection = 0;
let editingReportId = null;
let currentPage = 1;
const reportsPerPage = 10;
let allReportsCache = []; // Cache for all reports to avoid re-fetching
let dashboardStatsCache = null; // Cache for dashboard statistics with structure: {data: object, cacheTime: number}
// Auto-save functionality
let autoSaveTimeout = null;

// Constants for localStorage keys
const FORM_DATA_KEY = 'qaReportFormData';
const FORM_ARRAYS_KEY = 'qaReportArrayData';
const CACHE_DURATION = 300000; // 5 minutes in milliseconds

// Form-specific variables
let requestData = [];
let buildData = [];
let testerData = [];
let qaNoteFieldsData = []; // New: for custom QA note fields
// let customFieldsData = []; // This will be used if custom fields are implemented - REMOVED
let userStoriesChart = null;
let testCasesChart = null;
let issuesPriorityChart = null;
let issuesStatusChart = null;
let enhancementsChart = null;
let automationTestCasesChart = null;
let automationPercentageChart = null;
let automationStabilityChart = null;
let evaluationChart = null;
let scoreColumnCount = 0; // Not directly used in this version but kept for consistency
let weightReasonVisible = false; // Not directly used in this version but kept for consistency

// --- API Communication ---
const API_URL = '/api/reports';
const DASHBOARD_API_URL = '/api/dashboard/stats';


