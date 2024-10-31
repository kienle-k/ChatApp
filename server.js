const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');




// Initialisiere Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('public'));


const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'thisandthat123',
  database: 'chatAppDB'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database');
    connection.release();
  } catch (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
}

testConnection();



app.get('/api/messages/history', async (req, res) => {
  try {
    // Ensure user IDs and limit are integers
    const user1_id = req.query.user1_id; // Treat as a string
    const user2_id = req.query.user2_id; // Treat as a string
    const limit = req.query.limit;
    

    // Validate input
    if (isNaN(user1_id) || isNaN(user2_id)) {
      return res.status(400).json({ error: 'Both user1_id and user2_id must be valid integers.' });
    }

    // Get connection from pool
    const connection = await pool.getConnection();

    try {
      // Query to get messages between two users
      const [messages] = await connection.execute(
        `SELECT 
            m.message_id,
            m.sender_id,
            m.receiver_id,
            m.receiver_group_id,
            m.message,
            m.sent_at,
            sender.username AS sender_username,
            receiver.username AS receiver_username
        FROM chat_messages m
        JOIN users sender ON m.sender_id = sender.id
        LEFT JOIN users receiver ON m.receiver_id = receiver.id
        WHERE 
            (m.sender_id = ? AND m.receiver_id = ?)
            OR 
            (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.sent_at DESC
        LIMIT ?`,
        [user1_id, user2_id, user2_id, user1_id, limit]
      );

      res.json({
        success: true,
        messages: messages.reverse() // Reverse to get chronological order
      });

    } finally {
      connection.release(); // Always release the connection
    }

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});









const words = [
        "YOO", "hello", "how are you", "what's up", "let's meet", 
        "check this out", "long time no see", "see you soon", 
        "I'm busy", "sounds good", "why not", "okay", "let's go", 
        "goodbye", "talk later", "yes", "no", "maybe"
];
function generateRandomMessages(numMessages) {    
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
            // testing: senf rand
            const randomText = Array.from({ length: Math.floor(Math.random() * 3) + 1 }) // Random length of the message (1 to 3 words)
            .map(() => words[Math.floor(Math.random() * words.length)]) // Randomly select words
            .join(" "); // Join words into a send random sentence back
            
            socket.emit('chat message', randomText);
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
