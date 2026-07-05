document.addEventListener('DOMContentLoaded', () => {
    const meetingNotesInput = document.getElementById('meeting-notes');
    const charCount = document.getElementById('char-count');
    const processBtn = document.getElementById('process-btn');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const resultsSection = document.getElementById('results-section');
    
    // Result elements
    const priorityContent = document.getElementById('priority-content');
    const summaryContent = document.getElementById('summary-content');
    const discussionContent = document.getElementById('discussion-content');
    const actionContent = document.getElementById('action-content');
    const risksContent = document.getElementById('risks-content');
    const nextStepsContent = document.getElementById('next-steps-content');
    const emailContent = document.getElementById('email-content');

    // Store raw JSON for download
    let currentJsonData = null;

    // Character counter
    meetingNotesInput.addEventListener('input', () => {
        charCount.textContent = meetingNotesInput.value.length;
    });

    // Process button click
    processBtn.addEventListener('click', async () => {
        const notes = meetingNotesInput.value.trim();
        
        if (!notes) {
            showError("Please paste some meeting notes first.");
            return;
        }

        // Reset state
        hideError();
        resultsSection.classList.add('hidden');
        loading.classList.remove('hidden');
        processBtn.disabled = true;

        try {
            const response = await fetch('/process-meeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ meeting_notes: notes })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to process meeting notes.");
            }

            const data = await response.json();
            currentJsonData = data;
            
            populateResults(data);
            
            loading.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            
            // Enable n8n button
            document.getElementById('send-webhook-btn').disabled = false;
            
            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            loading.classList.add('hidden');
            showError(error.message);
        } finally {
            processBtn.disabled = false;
        }
    });

    function populateResults(data) {
        // Priority
        const priority = data.priority || "Medium";
        priorityContent.textContent = priority;
        priorityContent.className = 'priority-badge ' + priority.toLowerCase();

        // Summary
        summaryContent.textContent = data.meeting_summary || "No summary available.";

        // Discussion Points
        discussionContent.innerHTML = '';
        if (data.discussion_points && data.discussion_points.length > 0) {
            data.discussion_points.forEach(point => {
                const li = document.createElement('li');
                li.textContent = point;
                discussionContent.appendChild(li);
            });
        } else {
            discussionContent.innerHTML = '<li>None</li>';
        }

        // Action Items
        actionContent.innerHTML = '';
        if (data.action_items && data.action_items.length > 0) {
            data.action_items.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.employee}</td>
                    <td>${item.task}</td>
                    <td>${item.deadline}</td>
                `;
                actionContent.appendChild(tr);
            });
        } else {
            actionContent.innerHTML = '<tr><td colspan="3">No action items found</td></tr>';
        }

        // Risks
        risksContent.innerHTML = '';
        if (data.risks && data.risks.length > 0) {
            data.risks.forEach(risk => {
                const li = document.createElement('li');
                li.textContent = risk;
                risksContent.appendChild(li);
            });
        } else {
            risksContent.innerHTML = '<li>None identified</li>';
        }

        // Next Steps
        nextStepsContent.innerHTML = '';
        if (data.next_steps && data.next_steps.length > 0) {
            data.next_steps.forEach(step => {
                const li = document.createElement('li');
                li.textContent = step;
                nextStepsContent.appendChild(li);
            });
        } else {
            nextStepsContent.innerHTML = '<li>None</li>';
        }

        // Email
        emailContent.textContent = data.follow_up_email || "No draft available.";
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Copy to clipboard functionality
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            let textToCopy = targetElement.textContent;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                const icon = btn.querySelector('i');
                const originalClass = icon.className;
                
                // Show checkmark
                icon.className = 'fa-solid fa-check text-success';
                
                setTimeout(() => {
                    icon.className = originalClass;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    });

    // Download PDF functionality
    document.getElementById('download-pdf-btn').addEventListener('click', () => {
        if (!currentJsonData) return;
        
        const element = document.querySelector('.cards-grid');
        const opt = {
            margin:       10,
            filename:     'meeting_analysis.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Apply temporary light mode for PDF rendering
        element.classList.add('pdf-export-mode');
        
        // Disable buttons temporarily to show loading state
        const btn = document.getElementById('download-pdf-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
        btn.disabled = true;

        // Give the browser time to repaint with the new PDF styles
        setTimeout(() => {
            html2pdf().set(opt).from(element).save().then(() => {
                // Revert back to original dark mode
                element.classList.remove('pdf-export-mode');
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        }, 500);
    });

    // Webhook functionality
    document.getElementById('send-webhook-btn').addEventListener('click', async () => {
        if (!currentJsonData) return;
        
        const btn = document.getElementById('send-webhook-btn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
        
        try {
            const response = await fetch('/send-to-n8n', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(currentJsonData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                btn.innerHTML = 'Successfully sent to n8n.';
                btn.classList.add('text-success');
            } else {
                throw new Error(result.detail || "Failed to send");
            }
        } catch (error) {
            btn.innerHTML = '<i class="fa-solid fa-xmark"></i> ' + error.message;
            console.error(error);
        } finally {
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('text-success');
                btn.disabled = false;
            }, 5000);
        }
    });
});
