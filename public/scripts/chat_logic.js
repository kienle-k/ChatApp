// Verbindung mit dem Socket.IO-Server herstellen
const socket = io();


var DARKMODE = false;
var FIRST_LOAD = true; //Flag for scrolling down when loading the first time -> will be set to zero after first load

let MY_USER;
let MY_USER_ID;

let CURRENTLY_CHATTING_WITH_ID = null;
let CURRENT_CHAT_GROUP = null;


let CONTACTS_DISPLAYED = true;
let CONTACT_WINDOW_LOCKED = true;

var currently_loading_messages = false;


// File storage
var selectedFile = null;


let peerConnection = null;
let localStream = null;


var pending_messages = [];
const bottomThreshold = 150;



let input;
let messageContainer;
let messagesUL;

let bigProfileModal;
let bigProfileDisplay;
let bigProfileInfo;

let contact_list;

let fileButton;
let fileButtonImage;
let fileInput;



// Function to run pre-load, selects darkmode css
function check_and_setup_darkmode(){
    const switchCheckbox = document.getElementById("switch-checkbox");
    const link = document.getElementById("theme-styles");
    switchCheckbox.addEventListener("change", function() {
    if (switchCheckbox.checked) {
        console.log("Darkmode ON.");
        localStorage.setItem("darkmode", true);
        DARKMODE = true;
        link.href = "/css/chat/dark_styles.css"; 
        document.getElementById("messages").style.backgroundColor = "#161124";
    } else {
        DARKMODE = false;
        console.log("Darkmode OFF.");
        localStorage.setItem("darkmode", false);
        link.href = "/css/chat/light_styles.css";  
        document.getElementById("messages").style.backgroundColor = "#ededed";
    }
    });

    const darkmode = JSON.parse(localStorage.getItem("darkmode"));
    console.log("Stored Darkmode:", darkmode);

    if (darkmode == true){
        switchCheckbox.checked = true;
    } else {
        switchCheckbox.checked = false;
    }

    switchCheckbox.dispatchEvent(new Event('change'));
}


// Enable / Disable darkmode via TRUE / FALSE
function set_darkmode(value){
    const switchCheckbox = document.getElementById("switch-checkbox");
    const link = document.getElementById("theme-styles");
    DARKMODE = value;

    switchCheckbox.checked = true;
    
    switchCheckbox.dispatchEvent(new Event('change'));
}


// For Mobile View: Lets you choose wether to display contact list OR te chat
function setContacts(value){
    if (!CONTACT_WINDOW_LOCKED){
        console.log("Contacts displayed until now:", CONTACTS_DISPLAYED);
        if (value == false){
            document.getElementById("contacts-window").classList.add("hidden-mobile-window");
            document.getElementById("chat-window").classList.remove("hidden-mobile-window");
            CONTACTS_DISPLAYED = false;
        } else {
            document.getElementById("contacts-window").classList.remove("hidden-mobile-window");
            document.getElementById("chat-window").classList.add("hidden-mobile-window");
            CONTACTS_DISPLAYED = true;
        }
        
        console.log("Contacts displayed from now:", CONTACTS_DISPLAYED);
    }

}

// Force version, that also works with CONTACT_WINDOW_LOCKED enabled
function setContactsForce(value){
    CONTACT_WINDOW_LOCKED = false;
    console.log("FORCING");
    setContacts(value);
}

// For Mobile View: Open contact chat
function choosePersonalChatwSwitchWindow(id, name, pic){
    choosePersonalChat(id, name, pic);
    setContactsForce(false);
}

// Display the big profile picture 
function showBigProfilePic(id){
    let src;
    let name;

    for (let child of contact_list.children) {
        if (child.getAttribute('data-id') == id) {
            src = child.getAttribute('data-imgsrc');
            name = child.getAttribute('data-username');
            email = "";
            break; 
        }
    }
    if (src) { 
        bigProfileDisplay.innerHTML = '';
        bigProfileInfo.innerHTML = `<div><b>${name}</b></div>
                                    <div>${email}</div>`;
        
        bigProfileModal.style.display = "flex";

        const img = document.createElement('img');
        img.src = src; 
        img.alt = "Profile Picture"; 
        img.classList.add('big-profile-pic');

        bigProfileDisplay.appendChild(img);
    }
        
}

