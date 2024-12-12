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


let FETCHING_FILES = false;



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
function check_and_setup_darkmode() {
    const switchCheckbox = document.getElementById("switch-checkbox");
    const link = document.getElementById("theme-styles");
    switchCheckbox.addEventListener("change", function () {
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

    if (darkmode == true) {
        switchCheckbox.checked = true;
    } else {
        switchCheckbox.checked = false;
    }

    switchCheckbox.dispatchEvent(new Event('change'));
}


// Enable / Disable darkmode via TRUE / FALSE
function set_darkmode(value) {
    const switchCheckbox = document.getElementById("switch-checkbox");
    const link = document.getElementById("theme-styles");
    DARKMODE = value;

    switchCheckbox.checked = true;

    switchCheckbox.dispatchEvent(new Event('change'));
}


// For Mobile View: Lets you choose wether to display contact list OR te chat
function setContacts(value) {
    if (!CONTACT_WINDOW_LOCKED) {
        if (value == false) {
            document.getElementById("contacts-window").classList.add("hidden-mobile-window");
            document.getElementById("chat-window").classList.remove("hidden-mobile-window");
            CONTACTS_DISPLAYED = false;
        } else {
            document.getElementById("contacts-window").classList.remove("hidden-mobile-window");
            document.getElementById("chat-window").classList.add("hidden-mobile-window");
            CONTACTS_DISPLAYED = true;
        }
    }

}

// Force version, that also works with CONTACT_WINDOW_LOCKED enabled
function setContactsForce(value) {
    CONTACT_WINDOW_LOCKED = false;
    setContacts(value);
}

// For Mobile View: Open contact chat
function choosePersonalChatwSwitchWindow(id, name, pic, showHighlight=true) {
    choosePersonalChat(id, name, pic, showHighlight);
    setContactsForce(false);
    
}

function showBigProfilePicForCall(id) {
    let src;
    let name;

    // const bigProfileWrapperCall = document.getElementById("profile-wrapper-call");
    const bigProfileDisplayCall = document.getElementById("profile-pic-display-call");
    const bigProfileTextCall = document.getElementById("profile-text-call");


    for (let child of contact_list.children) {
        if (child.getAttribute('data-id') == id) {
            src = child.getAttribute('data-imgsrc');
            name = child.getAttribute('data-username');
            email = "";
            break;
        }
    }
    if (src) {
        bigProfileDisplayCall.innerHTML = '';
        bigProfileTextCall.innerHTML = `<div><b>${name}</b></div>
                                    <div>${email}</div>`;


        const img = document.createElement('img');
        img.src = src;
        img.alt = "Profile Picture";
        img.classList.add('big-profile-pic');

        bigProfileDisplayCall.appendChild(img);
    }

}

function showBigProfilePicByUrl(src, name, email){

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

// Display the big profile picture 
function showBigProfilePic(id) {
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
function scrollMessagesToBottom() {
    messagesUL.scrollTop = messagesUL.scrollHeight;
}

// Send a socket request to get the last chat messages 
// Starting from the <start_at_id> message in the database and from there get <number_of_messages> messaes
function requestHistoryMessages(start_at_id, number_of_messages) {
    const user2_id = CURRENTLY_CHATTING_WITH_ID;
    socket.emit('get-history', { user2_id, start_at_id, number_of_messages });
}




// Search for contact ID in the displayed list -> returns null || Li element
function getContactLi(id) {
    if (id == null) {
        return null;
    }
    for (let child of contact_list.children) {
        if (child.getAttribute('data-id') == id) {
            return child;
        }
    }
    return null;
}




// Checks if contact is already loaded or not present in the list -> returns true / false
function isContactLoaded(id) {
    return getContactLi(id) != null;
}




// Add a new contact to the contacts list
async function addContactToList(picture_path, contact_id, contact_username, last_msg_text, selected_class) {
    let exists = await checkFileExists(picture_path);

    try {
        if (picture_path == null || !exists) {
            picture_path = '/images/profile.png';
        }
    } catch (error) {
        picture_path = '/images/profile.png';
    }


    if (contact_username == "AI" || contact_id == 1){
        picture_path = "/images/ai_img.png";
    }

    if (!picture_path.startsWith("/")){
        picture_path = "/" + picture_path;
    }



    contact_list.insertAdjacentHTML('beforeend',
        `<li class="contact-container ${selected_class}" data-id=${contact_id} data-imgsrc='${picture_path}' data-username='${contact_username}' onclick="choosePersonalChatwSwitchWindow(${contact_id}, '${contact_username}', '${picture_path}')">
            <button type="button" class="contact-profile-button" onclick="event.stopPropagation(); showBigProfilePic(${contact_id});">
                <img src='${picture_path}'>
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

async function addContact(id, name, picture_path = null, showHightlight = true) {

    const resultsContainer = document.getElementById('user-list');
    const ct_wrapper = document.getElementById('drop-down-users');
    const ct_bg = document.getElementById('drop-down-background-modal');
    const user_search_input = document.getElementById('user-search-input');


    // Reset and hide the search results
    resultsContainer.innerHTML = '';
    ct_wrapper.style.opacity = "0";
    ct_bg.style.opacity = "0";
    user_search_input.value = "";
    setTimeout(() => {
        ct_bg.style.display = "none";
        ct_wrapper.style.display = "none";
    }, 250);


    let exists = await checkFileExists(picture_path);

    try {
        if (picture_path == null || !exists) {
            picture_path = '/images/profile.png';
        }
    } catch (error) {
        picture_path = '/images/profile.png';
    }


    // Check if contact already exists
    const li_element = getContactLi(id);
    if (li_element != null) {
        setTimeout(() => {
            choosePersonalChatwSwitchWindow(id, name, picture_path, showHightlight);
        }, 50);
        return li_element; // Exit function, return false, list-element  (no new contact added, already present)
    }


    selected_class = "";


    // Add "Du" for own user (when chatting with own account back)
    if (id == MY_USER_ID && !name.includes("(Du)")) {
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
    return new_contact_div;

}




// Is triggered by typing in the search bar, requests & then displays all users whose's name matches the search string
async function findUser() {
    const searchName = document.getElementById('user-search-input').value;
    const ct_wrapper = document.getElementById('drop-down-users');
    const ct_bg = document.getElementById('drop-down-background-modal');
    const resultsContainer = document.getElementById('user-list');


    // Decide wether to search & display results / abandon the search
    if (searchName == "") {
        resultsContainer.innerHTML = '';
        ct_bg.style.opacity = "0";
        ct_wrapper.style.opacity = "0";
        setTimeout(() => {
            ct_wrapper.style.display = "none";
            ct_bg.style.display = "none";
        }, 250);
        return;
    } else {
        ct_wrapper.style.display = "block";
        ct_bg.style.display = "block";
        setTimeout(() => {
            ct_wrapper.style.opacity = "1";
            ct_bg.style.opacity = "1";
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
            for (let user of data.users) {
                const userDiv = document.createElement('div');
                // Add marker for own user
                if (user.id == MY_USER_ID) {
                    user.username += " (Du)";
                }

                // New contacts have a plus, already chatted-with users are displayed with another mark
                let img_path = "/images/addcontact.png";
                if (isContactLoaded(user.id)) {
                    img_path = "/images/done.png";
                }

                let profile_picture = user.profile_picture;

                if (profile_picture != null) {
                    if (profile_picture[0] != "/") {
                        profile_picture = "/" + profile_picture;
                    }
                    let exists = await checkFileExists(profile_picture);
                    if (!exists) {
                        profile_picture = "/images/profile.png";
                    }
                } else {
                    profile_picture = "/images/profile.png";
                }

                // Create div with data & Add to result list
                userDiv.innerHTML = `<button class="search-bar-user" data-id="${user.id}">
                                        <img class="user-searchlist-add-icon" src="${img_path}" onclick="addContact(${user.id}, '${user.username}', '${profile_picture}')">
                                        <img class="small-search-profile-pic" src="${profile_picture}" onclick="showBigProfilePicByUrl('${profile_picture}', '${user.username}', '');">
                                        ${user.username}
                                    </button>`; // <br>Email: ${user.email}
                resultsContainer.appendChild(userDiv);
            }

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
    console.log("Updating selected chat", contact_list.children.length);
    for (let child of contact_list.children) {
        const contactButton = child.querySelector('.choose-contact-button');
        child.classList.remove("selected-chat-user");
        if (contactButton && contactButton.getAttribute('data-id') == CURRENTLY_CHATTING_WITH_ID) {
            child.classList.add("selected-chat-user");
        }
    }
}


// Opens a new personal chat, loads and displays it
async function choosePersonalChat(user_id, username, picture_path = null, showHightlight = true) {
    if (user_id == 1 || username == "AI"){
        document.getElementById("openFilesButton").style.display = "none";
        document.getElementById("call-btn").style.display = "none";
        document.getElementById("file-button").style.display = "none";
    } else {
        document.getElementById("openFilesButton").style.display = "flex";
        document.getElementById("call-btn").style.display = "flex";
        document.getElementById("file-button").style.display = "flex";        
    }

    const files_list = document.getElementById("files-list");
    files_list.style.minHeight = "0px";
    files_list.style.height = "0px";

    setTimeout(()=> {
        files_list.style.display = "none";
    }, 400);
    files_list.innerHTML = "";
    console.log("USER selected for chatting", username, user_id);

    // For Mobile view, contact info & image on top of the chat
    if (username != null && username != false) {
        document.getElementById("contact-info").innerText = username;
    }
    if (picture_path != null) {
        // picture_path = `/${picture_path}`;
        let exists = await checkFileExists(picture_path);
        if (!exists) {
            picture_path = "/images/profile.png";
        }
        if (!picture_path.startsWith("/")){
            picture_path = "/" + picture_path;
        }

        document.getElementById("user-image-img").src = picture_path;
        document.getElementById("user-image-img").onclick = function () {
            showBigProfilePic(user_id);
        };
    } else {
        document.getElementById("user-image-img").src = "/images/profile.png";
        document.getElementById("user-image-img").onclick = function () {
            showBigProfilePic(user_id);
        };
    }

    // Display a flash to highlight the update of the chat
    if (showHightlight) {
        messages_div = document.getElementById("messages");
        if (!DARKMODE) {
            messages_div.style.border = "2px solid lightseagreen";
            messages_div.style.backgroundColor = "rgba(32, 178, 170, 0.1)";
        } else {
            messages_div.style.border = "2px solid rgb(106, 81, 145)";
            messages_div.style.backgroundColor = "rgba(106, 81, 145, 0.2)";
        }
        setTimeout(() => {
            messages_div.style.border = "2px solid transparent";
            if (!DARKMODE) {
                messages_div.style.backgroundColor = "#ededed";
            } else {
                messages_div.style.backgroundColor = "#161124";
            }
        }, 250);
    }

    
    prev_id = CURRENTLY_CHATTING_WITH_ID;

    // Change IDs
    CURRENTLY_CHATTING_WITH_ID = user_id;
    CURRENT_CHAT_GROUP = null; // Personal Chat -> Group ID is null!

    
    // Update the highlighted contact div
    updateSelectedChatDisplay();

    // Return if the clicked chat partner is the same as the previous
    if (prev_id == CURRENTLY_CHATTING_WITH_ID) {
        return;
    }

    // Delete previous messages, Request 100 of the new chat partner from the server
    messagesUL.innerHTML = "";
    requestHistoryMessages(0, 100);
    FIRST_LOAD = true; // Flag to prevent buggy scrolling in the beginning

    document.getElementById('message-input').focus(); // Focus chat input, to allow direct texting onload
}






// Open user settings page in new tab
function openSettingsPage() {
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
function addMessage(message, messageType, on_top = false) {
    // messageType can be 'pending' / 'sent' / 'received'

    const li = document.createElement('li');
    li.classList.add("message-container");
    const msg = document.createElement('div');

    msg.innerText = message;

    msg.classList.add('message');
    msg.classList.add('new-message');

    switch (messageType) {
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

    if (on_top) {
        messagesUL.insertBefore(li, messagesUL.firstChild);
    } else {
        messagesUL.appendChild(li);
    }

    setTimeout(() => {
        msg.classList.add('expanded');
    }, 10);

    return li;
}

// Display last sent message in the contact field 
async function updateLastMessage(from_name, chat_partner_id, text) {

    const contactItems = document.querySelectorAll('.contact-container');

    contactItems.forEach(item => {
        const button = item.querySelector('.choose-contact-button'); // Select the button
        const contactId = button.getAttribute('data-id');
        if (contactId == chat_partner_id) {
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
    if (li) {
        msg = li.querySelector("div");
    } else {
        msg = null;
    }
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

            if (msg) {
                msg.classList.remove('pending-message'); // Entfernt den Pending-Status
                msg.classList.add('sent-message'); // Fügt die normale Nachricht-Klasse hinzu
                console.log("Message confirmed by server as 'sent': " + msgID);
                delete pending_messages[msgID]; // Entferne das Pending-Tracking
            }
        } else {
            const errorData = await response.json();
            console.error('Error:', errorData.error);
            if (msg) {
                msg.style.backgroundColor = "red";
                delete pending_messages[msgID]; // Entferne das Pending-Tracking
            }
        }
    } catch (error) {
        console.error('Request failed:', error);
        if (msg) {
            msg.style.backgroundColor = "darkred";
            delete pending_messages[msgID]; // Entferne das Pending-Tracking
        }
    }
}


// Send a custom message directly to the current chat user
function sendCustomMessage(txt) {
    if (!CURRENTLY_CHATTING_WITH_ID && !CURRENT_CHAT_GROUP) {
        console.error("No valid recipient for the message.");
        return;
    }

    // Construct message data
    const msgID = Date.now(); // Unique message ID using current time
    const messageData = {
        id: msgID,
        to_user: CURRENTLY_CHATTING_WITH_ID,
        to_group: CURRENT_CHAT_GROUP,
        text: txt,
    };

    // Send the message via socket to the server
    socket.emit('chat-message', messageData);

    
    const msgLi = addMessage(txt, 'sent'); 
    setTimeout(scrollMessagesToBottom, 0);

    // Update the last sent message in the contact field
    updateLastMessage("Du", CURRENTLY_CHATTING_WITH_ID, txt);

    // Ensure focus is back on the input field after sending
    setTimeout(() => {
        document.getElementById('message-input').focus();
    }, 100);
}


// Send message to the server via Socket
async function sendMessage(event) {
    event.preventDefault();
    const msgID = Date.now();

    if (selectedFile != null) {
        await sendFile();
        setTimeout(() => {
            sendCustomMessage("[Datei gesendet]");
        }, 500);
    }

    if (input.value == "") {
        return;
    }
    let msgLi = addMessage(input.value, 'pending');
    pending_messages[msgID] = msgLi;

    setTimeout(scrollMessagesToBottom, 0);

    let to_user = CURRENTLY_CHATTING_WITH_ID;

    let to_group = CURRENT_CHAT_GROUP;


    if (!to_user && !to_group) {
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


async function fetchProfilePicture() {
    console.log("Fetching profile picture...");

    const profileImageElement = document.getElementById('profileImage');

    try {
        // Make the API request to the backend and await the response
        const response = await fetch('/api/get-my-info');
        const data = await response.json(); // Parse the JSON response from the backend

        // Get the profile picture path from the response
        let profilePicturePath = data.profile_picture;

        // If the element exists and the profile picture path is not null
        if (profileImageElement && profilePicturePath != null) {
            // Ensure the profile picture path starts with "/"
            if (!profilePicturePath.startsWith("/")) {
                profilePicturePath = "/" + profilePicturePath;
            }

            // Check if the file exists on the server
            let exists = await checkFileExists(profilePicturePath);
            if (!exists) {
                profilePicturePath = '/images/profile.png'; // Fallback if file doesn't exist
            }

            profileImageElement.src = profilePicturePath;

            console.log("Profile pic loaded and set to:", profilePicturePath);

        } else {
            profileImageElement.src = '/images/profile.png'; // Default image if no profile picture is provided
        }
    } catch (error) {
        console.error('Error fetching profile picture:', error);
        // Optionally, set a default image in case of an error
        profileImageElement.src = '/images/profile.png';
    }
}


function reloadMsgsWhenReachingTop() {
    if (messagesUL.scrollTop === 0) {
        if (currently_loading_messages == false) {
            console.log("at the top, loading more messages...");
            currently_loading_messages = true;
            let num = messagesUL.querySelectorAll('.message').length;
            requestHistoryMessages(num, 50);
        }
    }
}

// Switch between uploading file / deleting uploaded file
function fileButtonLogic() {
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

function fileUploadLogic() {
    if (!fileInput.files[0]) {
        console.error('No file selected');
        return;
    }

    selectedFile = fileInput.files[0];
    fileButtonImage.src = '/images/clear2.png'; // Change button to clear image

    console.log("File selected: ", selectedFile);

}


function sendFile() {
    // Prepare FormData
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("sender_id", MY_USER_ID);  // Replace with dynamic user ID
    formData.append("receiver_id", CURRENTLY_CHATTING_WITH_ID);

    // Send file to server
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }
            fileButtonLogic();
            setTimeout(() => {
                fetchFiles();
            }, 100);
            return response.json();
        })
        .then(data => {
            console.log('File uploaded successfully:', data);
        })
        .catch(error => {
            console.error('Error uploading file:', error);
        });
}




async function fetchUserAndLastMessage(userId) {
    const apiUrl = '/api/get-user-and-last-message';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId, // User whose data we want to fetch
            }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('User Info:', data.user);
        console.log('Last Message:', data.lastMessage);

        return data;

    } catch (error) {
        console.error('Error fetching user and last message:', error);
    }
    return null;
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

        sendCustomMessage("[Anruf gestartet]");



    } catch (error) {
        console.error('Call setup error:', error);
    }
}


function trigger_call() {
    const selectedUserId = CURRENTLY_CHATTING_WITH_ID; 

    if (selectedUserId) {
        startCall(selectedUserId);

        // Optionally show call interface
        document.getElementById('call-container').style.display = 'block';
        showBigProfilePicForCall(selectedUserId);
    } else {
        alert('Please select a user to call');
    }
}

function trigger_end_call() {
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
    
    sendCustomMessage("[Anruf beendet]");
}

socket.on('response-chat-history', (rows) => {
    console.log("Received recent chats:", rows.messages);
    let contact_username;

    let contact_id;


    let selected_class;

    let last_msg_text;

    let picture_path;



    for (let chat of rows.messages) {

        let txtmessage = chat.message;

        // Socket returns list of last messages from all chats, -> determine from who the message came
        if (chat.group_name == null) {
            if (chat.sender_username == MY_USER) {
                contact_username = chat.receiver_username;
                contact_id = chat.receiver_id;
                last_msg_text = `<b style="color: darkgray">Du:</b><br>${txtmessage}`;
                picture_path = chat.receiver_picture;
            } else {
                contact_username = chat.sender_username;
                contact_id = chat.sender_id;
                last_msg_text = `<b style="color: darkgray">${contact_username}:</b><br>${txtmessage}`;
                picture_path = chat.sender_picture;
            }

            if (chat.receiver_id == chat.sender_id){
                contact_username += " (Du)";
            }

            selected_class = "";


            if (picture_path == null){
                picture_path = '/images/profile.png';
            }
            if (!picture_path.startsWith("/")){
                picture_path = "/" + picture_path;
            }

            // Insert new contact into display list
            addContactToList(picture_path, contact_id, contact_username, last_msg_text, selected_class);

            if (CURRENTLY_CHATTING_WITH_ID == null){
                // CURRENTLY_CHATTING_WITH_ID = contact_id;
                messagesUL.innerHTML = "";
                choosePersonalChat(contact_id, contact_username, picture_path, showHighlight=false);
                CURRENTLY_CHATTING_WITH_ID = contact_id;
                // setTimeout(() => {
                //     updateSelectedChatDisplay();
                // }, 100);
                FIRST_LOAD = true;
                requestHistoryMessages(0, 100);
            }

        } else {
            console.log("bro really thought");
        }
    }

});


// Socket for receiving the requested chat history 
socket.on('response-history', (data) => {
    console.log('Received chat messages:', data); // Process the returned data
    if (!data.success) { return; };

    // Add messages to List
    let messages = data.messages;
    let msg;
    for (let i = messages.length - 1; i >= 0; i--) {
        const scrollPosition = messagesUL.scrollTop;
        const offsetHeightBefore = messagesUL.scrollHeight;
        msg = messages[i];
        let messageType = 'sent';
        if (msg.sender_id == CURRENTLY_CHATTING_WITH_ID) {
            messageType = 'received'
        }
        addMessage(msg.message, messageType, on_top = true);
        if (on_top) {
            const offsetHeightAfter = messagesUL.scrollHeight;
            messagesUL.scrollTop = scrollPosition + (offsetHeightAfter - offsetHeightBefore);
        }
    }
    if (FIRST_LOAD == true) {
        scrollMessagesToBottom();
        FIRST_LOAD = false;
    }

    currently_loading_messages = false;
});


// Socket for receiving messages
socket.on('chat-message', async (msg) => { // Make the callback async

    const from_user = msg.from_user;
    const from_username = msg.from_username;
    const text = msg.text;



    if (from_user == CURRENTLY_CHATTING_WITH_ID) {
        console.log("Received message: ", msg);
        let li = addMessage(text, 'received');
        if (isListNearBottom()) {
            setTimeout(scrollMessagesToBottom, 0);
        }
        if (text == "[Datei gesendet]") {
            setTimeout(() => {
                fetchFiles();
            }, 500);
        }
    } else {
        if (!isContactLoaded(from_user)){
            console.log("Received message from user that is currently not chatted with: ", msg);

            try {
                const data = await fetchUserAndLastMessage(from_user); // Use `await` to fetch data
                

                if (data) {
                    console.log(data);

                    let picture_path = data.user.profile_picture;
                    if (!picture_path.startsWith("/")){
                        picture_path = "/" + picture_path;
                    }
                
                    addContactToList(picture_path, from_user, from_username, data.lastMessage, "");
                }
            } catch (error) {
                console.error("Error fetching user and last message:", error);
            }
        }
    }
    updateLastMessage(from_username, from_user, text);
});


// Old approach, now API call -> different handling

// Message confirmed as received by the server -> "Sent"
socket.on('message-confirmation', (output) => {
    if (output.success == true) {
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

    document.getElementById('call-container').style.display = 'block';

    // Prompt user to accept the call
    if (confirm(`${data.from_username} ruft an. Anruf annehmen?`)) {

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


        if (!isContactLoaded(remoteUserId)){
            try {
                const data = await fetchUserAndLastMessage(remoteUserId); // Use `await` to fetch data
                
    
                if (data) {
                    console.log(data);
    
                    let picture_path = data.user.profile_picture;
                    if (!picture_path.startsWith("/")){
                        picture_path = "/" + picture_path;
                    }

                    let last_message = data.lastMessage || "";
                
                    addContactToList(picture_path, remoteUserId, data.user.username, last_message, "");
                }
            } catch (error) {
                console.error("Error fetching user and last message:", error);
            }
        }
    
    
        choosePersonalChatwSwitchWindow(remoteUserId, data.from_username, null);
    
    }
});


socket.on('call-answered', async (data) => {
    await peerConnection.setRemoteDescription(data.answer);
});


// Client-side code to handle 'call-ended' event
socket.on('call-ended', (data) => {
    // Hide the call container when the call ends
    document.getElementById('call-container').style.display = 'none';
    console.log("Call ended.");
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



async function checkFileExists(fileUrl) {
    console.log("\t\tChecking FILE:", fileUrl);
    
    try {
        const response = await fetch(fileUrl, { method: 'HEAD' });
        if (!response.ok){
            console.log("The 404 error is by design, to check the existence of files on the server (if file is not present).");
        }
        return response.ok; // true if file exists, false if not
    } catch (error) {
        console.error('Error checking file existence:', error);
        return false; // If there's an error, assume file doesn't exist
    }
}



async function fetchFiles() {
    
    if (FETCHING_FILES == true){return;}
    FETCHING_FILES = true;

    let isTheSame = false;
    const filesListDiv = document.getElementById('files-list');

    if (filesListDiv.dataset.userid != CURRENTLY_CHATTING_WITH_ID){
        filesListDiv.innerHTML = ''; // Clear existing content instantly, if the previous files were not from the current user 
    } else {
        isTheSame = true;
    }

    filesListDiv.dataset.userid = CURRENTLY_CHATTING_WITH_ID; // Set the data file id to the current user

    // filesListDiv.style.minHeight = "0px";
    // filesListDiv.style.height = "0px";

    if (filesListDiv.innerHTML == ""){
        filesListDiv.innerHTML = '<div class="files-info-div">Dateien werden geladen...</div>';
        setTimeout(()=>{
        filesListDiv.style.minHeight = "50px";
        filesListDiv.style.height = "50px";
        }, 50);
    }


    try {
        // Fetch files from the backend
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from_user: CURRENTLY_CHATTING_WITH_ID }),
        });

        // Handle response
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error fetching files:', errorData.message);
            filesListDiv.innerHTML = '<div class="files-info-div">Fehler beim Laden der Dateien ⚠</div>';
            setTimeout(()=>{
            filesListDiv.style.minHeight = "50px";
            filesListDiv.style.height = "50px";
            },50);
            return;
        }

        const data = await response.json();


        const types = [
            "jpg", "png", "pdf", "txt", "doc", "exe", "mp3", "mp4", "zip"
        ]
                
        let results = [];

        let exists;
        // Iterate through the files and add them to the DIV
        for (const file of data.files) {
            const fileElement = document.createElement('div');
            fileElement.classList.add("file-list-icon");
            fileElement.classList.add("highlight-on-hover");

            if (file.file_path == null){continue}

            if (!file.file_path.startsWith("/")){
                file.file_path = "/" + file.file_path;
            }
            
            // Use await for checking the file existence
            exists = await checkFileExists(file.file_path);
            if (exists) {
                // If file exists, show download icon
                console.log(file.file_path);
                let type = file.file_path.split(".").pop();

                if (type != null){
                    type = type.toLowerCase();
                }else {
                    type = "";
                }
                
                if (types.includes(type)){
                    iconexists = await checkFileExists(`/images/downloadFile_${type}.png`);
                }else {
                    iconexists = false;
                }
                // if (!iconexists){type = "default";}
                if (!iconexists){
                    fileElement.innerHTML = `<img style="width: 80%; height: 80%; object-fit: cover" src="/images/downloadFile_default.png">
                                             <div class="file-list-icon-text">${type}</div>`;
                }else if (type == "jpg" || type == "png"){
                    fileElement.innerHTML = `<img style="width: 80%; height: 80%; object-fit: cover" src="${file.file_path}">
                                                                 <div class="file-list-icon-text">${type}</div>`;

                }else {
                    fileElement.innerHTML = `<img style="width: 80%; height: 80%; object-fit: cover" src="/images/downloadFile_${type}.png">`;
                }
                fileElement.style.cursor = 'pointer'; //url("/images/download-cursor-small.png"),

                fileElement.onclick = () => {
                    fileElement.style.cursor = 'wait'; 
                    downloadFile(file.file_path)
                        .then(() => {
                            // Reset the cursor after download has started
                            
                            setTimeout(() => {
                                console.log("RESET TO IMG CURSOR");
                                fileElement.style.cursor = 'pointer'; //url("/images/download-cursor-small.png"),
                            }, 100);
                        });
                };
            } else {
                // If file does not exist, show "deleted" icon
                fileElement.innerHTML = `<img style="width: 70%; height: 70%; object-fit: cover" src="/images/downloadLostFile.png">`;

                fileElement.onclick = () => {
                    alert("Diese Datei wurde gelöscht 🗑️");
                };
            }

            // Add styling for better visibility
            fileElement.style.width = "50px";
            fileElement.style.height = "50px";

            // fileElement.style.cursor = 'pointer';
            if (isTheSame == true){
                fileElement.style.opacity = 1;
            } else {
                fileElement.style.opacity = 0;
            }

            // Append the file element to the files list
            results.push(fileElement);
        }

        filesListDiv.innerHTML = ''; // Clear existing content

        if (results.length == 0){
            filesListDiv.innerHTML = '<div class="files-info-div">Keine Dateien gefunden ⛒</div>';
            setTimeout(()=>{
            filesListDiv.style.minHeight = "50px";
            filesListDiv.style.height = "50px";
            },50);
        } else {
            setTimeout(()=>{
            filesListDiv.style.minHeight = "150px";
            filesListDiv.style.height = "150px";
            },50);
        }
        

        // Add new files        
        for (const fileElement of results) {
            filesListDiv.appendChild(fileElement);
            setTimeout(()=> {
                fileElement.style.opacity = 1;
            }, 100);
        }


    } catch (error) {
        console.error('Error during fetch operation:', error);
        filesListDiv.innerHTML = '<div class="files-info-div">Fehler beim Laden der Dateien ⚠</div>';
        setTimeout(()=>{
        filesListDiv.style.minHeight = "50px";
        filesListDiv.style.height = "50px";
        },50);
    } finally {
        FETCHING_FILES = false;
    }
}


// Function to download file
async function downloadFile(filePath) {
    try  {
        const link = document.createElement('a');
        link.href = filePath; // Assumes `file_path` is a direct URL to the file
        link.download = filePath.split('/').pop(); // Extract the file name from the path
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error){
        console.error("Download failed:",  error);
    }
}


// Function to Add a new group to the server. Because of time problems, the implementation of displaying group chats isnt working.
// Therefore, the entire function is postponed to a later release

//   async function addGroupToServer(){
//     // Get the group name and user IDs from the form inputs
//     const groupName = document.querySelector('input[placeholder="Gruppen-Name"]').value;
//     const userInput = document.querySelector('input[placeholder="Users, separated by \';\'"]').value;

//     // Parse user IDs (split by semicolon, and remove leading/trailing spaces)
//     const userIds = userInput.split(';').map(userId => userId.trim()).filter(userId => userId !== '');

//     console.log(userIds);

//     // Validate inputs
//     if (!groupName || userIds.length === 0) {
//         alert("Please enter a valid group name and at least one user.");
//         return;
//     }

//     try {
//         // Send the data to the backend
//         const response = await fetch('/api/add-new-group', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 groupName: groupName,
//                 userIds: userIds
//             })
//         });

//         // Handle the response
//         const result = await response.json();
//         if (result.success) {
//             // Group created successfully
//             document.getElementById("add-group-modal").style.display = 'none';
//             document.getElementById("add-group-form").reset();
//             setTimeout(()=>{
//                 alert(result.message);
//             }, 50);

//         } else {
//             // Group creation failed
//             alert(result.message);
//         }
//     } catch (error) {
//         console.error('Error creating group:', error);
//         alert('An error occurred while creating the group. Please try again.');
//     }
// }



// // Function to delete chat
// async function deleteChat() {
//     if (!CURRENTLY_CHATTING_WITH_ID) {
//         console.error("No user is currently selected for chatting.");
//         alert("Please select a user to delete the chat with.");
//         return;
//     }

//     try {
//         // Show a confirmation dialog
//         const confirmDelete = confirm("Are you sure you want to delete this chat?");
//         if (!confirmDelete) return;

//         // Make the API request
//         const response = await fetch('/api/delete-chat', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 other_user_id: CURRENTLY_CHATTING_WITH_ID,
//             }),
//         });

//         // Handle the response
//         const result = await response.json();

//         if (response.ok) {
//             alert(`Chat deleted successfully. ${result.affectedRows} messages were removed.`);
//         } else if (response.status === 404) {
//             alert("No messages found between the specified users.");
//         } else {
//             alert(`Error deleting chat: ${result.error || 'Unknown error occurred.'}`);
//         }
//     } catch (error) {
//         console.error("Error while deleting chat:", error);
//         alert("An unexpected error occurred while trying to delete the chat.");
//     }
// }



// Load last Messages on window load    
window.onload = async function () {

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
    console.log("Fetching users profile picture");
    fetchProfilePicture();
    console.log("Socket-call to load chat history")
    socket.emit("get-chat-history");
    // fetchGroupChatHistory();

    FIRST_LOAD = true;

    let width = document.body.clientWidth;
    let height = document.body.clientHeight;
    if (width <= 600) {
        setContactsForce(CONTACTS_DISPLAYED); // If the screen is resized, make sure one window is hidden
    }

    document.getElementById('call-btn').addEventListener('click', trigger_call);
    document.getElementById('end-call-btn').addEventListener('click', trigger_end_call);

    document.getElementById("search-button").addEventListener("click", findUser);
    document.getElementById("user-search-input").addEventListener("input", findUser);



    document.getElementById("openFilesButton").addEventListener('click', async function () {
        const files_list = document.getElementById("files-list");
        style = files_list.style.display;
        if (style == "flex") {
            files_list.style.overflowY = "hidden";
            files_list.style.minHeight = "0px";
            files_list.style.height = "0px";
            setTimeout(()=> {
                files_list.style.display = "none";
                files_list.style.overflowY = "auto";
            }, 400);
        } else {
            // files_list.innerHTML = ''; // Clear existing content
            files_list.style.display = "flex";
            files_list.style.overflowY = "auto";
            fetchFiles();
        }
    });


    document.getElementById("messages").addEventListener("click", async function () {
        const files_list = document.getElementById("files-list");
        style = files_list.style.display;
        if (style == "flex") {
            files_list.style.overflowY = "hidden";
            files_list.style.minHeight = "0px";
            files_list.style.height = "0px";
            setTimeout(()=> {
                files_list.style.display = "none";
                files_list.style.overflowY = "auto";
            }, 400);
        }
    });


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

    bigProfileModal.addEventListener("click", function () { bigProfileModal.style.display = "none"; });


    window.addEventListener("resize", function (event) {
        let width = document.body.clientWidth;
        let height = document.body.clientHeight;
        if (width <= 600) {
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



    const resultsContainer = document.getElementById('user-list');
    const ct_wrapper = document.getElementById('drop-down-users');
    const ct_bg = document.getElementById('drop-down-background-modal');
    const user_search_input = document.getElementById('user-search-input');

    ct_bg.addEventListener("click", () => {
        console.log("Stopping search");
        // Reset and hide the search results
        resultsContainer.innerHTML = '';
        ct_wrapper.style.opacity = "0";
        ct_bg.style.opacity = "0";
        user_search_input.value = "";
        setTimeout(() => {
            ct_bg.style.display = "none";
            ct_wrapper.style.display = "none";
        }, 250);
    });



    // document.getElementById("deleteChatButton").addEventListener('click', deleteChat);


    // Close modal when the background is clicked
    // document.getElementById("add-group-modal").addEventListener('click', () => {
    //     document.getElementById("add-group-modal").style.display = "none";
    // });

    // Show modal when the button is clicked
    // document.getElementById("addGroupButton").addEventListener('click', (event) => {
    //     event.stopPropagation();  // Stop event from propagating to the modal background
    //     document.getElementById("add-group-modal").style.display = "flex";
    // });

    // Prevent closing the modal when clicking inside the modal content
    // document.getElementById("add-group-window").addEventListener('click', (event) => {
    //     event.stopPropagation(); // Prevent event from propagating to the background
    // });

    // document.getElementById("create-group-button").addEventListener("click", async (event) => {
    //     event.preventDefault();
    //     addGroupToServer();
    // });


}


