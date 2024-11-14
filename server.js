const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const port = 3000; // Globale Variable für den Port



// Initialisiere Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);



let connected_users = [];


// Middleware to parse JSON bodies
app.use(express.json());

// Custom middleware to protect chat directory
app.use('/chat', (req, res, next) => {
  // Block direct access to chat.html
  if (req.path.toLowerCase().endsWith('chat.html')) {
    return res.redirect('/chat');
  }
  next();
});

app.use(express.static('public', {
  index: 'index.html',
  // Exclude the chat directory from static serving
  setHeaders: (res, path) => {
    if (path.includes('/chat/')) {
      res.status(403).end('Forbidden');
    }
  }
}));


const sessionMiddleware = session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 }
});

// Use the session middleware with Express
app.use(sessionMiddleware);

// Use the session middleware with Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});


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


async function getPasswordHash(password){
  console.log(password);
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
}

async function verifyPassword(password, hash){
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch;
}


testConnection();

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await pool.getConnection();
    let query = 'SELECT id, username, password FROM users WHERE username = ?';
    const [users] = await connection.execute(query, [username]); // Search for username (Max 1 time, as registration is else not possible)
    connection.release();

    console.log(users)

    if (users.length > 0) {
      const user = users[0];


      console.log(password, user.password);
      // Check if the given password matches the hash representation in the database
      if (await verifyPassword(password, user.password)){
        req.session.user = { id: user.id, username: user.username };
        return res.json({ success: true, message: 'Logged in successfully' });
      } else {
        res.status(401).json({ error: 'Invalid password' });
      }
    }
    res.status(401).json({ error: 'Invalid username or password' });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});



function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    console.log("Authenticated user:", req.session.user);
    return next();
  } else {
    console.log("User is not authenticated");
    // Check if it's an API request
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    } else {
      // For non-API routes, redirect to home
      res.redirect('/');
    }
  }
}



// Secure chat route
app.get('/chat', isAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/public/chat/chat.html');
});

// Catch-all route for chat directory attempts
app.get('/chat/*', (req, res) => {
  res.redirect('/chat');
});



// Logout endpoint
app.post('/api/logout', isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});




// Registrierung Route
app.post('/register', async (req, res) => {
  
  const { email, username, password } = req.body;

  // Überprüfe, ob alle Felder ausgefüllt sind
  if (!email || !username || !password) {
    return res.status(400).send('Alle Felder sind erforderlich.');
  }

  try {
    // Passwort hashen, um es sicher zu speichern
    const hashedPassword = await getPasswordHash(password);

    // Daten in die Datenbank einfügen
    const query = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
    const connection = await pool.getConnection();

    try {
      await connection.execute(query, [email, username, hashedPassword]);
      console.log("User registrated");
      res.status(200).send('Benutzer erfolgreich registriert.');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).send('Email oder Benutzername ist bereits vergeben.');
      } else {
        console.error('Fehler beim Einfügen in die Datenbank:', err);
        res.status(500).send('Ein Fehler ist aufgetreten.');
      }
    } finally {
      connection.release(); // Verbindung freigeben
    }
  } catch (err) {
    console.error('Fehler beim Hashen des Passworts:', err);
    res.status(500).send('Ein Fehler ist aufgetreten.');
  }
});


async function handleMessage(sessionUser, msg) {
    const to_user = msg.to_user;
    const text = msg.text;

    console.log(sessionUser, to_user, text);
    
    if (!sessionUser == null || to_user == null || text == null) {
      console.log("sessionUser, to_user or text of message is null -> not sending message");
      return;
      throw new Error('Missing required data, no valid message');
    }
    
    const connection = await pool.getConnection();
    try {
        const query = `
            INSERT INTO chat_messages (sender_id, receiver_id, message, sent_at)
            VALUES (?, ?, ?, NOW())
        `;
        
        await connection.execute(query, [sessionUser.id, to_user, text]);
        
        // Include sender information in broadcast
        const broadcastMsg = {
            from_user: sessionUser.id,
            from_username: sessionUser.username,
            text : text
        };

        // If the adressed user is currently connected, directly send message
        if (connected_users[to_user]){
           let to_user_socket = connected_users[sessionUser.id];
           to_user_socket.emit('chat-message', broadcastMsg);
        }
        
        return { 
          id: msg.id,
          success: true
        };
    } catch (error) {
        console.error('Error saving message:', error);
        return {
          id: msg.id,
          success: false, 
          error: error
        };
    } finally {
        connection.release();
    }
}


app.post('/api/send-message', isAuthenticated, async (req, res) => {
  try {
    console.log(req.session.user, req.body);
      // Use the authenticated user from session
      await handleMessage(req.session.user, req.body);
      res.json({ 
          success: true, 
          message: 'Message sent successfully' 
      });
  } catch (error) {
      console.error('Error processing message:', error);
      res.status(500).json({ 
          success: false, 
          error: 'Failed to process message' 
      });
  }
});