// Returns bool, if list is scrolled below a certain distance from the bottom
function isListNearBottom() {
    // Calculate the distance from the bottom
    const distanceFromBottom = messagesUL.scrollHeight - messagesUL.scrollTop - messagesUL.clientHeight;
    
    // Return true if within threshold, false otherwise
    return distanceFromBottom < bottomThreshold;
}

// Scrolls the chat message list to the bottom
function scrollMessagesToBottom(){
    messagesUL.scrollTop = messagesUL.scrollHeight;
}

// Send a socket request to get the last chat messages 
// Starting from the <start_at_id> message in the database and from there get <number_of_messages> messaes
function requestHistoryMessages(start_at_id, number_of_messages) {
    const user2_id = CURRENTLY_CHATTING_WITH_ID;
    socket.emit('get-history', { user2_id, start_at_id, number_of_messages });
} 

// Search for contact ID in the displayed list -> returns null || Li element
function getContactLi(id){
    if (id == null){
        return null;
    }
    for (let child of contact_list.children) {
        if (child.getAttribute('data-id') == id) {
            return child;
        }
    }
}
// Checks if contact is already loaded or not present in the list -> returns true / false
function isContactLoaded(id){
    return getContactLi(id) != null;
}

// Add a new contact to the contacts list
async function addContactToList(picture_path, contact_id, contact_username, last_msg_text, selected_class) {
    contact_list.insertAdjacentHTML('beforeend', 
        `<li class="contact-container ${selected_class}" data-id=${contact_id} data-imgsrc='/${picture_path}' data-username='${contact_username}' onclick="choosePersonalChatwSwitchWindow(${contact_id}, '${contact_username}', '${picture_path}')">
            <button type="button" class="contact-profile-button" onclick="event.stopPropagation(); showBigProfilePic(${contact_id});">
                <img src='/${picture_path}'>
            </button>
            <button type="button" class="choose-contact-button" data-id=${contact_id}>
                <div class="contact">${contact_username}</div>
            </button>
            <div class="last-message">${last_msg_text}</div>
        </li>` 
    );

    // Return the last inserted contact element
    return contact_list.lastElementChild;
}

// Add Contact to the chat list
async function addContact(id, name, picture_path = null, showHightlight=true){

    const resultsContainer = document.getElementById('user-list');
    const ct_wrapper = document.getElementById('drop-down-users');
    const user_search_input = document.getElementById('user-search-input');


    // Reset and hide the search results
    resultsContainer.innerHTML = '';
    ct_wrapper.style.opacity = "0";
    user_search_input.value = "";
    setTimeout(()=> {
        ct_wrapper.style.display = "none";
    }, 250);


    // Check if contact already exists
    const li_element = getContactLi(id);
    if (li_element != null){
            choosePersonalChatwSwitchWindow(id, name, picture_path, showHightlight);
            return false, li_element; // Exit function, return false, list-element  (no new contact added, already present)
    }


    selected_class = "";

    try {
        if (picture_path == null || !picture_path.includes("/")){
            picture_path = '/images/profile.png';
        }
    }catch (error){
        picture_path = '/images/profile.png';
    }
    console.log("Picture path of new contact:", picture_path);

    // Add "Du" for own user (when chatting with own account back)
    if (id == MY_USER_ID && !name.includes("(Du)")){
        name += " (Du)";
    }

    // Finally add element to the list
    const new_contact_div = addContactToList(picture_path, id, name, "", selected_class);     
    
    // Switch to the newly added contact chat
    setTimeout(() => {
        choosePersonalChatwSwitchWindow(id, name, picture_path, showHightlight);
    }, 50);

    // Focus the message input (To make direct writing possible)
    document.getElementById('message-input').focus();

    // Return true (contact added successfully) and the list-element
    return true, new_contact_div;

}

