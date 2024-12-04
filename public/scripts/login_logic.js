document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevents the form from submitting the traditional way
  
    // Get form data
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    try {
      // Send POST request to the login endpoint

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      // Handle the response
      const result = await response.json();
      const messageEl = document.getElementById("error-message");
  
   
      if (response.ok) {
        // Redirect to chat page or homepage after login
        window.location.href = '/chat'; // Adjust to your chat page
      } else {
        // Show error message
        messageEl.textContent = result.error || "Login failed";
        messageEl.style.color = "red";
      }

    } catch (error) {
      console.error("Login Error:", error);
      document.getElementById("error-message").textContent = "An error occurred. Please try again.";
    }
  });

window.onload = function(){
  document.getElementById("login-container").style.opacity = "1";
}

// const link = document.getElementById("doc-styles");

// const darkmode = JSON.parse(localStorage.getItem("darkmode"));

// if (darkmode == true) {
//     console.log("Darkmode turned ON.");
//     link.href = "/css/login_dark.css";
// } else {
//     DARKMODE = false;
//     console.log("Darkmode turned OFF.");
//     link.href = "/css/login_light.css"; 
// }

