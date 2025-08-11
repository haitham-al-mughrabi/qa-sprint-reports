// --- Global variables ---
export let currentSection = 0;
export let editingReportId = null;
export let currentPage = 1;
export const reportsPerPage = 10;
export let allReportsCache = []; // Cache for all reports to avoid re-fetching
export let dashboardStatsCache = null; // Cache for dashboard statistics with structure: {data: object, cacheTime: number}
// Auto-save functionality
export let autoSaveTimeout = null;

// Constants for localStorage keys
export const FORM_DATA_KEY = 'qaReportFormData';
export const FORM_ARRAYS_KEY = 'qaReportArrayData';
export const CACHE_DURATION = 300000; // 5 minutes in milliseconds

// Form-specific variables
export let requestData = [];
export let buildData = [];
export let testerData = [];
export let qaNoteFieldsData = []; // New: for custom QA note fields
// let customFieldsData = []; // This will be used if custom fields are implemented - REMOVED
export let userStoriesChart = null;
export let testCasesChart = null;
export let issuesPriorityChart = null;
export let issuesStatusChart = null;
export let enhancementsChart = null;
export let automationTestCasesChart = null;
export let automationPercentageChart = null;
export let automationStabilityChart = null;
export let evaluationChart = null;
export let scoreColumnCount = 0; // Not directly used in this version but kept for consistency
export let weightReasonVisible = false; // Not directly used in this version but kept for consistency

// --- API Communication ---
export const API_URL = '/api/reports';
export const DASHBOARD_API_URL = '/api/dashboard/stats';


