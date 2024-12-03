document.getElementById('random-chat-button').addEventListener('click', async () => {
    try {
        const response = await fetch('/random-chat');
        const data = await response.json();
        if (data.success) {
            alert(`Starting chat with ${data.user.username}`);
            addContact(data.user.id, data.user.username, data.user.profile_picture); // Starte den Chat mit der zufälligen Person, zeige den Kontakt direkt an
            //choosePersonalChat(data.user.id); // Starte den Chat mit der zufälligen Person
        } else {
            alert('Failed to start random chat');
        }
    } catch (error) {
        console.error('Error starting random chat:', error);
    }
});