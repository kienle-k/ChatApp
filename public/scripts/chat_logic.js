// Verbindung mit dem Socket.IO-Server herstellen
const socket = io();




DARKMODE = false;





var FIRST_LOAD = true; //Flag for scrolling down when loading the first time -> will be set to zero after first load


let MY_USER;
let MY_USER_ID;

// EDIT THESE VALUES TO SET THE CURRENTLY CHATTED WITH USER (CONSCHTI)
let CURRENTLY_CHATTING_WITH_ID = null;
let CURRENT_CHAT_GROUP = null;

var currently_loading_messages = false;

var pending_messages = [];

const input = document.getElementById("message-input");
const messageContainer = document.getElementById('message-history-container');
const messagesUL = document.getElementById('messages');

const bottomThreshold = 150;


const bigProfileModal = document.getElementById('profile-pic-modal');
const bigProfileDisplay = document.getElementById('profile-pic-display');
const bigProfileInfo = document.getElementById('profile-text');


bigProfileModal.addEventListener("click", function(){ bigProfileModal.style.display="none"; });

const contact_list = document.getElementById("contacts");





// async function addContactToList(picture_path, contact_id, contact_username, last_msg_text, selected_class){
//     contact_list.insertAdjacentHTML('beforeend', 
//         `<li class="contact-container ${selected_class}" data-id=${contact_id} data-imgsrc='/${picture_path}' onclick="choosePersonalChat(${contact_id})">
//             <button type="button" class="contact-profile-button" onclick="showBigProfilePic(${contact_id})">
//                 <img src='/${picture_path}'>
//             </button>
//             <button type="button" class="choose-contact-button" data-id=${contact_id}>
//                 <div class="contact">${contact_username}</div>
//             </button>
//             <div class="last-message">${last_msg_text}</div>
//         </li>` 
//     );
// }






let CONTACTS_DISPLAYED = true;
let CONTACT_WINDOW_LOCKED = true;

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

function setContactsForce(value){
    CONTACT_WINDOW_LOCKED = false;
    console.log("FORCING");
    setContacts(value);
}

function choosePersonalChatwSwitchWindow(id, name, pic){
    choosePersonalChat(id, name, pic);
    setContactsForce(false);
}





