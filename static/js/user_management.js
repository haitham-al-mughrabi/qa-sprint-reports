let users = [];
let resetRequests = [];

// Show/hide tabs
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.remove("active");
    });

    // Remove active class from all tab buttons
    document.querySelectorAll(".management-tab").forEach((btn) => {
        btn.classList.remove("active");
    });

    // Show selected tab
    document
        .getElementById(tabName + "-tab")
        .classList.add("active");

    // Add active class to clicked button
    event.target.classList.add("active");

    // Load data for the selected tab
    if (tabName === "users") {
        loadUsers();
    } else if (tabName === "reset-requests") {
        loadResetRequests();
    } else if (tabName === "email-settings") {
        loadEmailSettings();
    }
}

// Show toast notification
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    toast.innerHTML = `
    <div class="toast-icon"></div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
`;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch("/api/users");
        const result = await response.json();

        if (result.success) {
            users = result.users;
            renderUsers();
        } else {
            showToast("Failed to load users", "error");
        }
    } catch (error) {
        showToast("Network error loading users", "error");
    }
}

// Render users
function renderUsers() {
    const container = document.getElementById("usersContainer");

    if (users.length === 0) {
        container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-users"></i>
            <h3>No Users Found</h3>
            <p>No user accounts are registered in the system.</p>
        </div>
    `;
        return;
    }

    const usersHtml = users
        .map(
            (user) => `
    <tr>
        <td>
            <div class="user-header">
                <div class="user-avatar">
                    ${user.first_name.charAt(0)}${user.last_name.charAt(0)}
                </div>
                <div class="user-info">
                    <h3>${user.full_name}</h3>
                    <p>${user.email}</p>
                </div>
            </div>
        </td>
        <td>
            <span class="badge ${user.is_admin ? "admin" : "user"}">
                ${user.is_admin ? "Administrator" : "User"}
            </span>
        </td>
        <td>
            <span class="badge ${user.is_approved ? "approved" : "pending"}">
                ${user.is_approved ? "Approved" : "Pending"}
            </span>
            ${!user.is_active ? '<span class="badge inactive">Inactive</span>' : ""}
        </td>
        <td>${new Date(user.created_at).toLocaleDateString()}</td>
        <td>
            <div class="user-actions">
                ${!user.is_approved
                    ? `
                <button class="btn btn-success" onclick="approveUser(${user.id})" title="Approve User">
                    <i class="fas fa-check"></i>
                </button>
                `
                    : ""
                }
                <button class="btn btn-secondary" onclick="viewUser(${user.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-secondary" onclick="editUser(${user.id})" title="Edit User">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-warning" onclick="changePassword(${user.id})" title="Change Password">
                    <i class="fas fa-key"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteUser(${user.id})" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    </tr>
`,
        )
        .join("");

    container.innerHTML = `
    <div class="reset-requests-table">
        <table class="table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${usersHtml}
            </tbody>
        </table>
    </div>
`;
}

// Load password reset requests
async function loadResetRequests() {
    try {
        const response = await fetch(
            "/api/password-reset-requests",
        );
        const result = await response.json();

        if (result.success) {
            resetRequests = result.requests;
            renderResetRequests();
        } else {
            showToast("Failed to load reset requests", "error");
        }
    } catch (error) {
        showToast("Network error loading reset requests", "error");
    }
}

// Render password reset requests
function renderResetRequests() {
    const container = document.getElementById(
        "resetRequestsContainer",
    );

    if (resetRequests.length === 0) {
        container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-key"></i>
            <h3>No Reset Requests</h3>
            <p>No password reset requests are pending.</p>
        </div>
    `;
        return;
    }

    const requestsHtml = resetRequests
        .map(
            (request) => `
    <tr>
        <td>
            <strong>${request.user_name}</strong><br>
            <small>${request.user_email}</small>
        </td>
        <td>${new Date(request.created_at).toLocaleString()}</td>
        <td>
            <span class="status-indicator ${request.is_expired ? "status-expired" : request.is_approved ? "status-approved" : "status-pending"}">
                <i class="fas fa-${request.is_expired ? "times-circle" : request.is_approved ? "check-circle" : "clock"}"></i>
                ${request.is_expired ? "Expired" : request.is_approved ? "Approved" : "Pending"}
            </span>
        </td>
        <td>
            ${!request.is_approved && !request.is_expired
                    ? `
            <button class="btn btn-success" onclick="approveResetRequest(${request.id})">
                <i class="fas fa-check"></i> Approve
            </button>
            `
                    : "-"
                }
        </td>
    </tr>
`,
        )
        .join("");

    container.innerHTML = `
    <div class="reset-requests-table">
        <table class="table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${requestsHtml}
            </tbody>
        </table>
    </div>
`;
}

// User management actions
// Approve user - redirect to user information page
function approveUser(userId) {
    window.location.href = `/user-details?id=${userId}&tab=settings&action=approve`;
}

// Toggle admin - redirect to user information page
function toggleAdmin(userId) {
    window.location.href = `/user-details?id=${userId}&tab=settings&action=toggle-admin`;
}

