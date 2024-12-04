window.onload = function(){
    document.getElementById("logout-container").style.opacity = "1";

    const link = document.getElementById("doc-styles");

    const darkmode = JSON.parse(localStorage.getItem("darkmode"));

    if (darkmode == true) {
        console.log("Darkmode turned ON.");
        link.href = "/css/register/register_dark.css";
    } else {
        DARKMODE = false;
        console.log("Darkmode turned OFF.");
        link.href = "/css/register/register_light.css"; 
    }
}