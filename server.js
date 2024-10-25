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
    console.log('User has connected (brrr gucci gang (we gon steal every peace of personal info he has');

    // Nachricht empfangen und an alle Clients weiterleiten
    socket.on('chat message', (msg) => {
        console.log("Msg", msg);
        // Timeout only for Dev and Testing phase
        setTimeout(() => {
            io.emit('message confirmation', msg.id);
            // io.emit does not make sense here, cause it sends to every user there is
            io.emit('chat message', msg.text);
        }, 2500);
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