// Is triggered by typing in the search bar, requests & then displays all users whose's name matches the search string
async function findUser() {
    const searchName = document.getElementById('user-search-input').value;
    const ct_wrapper = document.getElementById('drop-down-users');
    const resultsContainer = document.getElementById('user-list');


    // Decide wether to search & display results / abandon the search
    if (searchName == ""){
        resultsContainer.innerHTML = '';
        ct_wrapper.style.opacity = "0";
        setTimeout(()=> {
            ct_wrapper.style.display = "none";
        }, 250);
        return;
    } else {
        ct_wrapper.style.display = "block";
        setTimeout(() => {
            ct_wrapper.style.opacity = "1";
        }, 10);
    }

    // Request matching users from backend via POST
    try {
      const response = await fetch('/api/find-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ search_name: searchName })
      });

      const data = await response.json();

      // Reset container for new results
      resultsContainer.innerHTML = '';

      if (data.success && data.users.length > 0) {

        // Add every matching user to the results list
        data.users.forEach(user => {
            const userDiv = document.createElement('div');
            // Add marker for own user
            if (user.id == MY_USER_ID){
                user.username += " (Du)";
            }

            // New contacts have a plus, already chatted-with users are displayed with another mark
            let img_path = "/images/plus2.png";
            if (isContactLoaded(user.id)){
                img_path = "/images/done.png";
            }

            // Create div with data & Add to result list
            userDiv.innerHTML = `<button class="search-bar-user" data-id="${user.id}" onclick="addContact(${user.id}, '${user.username}', '${user.profile_picture}')"><img src="${img_path}"/>${user.username}</button>`; // <br>Email: ${user.email}
            resultsContainer.appendChild(userDiv);
        });

      } else {
        // Display message when no user is matching the string
        resultsContainer.innerHTML = '<div id="no-users">Keine Nutzer gefunden.</div>';
      }
    } catch (error) {
       console.error('An error occurred while searching for users:', error);
    }
}

// Changes the highlighted contact to the one currently chatted with (CURRENTLY_CHATTING_WITH_ID)
async function updateSelectedChatDisplay() {
    console.log("Updating selected chat");
    for (let child of contact_list.children) {
        const contactButton = child.querySelector('.choose-contact-button');
        child.classList.remove("selected-chat-user");
        if (contactButton && contactButton.getAttribute('data-id') == CURRENTLY_CHATTING_WITH_ID) {
            child.classList.add("selected-chat-user");
        }
    }  
}


// Opens a new personal chat, loads and displays it
async function choosePersonalChat(user_id, username, picture_path=null, showHightlight=true) {

    // For Mobile view, contact info & image on top of the chat
    document.getElementById("contact-info").innerText = username;
    if (picture_path != null){
        picture_path = `/${picture_path}`;
        document.getElementById("user-image-img").src = picture_path;
        document.getElementById("user-image-img").onclick = function() {
            showBigProfilePic(user_id);
        };  
    } else {
        document.getElementById("user-image-img").src = "/images/profile.png";
        document.getElementById("user-image-img").onclick = function() {
            showBigProfilePic(user_id);
        }; 
    }
    
    // Display a flash to highlight the update of the chat
    if (showHightlight) {
        messages_div = document.getElementById("messages");
        if (!DARKMODE){
            messages_div.style.border = "2px solid lightseagreen";
            messages_div.style.backgroundColor = "rgba(32, 178, 170, 0.1)";
        }else {
            messages_div.style.border = "2px solid rgb(106, 81, 145)";
            messages_div.style.backgroundColor = "rgba(106, 81, 145, 0.2)";
        }
        setTimeout(() => {
            messages_div.style.border = "2px solid transparent";
            if (!DARKMODE){
                messages_div.style.backgroundColor = "#ededed";
            }else{
                messages_div.style.backgroundColor = "#161124";
            }
        }, 250);
    }

    // Return if the clicked chat partner is the same as the previous
    if (user_id == CURRENTLY_CHATTING_WITH_ID){
        return;
    }

    // Change IDs
    CURRENTLY_CHATTING_WITH_ID = user_id;
    CURRENT_CHAT_GROUP = null; // Personal Chat -> Group ID is null!

    // Update the highlighted contact div
    updateSelectedChatDisplay();
    
    // Delete previous messages, Request 100 of the new chat partner from the server
    messagesUL.innerHTML = ""; 
    requestHistoryMessages(0, 100);
    FIRST_LOAD = true; // Flag to prevent buggy scrolling in the beginning

    document.getElementById('message-input').focus(); // Focus chat input, to allow direct texting onload
}


