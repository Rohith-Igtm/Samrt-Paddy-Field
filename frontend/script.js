// Initialize application without authentication
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupFileHandling();
    setupPrediction();
    console.log('Smart Paddy Field app initialized');
}

function setupFileHandling() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadArea) {
        setupDragAndDrop(uploadArea);
    }
}

function setupDragAndDrop(uploadArea) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        uploadArea.style.background = 'rgba(76, 175, 80, 0.1)';
        uploadArea.style.borderColor = '#2d7d32';
    }
    
    function unhighlight(e) {
        uploadArea.style.background = '';
        uploadArea.style.borderColor = '#4caf50';
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.files = files;
                handleFileSelect({ target: { files: files } });
            }
        }
    }
}

function setupPrediction() {
    const predictBtn = document.getElementById('predictBtn');
    if (predictBtn) {
        predictBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            uploadImage();
        });
    }
}

// File handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.type, file.size);
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, JPEG, PNG)');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        displayImagePreview(e.target.result);
        enablePredictButton();
    };
    reader.readAsDataURL(file);
}

function displayImagePreview(imageSrc) {
    const uploadArea = document.getElementById('uploadArea');
    const uploadContent = uploadArea?.querySelector('.upload-content');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (uploadContent && imagePreview && previewImg) {
        previewImg.src = imageSrc;
        uploadContent.style.display = 'none';
        imagePreview.style.display = 'block';
    }
}

function enablePredictButton() {
    const predictBtn = document.getElementById('predictBtn');
    if (predictBtn) {
        predictBtn.disabled = false;
    }
}

function removeImage() {
    const uploadArea = document.getElementById('uploadArea');
    const uploadContent = uploadArea?.querySelector('.upload-content');
    const imagePreview = document.getElementById('imagePreview');
    const fileInput = document.getElementById('fileInput');
    const predictBtn = document.getElementById('predictBtn');
    const resultDiv = document.getElementById('result');
    
    if (uploadContent && imagePreview) {
        uploadContent.style.display = 'block';
        imagePreview.style.display = 'none';
    }
    
    if (fileInput) {
        fileInput.value = '';
    }
    
    if (predictBtn) {
        predictBtn.disabled = true;
    }
    
    if (resultDiv) {
        resultDiv.style.display = 'none';
    }
}

// Main upload function - fixed version that works with your backend
async function uploadImage() {
    console.log('Upload started');
    
    const fileInput = document.getElementById("fileInput");
    const resultDiv = document.getElementById("result");
    const resultData = document.getElementById("resultData");
    const loading = document.getElementById("loading");
    const predictBtn = document.getElementById("predictBtn");
    
    if (!fileInput || !fileInput.files[0]) {
        alert("Please select an image first");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    
    // Show loading state
    if (loading) loading.style.display = 'block';
    if (resultDiv) resultDiv.style.display = 'none';
    if (predictBtn) predictBtn.disabled = true;
    
    try {
        console.log('Sending request...');
        
        const response = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST", 
            body: formData
        });
        
        const data = await response.json();
        console.log('Got data:', data);
        
        // Hide loading
        if (loading) loading.style.display = 'none';
        
        // Display results properly (not popup)
        displayPredictionResults(data);
        
        // Show results section
        if (resultDiv) resultDiv.style.display = 'block';
        
        console.log('Results displayed successfully');
        
    } catch (error) {
        console.log('Error occurred:', error);
        
        // Hide loading
        if (loading) loading.style.display = 'none';
        
        // Display error properly (not popup)
        displayPredictionError(error.message || 'Unknown error');
        
        // Show results section with error
        if (resultDiv) resultDiv.style.display = 'block';
        
    } finally {
        // Re-enable button
        if (predictBtn) predictBtn.disabled = false;
    }
}

