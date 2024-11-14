// Verbindung mit dem Socket.IO-Server herstellen
const socket = io();


let MY_USER;
let MY_USER_ID;

// EDIT THESE VALUES TO SET THE CURRENTLY CHATTED WITH USER (CONSCHTI)
let CURRENTLY_CHATTING_WITH_ID = 2;
let CURRENT_CHAT_GROUP = null;

var currently_loading_messages = false;

var pending_messages = [];

const input = document.getElementById("message-input");
const messageContainer = document.getElementById('message-history-container');
const messagesUL = document.getElementById('messages');

const bottomThreshold = 150;



async function getUserData() {
    try {
        const response = await fetch('/api/get-my-user', {
            method: 'GET',
            credentials: 'include', // Include cookies/session for authenticated requests
        });

        if (response.ok) {
            const { username, id } = await response.json();
            MY_USER = username;
            MY_USER_ID = id;
            console.log(`Logged in user: ${username} (ID: ${id})`);
            // You can now use the username and id as needed in your application
        } else {
            console.error('Failed to fetch user data:', await response.json());
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

function isListNearBottom() {
    // Calculate the distance from the bottom
    const distanceFromBottom = messagesUL.scrollHeight - messagesUL.scrollTop - messagesUL.clientHeight;
    
    // Return true if within threshold, false otherwise
    return distanceFromBottom < bottomThreshold;
}

function scrollMessagesToBottom(){
    messagesUL.scrollTop = messagesUL.scrollHeight;
}

function requestHistoryMessages(start_at_id, number_of_messages) {
    const user2_id = CURRENTLY_CHATTING_WITH_ID;
    socket.emit('get-history', { user2_id, start_at_id, number_of_messages });
}



socket.on('response-history', (data) => {
    console.log('Received data from server:', data); // Process the returned data
    if (!data.success){return; };
    
    let messages = data.messages;
    let msg;
    for (let i=messages.length-1; i>= 0; i--){
        const scrollPosition = messagesUL.scrollTop;
        const offsetHeightBefore = messagesUL.scrollHeight;
        msg = messages[i];
        let messageType = 'sent';
        console.log(CURRENTLY_CHATTING_WITH_ID, "|> MESSAGE: ", msg.sender_id, msg.receiver_id);
        if (msg.sender_id == CURRENTLY_CHATTING_WITH_ID){
            messageType = 'received'
        }
        addMessage(msg.message, messageType, on_top=true);
        if (on_top) {
            const offsetHeightAfter = messagesUL.scrollHeight;
            messagesUL.scrollTop = scrollPosition + (offsetHeightAfter - offsetHeightBefore);
        }
    }

    

    currently_loading_messages = false;
});


function addMessage(message, messageType, on_top=false){
    // messageType can be 'pending' / 'sent' / 'received'

    // Nachricht sofort anzeigen
    const li = document.createElement('li');

    li.classList.add("message-container");            
    
    const msg = document.createElement('div');

    msg.innerText = message;

    msg.classList.add('message');
    msg.classList.add('new-message');
    
    switch(messageType) {
        case "pending":
        li.classList.add('right');
        msg.classList.add('pending-message');
            break;
        
        case "sent":
            li.classList.add('right');
            msg.classList.add('sent-message');
            break;
        
        case "received":
            li.classList.add('left');
            msg.classList.add('received-message');
            break;
    }


    li.appendChild(msg);


    
    if (on_top){
        messagesUL.insertBefore(li, messagesUL.firstChild);
    }else{
        messagesUL.appendChild(li);
    } 

    // msg.addEventListener('transitionend', scrollMessagesToBottom);
    setTimeout(() => {
        msg.classList.add('expanded');
    }, 10);

    

    return li;
}


// Wenn eine Nachricht empfangen wird
socket.on('chat-message', (msg) => {
    console.log("RECEIVED: ", msg);

    from_user =  msg.from_user;
    from_username = msg.from_username;
    text = msg.text;

    // TODO make it more logical, change addMessage function, change whole flow
    // DEBUG MODE: ALL MESSAGES ARE PUT IN THE SAME CHAT
    if (true) { //from_user == CURRENTLY_CHATTING_WITH_ID){
        let li = addMessage(text, 'received');
        if (isListNearBottom()) {
            setTimeout(scrollMessagesToBottom, 0);
        }
    } else {
        console.log("Received message from user that is currently not chatted with");
    }
});

// Old approach, now API call -> different handling

// // Wenn eine Nachricht als bestätigt zurückkommt
socket.on('message-confirmation', (output) => {
    let msgID = output.id;
    // Suchen der Nachricht mit der erhaltenen msgID
    const li = pending_messages[msgID];
    if (li) {
        const msg = li.querySelector("div");
        msg.classList.remove('pending-message'); // Entfernt den Pending-Status
        msg.classList.add('sent-message'); // Fügt die normale Nachricht-Klasse hinzu
        console.log("Message confirmed sent: " + msgID);
        delete pending_messages[msgID]; // Entferne das Pending-Tracking
    }
});


// This socket receives updates on the chats
socket.on('response-chat-history', (rows) => {
    console.log("RECEIVED CHATS:", rows.messages);
    // TODO
    // CJ FU
    // Logik für das Generieren / Regenerieren der Divs (je nachdem ob nur neu laden / hinzufügen zur liste)
    // Divs brauchen data-id, um die richtigen chats laden zu können <div class=".." data-id=${chat_partner.id}>
});


async function sendMessageToAPI(messageData) {
    const msgID = messageData.id;
    const li = pending_messages[msgID];
    let msg;
    if (li){
        msg = li.querySelector("div");
    } else {
        msg = null;
    }
    console.log(msgID, li, msg);
    try {
        const response = await fetch('/api/send-message', {
            method: 'POST',  
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Message sent:', result.message);
            
            if (msg){
                msg.classList.remove('pending-message'); // Entfernt den Pending-Status
                msg.classList.add('sent-message'); // Fügt die normale Nachricht-Klasse hinzu
                console.log("Message confirmed sent: " + msgID);
                delete pending_messages[msgID]; // Entferne das Pending-Tracking
            }
        } else {
            const errorData = await response.json();
            console.error('Error:', errorData.error);
            if (msg){
                msg.style.backgroundColor = "red";
                delete pending_messages[msgID]; // Entferne das Pending-Tracking
            }
        }
    } catch (error) {
        console.error('Request failed:', error);
        if (msg){
            msg.style.backgroundColor = "darkred";
            delete pending_messages[msgID]; // Entferne das Pending-Tracking
        }
    }
}

    // Equivalent message data
    


function sendMessage(event) {
    event.preventDefault(); 
    const msgID = Date.now(); 



    if (input.value == ""){
        return;
    }
    let msgLi = addMessage(input.value, 'pending');
    pending_messages[msgID] = msgLi;

    setTimeout(scrollMessagesToBottom, 0);

    let to_user = CURRENTLY_CHATTING_WITH_ID;

    let to_group = CURRENT_CHAT_GROUP;

    let value = input.value;

    input.value = ''; // Eingabefeld leeren

    // Nachricht mit ID an den Server senden

    const messageData = {
        id: msgID,
        to_user: to_user,
        to_group: to_group,
        text: value,
    };

    // sendMessageToAPI(messageData);

    // Approach via socket
    socket.emit('chat-message', { id: msgID, to_user: to_user, to_group: to_group, text: value }); 
    
    setTimeout(() => {
             document.getElementById('message-input').focus();
    }, 1000);
}

// Nachricht senden
document.getElementById('chat-form').addEventListener('submit', sendMessage);
document.getElementById('send-button').addEventListener("touchend", (e) => {
    e.preventDefault();
    sendMessage(e); // Event für Touch-Ende hinzufügen
});
    



// Load last Messages on window load    
window.onload = async function(){
    await getUserData();
    socket.emit("get-chat-history");
    requestHistoryMessages(0,100);
    setTimeout(() => {
        scrollMessagesToBottom();
    }, 2500);
}  

// Automatic reload when scrolled to the top
messagesUL.addEventListener('scroll', function() {
    if (messagesUL.scrollTop === 0) {
        if (currently_loading_messages == false){
            console.log("at the top, triggerin reload");
            currently_loading_messages = true;
            let num = messagesUL.querySelectorAll('.message').length;
            console.log("REQUESTING:", num, 50);
            requestHistoryMessages(num, 50);
        }
    }
});

document.getElementById('logout-button').addEventListener('click', async () => {
try {
    const response = await fetch('/api/logout', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    });

    const result = await response.json();

    if (result.success) {
        // alert('Logout success!')
        window.location.href = '/logout';  // Redirect to login page after logout
    } else {
        alert('Logout failed');
    }
} catch (error) {
    console.error('Error logging out:', error);
}
});




// socket.on('disconnect', () => {
//     console.log('Socket disconnected, reloading the page...');
    
//     // Optionally, you can check the reason or do other actions before reloading
//     window.location.reload();  // Reload the page
// });