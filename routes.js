var sql = require('./sql');

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

exports.index = function(req, res) {
	res.send('<h1>Hello</h1>');
}

exports.kasutajad = function(req, res) {
    var query = 'select * from dbo.Kasutaja';
    
    // If there's an ID passed along
    if (typeof(req.params.id) !== 'undefined') {
        if (isNumber(req.params.id)) {
            query = query.concat(' where id=' + req.params.id);
        } else {
            query = query.concat(' where Kasutajanimi=\'' + req.params.id + '\'');            
        }
    }

    var result = sql.querySql(query, function(data) {
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
    var query = 'SELECT Postitus.ID AS PostituseID, Kasutaja.Kasutajanimi, Postitus.AsukohaNimi, Postitus.Asukoht, ' +
        '    PostituseMeedia.MeediaTyypID, PostituseMeedia.MeediaFail, ' +
        '    (SELECT Count(PostituseID) FROM Meeldimine WHERE PostituseID = Postitus.ID) AS Meeldimisi ' +
        'FROM Postitus INNER JOIN ' +
        '    Kasutaja ON Postitus.KasutajaID = Kasutaja.ID INNER JOIN ' +
        '    PostituseMeedia ON Postitus.ID = PostituseMeedia.PostituseID INNER JOIN ' +
        '    Jalgimine ON Kasutaja.ID = Jalgimine.JalgitavaID ' +
        'WHERE Jalgimine.JalgijaID = 19 ' +
        'ORDER BY Postitus.LisamiseAeg DESC';
    
    var result = sql.querySql(query, function(data) {
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
    var kasutajaNimi = ''
    // If there's an ID passed along
    if (typeof(req.params.id) !== 'undefined') {
        kasutajaNimi = req.params.id;           
    }
    
    var query = 'SELECT ID, Kasutajanimi, Website, Kirjeldus, PildiUrl, ' +
    '           (SELECT Count(ID) FROM dbo.Postitus WHERE KasutajaID = Kasutaja.ID) AS Postitusi, ' +
    '           (SELECT Count(*) FROM dbo.Jalgimine WHERE JalgitavaID = Kasutaja.ID) AS Jalgijaid, ' +
    '           (SELECT Count(*) FROM dbo.Jalgimine WHERE JalgijaID = Kasutaja.ID) AS Jalgitavaid ' +
    '      FROM dbo.Kasutaja ' +
    '     WHERE Kasutajanimi = \'' + kasutajaNimi + '\'' +

    '    SELECT Postitus.ID, AsukohaNimi, PostituseMeedia.MeediaTyypID, PostituseMeedia.MeediaFail' +
    '      FROM dbo.Postitus INNER JOIN' +
    '           dbo.Kasutaja ON Postitus.KasutajaID = Kasutaja.ID LEFT OUTER JOIN' +
    '           dbo.PostituseMeedia ON Postitus.ID = PostituseMeedia.PostituseID' +
    '     WHERE Kasutajanimi = \'' + kasutajaNimi + '\'' +
    '     ORDER BY Postitus.LisamiseAeg DESC';
    
    var result = sql.querySql(query, function(data) {
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
    var id = '';
    // If there's an ID passed along
    if (typeof(req.params.id) !== 'undefined') {
        id = req.params.id;
    }

    var query = 'SELECT Postitus.ID, Kasutajanimi, Kasutaja.PildiUrl, AsukohaNimi, ' +
    '         IsNull((SELECT Count(PostituseID) ' +
    '                   FROM dbo.Meeldimine ' +
    '                  WHERE PostituseID = Postitus.ID), 0) AS Meeldimisi ' +
    '    FROM dbo.Postitus INNER JOIN ' +
    '         dbo.Kasutaja ON Postitus.KasutajaID = Kasutaja.ID ' +
    '   WHERE Postitus.ID = ' + id +
    '   ORDER BY Postitus.LisamiseAeg DESC' +
    
    '  SELECT PostituseMeedia.ID, PostituseMeedia.MeediaTyypID, PostituseMeedia.MeediaFail ' +
    '    FROM dbo.Postitus INNER JOIN ' +
    '         dbo.Kasutaja ON Postitus.KasutajaID = Kasutaja.ID LEFT OUTER JOIN ' +
    '         dbo.PostituseMeedia ON Postitus.ID = PostituseMeedia.PostituseID  ' +
    '   WHERE Postitus.ID = ' + id +
    '   ORDER BY Postitus.LisamiseAeg DESC ' +
      
    '    SELECT ID AS KommentaariID, Kommentaar, LisamiseAeg ' +
    '      FROM Kommentaar' +
    '     WHERE PostituseID = ' + id +
    '     ORDER BY LisamiseAeg';

    var result = sql.querySql(query, function(data) {
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
    var query = 'WITH PostitusiKasutajaKohta (KasutajaID, PostitusteArv) AS' +
    '    (' +
    '      SELECT KasutajaID, Count(ID) FROM Postitus GROUP BY KasutajaID' +
    '    ),' +
    '    KommentaarePostituseKohta (PostituseID, KommentaarideArv) AS' +
    '    (' +
    '      SELECT PostituseID, Count(ID) FROM Kommentaar GROUP BY PostituseID' +
    '    ),' +
    '    MeeldimisiPostituseKohta (PostituseID, MeeldimisteArv) AS' +
    '    (' +
    '      SELECT PostituseID, Count(ID) FROM Kommentaar GROUP BY PostituseID' +
    '    )' +
    '    SELECT ' +
    '           (SELECT Count(ID) FROM Kasutaja) AS KasutajateArv,' +
    '           (SELECT Count(ID) FROM Postitus) AS PostitusteArv,' +
    '           (SELECT Avg(PostitusteArv) FROM PostitusiKasutajaKohta) AS KeskminePostitusteArvKasutajaKohta,' +
    '           (SELECT Max(PostitusteArv) FROM PostitusiKasutajaKohta) AS MaksimaalnePostitusteArvKasutajaKohta,' +
    
    '           (SELECT Avg(KommentaarideArv) FROM KommentaarePostituseKohta) AS KeskmineKommentaarideArvPostituseKohta,' +
    '           (SELECT Max(KommentaarideArv) FROM KommentaarePostituseKohta) AS MaksimaalneKommentaarideArvPostituseKohta,' +
    '           (SELECT Avg(MeeldimisteArv) FROM MeeldimisiPostituseKohta) AS KeskmineMeeldimisteArvPostituseKohta,' +
    '           (SELECT Max(MeeldimisteArv) FROM MeeldimisiPostituseKohta) AS MaksimaalneMeeldimisteArvPostituseKohta';
    
    var result = sql.querySql(query, function(data) {
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
    var query = 'SELECT TOP 10 Kasutaja.ID, Kasutaja.Kasutajanimi, Count(Postitus.ID) AS Postitusi' +
    '    FROM Kommentaar INNER JOIN' +
    '         Postitus ON Kommentaar.PostituseID = Postitus.ID INNER JOIN' +
    '         Kasutaja ON Postitus.KasutajaID = Kasutaja.ID' +
    '   GROUP BY Kasutaja.ID, Kasutaja.Kasutajanimi' +
    '   ORDER BY Postitusi desc ';
    
    var result = sql.querySql(query, function(data) {
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
    var query = 'SELECT CAST(LisamiseAeg AS Date) AS Kuupaev, Count(ID) AS Arv' +
    '    FROM Kasutaja' +
    '   GROUP BY CAST(LisamiseAeg AS Date)' +
    '   ORDER BY Kuupaev';
    
    var result = sql.querySql(query, function(data) {
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
    var query = 'SELECT Sugu.Nimi AS Sugu, Count(Kasutaja.ID) AS Kasutajaid ' +
    '    FROM dbo.Kasutaja INNER JOIN' +
    '         dbo.Sugu ON Kasutaja.SuguID = Sugu.ID' +
    '   GROUP BY Sugu.Nimi';
    
    var result = sql.querySql(query, function(data) {
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
