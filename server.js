const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // your MySQL username
  password: 'skurrSkurrBrr',  // your MySQL password
  database: 'chatAppDB'  // the database you want to connect to
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as ID:', connection.threadId);
});

// Remember to close the connection when done
connection.end();



// Initialisiere Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statische Dateien aus dem "public"-Ordner bereitstellen
app.use(express.static('public'));




function generateRandomMessages(numMessages) {
    const words = [
        "YOO", "hello", "how are you", "what's up", "let's meet", 
        "check this out", "long time no see", "see you soon", 
        "I'm busy", "sounds good", "why not", "okay", "let's go", 
        "goodbye", "talk later", "yes", "no", "maybe"
    ];
    
    const result = [];
    
    for (let i = 0; i < numMessages; i++) {
        const fromUser = Math.random() > 0.5 ? "Karl" : "Kalle"; // Randomly choose the sender
        const toUser = fromUser === "Karl" ? "Kalle" : "Karl"; // Ensure the recipient is the other user
        const randomText = Array.from({ length: Math.floor(Math.random() * 3) + 1 }) // Random length of the message (1 to 3 words)
            .map(() => words[Math.floor(Math.random() * words.length)]) // Randomly select words
            .join(" "); // Join words into a sentence
        
        result.push({ from_user: fromUser, to_user: toUser, text: randomText });
    }
    
    return result;
}


// WebSocket-Verbindung
io.on('connection', (socket) => {
    console.log('User has connected (brrr gucci gang (we gon steal every peace of personal info he has');

    // Nachricht empfangen und an alle Clients weiterleiten
    socket.on('chat message', (msg) => {
        console.log("Msg", msg);
        // Timeout only for Dev and Testing phase
        setTimeout(() => {
            socket.emit('message confirmation', msg.id);
            // io.emit does not make sense here, cause it sends to every user there is
            // Database insert needed 
            io.emit('chat message', msg.text);
        }, 2500);
    });

    // Listen for the requestData event
    socket.on('get-history', (data) => {
        const { start_at_id, number_of_messages } = data;
        console.log('Received parameters:', start_at_id, number_of_messages);

        const result = generateRandomMessages(number_of_messages);

        // Send the response back to the client
        setTimeout(() => {
            socket.emit('response-history', result);
        }, 1000);
    });


    // Wenn ein Benutzer die Verbindung trennt
    socket.on('disconnect', () => {
        console.log('Kleiner hund at verbindung getrennt ya eri ya maniak ya sibby');
    });
});

// Server starten
server.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});
