// Go back function
function goBack() {
    if (window.opener) {
        window.opener.focus(); // Focus the original tab
    }
    window.close(); // Close the current tab
    // window.location.href = '/chat';
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
    // First allow image display after loading
    document.getElementById("hide-images").href = "";
    const usernameElement = document.getElementById('username');
    const emailElement = document.getElementById('email');
    const profileImageElement = document.getElementById('profile-picture');
    try {
        const response = await fetch('/api/get-my-info');
        const data = await response.json();

        usernameElement.value = data.username;
        emailElement.value = data.email;
        profileImageElement.src = data.profile_picture || '/images/profile.png';
    } catch (error) {
        console.error('Error fetching profile data:', error);
        profileImageElement.src = '/images/profile.png';
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


const bigProfileModal = document.getElementById('profile-pic-modal');
const bigProfileDisplay = document.getElementById('profile-pic-display');
const bigProfileInfo = document.getElementById('profile-text');
const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');


function showBigProfilePic(){

    // Get image source
    let src = document.getElementById("profile-picture").src;

    if (src) { 
       
        bigProfileDisplay.innerHTML = '';
        bigProfileInfo.innerHTML = `<div><b>${usernameInput.value}</b></div>
                                    <div>${emailInput.value}</div>`;
        
        bigProfileModal.style.display = "block";

        // Create a new image element
        const img = document.createElement('img');
        img.src = src; // Set the image source
        img.alt = "Profile Picture"; // Set alt text for accessibility
        img.classList.add('big-profile-pic');

        bigProfileDisplay.appendChild(img);
    }
        
}





async function loadUserSettings() {
    try {
        const response = await fetch('/api/get-user-settings', {
            method: 'GET',
            credentials: 'include' // Include cookies/session for authenticated requests
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const user = data.user;
                document.getElementById('username').value = user.username;
                document.getElementById('email').value = user.email;
                // Füge hier weitere Felder hinzu, falls erforderlich
            } else {
                console.error('Failed to load user settings:', data.error);
            }
        } else {
            console.error('Failed to fetch user settings:', await response.json());
        }
    } catch (error) {
        console.error('Error fetching user settings:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadUserSettings);


window.onload = function(){
    loadData();
    const link = document.getElementById("doc-styles");

    const darkmode = JSON.parse(localStorage.getItem("darkmode"));

    if (darkmode == true) {
        console.log("Darkmode turned ON.");
        link.href = "/css/user_settings/settings_dark.css";
    } else {
        console.log("Darkmode turned OFF.");
        link.href = "/css/user_settings/settings_light.css"; 
    }
}