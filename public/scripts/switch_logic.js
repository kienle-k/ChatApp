
DARKMODE = false;



const switchCheckbox = document.getElementById("switch-checkbox");
const link = document.getElementById("theme-styles");

switchCheckbox.addEventListener("change", function() {
    console.log("CHECKCHECK");
  if (switchCheckbox.checked) {
    console.log("Darkmode turned ON.");
    localStorage.setItem("darkmode", true);
    DARKMODE = true;
    link.href = "/css/chat/dark_styles.css";  // Update with the path of the new stylesheet
    // document.getElementById("messages").style.backgroundColor = "#161124";
  } else {
    DARKMODE = false;
    console.log("Darkmode turned OFF.");
    localStorage.setItem("darkmode", false);
    link.href = "/css/chat/light_styles.css";  // Update with the path of the new stylesheet
    //  document.getElementById("messages").style.backgroundColor = "#ededed";
  }
});




