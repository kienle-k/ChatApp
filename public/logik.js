document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Hardcoded credentials
    const correctUsername = 'admin';
    const correctPassword = 'password123';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    if (username === correctUsername && password === correctPassword) {
        // Successful login
        window.location.href = '/chat/chat.html';  // Weiterleitung zu einer anderen Seite
    } else {
        // Display error message
        errorMessage.textContent = 'Benutzername oder Passwort ist falsch.';
    }
});
