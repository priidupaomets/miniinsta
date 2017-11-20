// Module requires
var express = require('express');

// Instatiate application instance
var app = express();

// Juur-kataloogi haldamine 
app.get('/', function(req, res) { 
    res.send('<h1>Hello</h1>'); 
}); 

// Vaikimisi vastus, kui muid teekondi ei leitud 
app.get('*', function(req, res) { 
    res.status(404).send('Invalid route'); 
});

// Initialize the server
var server = app.listen(3000, function() {
    console.log('Listening on port 3000');
});
