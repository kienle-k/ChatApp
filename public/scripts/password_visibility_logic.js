// Toggle password visibility register page
document.getElementById('toggle-password').addEventListener('click', function () {
    const passwordField = document.getElementById('password');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    // this.textContent = type === 'password' ? '👁️' : '🙈';
    this.textContent = type === 'password' ? '🙈' : '👁️' ;
});

const confirm_passwd = document.getElementById('toggle-confirm-password');
if (confirm_passwd != null){
    confirm_passwd.addEventListener('click', function () {
        const confirmPasswordField = document.getElementById('confirm-password');
        const type = confirmPasswordField.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordField.setAttribute('type', type);
        // this.textContent = type === 'password' ? '👁️' : '🙈';
        this.textContent = type === 'password' ? '🙈' : '👁️' ;
    });
}

