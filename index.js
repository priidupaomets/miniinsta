// Module requires
var express = require('express');

// Instatiate application instance
var app = express();

// Juur-kataloogi haldamine 
app.get('/', routes.index);

// Vaikimisi vastus, kui muid teekondi ei leitud
app.get('*', routes.default);

// Initialize the server
var server = app.listen(3000, function() {
    console.log('Listening on port 3000');
});
