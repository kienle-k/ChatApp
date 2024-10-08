const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

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
