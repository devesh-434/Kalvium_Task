const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store the PDF URL and presenter status
let pdfUrl = null;
let presenter = null;

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');
  ws.send(JSON.stringify({ type: 'status', pdfUrl, presenter }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'setPresenter') {
      presenter = ws;
      ws.send(JSON.stringify({ type: 'status', role: 'presenter' }));
    } else if (data.type === 'setViewer') {
      ws.send(JSON.stringify({ type: 'status', role: 'viewer' }));
    } else if (data.type === 'pdfUrl') {
      pdfUrl = data.url;
      // Broadcast the new PDF URL to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'pdfUrl', url: pdfUrl }));
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start server on port 8080
server.listen(8080, () => {
  console.log('Server is listening on port 8080');
});
