var sql = require('./sql');
var mssql = require('mssql');
var redis = require('redis');

var useCache = true;

if (useCache) {
    var redisClient = redis.createClient(6379, '127.0.0.1', { no_ready_check: true });
    // redisClient.auth('password', function (err) {
    //     if (err)
    //         throw err;
    // });

    redisClient.on('connect', function() {
        console.log('Connected to Redis');
    });
}
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

exports.index = function(req, res) {
	res.send('<h1>Hello</h1>');
}

exports.apiIndex = function(req, res) {
    var vm = {                          // vm = View Model
        title: 'API Functions',
        api: [
            { name: 'Users', url: '/api/users?pagesize=20&page=2' },         
            { name: 'User by ID', url: '/api/users/121' },         
            { name: 'User by Username', url: '/api/users/cbaccup3b' },         
            { name: 'User by Username (Insecure)', url: '/api/users_insecure/cbaccup3b' },         
            { name: 'Front Page', url: '/api/frontpage' },
            { name: 'Profile Page', url: '/api/profile/cbaccup3b' },
            { name: 'Post', url: '/api/posts/19' },
            { name: 'General Statistics', url: '/api/stats' },
            { name: 'TOP 10 Most Commented Users', url: '/api/stats/top10/commentedusers' },
            { name: 'User Registrations', url: '/api/stats/registrations' },
            { name: 'Gender Division', url: '/api/stats/genderdivision' }
        ],
        injections: [
            { name: 'Basic test (Insecure)', url: '/api/users_insecure/kala\' or 1=1 --'},
            { name: 'Basic test (Secure)', url: '/api/users/kala\' or 1=1 --'},
            { name: 'Alternate Query (Insecure)', url: '/api/users_insecure/kala\' or 1=0; select * from MediaType --'},
            { name: 'Alternate Query (Secure)', url: '/api/users/kala\' or 1=0; select * from MediaType --'},
        ]
    };
    
    res.render('api-index', vm);
};

function paginate(query, params, req) {
    let pagesize = 50;
    let page = 1;

    if (typeof(req.query.pagesize) !== 'undefined') {
        pagesize = parseInt(req.query.pagesize, 10);

        if (pagesize <= 0) {
            pageSize = 10;
        }
    }

    if (typeof(req.query.page) !== 'undefined') {
        page = parseInt(req.query.page, 10);

        if (page <= 0) {
            page = 1;
        }
    }

    params.push({ name: 'pagesize', type: mssql.Int, value: pagesize });
    params.push({ name: 'page', type: mssql.Int, value: page });

    query = query.concat(' OFFSET @pagesize * (@page - 1) ROWS ' +
                         ' FETCH NEXT @pagesize ROWS ONLY');

    return query;
}

