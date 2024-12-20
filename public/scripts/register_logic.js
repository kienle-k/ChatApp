const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');
const confirmPasswordField = document.getElementById('confirm-password');
const usernameErrorMessage = document.getElementById('username-error-message');
const passwordErrorMessage = document.getElementById('password-error-message');
const errorMessage = document.getElementById('error-message');

// Passwortanforderungen: mindestens 10 Zeichen, ein Großbuchstabe, eine Zahl, ein Sonderzeichen, maximale Länge 30 Zeichen
// const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{10,30}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/;
// Benutzername: mindestens 5 Zeichen, maximal 30 Zeichen
const usernameRegex = /^[A-Za-z\d._]{5,30}[^.]$/; // erlaubt _ und . mit am Ende kein .

usernameField.addEventListener('input', function() {
    const username = usernameField.value;
    if (username.toLowerCase() === 'ai') {
        usernameErrorMessage.textContent = 'Der Benutzername darf nicht "AI" sein.';
    } else if (!usernameRegex.test(username)) {
        if (username.length < 5) {
            usernameErrorMessage.textContent = 'Der Benutzername muss mindestens 5 Zeichen lang sein.';
        } else if (username.length > 30) {
            usernameErrorMessage.textContent = 'Der Benutzername darf maximal 30 Zeichen lang sein.';
        } else if (username[username.length-1] == "."){
            usernameErrorMessage.textContent = 'Der Benutzername darf nicht mit einem "." enden.';
        } else {
            usernameErrorMessage.textContent = 'Der Benutzername darf nur Buchstaben, Zahlen, "_" und "." enthalten.';
        }
    } else {
        usernameErrorMessage.textContent = '';
    }
});

passwordField.addEventListener('input', function() {
    const password = passwordField.value;
    if (!passwordRegex.test(password)) {
            if (password.length < 8){
                passwordErrorMessage.textContent = 'Das Passwort muss mindestens 8 Zeichen lang sein';
            }else {
                passwordErrorMessage.textContent = 'Das Passwort erfordert einen Großbuchstaben, eine Zahl und ein Sonderzeichen';
            }
    } else {
        passwordErrorMessage.textContent = '';
    }
});

document.getElementById('registerForm').addEventListener('submit', function(event) {

    event.preventDefault();

    // const fileInput = document.getElementById('imageInput');

    const username = usernameField.value;
    const password = passwordField.value;
    const confirmPassword = confirmPasswordField.value;

    if (!usernameRegex.test(username)) {
        event.preventDefault();
        if (username.length < 5) {
            usernameErrorMessage.textContent = 'Der Benutzername muss mindestens 5 Zeichen lang sein.';
        } else if (username.length > 30) {
            usernameErrorMessage.textContent = 'Der Benutzername darf maximal 30 Zeichen lang sein.';
        } else {
            usernameErrorMessage.textContent = 'Der Benutzername darf nur Buchstaben, Zahlen, "_" und "." enthalten.';
        }
    } else if (!passwordRegex.test(password)) {
        if (password.length < 8){
            passwordErrorMessage.textContent = 'Das Passwort muss mindestens 8 Zeichen lang sein';
        }else {
            passwordErrorMessage.textContent = 'Das Passwort erfordert einen Großbuchstaben, eine Zahl und ein Sonderzeichen';
        }
    } else if (password !== confirmPassword) {
        event.preventDefault();
        errorMessage.textContent = 'Die Passwörter stimmen nicht überein.';
    } else {
        errorMessage.textContent = '';
        // Handle image processing
        let formData = new FormData();


        // if (fileInput.files.length > 0) {
        //     const file = fileInput.files[0];
        //     formData.append('image', file);
        // }

        const profileUpload = document.getElementById('profile-upload').files[0]; // Get the uploaded file
        formData.append('profile_picture', profileUpload);

        // Add other form data
        formData.append('email', document.getElementById('email').value);
        formData.append('username', username);
        formData.append('password', password);

        // Send the data to the server
        fetch('/register', {
            method: 'POST',
            body: formData // Using FormData instead of JSON to include the image
        }).then(response => {
            if (response.ok) {
                // alert('Registrierung erfolgreich!');
                window.location.href = "/registrated-successfully";
            } else {
                response.text().then(text => {
                    alert('Fehler: ' + text);
                });
            }
        }).catch(error => {
            console.error('Fehler:', error);
            alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
        });
    }
});

window.onload = function(){
    document.getElementById("register-container").style.opacity = "1";

    const link = document.getElementById("doc-styles");

    const darkmode = JSON.parse(localStorage.getItem("darkmode"));
  
    if (darkmode == true) {
        console.log("Darkmode turned ON.");
        link.href = "/css/register/register_dark.css";
    } else {
        console.log("Darkmode turned OFF.");
        link.href = "/css/register/register_light.css"; 
    }
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

