document.addEventListener('DOMContentLoaded', () => {
    const userTable = document.querySelector('.table');

    if (userTable) {
        userTable.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;

            const action = target.dataset.action;
            const userId = target.dataset.userId;

            if (action === 'approve') {
                approveUser(userId);
            } else if (action === 'toggle-role') {
                const userRole = target.dataset.role;
                toggleRole(userId, userRole);
            } else if (action === 'delete') {
                const userName = target.dataset.name;
                deleteUser(userId, userName);
            }
        });
    }

    function approveUser(userId) {
        if (!confirm('Are you sure you want to approve this user?')) return;
        fetch(`/api/users/approve/${userId}`, { method: 'POST' })
            .then(handleResponse)
            .catch(handleError);
    }

    function toggleRole(userId, currentRole) {
        if (!confirm(`Are you sure you want to toggle the role for this user? Current role: ${currentRole}`)) return;
        fetch(`/api/users/toggle-role/${userId}`, { method: 'POST' })
            .then(handleResponse)
            .catch(handleError);
    }

    function deleteUser(userId, userName) {
        if (!confirm(`Are you sure you want to delete the user: ${userName}? This action cannot be undone.`)) return;
        fetch(`/api/users/delete/${userId}`, { method: 'DELETE' })
            .then(handleResponse)
            .catch(handleError);
    }

    function handleResponse(response) {
        if (response.ok) {
            location.reload();
        } else {
            response.json().then(data => {
                alert(`Error: ${data.message || 'An unknown error occurred.'}`);
            });
        }
    }

    function handleError(error) {
        console.error('API Error:', error);
        alert('An error occurred while communicating with the server. Please try again.');
    }
});
