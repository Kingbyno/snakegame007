const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8082;
const PUBLIC_DIR = __dirname;

function serveFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end('<h1>404 Not Found</h1><p>File not found: ' + filePath + '</p>');
            return;
        }
        res.writeHead(200, {'Content-Type': contentType});
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    // Parse URL and remove query parameters
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html for root path
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Clean up the path and prevent directory traversal
    pathname = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(PUBLIC_DIR, pathname);
    
    console.log('Request:', req.url);
    console.log('Parsed pathname:', pathname);
    console.log('Serving file:', filePath);
    
    // Security check - ensure the file is within our public directory
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, {'Content-Type': 'text/html'});
        res.end('<h1>403 Forbidden</h1>');
        return;
    }
    
    const extname = path.extname(filePath).toLowerCase();
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpg';
            break;
    }
    
    serveFile(res, filePath, contentType);
});

server.listen(PORT, () => {
    console.log(`🎮 Snake Game Server running at http://localhost:${PORT}/`);
    console.log(`📁 Serving files from: ${PUBLIC_DIR}`);
});