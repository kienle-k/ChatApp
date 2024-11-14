CURRENTLY_CHATTING_WITH_ID = 2;  // Shows which users chat is currently displayed
CURRENT_CHAT_GROUP = null;      // Shows which group chat is currently displayed
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
    // TODO
    // CJ FU
    // Logik für das Generieren / Regenerieren der Divs (je nachdem ob nur neu laden / hinzufügen zur liste)
    // Divs brauchen data-id, um die richtigen chats laden zu können <div class=".." data-id=${chat_partner.id}>
});
