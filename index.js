// Module requires
let express = require('express');
let logger = require('morgan');
let apicache = require('apicache');
let redis = require('redis');
let routes = require('./routes');

// Instatiate application instance
let app = express();

// // instantiate default API cache
// let cache = apicache.middleware;
// if redisClient option is defined, apicache will use redis client 
// instead of built-in memory store
let cache = apicache.options({ 
    redisClient: redis.createClient(6379, '127.0.0.1', { no_ready_check: true }) 
   }).middleware;
   
// Configure the middleware - in this case Morgan Logger
app.use(logger('dev'));

// Let's add a View Engine - Handlebars
app.set('view engine', 'hbs');

// Handle URL root 
app.get('/', routes.index);

app.get('/api', routes.apiIndex);

// Application-specific routes
// app.get('/api/users/:id([0-9]{1,9})?', routes.usersByID);
// app.get('/api/users/:username?', routes.usersByUsername);
app.get('/api/users/:id?', cache('10 seconds'), routes.users);
app.get('/api/users_insecure/:id?', cache('10 seconds'), routes.usersInsecure);

app.get('/api/frontpage', cache('10 seconds'), routes.frontpage);
app.get('/api/profile/:id', cache('10 seconds'), routes.profilePage);
app.get('/api/posts/:id', cache('10 seconds'), routes.postDetails);
app.get('/api/stats', cache('10 seconds'), routes.statistics);
app.get('/api/stats/top10/commentedusers', cache('10 seconds'), routes.top10CommentedUsers);
app.get('/api/stats/registrations', cache('10 seconds'), routes.userRegistrations);
app.get('/api/stats/genderdivision', cache('10 seconds'), routes.genderDivision);

// Default route when nothing else was found
app.get('*', routes.default);

// Initialize the server
let server = app.listen(3000, function() {
    console.log('Listening on port 3000');
});
