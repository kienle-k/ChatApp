const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');
const confirmPasswordField = document.getElementById('confirm-password');
const usernameErrorMessage = document.getElementById('username-error-message');
const passwordErrorMessage = document.getElementById('password-error-message');
const errorMessage = document.getElementById('error-message');

// Passwortanforderungen: mindestens 10 Zeichen, ein Großbuchstabe, eine Zahl, ein Sonderzeichen, maximale Länge 30 Zeichen
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{10,30}$/;
// Benutzername: mindestens 5 Zeichen, maximal 30 Zeichen
const usernameRegex = /^[A-Za-z\d]{5,30}$/;

usernameField.addEventListener('input', function() {
    const username = usernameField.value;
    if (!usernameRegex.test(username)) {
        if (username.length < 5) {
            usernameErrorMessage.textContent = 'Der Benutzername muss mindestens 5 Zeichen lang sein.';
        } else if (username.length > 30) {
            usernameErrorMessage.textContent = 'Der Benutzername darf maximal 30 Zeichen lang sein.';
        } else {
            usernameErrorMessage.textContent = 'Der Benutzername darf nur Buchstaben und Zahlen enthalten.';
        }
    } else {
        usernameErrorMessage.textContent = '';
    }
});

passwordField.addEventListener('input', function() {
    const password = passwordField.value;
    if (!passwordRegex.test(password)) {
        if (password.length > 30) {
            passwordErrorMessage.textContent = 'Das Passwort darf maximal 30 Zeichen lang sein.';
        } else {
            passwordErrorMessage.textContent = 'Das Passwort muss mindestens 10 Zeichen lang sein, einen Großbuchstaben, eine Zahl und ein Sonderzeichen enthalten.';
        }
    } else {
        passwordErrorMessage.textContent = '';
    }
});

document.getElementById('registerForm').addEventListener('submit', function(event) {
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
            usernameErrorMessage.textContent = 'Der Benutzername darf nur Buchstaben und Zahlen enthalten.';
        }
    } else if (!passwordRegex.test(password)) {
        event.preventDefault();
        if (password.length > 30) {
            passwordErrorMessage.textContent = 'Das Passwort darf maximal 30 Zeichen lang sein.';
        } else {
            passwordErrorMessage.textContent = 'Das Passwort muss mindestens 10 Zeichen lang sein, einen Großbuchstaben, eine Zahl und ein Sonderzeichen enthalten.';
        }
    } else if (password !== confirmPassword) {
        event.preventDefault();
        errorMessage.textContent = 'Die Passwörter stimmen nicht überein.';
    } else {
        errorMessage.textContent = '';
        // Die Daten an den Server senden
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: document.getElementById('email').value,
                username: username,
                password: password
            })
        }).then(response => {
            if (response.ok) {
                alert('Registrierung erfolgreich!');
            } else {
                response.text().then(text => {
                    alert('Fehler: ' + text);
                });
            }
        }).catch(error => {
            console.error('Fehler:', error);
            alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
        });
        event.preventDefault(); // Verhindere, dass das Formular die Seite neu lädt
    }
});