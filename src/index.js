const http = require('http');
const fs = require('fs');
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');

const logger = require('./logger');
const config = require('./config');
const wss = require('./server');

// We serve static files over HTTP
const serve = serveStatic('public');
const server = http.createServer(function handler(req, res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'interest-cohort=()');
  serve(req, res, finalhandler(req, res));
});

server.on('upgrade', function upgrade(request, socket, head) {
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request);
  });
});

server.on('close', function() {
  logger.info('Server closing');
  wss.close();
});

const port = config.port;
server.listen(port, function() {
  if (typeof port === 'string' && port.startsWith('/') && config.unixSocketPermissions >= 0) {
    fs.chmod(port, config.unixSocketPermissions, function(err) {
      if (err) {
        logger.error('could not chmod unix socket: ' + err);
        process.exit(1);
      }
    });
  }
  logger.info('Server started on port: ' + port);
});



// ❗❗ ADD THIS — KEEP-ALIVE SELF-PING FOR RENDER
//----------------------------------------------------
const PING_URL = process.env.PING_URL || "https://variablevault.onrender.com/";

setInterval(async () => {
  try {
    const res = await fetch(PING_URL);
    console.log("Self-ping:", res.status);
  } catch (err) {
    console.error("Self-ping error:", err);
  }
}, 1 * 60 * 1000); // 10 minutes
//----------------------------------------------------
