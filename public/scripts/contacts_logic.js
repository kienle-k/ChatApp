// CURRENTLY_CHATTING_WITH_ID = 2;  // Shows which users chat is currently displayed
// CURRENT_CHAT_GROUP = null;      // Shows which group chat is currently displayed
// Nur eins von beidem kann einen Wert haben



// This socket receives updates on the chats
// Example Data:
//     {
//         messages: [
//             {
//                 group_name: null,
//                 message: "ojser",
//                 message_id: 6,
//                 receiver_username: "user2_example",
//                 sender_username: "jonasderboss",
//                 sent_at: "2024-11-13T23:01:09.000Z"
//             },
//             {
//                 ...
//             }
//         ]
//     }
socket.on('response-chat-history', (rows) => {
    console.log("RECEIVED CHATS:", rows.messages);
    let contact_username;

    let contact_id;


    let selected_class;

    let last_msg_text;

    let picture_path;



    for (const message of rows.messages) {

        let txtmessage = message.message;

        let add_points = "";
        if (txtmessage.length > 9){
            add_points = "...";
        }
        txtmessage = txtmessage.slice(0, 9);
        // Add spaces if the length is less than 6
        while (txtmessage.length < 9) {
            txtmessage += " ";
        }        
        
        txtmessage += add_points;

        if (message.group_name == null) {
            if (message.sender_username == MY_USER) {
                contact_username = message.receiver_username;
                contact_id = message.receiver_id;
                last_msg_text = `<b style="color: darkgray">Du:</b><br>${txtmessage}`;
                picture_path = message.receiver_picture;
            } else {
                contact_username = message.sender_username;
                contact_id = message.sender_id;
                last_msg_text = `<b style="color: darkgray">${contact_username}:</b><br>${txtmessage}`;
                picture_path = message.sender_picture;
            }

            if (message.receiver_id == message.sender_id){
                contact_username += " (Du)";
            }

            selected_class = "";

            console.log(picture_path);

            if (picture_path == null){
                picture_path = 'images/profile.jpg';
            }

            let contact_list = document.getElementById("contacts");
            contact_list.insertAdjacentHTML('beforeend', 
                `<li class="contact-container ${selected_class}">
                  <button type="button" class="contact-profile-button">
                    <img src='/${picture_path}'>
                  </button>
                  <button type="button" class="choose-contact-button" data-id=${contact_id} onclick="choosePersonalChat(${contact_id})">
                    <div class="contact">${contact_username}</div>
                  </button>
                  <div class="last-message">${last_msg_text}</div>
                </li>` // LAST MESSAGE DISPLAY TODO
            );
            if (CURRENTLY_CHATTING_WITH_ID == null){
                CURRENTLY_CHATTING_WITH_ID = contact_id;
                messagesUL.innerHTML = "";
                choosePersonalChat(CURRENTLY_CHATTING_WITH_ID);
                updateSelectedChatDisplay();
                FIRST_LOAD = true;
                requestHistoryMessages(0, 100);
            }

        } else {
            console.log("bro really thought")
        }
    }
    // TODO
    // CJ FU
    // Logik für das Generieren / Regenerieren der Divs (je nachdem ob nur neu laden / hinzufügen zur liste)
    // Divs brauchen data-id, um die richtigen chats laden zu können <div class=".." data-id=${chat_partner.id}>
});

