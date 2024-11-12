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


app.use(session({
  secret: 'yourSecretKey',  // Replace with a strong secret key
  resave: false,            // Don't save session if unmodified
  saveUninitialized: true,  // Save uninitialized sessions
  cookie: { maxAge: 1000 * 60 * 60 } // Session expires after 1 hour
}));

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


app.use(session({
  secret: 'yourSecretKey',  // Replace with a strong secret key
  resave: false,            // Don't save session if unmodified
  saveUninitialized: true,  // Save uninitialized sessions
  cookie: { maxAge: 1000 * 60 * 60 } // Session expires after 1 hour
}));


const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'thisandthat123', //thisandthat123
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


// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await pool.getConnection();
    const query = 'SELECT id, username FROM users WHERE username = ? AND password = ?';
    const [users] = await connection.execute(query, [username, password]);
    connection.release();

    console.log(users)

    if (users.length > 0) {
      const user = users[0];
      req.session.user = { id: user.id, username: user.username };
      return res.json({ success: true, message: 'Logged in successfully' });
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
    res.redirect('/'); // Redirect to root instead of serving index.html directly
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
    const hashedPassword = await bcrypt.hash(password, 10);

    // Daten in die Datenbank einfügen
    const query = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
    const connection = await pool.getConnection();

    try {
      await connection.execute(query, [email, username, hashedPassword]);
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
    console.log('User disconnected');
  });
});

// Server starten
server.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
