const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // your MySQL username
  password: 'thisandthat123',  // your MySQL password
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

// WebSocket-Verbindung
io.on('connection', (socket) => {
    console.log('Ein Benutzer hat sich verbunden (brrr gucci gang');

    // Nachricht empfangen und an alle Clients weiterleiten
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    // Wenn ein Benutzer die Verbindung trennt
    socket.on('disconnect', () => {
        console.log('Ein Benutzer hat die Verbindung getrennt');
    });
});

// Server starten
server.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});