// Open user settings page in new tab
function openSettingsPage(){
    settingsTab = window.open('/user-settings', '_blank');
    settingsTab.opener = window;
    settingsTab.focus();
}


// Load username & ID of OWN chat user
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

// Add a message to the current chat
function addMessage(message, messageType, on_top=false){
    // messageType can be 'pending' / 'sent' / 'received'

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

    setTimeout(() => {
        msg.classList.add('expanded');
    }, 10);

    return li;
}

// Display last sent message in the contact field 
async function updateLastMessage(from_name, chat_partner_id, text){
    console.log(from_name, chat_partner_id, text );

    const contactItems = document.querySelectorAll('.contact-container');

    contactItems.forEach(item => {
        console.log(item);
        const button = item.querySelector('.choose-contact-button'); // Select the button
        const contactId = button.getAttribute('data-id');
        console.log(button);
        console.log(contactId, chat_partner_id);
        if (contactId == chat_partner_id){
            const lastMessageDiv = item.querySelector('.last-message');
            lastMessageDiv.innerHTML = `<b style="color: darkgray">${from_name}:</b><br>${text}`;
            return;
        }
    });
}


// !!!!UNUSED!!!!!: Sends message to the API Endpoint 
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
    
// Send message to the server via Socket
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


    if (!to_user && !to_group){
        return;
    }

    let value = input.value;

    input.value = ''; // Eingabefeld leeren

    const messageData = {
        id: msgID,
        to_user: to_user,
        to_group: to_group,
        text: value,
    };

    // Handle file sending TODO TODO TODO
    if (selectedFile != null) {
    }

    // sendMessageToAPI(messageData);

    // Send message via socket
    socket.emit('chat-message', messageData); 
    
    // Update last sent message in contact field
    updateLastMessage("Du", to_user, value);

    setTimeout(() => {
             document.getElementById('message-input').focus();
    }, 100);
}


// Get own profile picture
function fetchProfilePicture() {
    const profileImageElement = document.getElementById('profileImage');
    // Make the API request to the backend
    fetch('/api/get-my-info')
      .then(response => response.json()) // Parse the JSON response from the backend
      .then(data => {
        // Get the profile picture path from the response
        const profilePicturePath = data.profile_picture;
  
        // Find the image element where the profile picture will be displayed
       
  
        // If the element exists, set its src attribute to the profile picture path
        if (profileImageElement && profileImageElement != null) {
          profileImageElement.src = profilePicturePath;
        } else {
          profileImageElement.src = '/images/profile.png'; 
        }
      })
      .catch(error => {
        console.error('Error fetching profile picture:', error);
        // Optionally, set a default image in case of an error
        profileImageElement.src = '/images/profile.png';
      });
}


function reloadMsgsWhenReachingTop(){
    if (messagesUL.scrollTop === 0) {
        if (currently_loading_messages == false){
            console.log("at the top, triggerin reload");
            currently_loading_messages = true;
            let num = messagesUL.querySelectorAll('.message').length;
            console.log("REQUESTING:", num, 50);
            requestHistoryMessages(num, 50);
        }
    }
}
  