function displayPredictionResults(data) {
    const resultData = document.getElementById("resultData");
    if (!resultData) return;
    
    console.log('Displaying results for:', data);
    
    // Handle confidence format (remove % if present)
    let confidence;
    if (typeof data.confidence === 'string') {
        confidence = parseFloat(data.confidence.replace('%', ''));
    } else {
        confidence = parseFloat(data.confidence) || 0;
    }
    
    confidence = Math.round(confidence * 100) / 100;
    const condition = data.class.toLowerCase();
    const recommendations = getDetailedRecommendations(condition);
    
    resultData.innerHTML = `
        <div class="result-item">
            <div class="result-label">Field Condition:</div>
            <div class="result-value">
                <span class="status ${condition}">${data.class.toUpperCase()}</span>
            </div>
        </div>
        <div class="result-item">
            <div class="result-label">Confidence Level:</div>
            <div class="result-value">
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${confidence}%"></div>
                </div>
                <span class="confidence-text">${confidence}%</span>
            </div>
        </div>
        
        <div class="result-recommendations">
            <h4><i class="fas fa-lightbulb"></i> Expert Recommendations:</h4>
            <p class="main-recommendation">${recommendations.main}</p>
            
            <div class="detailed-suggestions">
                <div class="suggestion-category">
                    <h5><i class="fas fa-tasks"></i> Immediate Actions:</h5>
                    <ul>
                        ${recommendations.immediate.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="suggestion-category">
                    <h5><i class="fas fa-calendar-check"></i> Weekly Tasks:</h5>
                    <ul>
                        ${recommendations.weekly.map(task => `<li>${task}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="suggestion-category">
                    <h5><i class="fas fa-eye"></i> What to Monitor:</h5>
                    <ul>
                        ${recommendations.monitoring.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                
                ${recommendations.treatment ? `
                <div class="suggestion-category treatment-needed">
                    <h5><i class="fas fa-medkit"></i> Treatment Required:</h5>
                    <ul>
                        ${recommendations.treatment.map(treatment => `<li>${treatment}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            
            <div class="next-steps">
                <h5><i class="fas fa-arrow-right"></i> Next Steps:</h5>
                <div class="timeline">
                    ${recommendations.timeline.map((step, index) => `
                        <div class="timeline-item">
                            <div class="timeline-marker">${index + 1}</div>
                            <div class="timeline-content">${step}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="result-actions">
            <button class="action-btn primary" onclick="downloadReport('${data.class}', ${confidence})">
                <i class="fas fa-download"></i> Download Report
            </button>
            <button class="action-btn secondary" onclick="shareResults('${data.class}', ${confidence})">
                <i class="fas fa-share"></i> Share Results
            </button>
            <button class="action-btn info" onclick="showDetectedIssues('${condition}')">
                <i class="fas fa-search"></i> View Details
            </button>
        </div>
    `;
}

// Enhanced recommendations based on condition
function getDetailedRecommendations(condition) {
    const recommendations = {
        'healthy': {
            main: 'Excellent! Your paddy field is in optimal condition. Continue with current farming practices and maintain regular monitoring schedule.',
            immediate: [
                'Continue current irrigation schedule',
                'Maintain proper field drainage',
                'Keep monitoring for any changes'
            ],
            weekly: [
                'Check water levels twice weekly',
                'Inspect plants for early signs of issues',
                'Monitor weather conditions for planning',
                'Document growth progress with photos'
            ],
            monitoring: [
                'Leaf color and texture changes',
                'Plant height and density',
                'Water quality and pH levels',
                'Pest activity around the field'
            ],
            timeline: [
                'Continue current care routine for the next 2 weeks',
                'Schedule next analysis in 10-14 days',
                'Prepare for next growth stage requirements',
                'Maintain detailed farming records'
            ]
        },
        'mild': {
            main: 'Minor issues detected. Monitor irrigation levels and check for early signs of nutrient deficiency. Consider soil testing and adjust fertilizer accordingly.',
            immediate: [
                'Check and adjust irrigation system',
                'Inspect plants closely for specific symptoms',
                'Test soil pH and nutrient levels',
                'Increase monitoring frequency'
            ],
            weekly: [
                'Apply balanced fertilizer if needed',
                'Monitor water drainage patterns',
                'Check for early pest signs',
                'Document any changes with photos'
            ],
            monitoring: [
                'Leaf yellowing or browning patterns',
                'Plant growth rate changes',
                'Soil moisture consistency',
                'Root health and development'
            ],
            timeline: [
                'Implement corrective measures within 2-3 days',
                'Monitor improvements over next week',
                'Reassess condition in 7 days',
                'Adjust treatment plan based on response'
            ]
        },
        'moderate': {
            main: 'Attention required. Check for pest infestations, water logging, or nutrient imbalance. Consider consulting with local agricultural extension services.',
            immediate: [
                'Identify specific problem areas',
                'Adjust irrigation to prevent water logging',
                'Apply targeted fertilizer or pesticide',
                'Isolate affected areas if possible'
            ],
            weekly: [
                'Monitor treatment effectiveness',
                'Apply follow-up treatments as needed',
                'Consult agricultural extension officer',
                'Implement preventive measures'
            ],
            monitoring: [
                'Disease progression or recovery',
                'Pest population changes',
                'Plant stress indicators',
                'Soil health improvements'
            ],
            treatment: [
                'Apply appropriate fungicide if disease detected',
                'Use organic pest control methods',
                'Improve field drainage system',
                'Supplement with micronutrients'
            ],
            timeline: [
                'Start treatment within 24 hours',
                'Monitor daily for first week',
                'Reassess in 5-7 days',
                'Continue treatment for 2-3 weeks as needed'
            ]
        },
        'severe': {
            main: 'Immediate action needed! Critical issues detected that could significantly impact yield. Please consult with an agricultural specialist immediately.',
            immediate: [
                'Contact agricultural specialist immediately',
                'Stop current irrigation if water logging detected',
                'Apply emergency treatment measures',
                'Isolate severely affected areas'
            ],
            weekly: [
                'Implement intensive treatment plan',
                'Monitor recovery progress daily',
                'Apply multiple treatment approaches',
                'Prepare for potential crop loss mitigation'
            ],
            monitoring: [
                'Critical plant survival indicators',
                'Treatment response effectiveness',
                'Spread prevention to healthy areas',
                'Overall field recovery progress'
            ],
            treatment: [
                'Emergency fungicide/pesticide application',
                'Soil treatment and amendment',
                'Drainage system emergency repairs',
                'Consider replanting in worst areas'
            ],
            timeline: [
                'Emergency response within 6 hours',
                'Intensive monitoring for 48 hours',
                'Evaluate treatment response in 3 days',
                'Plan recovery strategy for next 2-4 weeks'
            ]
        }
    };
    
    return recommendations[condition] || recommendations['healthy'];
}

function displayPredictionError(errorMessage) {
    const resultData = document.getElementById("resultData");
    if (!resultData) return;
    
    const safeErrorMessage = errorMessage || 'An unknown error occurred';
    
    resultData.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Analysis Failed</h3>
            <p>We couldn't analyze your image. Please try again.</p>
            <div class="error-details">
                <strong>Error Details:</strong> ${safeErrorMessage}
            </div>
            <div class="troubleshooting">
                <h4>Troubleshooting Steps:</h4>
                <ul>
                    <li><strong>Check Backend:</strong> Make sure Python server is running (python main.py)</li>
                    <li><strong>Test URL:</strong> Visit <a href="http://127.0.0.1:8000" target="_blank">http://127.0.0.1:8000</a> to verify backend</li>
                    <li><strong>Browser Console:</strong> Press F12 and check for error messages</li>
                    <li><strong>Image Format:</strong> Ensure image is JPG, PNG, or JPEG</li>
                    <li><strong>File Size:</strong> Keep image under 5MB</li>
                    <li><strong>Internet:</strong> Check your network connection</li>
                </ul>
            </div>
        </div>
    `;
}

// Additional utility functions
function downloadReport(condition, confidence) {
    const currentDate = new Date().toLocaleDateString();
    const recommendations = getDetailedRecommendations(condition.toLowerCase());
    
    const reportContent = `
SMART PADDY FIELD ANALYSIS REPORT
================================

Analysis Date: ${currentDate}
Field Condition: ${condition.toUpperCase()}
Confidence Level: ${confidence}%

EXPERT RECOMMENDATIONS:
${recommendations.main}

IMMEDIATE ACTIONS REQUIRED:
${recommendations.immediate.map((action, index) => `${index + 1}. ${action}`).join('\n')}

WEEKLY MAINTENANCE TASKS:
${recommendations.weekly.map((task, index) => `${index + 1}. ${task}`).join('\n')}

MONITORING CHECKLIST:
${recommendations.monitoring.map((item, index) => `${index + 1}. ${item}`).join('\n')}

${recommendations.treatment ? `
TREATMENT PLAN:
${recommendations.treatment.map((treatment, index) => `${index + 1}. ${treatment}`).join('\n')}
` : ''}

TIMELINE FOR NEXT STEPS:
${recommendations.timeline.map((step, index) => `${index + 1}. ${step}`).join('\n')}

---
Generated by Smart Paddy Field AI System
Report Date: ${currentDate}
    `.trim();
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paddy-field-analysis-${currentDate.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('Detailed report downloaded successfully!');
}

function shareResults(condition, confidence) {
    const shareText = `My paddy field analysis: ${condition} condition (${confidence}% confidence) - Get expert recommendations with Smart Paddy Field AI`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Smart Paddy Field Analysis Results',
            text: shareText,
            url: window.location.href
        }).then(() => {
            console.log('Results shared successfully!');
        }).catch(() => {
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

function fallbackShare(shareText) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Results copied to clipboard!');
        }).catch(() => {
            alert('Unable to share results');
        });
    } else {
        alert('Sharing not supported on this device');
    }
}

function showDetectedIssues(condition) {
    const issues = getDetectedIssues(condition);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-search"></i> Detected Issues Details</h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="issue-details">
                    <h3>Current Field Status: <span class="status ${condition}">${condition.toUpperCase()}</span></h3>
                    
                    <div class="possible-issues">
                        <h4><i class="fas fa-exclamation-circle"></i> Possible Issues:</h4>
                        <ul>
                            ${issues.possible.map(issue => `<li>${issue}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="symptoms">
                        <h4><i class="fas fa-stethoscope"></i> Common Symptoms:</h4>
                        <ul>
                            ${issues.symptoms.map(symptom => `<li>${symptom}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="causes">
                        <h4><i class="fas fa-question-circle"></i> Likely Causes:</h4>
                        <ul>
                            ${issues.causes.map(cause => `<li>${cause}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function getDetectedIssues(condition) {
    const issues = {
        'healthy': {
            possible: ['No significant issues detected', 'Field is in optimal condition'],
            symptoms: ['Healthy green leaves', 'Good plant density', 'Proper growth rate'],
            causes: ['Good farming practices', 'Optimal environmental conditions', 'Proper care and maintenance']
        },
        'mild': {
            possible: ['Early nutrient deficiency', 'Minor irrigation issues', 'Beginning of pest activity'],
            symptoms: ['Slight leaf yellowing', 'Reduced growth rate', 'Minor discoloration'],
            causes: ['Nutrient imbalance', 'Irregular watering', 'Seasonal changes', 'Soil pH fluctuation']
        },
        'moderate': {
            possible: ['Pest infestation', 'Nutrient deficiency', 'Water logging', 'Disease onset'],
            symptoms: ['Visible leaf damage', 'Stunted growth', 'Brown/yellow patches', 'Wilting plants'],
            causes: ['Poor drainage', 'Pest attack', 'Fungal infection', 'Over/under watering', 'Nutrient deficiency']
        },
        'severe': {
            possible: ['Major disease outbreak', 'Severe pest damage', 'Critical nutrient deficiency', 'Environmental stress'],
            symptoms: ['Extensive leaf damage', 'Plant death', 'Severe discoloration', 'Complete wilting'],
            causes: ['Disease epidemic', 'Severe pest infestation', 'Extreme weather damage', 'Soil contamination', 'Complete system failure']
        }
    };
    
    return issues[condition] || issues['healthy'];
}
