console.log('Starting simple test server...');

const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Ghost Resurrection System - Test Server\n');
});

server.listen(3000, () => {
    console.log('Test server running on port 3000');
});