// Switch between uploading file / deleting uploaded file
function fileButtonLogic(){
    if (selectedFile) {
        // If a file is already uploaded, clear it
        selectedFile = null;
        fileInput.value = ''; // Clear file input
        fileButtonImage.src = '/images/upload2.png'; // Reset to upload image
    } else {
        // Otherwise, trigger file input dialog
        fileInput.click();
    }
}

// 
function fileUploadLogic(){
    if (fileInput.files[0]) {
        selectedFile = fileInput.files[0];
        fileButtonImage.src = '/images/clear2.png'; // Change button to clear image
    }
    console.log("FILE SELECTED: ", selectedFile);
   
}


// WebRTC call implementation


async function startCall(userId) {
    try {
      // Request only audio access (no video)
      localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      });
  
      // Create peer connection
      peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add TURN servers here if needed
        ]
      });
  
      // Add local stream tracks to peer connection
      localStream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind);  // Should log 'audio'
        peerConnection.addTrack(track, localStream);
      });
  
      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
  
      // Send offer to the other user via socket
      socket.emit('call-user', {
        to_user: userId,
        offer: offer
      });
  
      // Handle incoming tracks (only audio)
      peerConnection.ontrack = (event) => {
        const remoteAudio = document.getElementById('remoteAudio');
        if (event.streams[0].getAudioTracks().length > 0) {
          remoteAudio.srcObject = event.streams[0];
        }
      };
  
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            to_user: userId,
            candidate: event.candidate
          });
        }
      };
    } catch (error) {
      console.error('Call setup error:', error);
    }
  }
  

  // In your client-side JavaScript
function trigger_call(){
    const selectedUserId = CURRENTLY_CHATTING_WITH_ID; // Implement this to get the current chat partner's ID
    
    if (selectedUserId) {
      startCall(selectedUserId);
      
      // Optionally show call interface
      document.getElementById('call-container').style.display = 'block';
    } else {
      alert('Please select a user to call');
    }
  }
  
  // Add an end call function
function trigger_end_call(){  
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    
    document.getElementById('call-container').style.display = 'none';
    
    // Optionally emit a 'end-call' event to the other user
    socket.emit('end-call', { to_user: CURRENTLY_CHATTING_WITH_ID });
}


// Socket for receiving the requested chat history 
socket.on('response-history', (data) => {
    console.log('Received chat data:', data); // Process the returned data
    if (!data.success){return; };
    
    // Add messages to List
    let messages = data.messages;
    let msg;
    for (let i=messages.length-1; i>= 0; i--){
        const scrollPosition = messagesUL.scrollTop;
        const offsetHeightBefore = messagesUL.scrollHeight;
        msg = messages[i];
        let messageType = 'sent';
        if (msg.sender_id == CURRENTLY_CHATTING_WITH_ID){
            messageType = 'received'
        }
        addMessage(msg.message, messageType, on_top=true);
        if (on_top) {
            const offsetHeightAfter = messagesUL.scrollHeight;
            messagesUL.scrollTop = scrollPosition + (offsetHeightAfter - offsetHeightBefore);
        }
    }
    if (FIRST_LOAD == true){
        scrollMessagesToBottom();
        FIRST_LOAD = false;
    }

    currently_loading_messages = false;
});


// Socket for receiving messages
socket.on('chat-message', (msg) => {
    console.log("RECEIVED: ", msg);

    from_user =  msg.from_user;
    from_username = msg.from_username;
    text = msg.text;

    updateLastMessage(from_username, from_user, text);

    if (from_user == CURRENTLY_CHATTING_WITH_ID){
        let li = addMessage(text, 'received');
        if (isListNearBottom()) {
            setTimeout(scrollMessagesToBottom, 0);
        }
    } else {
        console.log("Received message from user that is currently not chatted with.", msg);
    }
});

// Old approach, now API call -> different handling

// Message confirmed as received by the server -> "Sent"
socket.on('message-confirmation', (output) => {
    if (output.success == true){
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
    } else {
        alert(output.message);
    }
});


