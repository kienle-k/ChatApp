document.getElementById('random-chat-button').addEventListener('click', async () => {
    try {
        const response = await fetch('/random-chat');
        const data = await response.json();
        if (data.success) {
            //alert(`Starting chat with ${data.user.username}`);

            prevID = 
            addContact(data.user.id, data.user.username, data.user.profile_picture); // Starte den Chat mit der zufälligen Person, zeige den Kontakt direkt an
            
            setTimeout(() => {
                const tmp = document.getElementById("messages").style.border;
                document.getElementById("messages").style.border = "2px solid red";
                setTimeout(() => {
                    document.getElementById("messages").style.border = "2px solid purple";
                }, 250);
                setTimeout(() => {
                    document.getElementById("messages").style.border = "2px solid blue";
                }, 500);            
                setTimeout(() => {
                    document.getElementById("messages").style.border = tmp;
                }, 750);
            }, 600);
            
            //choosePersonalChat(data.user.id); // Starte den Chat mit der zufälligen Person
        } else {
            alert('Failed to start random chat');
        }
    } catch (error) {
        console.error('Error starting random chat:', error);
    }
});