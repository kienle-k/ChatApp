const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const port = 3002; // Port-Nummer

// Initialisiere Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statische Dateien aus dem "public"-Ordner bereitstellen
//app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// Pfad-Modul vom Login-Formular
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login', 'fenster.html'));  // Korrektes Verzeichnis
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