// Socket event listener for incoming call
socket.on('incoming-call', async (data) => {
    const remoteUserId = data.from_user;
  

    choosePersonalChatwSwitchWindow(remoteUserId, data.from_username, null);

    
    document.getElementById('call-container').style.display = 'block';
    
    // Prompt user to accept the call
    if (confirm(`Accept call from ${data.from_username}?`)) {
  
      // Request camera and microphone access
      localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
      });
  
      // Create a peer connection
      peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add TURN servers here if needed
        ]
      });
  
      // Add local stream tracks to the peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
  
      // Set up the ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            to_user: remoteUserId,
            candidate: event.candidate
          });
        }
      };
  
      // Set remote description with the incoming offer
      await peerConnection.setRemoteDescription(data.offer);
      
      // Create an answer to send back to the caller
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send the answer back to the caller
      socket.emit('answer-call', {
        to_user: remoteUserId,
        answer: answer
      });
    }
  });
  

socket.on('call-answered', async (data) => {
  await peerConnection.setRemoteDescription(data.answer);
});


// Client-side code to handle 'call-ended' event
socket.on('call-ended', (data) => {
    // Hide the call container when the call ends
    document.getElementById('call-container').style.display = 'none';
    console.log("Call ended. Hiding the call container.");
});


socket.on('ice-candidate', async (data) => {
  if (peerConnection) {
    await peerConnection.addIceCandidate(data.candidate);
  }
});


socket.on('disconnect', () => {
    console.log('Socket disconnected, reloading the page...');
    
    // Optionally, you can check the reason or do other actions before reloading
    window.location.reload();  // Reload the page
});




// Load last Messages on window load    
window.onload = async function(){

    input = document.getElementById("message-input");
    messageContainer = document.getElementById('message-history-container');
    messagesUL = document.getElementById('messages');

    bigProfileModal = document.getElementById('profile-pic-modal');
    bigProfileDisplay = document.getElementById('profile-pic-display');
    bigProfileInfo = document.getElementById('profile-text');

    contact_list = document.getElementById("contacts");

    fileButton = document.getElementById('file-button');
    fileButtonImage = document.getElementById('file-button-image');
    fileInput = document.getElementById('file-input');


    check_and_setup_darkmode();
    document.getElementById("hide-images").href = "";
    await getUserData();
    console.log("FETCH PIC");
    fetchProfilePicture();
    socket.emit("get-chat-history");

    FIRST_LOAD = true;

    let width = document.body.clientWidth;
    let height = document.body.clientHeight;
    if (width <= 600){
        setContactsForce(CONTACTS_DISPLAYED); // If the screen is resized, make sure one window is hidden
    }

    document.getElementById('call-btn').addEventListener('click', trigger_call);
    document.getElementById('end-call-btn').addEventListener('click', trigger_end_call);

    document.getElementById("search-button").addEventListener("click", findUser);
    document.getElementById("user-search-input").addEventListener("input", findUser);


    // Handle file button click
    fileButton.addEventListener('click', fileButtonLogic);

    // Handle file selection
    fileInput.addEventListener('change', fileUploadLogic);

    // Automatic reload when scrolled to the top
    messagesUL.addEventListener('scroll', reloadMsgsWhenReachingTop);

    // Nachricht senden
    document.getElementById('chat-form').addEventListener('submit', sendMessage);
    document.getElementById('send-button').addEventListener("touchend", (e) => {
        e.preventDefault();
        sendMessage(e); // Event für Touch-Ende hinzufügen
    });
        
    bigProfileModal.addEventListener("click", function(){ bigProfileModal.style.display="none"; });


    window.addEventListener("resize", function(event) {
        let width = document.body.clientWidth;
        let height = document.body.clientHeight;
        if (width <= 600){
            setContactsForce(CONTACTS_DISPLAYED); // If the screen is resized, make sure one window is hidden
        }
    })



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

}  


