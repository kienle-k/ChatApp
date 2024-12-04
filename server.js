const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const upload_path = 'public/uploads';

if (!fs.existsSync(upload_path)) {
  fs.mkdirSync(upload_path);
}

const port = 3000;

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const hash = crypto.createHash('sha256').update(file.originalname + Date.now().toString()).digest('hex');
    cb(null, hash + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

let connected_users = [];

// Middleware to parse JSON bodies
app.use(express.json());

// Custom middleware to protect chat directory
app.use('/chat', (req, res, next) => {
  if (req.path.toLowerCase().endsWith('chat.html')) {
    return res.redirect('/chat');
  }
  next();
});

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use(express.static('public'));

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
  database: 'chatAppDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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

async function getPasswordHash(password) {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute('SELECT id, username, password FROM users WHERE username = ?', [username]);
    connection.release();

    if (users.length > 0) {
      const user = users[0];
      if (await verifyPassword(password, user.password)) {
        req.session.user = { id: user.id, username: user.username };
        return res.json({ success: true, message: 'Logged in successfully' });
      } else {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }
    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    console.log("Authenticated user: ", req.session.user.username);
    return next();
  } else {
    console.log("User is not authenticated");
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    } else {
      return res.redirect('/');
    }
  }
}

// Secure chat route
app.get('/chat', isAuthenticated, (req, res) => {
  return res.sendFile(__dirname + '/public/chat.html');
});

// Page endpoints
app.get('/register', (req, res) => {
  return res.sendFile(__dirname + '/public/register.html');
});

app.get('/login', (req, res) => {
  return res.sendFile(__dirname + '/public/index.html');
});

app.get('/logout', (req, res) => {
  return res.sendFile(__dirname + '/public/logout.html');
});

app.get('/registrated-successfully', (req, res) => {
  return res.sendFile(__dirname + '/public/registered.html');
});

app.get('/user-settings', isAuthenticated, (req, res) => {
  return res.sendFile(__dirname + '/public/user-settings.html');
});

// Redirect to pretty URLs
app.get('/user-settings.html', isAuthenticated, (req, res) => {
  return res.redirect(301, '/user-settings');
});

app.get('/register.html', (req, res) => {
  return res.redirect(301, '/register');
});

app.get('/index.html', (req, res) => {
  return res.redirect(301, '/');
});

app.get('/logout.html', (req, res) => {
  return res.redirect(301, '/logout');
});

app.get('/registered.html', (req, res) => {
  return res.redirect(301, '/registrated-successfully');
});

// Static middleware
app.use(express.static('public', {
  index: 'index.html',
  setHeaders: (res, path) => {
    if (path.includes('/chat')) {
      return res.status(403).end('Forbidden');
    }
  }
}));

// Logout endpoint
app.post('/api/logout', isAuthenticated, (req, res) => {
  const sessionUser = req.session.user;
  if (sessionUser && connected_users[sessionUser.id]) {
    connected_users[sessionUser.id].disconnect();
    connected_users[sessionUser.id] = null;
  }
  req.session.user = null;
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    } else {
      return res.json({ success: true, message: 'Logged out successfully' });
    }
  });
});

// Registration endpoint with profile picture upload
app.post('/register', upload.single('image'), async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).send('All fields are required.');
  }

  let imagePath = null;
  if (req.file) {
    imagePath = path.join('uploads', req.file.filename);
  }

  try {
    const hashedPassword = await getPasswordHash(password);
    const connection = await pool.getConnection();

    try {
      await connection.execute('INSERT INTO users (email, username, password, profile_picture) VALUES (?, ?, ?, ?)', [email, username, hashedPassword, imagePath]);
      console.log("New user registered");
      res.status(200).send('User successfully registered.');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).send('Email or username is already taken.');
      } else {
        console.error('Error inserting into database:', err);
        res.status(500).send('An error occurred.');
      }
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error hashing password:', err);
    res.status(500).send('An error occurred.');
  }
});