exports.usersInsecure = function(req, res) {
    var key = "mi.usersinsecure"; // Unique cache key
    var query = 'select * from dbo.[User] ';
    
     // If there's an ID passed along
     if (typeof(req.params.id) !== 'undefined') {
        if (isNumber(req.params.id)) {
            query = query.concat(' where id=' + req.params.id);
        } else {
            query = query.concat(' where Username=\'' + req.params.id + '\'');            
        }
    }
    else {
        // Paginate requires order by
        query = query.concat(' order by id');

        query = paginate(query, params, req);
    }

    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.querySql(query, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var strData = JSON.stringify(data.recordset, null, 2); // Convert JSON data to string (for Redis)
                        
                        redisClient.set(key, strData); // Store stringified data to cache
                        res.json(strData); // Return stringified data
                    }
                }, function(err) {
                    console.log('ERROR: ' + err);
                    res.status(500).send('ERROR: ' + err);
                });
            }
            else {
                res.send(reply);
            }
        });
    } else {
        var result = sql.querySql(query, function(data) {
            if (data !== undefined)
            {
                //console.log('DATA rowsAffected: ' + data.rowsAffected);
                res.send(data.recordsets); // Return all recordsets for testing purposes
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}

exports.users = function(req, res) {
    var procedureName = '';
    var key = "mi.users"; // Unique cache key
    
    var params = [];
    let pagesize = 50;
    let page = 1;

    if (typeof(req.query.pagesize) !== 'undefined') {
        pagesize = parseInt(req.query.pagesize, 10);

        if (pagesize <= 0) {
            pageSize = 10;
        }
    }

    if (typeof(req.query.page) !== 'undefined') {
        page = parseInt(req.query.page, 10);

        if (page <= 0) {
            page = 1;
        }
    }

    if (typeof(req.params.id) !== 'undefined') {
        key = key.concat('.' + req.params.id); // Update cache key for specific values
        if (isNumber(req.params.id)) {
            procedureName = 'GetUserByID';
            params.push({ name: 'ID', type: mssql.Int, value: req.params.id });
        } else {
            procedureName = 'GetUserByUsername';
            params.push({ name: 'Username', type: mssql.NVarChar, value: req.params.id });
        }
    } else { // When ID nor Username has not been specified
        key = key.concat('.' + page + '.' + pagesize); // Update cache key for specific values
        procedureName = 'GetUsers';
        params.push({ name: 'Page', type: mssql.Int, value: page });
        params.push({ name: 'PageSize', type: mssql.Int, value: pagesize });
    }

    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, params, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var strData = JSON.stringify(data.recordset, null, 2); // Convert JSON data to string (for Redis)
                        
                        redisClient.set(key, strData); // Store stringified data to cache
                        res.json(strData); // Return stringified data
                    }
                }, function(err) {
                    console.log('ERROR: ' + err);
                    res.status(500).send('ERROR: ' + err);
                });
            }
            else {
                res.send(reply);
            }
        });
    } else {
        var result = sql.execute(procedureName, params, function(data) {
            if (data !== undefined)
            {
                //console.log('DATA rowsAffected: ' + data.rowsAffected);
                res.send(data.recordset);
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}

exports.frontpage = function(req, res) {
    var params = [];
    var key = "mi.frontpage"; // Unique cache key
    
    let userid = 19;

    //if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'UserID', type: mssql.Int, value: userid }); 
        key = key.concat('.' + userid); // Update cache key for specific values
    //}

    var procedureName = 'GetFrontPageData';
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, params, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var strData = JSON.stringify(data.recordset, null, 2); // Convert JSON data to string (for Redis)
                        
                        redisClient.set(key, strData); // Store stringified data to cache
                        res.json(strData); // Return stringified data
                    }
                }, function(err) {
                    console.log('ERROR: ' + err);
                    res.status(500).send('ERROR: ' + err);
                });
            }
            else {
                res.send(reply);
            }
        });
    } else {
        var result = sql.execute(procedureName, params, function(data) {
            if (data !== undefined)
            {
                //console.log('DATA rowsAffected: ' + data.rowsAffected);
                res.send(data.recordset);
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}

exports.profilePage = function(req, res) {
    var params = [];
    var key = "mi.profile"; // Unique cache key
    
    if (typeof(req.params.id) !== 'undefined') {
        key = key.concat('.' + req.params.id); // Update cache key for specific values
        params.push({ name: 'Username', type: mssql.NVarChar, value: req.params.id });
    } else {
        params.push({ name: 'Username', type: mssql.NVarChar, value: '' });        
    }
    
    var procedureName = 'GetProfilePageDataByUsername';
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, params, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var profile = data.recordsets[0][0];
                        if (data.recordsets.length > 1) {
                            var posts = data.recordsets[1];
        
                            profile.posts = posts;
                        }
        
                        var strData = JSON.stringify(profile, null, 2); // Convert JSON data to string (for Redis)
                        
                        redisClient.set(key, strData); // Store stringified data to cache
                        res.json(strData); // Return stringified data
                    }
                }, function(err) {
                    console.log('ERROR: ' + err);
                    res.status(500).send('ERROR: ' + err);
                });
            }
            else {
                res.send(reply);
            }
        });
    } else {
        var result = sql.execute(procedureName, params, function(data) {
            if (data !== undefined)
            {
                //console.log('DATA rowsAffected: ' + data.rowsAffected);

                var profile = data.recordsets[0][0];
                if (data.recordsets.length > 1) {
                    var posts = data.recordsets[1];

                    profile.posts = posts;
                }
                
                res.send(profile);
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}

exports.postDetails = function(req, res) {
    var params = [];
    var key = "mi.posts"; // Unique cache key
    
    if (typeof(req.params.id) !== 'undefined') {
        key = key.concat('.' + req.params.id); // Update cache key for specific values
        params.push({ name: 'PostID', type: mssql.Int, value: req.params.id });
    } else {
        params.push({ name: 'PostID', type: mssql.Int, value: 0 });        
    }

    var procedureName = 'GetPostDetailData';

    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, params, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var post = data.recordsets[0][0];
                        if (data.recordsets.length > 1) {
                            var media = data.recordsets[1];
        
                            post.media = media;
                        }
                        if (data.recordsets.length > 2) {
                            var comments = data.recordsets[2];
        
                            post.comments = comments;
                        }

                        var strData = JSON.stringify(post, null, 2); // Convert JSON data to string (for Redis)
                        
                        redisClient.set(key, strData); // Store stringified data to cache
                        res.json(strData); // Return stringified data
                    }
                }, function(err) {
                    console.log('ERROR: ' + err);
                    res.status(500).send('ERROR: ' + err);
                });
            }
            else {
                res.send(reply);
            }
        });
    } else {
        var result = sql.execute(procedureName, params, function(data) {
            if (data !== undefined)
            {
                //console.log('DATA rowsAffected: ' + data.rowsAffected);

                var post = data.recordsets[0][0];
                if (data.recordsets.length > 1) {
                    var media = data.recordsets[1];

                    post.media = media;
                }
                if (data.recordsets.length > 2) {
                    var comments = data.recordsets[2];

                    post.comments = comments;
                }
                
                res.send(post);
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}

exports.statistics = function(req, res) {
    var procedureName = 'GetStatisticalData';
    var key = "mi.stats"; // Unique cache key
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, undefined, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var strData = JSON.stringify(data.recordset, null, 2); // Convert JSON data to string (for Redis)
                        
                        redisClient.set(key, strData); /// Store stringified data to cache
                        res.json(strData); // Return stringified data
                    }
                }, function(err) {
                    console.log('ERROR: ' + err);
                    res.status(500).send('ERROR: ' + err);
                });
            }
            else {
                res.send(reply);
            }
        });
    } else {
        var result = sql.execute(procedureName, undefined, function(data) {
            if (data !== undefined)
            {
                //console.log('DATA rowsAffected: ' + data.rowsAffected);
                res.send(data.recordset);
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}


exports.top10CommentedUsers = function(req, res) {
    var procedureName = 'GetTop10CommentedUsers';
    var key = "mi.top10commentedusers"; // Unique cache key
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, undefined, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var strData = JSON.stringify(data.recordset, null, 2); // Convert JSON data to string (for Redis)
                        
                        redisClient.set(key, strData); // Store stringified data to cache
                        res.json(strData); // Return stringified data
                    }
                }, function(err) {
                    console.log('ERROR: ' + err);
                    res.status(500).send('ERROR: ' + err);
                });
            }
            else {
                res.send(reply);
            }
        });
    } else {
        var result = sql.execute(procedureName, undefined, function(data) {
            if (data !== undefined)
            {
                //console.log('DATA rowsAffected: ' + data.rowsAffected);
                res.send(data.recordset);
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}

exports.userRegistrations = function(req, res) {
    var procedureName = 'GetUserRegistrationsHistogramData';
    var key = "mi.userreg"; // Unique cache key
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, undefined, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var strData = JSON.stringify(data.recordset, null, 2); // Convert JSON data to string (for Redis)
                        
                        redisClient.set(key, strData); // Store stringified data to cache
                        res.json(strData); // Return stringified data
                    }
                }, function(err) {
                    console.log('ERROR: ' + err);
                    res.status(500).send('ERROR: ' + err);
                });
            }
            else {
                res.send(reply);
            }
        });
    } else {
        var result = sql.execute(procedureName, undefined, function(data) {
            if (data !== undefined)
            {
                //console.log('DATA rowsAffected: ' + data.rowsAffected);
                res.send(data.recordset);
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}

exports.genderDivision = function(req, res) {
    var procedureName = 'GetGenderDivisionData';
    var key = "mi.genderdivision"; // Unique cache key
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, undefined, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var strData = JSON.stringify(data.recordset, null, 2); // Convert JSON data to string (for Redis)
                        
                        redisClient.set(key, strData); // Store stringified data to cache
                        res.json(strData); // Return stringified data
                    }
                }, function(err) {
                    console.log('ERROR: ' + err);
                    res.status(500).send('ERROR: ' + err);
                });
            }
            else {
                res.send(reply);
            }
        });
    } else {
        var result = sql.execute(procedureName, undefined, function(data) {
            if (data !== undefined)
            {
                //console.log('DATA rowsAffected: ' + data.rowsAffected);
                res.send(data.recordset);
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}

exports.default = function(req, res) {
	res.status(404).send('Invalid route');
}
