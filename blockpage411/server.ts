
import WebSocket, { WebSocketServer } from 'ws';

// Only start the demo websocket server when running directly (not during tests or when imported)
function startDemoServer(port = 8080) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.send('Welcome to the real-time transaction feed!');

    // Simulate a new transaction every 3 seconds
    const interval = setInterval(() => {
      const transaction = {
        hash: `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        from: `0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        to: `0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        value: Math.random() * 10,
        timestamp: new Date().toISOString(),
      };
      
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(transaction));
        }
      });

    }, 3000);

    ws.on('close', () => {
      clearInterval(interval);
    });
  });

  console.log('WebSocket server started on port', port);

  return {
    stop: async () => {
      try { wss.close(); } catch (e) {}
    }
  };
}

// Auto-start only when run directly and not in test environment
if (require.main === module && process.env.NODE_ENV !== 'test') {
  startDemoServer(8080);
}

export { startDemoServer };
