async function highlightRandom(element, time_ms, ignore_bg=false) {
    const colors = [
        "red", "orange", "yellow", "green", "blue", "indigo", "violet"
    ];

    const rgbaColors = [
        "rgba(255, 0, 0, 0.2)",   // Red (0.5% a)
        "rgba(255, 165, 0, 0.2)", // Orange (0.5% a)
        "rgba(255, 255, 0, 0.2)", // Yellow (0.5% a)
        "rgba(0, 128, 0, 0.2)",   // Green (0.5% a)
        "rgba(0, 0, 255, 0.2)",   // Blue (0.5% a)
        "rgba(75, 0, 130, 0.2)",  // Indigo (0.5% a)
        "rgba(238, 130, 238, 0.2)" // Violet (0.5% a)
    ];

    const waitTime = 110;
    const iterations = Math.floor(time_ms / (waitTime * colors.length));  // Loop duration based on time_ms
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const tmp = element.style.backgroundColor;

    for (let i = 0; i < iterations; i++) {
        // Loop through rainbow colors for each iteration
        for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
            element.style.border = `2px solid ${colors[colorIndex]}`;
            element.style.backgroundColor = `${rgbaColors[colorIndex]}`;
            await delay(waitTime);  // Smooth transition time between colors
        }
    }

    // End with no border or a specific final color
    element.style.border = "2px solid transparent";
    element.style.backgroundColor = "#ededed";

}



document.getElementById('random-chat-button').addEventListener('click', async () => {
    try {
        const response = await fetch('/random-chat');
        const data = await response.json();
        if (data.success) {
            //alert(`Starting chat with ${data.user.username}`);
            const new_list_item = await addContact(data.user.id, data.user.username, data.user.profile_picture, showHighlight=false); // Starte den Chat mit der zufälligen Person, zeige den Kontakt direkt an
            const messages_div = document.getElementById("messages");
            setTimeout(() => {
                highlightRandom(messages_div, 1000);
            }, 50);
            
            //choosePersonalChat(data.user.id); // Starte den Chat mit der zufälligen Person
        } else {
            alert('Failed to start random chat');
        }
    } catch (error) {
        console.error('Error starting random chat:', error);
    }
});