async function handleMessage(sessionUser, msg) {
  const to_user = msg.to_user;
  const text = msg.text;

  if (!sessionUser || !to_user || !text) {
    console.log("Missing sessionUser, to_user, or text in message");
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.execute('INSERT INTO chat_messages (sender_id, receiver_id, message, sent_at) VALUES (?, ?, ?, NOW())', [sessionUser.id, to_user, text]);
    const broadcastMsg = {
      from_user: sessionUser.id,
      from_username: sessionUser.username,
      text: text
    };

    if (connected_users[to_user]) {
      console.log("Recipient is online, sending via socket: ", to_user);
      connected_users[to_user].emit('chat-message', broadcastMsg);
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
      error: "Internal server error. Could not save message."
    };
  } finally {
    connection.release();
  }
}

app.post('/api/find-user', isAuthenticated, async (req, res) => {
  const search_name = req.body.search_name;
  const connection = await pool.getConnection();
  try {
    let [found_users] = await connection.query('SELECT id, username, email, profile_picture FROM users WHERE username LIKE ?', [search_name]);

    if (found_users.length === 0) {
      [found_users] = await connection.query('SELECT id, username, email, profile_picture FROM users WHERE username LIKE ?', [`%${search_name}%`]);
    }

    if (found_users.length === 0) {
      return res.json({ success: false, search_name: search_name });
    } else {
      return res.json({ success: true, search_name: search_name, users: found_users });
    }
  } catch (error) {
    console.error('Error searching for users:', error);
    return res.status(500).json({ success: false, search_name: search_name, error: 'Error while searching for user' });
  } finally {
    connection.release();
  }
});

app.post('/api/send-message', isAuthenticated, async (req, res) => {
  try {
    const result = await handleMessage(req.session.user, req.body);
    return res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error processing message:', error);
    return res.status(500).json({ success: false, error: 'Failed to process message' });
  }
});

