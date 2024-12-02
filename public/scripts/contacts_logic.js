





socket.on('response-chat-history', (rows) => {
    console.log("RECEIVED CHATS:", rows.messages);
    let contact_username;

    let contact_id;


    let selected_class;

    let last_msg_text;

    let picture_path;



    for (const message of rows.messages) {

        let txtmessage = message.message;

        // let add_points = "";
        // if (txtmessage.length > 9){
        //     add_points = "...";
        // }
        // txtmessage = txtmessage.slice(0, 9);
        // // Add spaces if the length is less than 6
        // while (txtmessage.length < 9) {
        //     txtmessage += " ";
        // }        
        
        // txtmessage += add_points;

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

            // Insert new contact into display list
            addContactToList(picture_path, contact_id, contact_username, last_msg_text, selected_class);

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

});

