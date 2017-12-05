var sql = require('./sql');
var mssql = require('mssql');

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
    
    // If there's an ID passed along
    var params = [];

    if (typeof(req.params.id) !== 'undefined') {
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

    var result = sql.execute(procedureName, params, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
}

exports.esileht = function(req, res) {
    var params = [];

    //if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'KasutajaID', type: mssql.Int, value: 19 }); 
    //}

    var procedureName = 'TagastaEsileheAndmed';
    
    var result = sql.execute(procedureName, params, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
}

exports.profiiliLeht = function(req, res) {
    // If there's an ID passed along
    var params = [];

    if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'Kasutajanimi', type: mssql.NVarChar, value: req.params.id });
    } else {
        params.push({ name: 'Kasutajanimi', type: mssql.NVarChar, value: '' });        
    }
    
    var procedureName = 'TagastaProfiilKasutajanimeJargi';
    
    var result = sql.execute(procedureName, params, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
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

exports.postituseDetailid = function(req, res) {
    // If there's an ID passed along
    var params = [];

    if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'PostituseID', type: mssql.Int, value: req.params.id });
    } else {
        params.push({ name: 'PostituseID', type: mssql.Int, value: 0 });        
    }

    var procedureName = 'TagastaPostituseDetailid';

    var result = sql.execute(procedureName, params, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);

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

exports.statistika = function(req, res) {
    var procedureName = 'TagastaStatistika';
    
    var result = sql.execute(procedureName, undefined, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
}


exports.top10KommenteeritudKasutajat = function(req, res) {
    var procedureName = 'TagastaTop10KommenteeritudKasutajat';
    
    var result = sql.execute(procedureName, undefined, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
}

exports.kasutajaksRegistreerimised = function(req, res) {
    var procedureName = 'TagastaKasutajaksRegistreerimiseHulgadKuupaevaKaupa';
    
    var result = sql.execute(procedureName, undefined, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
}

exports.soolineJagunemine = function(req, res) {
    var procedureName = 'TagastaKasutajateSoolineJagunemine';
    
    var result = sql.execute(procedureName, undefined, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
}

exports.default = function(req, res) {
	res.status(404).send('Invalid route');
}