app.get('/api/get-my-user', isAuthenticated, async (req, res) => {
  if (req.session.user) {
    return res.status(200).json({ success: true, username: req.session.user.username, id: req.session.user.id });
  } else {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
});

app.get('/api/get-my-info', isAuthenticated, async (req, res) => {
  try {
    const sessionUser = req.session.user;
    const user_id = parseInt(sessionUser.id);

    if (isNaN(user_id)) {
      return res.status(400).send('Invalid user ID');
    }

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT username, email, profile_picture FROM users WHERE id=?', [user_id]);

      if (rows.length > 0) {
        const { username, email, profile_picture } = rows[0];
        const picturePath = profile_picture ? `/${profile_picture}` : 'images/profile.jpg';
        res.json({ username, email, profile_picture: picturePath });
      } else {
        res.status(404).send('User not found');
      }
    } catch (error) {
      console.log("Database error:", error);
      res.status(500).send('Internal server error');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    res.status(500).send('Internal server error');
  }
});

// Route to update user information by ID
app.post('/api/update-my-info', upload.single('profile_picture'), async (req, res) => {
  const { username, email, password } = req.body;

  const sessionUser = req.session.user;
  const user_id = parseInt(sessionUser.id);

  if (isNaN(user_id)) {
    return res.status(400).send('Invalid user ID');
  }

  let imagePath = null;
  if (req.file) {
    imagePath = path.join('uploads', req.file.filename);
  }

  try {
    const connection = await pool.getConnection();
    let query = 'UPDATE users SET';
    const updates = [];
    const values = [];

    // Add fields to update if provided
    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password) {
      const hashedPassword = await getPasswordHash(password);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (imagePath) {
      updates.push('profile_picture = ?');
      values.push(imagePath);
    }

    if (updates.length === 0) {
      return res.status(400).send('No fields provided for update.');
    }

    query += ` ${updates.join(', ')} WHERE id = ?`;
    values.push(user_id);

    try {
      const [result] = await connection.execute(query, values);
      if (result.affectedRows === 0) {
        return res.status(404).send('User not found.');
      }
      console.log('User info updated successfully');
      res.status(200).send('User info updated successfully!');
    } catch (err) {
      console.error('Error updating user:', err);
      res.status(500).send('An error occurred.');
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
    res.status(500).send('An error occurred.');
  }
});



// WebSocket connection
io.on('connection', (socket) => {
  console.log('New user socket has connected');

  const sessionUser = socket.request.session.user;
  if (sessionUser) {
    connected_users[sessionUser.id] = socket;
  } else {
    socket.disconnect();
    return;
  }

  socket.on('disconnect', () => {
    console.log(`User socket has disconnected.`);
    if (sessionUser) {
      delete connected_users[sessionUser.id];
    }
  });

  socket.on('chat-message', async (msg) => {
    try {
      const result = await handleMessage(sessionUser, msg);
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

  socket.on('get-history', async (data) => {
    try {
      const { user2_id, number_of_messages, start_at_id } = data;

      if (isNaN(user2_id)) {
        return;
      }

      const user1_id = parseInt(sessionUser.id);

      if (isNaN(user1_id)) {
        return;
      }

      const connection = await pool.getConnection();
      try {
        let [messages] = await connection.query(
          `SELECT 
            m.message_id,
            m.sender_id,
            m.receiver_id,
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

        socket.emit("response-history", {
          success: true,
          messages: messages.reverse()
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  });

  socket.on('get-chat-history', async () => {
    console.log("Sending chat history");
    try {
      const user1_id = parseInt(sessionUser.id);

      if (isNaN(user1_id)) {
        console.log("No session user -> no data");
        return;
      }

      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.execute(
          `WITH LastMessages AS (
            SELECT
              cm.message_id,
              cm.sender_id,
              cm.receiver_id,
              cm.receiver_group_id,
              u.username AS sender_username,
              u.profile_picture AS sender_picture,
              u2.profile_picture AS receiver_picture,
              u2.username AS receiver_username,
              cm.message,
              cm.sent_at,
              ROW_NUMBER() OVER (
                PARTITION BY
                  CASE
                    WHEN cm.receiver_group_id IS NOT NULL THEN cm.receiver_group_id
                    ELSE CONCAT(LEAST(cm.sender_id, cm.receiver_id), '-', GREATEST(cm.sender_id, cm.receiver_id))
                  END
                ORDER BY cm.sent_at DESC
              ) AS message_rank
            FROM chat_messages cm
            JOIN users u ON cm.sender_id = u.id
            LEFT JOIN users u2 ON cm.receiver_id = u2.id
            WHERE cm.sender_id = ? OR cm.receiver_id = ?
          )
          SELECT
            message_id,
            sender_id,
            receiver_id,
            receiver_group_id,
            sender_username,
            receiver_username,
            sender_picture,
            receiver_picture,
            message,
            sent_at
          FROM LastMessages
          WHERE message_rank = 1
          ORDER BY sent_at DESC;
        `, [user1_id, user1_id]);

        socket.emit("response-chat-history", { success: true, messages: rows });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      socket.emit("response-chat-history", { success: false, error: error });
    }
  });
});


// Route for random chat
app.get('/random-chat', isAuthenticated, async (req, res) => {

  const sessionUser = req.session.user;
  const user_id = parseInt(sessionUser.id);

  if (isNaN(user_id)) {
    return res.status(400).send('Invalid user ID');
  }
  
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT id, username, profile_picture FROM users WHERE id != ? ORDER BY RAND() LIMIT 1',
      [user_id]
    );
    connection.release();

    if (rows.length > 0) {
      const user = rows[0];
      res.json({ success: true, user });
    } else {
      res.json({ success: false, error: 'No users found' });
    }
  } catch (error) {
    console.error('Error fetching random user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch random user' });
  }
});


//user settings 
app.get('/api/get-user-settings', isAuthenticated, async (req, res) => {
  try {
    const user = await getUserById(req.session.user.id); // Funktion, die die Benutzerdaten aus der Datenbank abruft
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user settings' });
  }
});


// Start the server
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
