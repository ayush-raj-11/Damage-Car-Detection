document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const browseBtn = document.getElementById('browseBtn');
    const fileInput = document.getElementById('fileInput');
    const resultContainer = document.getElementById('resultContainer');
    const previewImage = document.getElementById('previewImage');
    const resultText = document.getElementById('resultText');
    const confidenceText = document.getElementById('confidenceText');
    const statusIcon = document.getElementById('statusIcon');
    const loading = document.getElementById('loading');
    const checkAnotherBtn = document.getElementById('checkAnotherBtn');

    // Handle drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = 'white';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'white';
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileUpload(fileInput.files[0]);
        }
    });

    // Handle browse button click
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]);
        }
    });

    // Check another photo functionality
    checkAnotherBtn.addEventListener('click', resetForm);

    // Process the uploaded file
    function handleFileUpload(file) {
        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please upload an image file');
            return;
        }

        // Show loading spinner
        loading.style.display = 'block';
        resultContainer.style.display = 'none';
        uploadArea.style.display = 'none';

        // Create FormData object
        const formData = new FormData();
        formData.append('image', file);

        // Display preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Send to server for prediction
        fetch('/predict', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading spinner
            loading.style.display = 'none';
            
            // Show results
            resultText.textContent = data.predicted_class.replace('_', ' ');
            confidenceText.textContent = data.prediction_percentage + '%';
            
            // Get CSS variable values
            const rootStyles = getComputedStyle(document.documentElement);
            const dangerColor = rootStyles.getPropertyValue('--danger-color').trim();
            const successColor = rootStyles.getPropertyValue('--success-color').trim();
            
            // Set icon and color based on result
            if (data.predicted_class === 'damaged') {
                resultText.style.color = dangerColor;
                statusIcon.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: ${dangerColor}"></i>`;
            } else {
                resultText.style.color = successColor;
                statusIcon.innerHTML = `<i class="fas fa-check-circle" style="color: ${successColor}"></i>`;
            }
            
            // Set the image source from server (in case processing was needed)
            if (data.image_url) {
                previewImage.src = data.image_url;
            }
            
            resultContainer.style.display = 'flex';
        })
        .catch(error => {
            console.error('Error:', error);
            loading.style.display = 'none';
            resetForm();
            alert('An error occurred while processing the image');
        });
    }

    // Reset the form to initial state
    function resetForm() {
        fileInput.value = '';
        resultContainer.style.display = 'none';
        uploadArea.style.display = 'flex';
        previewImage.src = '';
        resultText.textContent = '';
        confidenceText.textContent = '';
        statusIcon.innerHTML = '';
    }

    // Allow clicking anywhere in the upload area to trigger file browse
    uploadArea.addEventListener('click', (e) => {
        if (e.target === uploadArea) {
            fileInput.click();
        }
    });
});