function check_and_setup_darkmode(){
    const switchCheckbox = document.getElementById("switch-checkbox");
const link = document.getElementById("theme-styles");
    switchCheckbox.addEventListener("change", function() {
        console.log("CHECKCHECK");
    if (switchCheckbox.checked) {
        console.log("Darkmode turned ON.");
        localStorage.setItem("darkmode", true);
        DARKMODE = true;
        link.href = "/css/chat/dark_styles.css";  // Update with the path of the new stylesheet
        document.getElementById("messages").style.backgroundColor = "#161124";
    } else {
        DARKMODE = false;
        console.log("Darkmode turned OFF.");
        localStorage.setItem("darkmode", false);
        link.href = "/css/chat/light_styles.css";  // Update with the path of the new stylesheet
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

function set_darkmode(value){
    const switchCheckbox = document.getElementById("switch-checkbox");
    const link = document.getElementById("theme-styles");
    DARKMODE = value;
    if (value == true){
        switchCheckbox.checked = true;
    } else {
        switchCheckbox.checked = false;
    }

    switchCheckbox.dispatchEvent(new Event('change'));
}


check_and_setup_darkmode();









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


function isContactLoaded(id){
    if (id == null){
        return false;
    }
    for (let child of contact_list.children) {
        if (child.getAttribute('data-id') == id) {
            return true;
        }
    }

}


function showBigProfilePic(id){
    console.log("OPENING IMG");
    // Check if contact already exists

    let src;
    let name;

    for (let child of contact_list.children) {
        console.log(child);
 
        if (child.getAttribute('data-id') == id) {
            src = child.getAttribute('data-imgsrc');
            name = child.getAttribute('data-username');
            email = "Email@email.email" // child.getAttribute('data-email');
            break; // Exit function after finding the match
        }
    }
    console.log(src);

    if (src) { 
       
        bigProfileDisplay.innerHTML = '';
        bigProfileInfo.innerHTML = `<div><b>${name}</b></div>
                                    <div>${email}</div>`;
        
        bigProfileModal.style.display = "flex";

        // Create a new image element
        const img = document.createElement('img');
        img.src = src; // Set the image source
        img.alt = "Profile Picture"; // Set alt text for accessibility
        img.classList.add('big-profile-pic');

        bigProfileDisplay.appendChild(img);
    }
        
}



async function addContact(id, name, picture_path = null, showHightlight=true){

    const resultsContainer = document.getElementById('user-list');
    const ct_wrapper = document.getElementById('drop-down-users');
    const user_search_input = document.getElementById('user-search-input');

    resultsContainer.innerHTML = '';
    ct_wrapper.style.opacity = "0";
    user_search_input.value = "";
    setTimeout(()=> {
        ct_wrapper.style.display = "none";
    }, 250);

    // Check if contact already exists
    for (let child of contact_list.children) {
        if (child.getAttribute('data-id') == id) {
            choosePersonalChatwSwitchWindow(id, name, picture_path, showHightlight);
            return false, child; // Exit function after finding the match, return false as no contact was added, and the contact div
        }
    }

    selected_class = "";

    console.log("THE PATH IS", picture_path);

    try {
        if (!picture_path.includes("/")){
            picture_path = 'images/profile.png';
        }
    }catch (error){
        console.log("EROR");
        picture_path = 'images/profile.png';
    }
    console.log("THE PATH IS", picture_path);

    if (id == MY_USER_ID && !name.includes("(Du)")){
        name += " (Du)";
    }
    const new_contact_div = addContactToList(picture_path, id, name, "", selected_class);     
    
    setTimeout(() => {
        choosePersonalChatwSwitchWindow(id, name, picture_path, showHightlight);
    }, 50);
    document.getElementById('message-input').focus();

    return true, new_contact_div;

}

async function findUser() {
    console.log("SEARCH TRIGGER");

    const searchName = document.getElementById('user-search-input').value;
    const ct_wrapper = document.getElementById('drop-down-users');
    const resultsContainer = document.getElementById('user-list');

    console.log(searchName, ct_wrapper, resultsContainer);

    if (searchName == ""){
        console.log("NO SEARCH name");
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

    console.log(ct_wrapper.style.display);
    console.log("OPACITY:", ct_wrapper.style.opacity);

    const computedOpacity = window.getComputedStyle(ct_wrapper).opacity;
    console.log(`Computed opacity: ${computedOpacity}`);
    // Make a POST request to your backend endpoint
    try {
      console.log("SKURR; REQESTING USERS");
      const response = await fetch('/api/find-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ search_name: searchName })
      });

      const data = await response.json();

      console.log("DATA:", data);

      resultsContainer.innerHTML = '';

      if (data.success && data.users.length > 0) {

        console.log(resultsContainer.childElementCount);
        console.log(data.users);

        data.users.forEach(user => {
            const userDiv = document.createElement('div');
            if (user.id == MY_USER_ID){
                user.username += " (Du)";
            }

            let img_path = "/images/plus2.png";
            if (isContactLoaded(user.id)){
                img_path = "/images/done.png";
            }
            console.log(img_path);
            userDiv.innerHTML = `<button class="search-bar-user" data-id="${user.id}" onclick="addContact(${user.id}, '${user.username}', '${user.profile_picture}')"><img src="${img_path}"/>${user.username}</button>`; // <br>Email: ${user.email}
            resultsContainer.appendChild(userDiv);
            console.log("ADDING:", userDiv);
        });
        console.log(resultsContainer.childElementCount);

      } else {
        resultsContainer.innerHTML = '<div id="no-users">Keine Nutzer gefunden.</div>';
      }
    } catch (error) {
       console.error('An error occurred while searching for users:', error);
    //    alert('An error occurred while searching for users.');
    }
}

async function updateSelectedChatDisplay() {
    console.log("UPDATGING");
    // Check if contact already exists
    for (let child of contact_list.children) {
        const contactButton = child.querySelector('.choose-contact-button');
        child.classList.remove("selected-chat-user");
        if (contactButton && contactButton.getAttribute('data-id') == CURRENTLY_CHATTING_WITH_ID) {
            child.classList.add("selected-chat-user");
        }
    }  
}





async function choosePersonalChat(user_id, username, picture_path=null, showHightlight=true) {

    document.getElementById("contact-info").innerText = username;
    console.log("PICTURE PATH", picture_path);
    if (picture_path != null){
        console.log("ADDING PIC", picture_path);
        document.getElementById("user-image-img").src = picture_path;
        document.getElementById("user-image-img").onclick = function() {
            showBigProfilePic(user_id);
        };
        
    }
    

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
    if (user_id == CURRENTLY_CHATTING_WITH_ID){
        return;
    }
    CURRENTLY_CHATTING_WITH_ID = user_id;
    CURRENT_CHAT_GROUP = null; // Setze die aktuelle Chat-Gruppe auf null, da es sich um einen persönlichen Chat handelt

    updateSelectedChatDisplay();
    
    messagesUL.innerHTML = ""; // Leere die Nachrichtenliste
    requestHistoryMessages(0, 100); // Fordere die Chat-Historie an
    FIRST_LOAD = true;

    document.getElementById('message-input').focus(); // Fokussiere das Eingabefeld für Nachrichten
}

document.getElementById("search-button").addEventListener("click", findUser);
document.getElementById("user-search-input").addEventListener("input", findUser);



function openSettingsPage(){
    settingsTab = window.open('/user-settings', '_blank');
    settingsTab.opener = window;
    settingsTab.focus();
}

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
        console.log("SCROLLING TO BTM");
        scrollMessagesToBottom();
        FIRST_LOAD = false;
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


async function updateLastMessage(from_name, chat_partner_id, text){
    console.log(from_name, chat_partner_id, text );

    // let add_points = "";
    // if (text.length > 9){
    //     add_points = "...";
    // }
    // text = text.slice(0, 9);
    // // Add spaces if the length is less than 6
    // while (text.length < 9) {
    //     text += " ";
    // }        
    
    // text += add_points;

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


// Wenn eine Nachricht empfangen wird
socket.on('chat-message', (msg) => {
    console.log("RECEIVED: ", msg);

    from_user =  msg.from_user;
    from_username = msg.from_username;
    text = msg.text;

    // TODO make it more logical, change addMessage function, change whole flow
    // DEBUG MODE: ALL MESSAGES ARE PUT IN THE SAME CHAT

    updateLastMessage(from_username, from_user, text);

    if (from_user == CURRENTLY_CHATTING_WITH_ID){
        let li = addMessage(text, 'received');
        if (isListNearBottom()) {
            setTimeout(scrollMessagesToBottom, 0);
        }
    } else {
        console.log("Received message from user that is currently not chatted with");
        // TODO: MAKE USER HIGHLIGHTED (MESSAGE COUNT)
    }
});

// Old approach, now API call -> different handling

// // Wenn eine Nachricht als bestätigt zurückkommt
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


    if (!to_user && !to_group){
        return;
    }

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
    
    updateLastMessage("Du", to_user, value);

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
  






// Load last Messages on window load    
window.onload = async function(){
    check_and_setup_darkmode();
    document.getElementById("hide-images").href = "";
    await getUserData();
    console.log("FETCH PIC");
    fetchProfilePicture();
    socket.emit("get-chat-history");
    // requestHistoryMessages(0,100);
    FIRST_LOAD = true; // Asure true

    let width = document.body.clientWidth;
    let height = document.body.clientHeight;
    if (width <= 600){
        setContactsForce(CONTACTS_DISPLAYED); // If the screen is resized, make sure one window is hidden
    }
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




socket.on('disconnect', () => {
    console.log('Socket disconnected, reloading the page...');
    
    // Optionally, you can check the reason or do other actions before reloading
    window.location.reload();  // Reload the page
});