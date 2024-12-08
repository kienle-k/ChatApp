
socket.on('response-chat-history', (rows) => {
    console.log("RECEIVED CHATS:", rows.messages);
    let contact_username;

    let contact_id;


    let selected_class;

    let last_msg_text;

    let picture_path;



    for (let chat of rows.messages) {

        let txtmessage = chat.message;

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

            console.log(picture_path);

            if (picture_path == null){
                picture_path = 'images/profile.png';
            }

            // Insert new contact into display list
            addContactToList(picture_path, contact_id, contact_username, last_msg_text, selected_class);

            if (CURRENTLY_CHATTING_WITH_ID == null){
                CURRENTLY_CHATTING_WITH_ID = contact_id;
                messagesUL.innerHTML = "";
                choosePersonalChat(CURRENTLY_CHATTING_WITH_ID, showHighlight=false);
                updateSelectedChatDisplay();
                FIRST_LOAD = true;
                requestHistoryMessages(0, 100);
            }

        } else {
            console.log("bro really thought");


            // message_id,
            // sender_id,
            // receiver_id,
            // receiver_group_id,
            // sender_username,
            // receiver_username,
            // sender_picture,
            // receiver_picture,
            // message,
            // iv,
            // sent_at

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

            console.log(picture_path);

            if (picture_path == null){
                picture_path = 'images/profile.png';
            }

            // Insert new contact into display list
            addContactToList(picture_path, contact_id, contact_username, last_msg_text, selected_class);

            if (CURRENTLY_CHATTING_WITH_ID == null){
                CURRENTLY_CHATTING_WITH_ID = contact_id;
                messagesUL.innerHTML = "";
                choosePersonalChat(CURRENTLY_CHATTING_WITH_ID, showHighlight=false);
                updateSelectedChatDisplay();
                FIRST_LOAD = true;
                requestHistoryMessages(0, 100);
            }

        }
    }

});

