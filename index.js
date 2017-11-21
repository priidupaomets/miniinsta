// Module requires
var express = require('express');
var logger = require('morgan');
var routes = require('./routes');

// Instatiate application instance
var app = express();

// Seadistame vahevara
app.use(logger('dev'));

// Lisame vaate mootori
app.set('view engine', 'hbs');

// Juur-kataloogi haldamine 
app.get('/', routes.index);

app.get('/api', routes.apiIndex);

// Rakenduskesksed teekonnad
// app.get('/api/kasutajad/:id([0-9]{1,9})?', routes.kasutajadIDJargi);
// app.get('/api/kasutajad/:kasutajanimi?', routes.kasutajadKasutajanimeKaudu);
app.get('/api/kasutajad/:id?', routes.kasutajad);

app.get('/api/esileht', routes.esileht);
app.get('/api/profiil/:id', routes.profiiliLeht);
app.get('/api/postitus/:id', routes.postituseDetailid);
app.get('/api/stats', routes.statistika);
app.get('/api/stats/top10/kommenteeritudkasutajad', routes.top10KommenteeritudKasutajat);
app.get('/api/stats/registreerimised', routes.kasutajaksRegistreerimised);
app.get('/api/stats/soolinejagunemine', routes.soolineJagunemine);

// Vaikimisi vastus, kui muid teekondi ei leitud
app.get('*', routes.default);

// Initialize the server
var server = app.listen(3000, function() {
    console.log('Listening on port 3000');
});