// Toggle active - redirect to user information page
function toggleActive(userId) {
    window.location.href = `/user-details?id=${userId}&tab=settings&action=toggle-active`;
}

async function approveResetRequest(requestId) {
    try {
        const response = await fetch(
            `/api/password-reset-requests/${requestId}/approve`,
            {
                method: "POST",
            },
        );
        const result = await response.json();

        if (result.success) {
            showToast(result.message, "success");
            loadResetRequests(); // Reload requests
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        showToast("Network error", "error");
    }
}

// Theme toggle function
function toggleTheme() {
    const currentTheme =
        document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    const themeIcon = document.getElementById("theme-icon");
    const themeText = document.getElementById("theme-text");

    if (newTheme === "light") {
        themeIcon.className = "fas fa-moon";
        themeText.textContent = "Dark";
    } else {
        themeIcon.className = "fas fa-sun";
        themeText.textContent = "Light";
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const themeIcon = document.getElementById("theme-icon");
    const themeText = document.getElementById("theme-text");

    if (savedTheme === "light") {
        themeIcon.className = "fas fa-moon";
        themeText.textContent = "Dark";
    } else {
        themeIcon.className = "fas fa-sun";
        themeText.textContent = "Light";
    }

    // Load initial data
    loadUsers();
});

// Email Settings Functions
async function loadEmailSettings() {
    try {
        const response = await fetch("/api/email/config/status");
        const data = await response.json();

        const statusContainer =
            document.getElementById("emailConfigStatus");

        if (data.configured) {
            statusContainer.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <strong>Email is configured and ready!</strong>
                <div style="margin-top: 10px; font-size: 14px;">
                    <strong>Server:</strong> ${data.server}:${data.port}<br>
                    <strong>Username:</strong> ${data.username}<br>
                    <strong>TLS:</strong> ${data.use_tls ? "Enabled" : "Disabled"}
                </div>
            </div>
        `;
        } else {
            statusContainer.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Email is not configured</strong>
                <p>Please set up your email configuration using environment variables to enable email notifications.</p>
            </div>
        `;
        }
    } catch (error) {
        document.getElementById("emailConfigStatus").innerHTML = `
        <div class="alert alert-error">
            <i class="fas fa-times-circle"></i>
            <strong>Error checking email configuration</strong>
        </div>
    `;
    }
}

async function sendTestEmail() {
    const emailAddress = document
        .getElementById("testEmailAddress")
        .value.trim();

    if (!emailAddress) {
        showToast("Please enter an email address", "error");
        return;
    }

    if (!emailAddress.includes("@")) {
        showToast("Please enter a valid email address", "error");
        return;
    }

    try {
        const response = await fetch("/api/email/test", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: emailAddress }),
        });

        const data = await response.json();

        if (data.success) {
            showToast("Test email sent successfully!", "success");
            document.getElementById("testEmailAddress").value = "";
        } else {
            showToast(
                data.message || "Failed to send test email",
                "error",
            );
        }
    } catch (error) {
        showToast(
            "Network error while sending test email",
            "error",
        );
    }
}

// View user details - redirect to dedicated page
function viewUser(userId) {
    window.location.href = `/user-details?id=${userId}&tab=view`;
}

// Edit user - redirect to user information page
function editUser(userId) {
    window.location.href = `/user-details?id=${userId}&tab=profile`;
}

// Change password - redirect to user information page
function changePassword(userId) {
    window.location.href = `/user-details?id=${userId}&tab=password`;
}

// Delete user - redirect to user information page
function deleteUser(userId) {
    window.location.href = `/user-details?id=${userId}&action=delete`;
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Handle edit user form submission
document
    .getElementById("editUserForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const userId = document.getElementById("editUserId").value;
        const formData = {
            first_name: document
                .getElementById("editFirstName")
                .value.trim(),
            last_name: document
                .getElementById("editLastName")
                .value.trim(),
            email: document
                .getElementById("editEmail")
                .value.trim(),
            username:
                document
                    .getElementById("editUsername")
                    .value.trim() || null,
            phone_number:
                document
                    .getElementById("editPhoneNumber")
                    .value.trim() || null,
            is_admin:
                document.getElementById("editIsAdmin").checked,
            is_approved:
                document.getElementById("editIsApproved").checked,
            is_active:
                document.getElementById("editIsActive").checked,
        };

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                showToast(result.message, "success");
                closeModal("editUserModal");
                loadUsers(); // Reload users list
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            showToast("Network error updating user", "error");
        }
    });

// Handle change password form submission
document
    .getElementById("changePasswordForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const userId =
            document.getElementById("passwordUserId").value;
        const newPassword =
            document.getElementById("newPassword").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        try {
            const response = await fetch(
                `/api/users/${userId}/password`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ password: newPassword }),
                },
            );

            const result = await response.json();

            if (result.success) {
                showToast(result.message, "success");
                closeModal("changePasswordModal");
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            showToast("Network error updating password", "error");
        }
    });

// Close modal when clicking outside
window.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
    }
});
