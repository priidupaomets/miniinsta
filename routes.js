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
        title: 'API Funktsioonid',
        api: [
            { name: 'Kasutajad', url: '/api/kasutajad' },         
            { name: 'Esileht', url: '/api/esileht' },
            { name: 'Profiil', url: '/api/profiil/cbaccup3b' },
            { name: 'Postitus', url: '/api/postitus/19' },
            { name: 'Üldine Statistika', url: '/api/stats' },
            { name: 'TOP 10 enim kommeneeritud kasutajad', url: '/api/stats/top10/kommenteeritudkasutajad' },
            { name: 'Registreerimised', url: '/api/stats/registreerimised' },
            { name: 'Sooline jagunemine', url: '/api/stats/soolinejagunemine' }
	    ]
    }
    
    res.render('api-index', vm);
}

exports.kasutajad = function(req, res) {
    var procedureName = '';
    var key = "mi.kasutajad"; // Vahemälu andmete unikaalse võtme defineerimine
    
    // If there's an ID passed along
    var params = [];

    if (typeof(req.params.id) !== 'undefined') {
        key = key.concat('.' + req.params.id); // Täiendame vahemälu andmete võtit
        if (isNumber(req.params.id)) {
            procedureName = 'TagastaKasutajadIDJargi';
            params.push({ name: 'ID', type: mssql.Int, value: req.params.id });
        } else {
            procedureName = 'TagastaKasutajadKasutajanimeJargi';
            params.push({ name: 'Kasutajanimi', type: mssql.NVarChar, value: req.params.id });
        }
    } else { // Kui ei ID-d ega kasutajanime polnud antud
        procedureName = 'TagastaKasutajadIDJargi';
        params.push({ name: 'ID', type: mssql.Int, value: 0 });
    }

    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, params, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var data = JSON.stringify(data.recordset, null, 2); // Viime objektid stringi kujule (Redis'e jaoks)
                        
                        redisClient.set(key, data); // Salvestame vahemällu
                        res.send(data); // Tagastame andmed
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

exports.esileht = function(req, res) {
    var params = [];
    var key = "mi.esileht"; // Vahemälu andmete unikaalse võtme defineerimine
    
    //if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'KasutajaID', type: mssql.Int, value: 19 }); 
        key = key.concat('.' + 19); // Täiendame vahemälu andmete võtit
    //}

    var procedureName = 'TagastaEsileheAndmed';
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, params, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var data = JSON.stringify(data.recordset, null, 2); // Viime objektid stringi kujule (Redis'e jaoks)
                        
                        redisClient.set(key, data); // Salvestame vahemällu
                        res.send(data); // Tagastame andmed
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

exports.profiiliLeht = function(req, res) {
    // If there's an ID passed along
    var params = [];
    var key = "mi.profiil"; // Vahemälu andmete unikaalse võtme defineerimine
    
    if (typeof(req.params.id) !== 'undefined') {
        key = key.concat('.' + req.params.id); // Täiendame vahemälu andmete võtit
        params.push({ name: 'Kasutajanimi', type: mssql.NVarChar, value: req.params.id });
    } else {
        params.push({ name: 'Kasutajanimi', type: mssql.NVarChar, value: '' });        
    }
    
    var procedureName = 'TagastaProfiilKasutajanimeJargi';
    
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
        
                            profile.postitused = posts;
                        }
        
                        var data = JSON.stringify(profile, null, 2); // Viime objektid stringi kujule (Redis'e jaoks)
                        
                        redisClient.set(key, data); // Salvestame vahemällu
                        res.send(data); // Tagastame andmed
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

                    profile.postitused = posts;
                }
                
                res.send(profile);
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}

exports.postituseDetailid = function(req, res) {
    // If there's an ID passed along
    var params = [];
    var key = "mi.postitus"; // Vahemälu andmete unikaalse võtme defineerimine
    
    if (typeof(req.params.id) !== 'undefined') {
        key = key.concat('.' + req.params.id); // Täiendame vahemälu andmete võtit
        params.push({ name: 'PostituseID', type: mssql.Int, value: req.params.id });
    } else {
        params.push({ name: 'PostituseID', type: mssql.Int, value: 0 });        
    }

    var procedureName = 'TagastaPostituseDetailid';

    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, params, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var postitus = data.recordsets[0][0];
                        if (data.recordsets.length > 1) {
                            var meedia = data.recordsets[1];
        
                            postitus.meedia = meedia;
                        }
                        if (data.recordsets.length > 2) {
                            var kommentaarid = data.recordsets[2];
        
                            postitus.kommentaarid = kommentaarid;
                        }

                        var data = JSON.stringify(postitus, null, 2); // Viime objektid stringi kujule (Redis'e jaoks)
                        
                        redisClient.set(key, data); // Salvestame vahemällu
                        res.send(data); // Tagastame andmed
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

                var postitus = data.recordsets[0][0];
                if (data.recordsets.length > 1) {
                    var meedia = data.recordsets[1];

                    postitus.meedia = meedia;
                }
                if (data.recordsets.length > 2) {
                    var kommentaarid = data.recordsets[2];

                    postitus.kommentaarid = kommentaarid;
                }
                
                res.send(postitus);
            }
        }, function(err) {
            console.log('ERROR: ' + err);
            res.status(500).send('ERROR: ' + err);
        });
    }
}

exports.statistika = function(req, res) {
    var procedureName = 'TagastaStatistika';
    var key = "mi.stats"; // Vahemälu andmete unikaalse võtme defineerimine
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, undefined, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var data = JSON.stringify(data.recordset, null, 2); // Viime objektid stringi kujule (Redis'e jaoks)
                        
                        redisClient.set(key, data); // Salvestame vahemällu
                        res.send(data); // Tagastame andmed
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


exports.top10KommenteeritudKasutajat = function(req, res) {
    var procedureName = 'TagastaTop10KommenteeritudKasutajat';
    var key = "mi.top10kommenteeritudkasutajat"; // Vahemälu andmete unikaalse võtme defineerimine
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, undefined, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var data = JSON.stringify(data.recordset, null, 2); // Viime objektid stringi kujule (Redis'e jaoks)
                        
                        redisClient.set(key, data); // Salvestame vahemällu
                        res.send(data); // Tagastame andmed
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

exports.kasutajaksRegistreerimised = function(req, res) {
    var procedureName = 'TagastaKasutajaksRegistreerimiseHulgadKuupaevaKaupa';
    var key = "mi.kasutajaksregistreerimised"; // Vahemälu andmete unikaalse võtme defineerimine
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, undefined, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var data = JSON.stringify(data.recordset, null, 2); // Viime objektid stringi kujule (Redis'e jaoks)
                        
                        redisClient.set(key, data); // Salvestame vahemällu
                        res.send(data); // Tagastame andmed
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

exports.soolineJagunemine = function(req, res) {
    var procedureName = 'TagastaKasutajateSoolineJagunemine';
    var key = "mi.soolinejagunemine"; // Vahemälu andmete unikaalse võtme defineerimine
    
    if (useCache) {
        redisClient.get(key, function (err, reply) {
            if (err || !reply ) {
                var result = sql.execute(procedureName, undefined, function(data) {
                    if (data !== undefined)
                    {
                        //console.log('DATA rowsAffected: ' + data.rowsAffected);

                        var data = JSON.stringify(data.recordset, null, 2); // Viime objektid stringi kujule (Redis'e jaoks)
                        
                        redisClient.set(key, data); // Salvestame vahemällu
                        res.send(data); // Tagastame andmed
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