app.get('/api/get-my-user', isAuthenticated, async (req, res) => {
  if (req.session.user) {
    res.status(200).json({ success: true, username: req.session.user.username, id: req.session.user.id });
  }else{
    res.status(401).json({ success: false, error: 'Not authenticated' });
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
    console.log('User connected');

    const sessionUser = socket.request.session.user;
    if (sessionUser) {
      connected_users[sessionUser.id] = socket;
    }


    // Verbindung trennen
    socket.on('disconnect', () => {
        // const sessionUser = socket.request.session.user;
        // if (sessionUser) {
        //   connected_users[sessionUser.id] = null;
        // }
        console.log(`User has disconnected.`);
    });
    

    // Message input über Socket
    // socket.emit('chat-message', { id: msgID, to_user: to_user, to_group: to_group, text: value });

    socket.on('chat-message', async (msg) => {
        // const sessionUser = socket.request.session.user;
        // if (!sessionUser) {
        //   console.log("No session user");
        //     socket.emit('message-confirmation', { 
        //         success: false, 
        //         error: 'Not authenticated' 
        //     });
        //     return;
        // }
        // More logic and a middleware wrapper needed for session user check, so skip and maybe implement later
        
        try {
            let result = await handleMessage(sessionUser, msg);
  
            socket.emit('message-confirmation', result);

        } catch (error) {
            socket.emit('message-confirmation', { 
                id: msg.id,
                success: false, 
                error: 'Failed to save message',
                error_message: error
            });
        }
    });
    

    // Socket endpoint  für random antworten
    socket.on('random-chat-message', (msg) => {
        console.log("Msg", msg);

        socket.emit('message confirmation', msg.id);
        
        setTimeout(() => {
            const randomText = Array.from({ length: Math.floor(Math.random() * 3) + 1 })
            .map(() => words[Math.floor(Math.random() * words.length)]) 
            .join(" ");
            socket.emit('chat-message', randomText);
        }, 2500);
    });


    // Socket für Nachrichtenverlauf mit bestimmtem User
    socket.on('get-history', async (data) => {
      try {
        // Ensure user IDs and limit are integers

        const { user2_id, number_of_messages, start_at_id } = data;
    
        // Validate input
        if (isNaN(user2_id)) {
          return;
        }

        const sessionUser = socket.request.session.user;
        let user1_id;
        if (sessionUser) {
          user1_id = parseInt(sessionUser.id); // GET USER FROM SESSION
        }
        
        // Validate input
        if (isNaN(user1_id)) {
          return;
        }
    
        // Get connection from pool
        const connection = await pool.getConnection();
    
        try {
          console.log(user1_id, user2_id, user2_id, user1_id, number_of_messages, start_at_id);
          // Query to get messages between two users
          // const [messages] = await connection.execute(
          let [messages] = await connection.query(
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
            LIMIT ?
            OFFSET ?`,

            [user1_id, user2_id, user2_id, user1_id, number_of_messages, start_at_id]
          );

          console.log(messages);

          // Add fake messages if none could be loaded / none are there
          // if (messages.length == 0){
          //   messages = generateRandomMessages(number_of_messages);
          // }

          socket.emit("response-history", {
            success: true,
            messages: messages.reverse() // Reverse to get chronological order
          });
    
        } finally {
          connection.release(); // Always release the connection
        }
    
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    });



    
    //API to get the last message of every chat (for the left side of the chat screen with different chats)
    socket.on('get-chat-history', async () => {
      try {
       
        const sessionUser = socket.request.session.user;
        let user1_id;
        if (sessionUser) {
          user1_id = parseInt(sessionUser.id); 
        }
        
        // Validate input
        if (isNaN(user1_id)) {
          return;
        }

        // Get connection from pool
        const connection = await pool.getConnection();

        try {
          // Query to get last message of each chat
          const [rows] = await pool.execute(`
            WITH RankedMessages AS (
                SELECT 
                    cm.message_id,
                    u.username AS sender_username,
                    u2.username AS receiver_username,
                    g.group_name,
                    cm.message,
                    cm.sent_at,
                    -- Create a unique identifier for each conversation
                    CASE 
                        WHEN cm.receiver_group_id IS NOT NULL THEN cm.receiver_group_id  -- Group chat
                        ELSE CONCAT(LEAST(cm.sender_id, cm.receiver_id), '-', GREATEST(cm.sender_id, cm.receiver_id))  -- Individual chat
                    END AS conversation_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY 
                            CASE 
                                WHEN cm.receiver_group_id IS NOT NULL THEN cm.receiver_group_id  -- Group chat
                                ELSE CONCAT(LEAST(cm.sender_id, cm.receiver_id), '-', GREATEST(cm.sender_id, cm.receiver_id))  -- Individual chat
                            END 
                        ORDER BY cm.sent_at ASC
                    ) AS message_rank
                FROM 
                    chat_messages cm
                JOIN 
                    users u ON cm.sender_id = u.id
                LEFT JOIN 
                    users u2 ON cm.receiver_id = u2.id
                LEFT JOIN 
                    \`groups\` g ON cm.receiver_group_id = g.group_id
                WHERE 
                    u.id = ?  -- Sender ID must match
                    OR 
                    (cm.receiver_id = ? AND cm.receiver_group_id IS NULL)  -- User is the receiver in individual chat
                    OR 
                    (cm.receiver_group_id IS NOT NULL AND EXISTS (
                        SELECT 1 
                        FROM group_members gm 
                        WHERE gm.group_id = cm.receiver_group_id AND gm.user_id = ?
                    ))  -- User is in the group for group messages
            )
        
            SELECT 
                message_id,
                sender_username,
                receiver_username,
                group_name,
                message,
                sent_at
            FROM 
                RankedMessages
            WHERE 
                message_rank = 1  -- Get only the first message per chat
            ORDER BY 
                sent_at ASC;  -- Order by sent_at date
        `, [user1_id, user1_id, user1_id]);

          socket.emit("response-chat-history", {
            success: true,
            messages: rows // Reverse to get chronological order
          });

        } finally {
          connection.release(); // Always release the connection
        }

      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    });

});

// Server starten
server.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
