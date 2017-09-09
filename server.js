#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('./app');
var http = require('http');

/**
 * Get port from Express.
 */
var port = app.get('port');

/**
 * Get address from Express.
 */
var address = app.get('address');

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
if (address) {
	server.listen(port, address);
} else {
	server.listen(port);
}

server.on('error', onError);
server.on('listening', onListening);


/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	var addr = server.address();
	if (typeof addr === 'string') {
		console.log('%s: Node server started on %s:%d', Date(Date.now()), 'pipe', addr);
	} else {
		console.log('%s: Node server started on %s:%d', Date(Date.now()), addr.address, addr.port);
	}
}
