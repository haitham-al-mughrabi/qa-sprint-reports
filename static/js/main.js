import * as globals from './globals.js';
import * as utils from './utils.js';
import * as api from './api.js';
import * as toast from './toast.js';
import * as dashboard from './dashboard.js';
import * as charts from './charts.js';
import * as calculations from './calculations.js';
import * as dynamic_forms from './dynamic_forms.js';
import * as navigation from './navigation.js';
import * as filters from './filters.js';
import * as pagination from './pagination.js';

// Expose modules globally if needed
window.globals = globals;
window.utils = utils;
window.api = api;
window.toast = toast;
window.dashboard = dashboard;
window.charts = charts;
window.calculations = calculations;
window.dynamic_forms = dynamic_forms;
window.navigation = navigation;
window.filters = filters;
window.pagination = pagination;

// Expose specific dashboard functions globally for HTML onclick handlers
window.loadDashboardData = dashboard.loadDashboardData;
window.exportDashboardReport = dashboard.exportDashboardReport;
