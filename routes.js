let sql = require('./sql');
let mssql = require('mssql');

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

exports.index = function(req, res) {
	res.send('<h1>Hello</h1>');
};

exports.apiIndex = function(req, res) {
    let vm = {                          // vm = View Model
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
    let query = 'select * from dbo.[User] ';
    
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

    let result = sql.querySql(query, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordsets); // Return all recordsets for testing purposes
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.users = function(req, res) {

    let procedureName = '';
    
    // If there's an ID passed along
    let params = [];
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
        if (isNumber(req.params.id)) {
            procedureName = 'GetUserByID';
            params.push({ name: 'ID', type: mssql.Int, value: req.params.id });
        } else {
            procedureName = 'GetUserByUsername';
            params.push({ name: 'Username', type: mssql.NVarChar, value: req.params.id });
        }
    } else { // When ID nor Username has not been specified
        procedureName = 'GetUsers';
        params.push({ name: 'Page', type: mssql.Int, value: page });
        params.push({ name: 'PageSize', type: mssql.Int, value: pagesize });
    }

    let result = sql.execute(procedureName, params, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.frontpage = function(req, res) {
    let params = [];

    //if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'UserID', type: mssql.Int, value: 19 }); 
    //}

    let procedureName = 'GetFrontPageData';
    
    let result = sql.execute(procedureName, params, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.profilePage = function(req, res) {
    // If there's an ID passed along
    let params = [];

    if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'Username', type: mssql.NVarChar, value: req.params.id });
    } else {
        params.push({ name: 'Username', type: mssql.NVarChar, value: '' });        
    }
    
    let procedureName = 'GetProfilePageDataByUsername';
    
    let result = sql.execute(procedureName, params, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);

            let profile = data.recordsets[0][0];
            if (data.recordsets.length > 1) {
                let posts = data.recordsets[1];

                profile.posts = posts;
            }
            
            res.send(profile);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.postDetails = function(req, res) {
    // If there's an ID passed along
    let params = [];

    if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'PostID', type: mssql.Int, value: req.params.id });
    } else {
        params.push({ name: 'PostID', type: mssql.Int, value: 0 });        
    }

    let procedureName = 'GetPostDetailData';

    let result = sql.execute(procedureName, params, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);

            let post = data.recordsets[0][0];
            if (data.recordsets.length > 1) {
                let media = data.recordsets[1];

                post.media = media;
            }
            if (data.recordsets.length > 2) {
                let comments = data.recordsets[2];

                post.comments = comments;
            }
            
            res.send(post);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.statistics = function(req, res) {
    let procedureName = 'GetStatisticalData';
    
    let result = sql.execute(procedureName, undefined, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};


exports.top10CommentedUsers = function(req, res) {
    let procedureName = 'GetTop10CommentedUsers';
    
    let result = sql.execute(procedureName, undefined, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.userRegistrations = function(req, res) {
    let procedureName = 'GetUserRegistrationsHistogramData';
    
    let result = sql.execute(procedureName, undefined, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.genderDivision = function(req, res) {
    let procedureName = 'GetGenderDivisionData';
    
    let result = sql.execute(procedureName, undefined, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.default = function(req, res) {
	res.status(404).send('Invalid route');
};
