document.getElementById('random-chat-button').addEventListener('click', async () => {
    try {
        const response = await fetch('/random-chat');
        const data = await response.json();
        if (data.success) {
            alert(`Starting chat with ${data.user.username}`);
            choosePersonalChat(data.user.id); // Starte den Chat mit der zufälligen Person
        } else {
            alert('Failed to start random chat');
        }
    } catch (error) {
        console.error('Error starting random chat:', error);
    }
});