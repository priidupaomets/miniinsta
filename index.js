// Module requires
var express = require('express');
var routes = require('./routes');

// Instatiate application instance
var app = express();

// Handle URL root 
app.get('/', routes.index);

// Application-specific routes
// app.get('/api/users/:id([0-9]{1,9})?', routes.usersByID);
// app.get('/api/users/:username?', routes.usersByUsername);
app.get('/api/users/:id?', routes.users);

// Default route when nothing else was found
app.get('*', routes.default);

// Initialize the server
var server = app.listen(3000, function() {
    console.log('Listening on port 3000');
});
