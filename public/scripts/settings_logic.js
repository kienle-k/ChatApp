// Go back function
function goBack() {
    window.location.href = '/chat';
    // window.history.back();
}

// Trigger file upload
function triggerUpload() {
    document.getElementById('profile-upload').click();
}

// Preview selected image
document.getElementById('profile-upload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('profile-picture').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});



// Load user data on page load
async function loadData() {
    const usernameElement = document.getElementById('username');
    const emailElement = document.getElementById('email');
    const profileImageElement = document.getElementById('profile-picture');
    try {
        const response = await fetch('/api/get-my-info');
        const data = await response.json();

        usernameElement.value = data.username;
        emailElement.value = data.email;
        profileImageElement.src = data.profile_picture || '/images/profile.jpg';
    } catch (error) {
        console.error('Error fetching profile data:', error);
        profileImageElement.src = '/images/profile.jpg';
    }
}

// Submit form data to the backend
document.querySelector('.settings-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent page refresh

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();
    const profileUpload = document.getElementById('profile-upload').files[0]; // Get the uploaded file

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    if (profileUpload) {
        formData.append('profile_picture', profileUpload); // Append the file to the request
    }

    try {
        const response = await fetch('/api/update-my-info', {
            method: 'POST',
            body: formData, // Use FormData for file uploads
        });

        if (response.ok) {
            //alert("Settings updated successfully!");
            goBack();
            
        } else {
            const error = await response.json();
            alert("Failed to update settings: " + error.message);
        }
    } catch (error) {
        console.error("Error updating settings:", error);
        alert("An error occurred while updating settings.");
    }
});


window.onload = loadData;