// Module requires
let express = require('express');
let routes = require('./routes');

// Instatiate application instance
let app = express();

// Juur-kataloogi haldamine 
app.get('/', routes.index);

// Vaikimisi vastus, kui muid teekondi ei leitud
app.get('*', routes.default);

// Initialize the server
let server = app.listen(3000, function() {
    console.log('Listening on port 3000');
});
