// Module requires
var express = require('express');
var routes = require('./routes');

// Instatiate application instance
var app = express();

// Juur-kataloogi haldamine 
app.get('/', routes.index);

// Rakenduskesksed teekonnad
// app.get('/api/kasutajad/:id([0-9]{1,9})?', routes.kasutajadIDJargi);
// app.get('/api/kasutajad/:kasutajanimi?', routes.kasutajadKasutajanimeKaudu);
app.get('/api/kasutajad/:id?', routes.kasutajad);

// Vaikimisi vastus, kui muid teekondi ei leitud
app.get('*', routes.default);

// Initialize the server
var server = app.listen(3000, function() {
    console.log('Listening on port 3000');
});
