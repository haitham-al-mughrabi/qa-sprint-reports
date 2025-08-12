function renderQANotes(report) {
    const qaNotesContent = document.getElementById('qaNotesContent');
    const qaNotesData = report.qaNotesData || [];

    let hasNotes = false;
    let notesHtml = '';

    // Check for array-based notes
    if (qaNotesData.length > 0) {
        qaNotesData.forEach(noteItem => {
            if (noteItem.note && noteItem.note.trim()) {
                notesHtml += `<div class="dynamic-item">${noteItem.note}</div>`;
                hasNotes = true;
            }
        });
    }

    if (hasNotes) {
        qaNotesContent.innerHTML = notesHtml;
    } else {
        qaNotesContent.innerHTML = `<div class="empty-state" style="border: none; padding: 0; background: none;">
            <h3>No QA Notes</h3>
            <p>No specific QA notes were provided for this report.</p>
        </div>`;
    }
    
}