const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const port = 3001; // Port-Nummer

// Initialisiere Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statische Dateien aus dem "public"-Ordner bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Route für die Login-Seite
app.get('/login/fenster.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login', 'fenster.html'));
});

// Route für die Chat-Seite
app.get('/login/chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login', 'chat.html'));
});

// Route für den Root-Pfad
app.get('/', (req, res) => {
    res.redirect('/login/fenster.html'); // Weiterleitung zur Login-Seite
});

// WebSocket-Verbindung
io.on('connection', (socket) => {
    console.log('Ein Benutzer hat sich verbunden (Basti)');

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
server.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});