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

function paginateWithRequest(query, params, req) {
    let pagesize = 50;
    let page = 1;

    if (typeof(req.query.pagesize) !== 'undefined') {
        pagesize = parseInt(req.query.pagesize, 10);
    }

    if (typeof(req.query.page) !== 'undefined') {
        page = parseInt(req.query.page, 10);
    }

    return paginate(query, params, pagesize, page);
}

function paginate(query, params, pagesize = 50, page = 1) {

    if (pagesize <= 0) {
        pageSize = 10;
    }

    if (page <= 0) {
        page = 1;
    }

    params.push({ name: 'pagesize', type: mssql.Int, value: pagesize });
    params.push({ name: 'page', type: mssql.Int, value: page });

    query = query.concat(' OFFSET @pagesize * (@page - 1) ROWS ' +
                         ' FETCH NEXT @pagesize ROWS ONLY');

    return query;
}

exports.usersInsecure = function(req, res) {
    var query = 'select * from dbo.[User] ';
    
     // If there's an ID passed along
     if (typeof(req.params.id) !== 'undefined') {
        if (isNumber(req.params.id)) {
            query = query.concat(' where id=' + req.params.id);
        } else {
            query = query.concat(' where Username=\'' + req.params.id + '\'');            
        }
    }

    var result = sql.querySql(query, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordsets); // Return all recordsets for testing purposes
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
}

exports.users = function(req, res) {
    var query = 'select * from dbo.[User] ';
    
    // If there's an ID passed along
    var params = [];

    if (typeof(req.params.id) !== 'undefined') {
        if (isNumber(req.params.id)) {
            query = query.concat(' where id=@id');
            params.push({ name: 'id', type: mssql.Int, value: req.params.id });
        } else {
            query = query.concat(' where Username=@username');            
            params.push({ name: 'username', type: mssql.NVarChar, value: req.params.id });
        }
    }
    else {
        // Paginate requires order by
        query = query.concat(' order by id');

        query = paginateWithRequest(query, params, req);
    }

    var result = sql.querySqlWithParams(query, params, function(data) {
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

exports.frontpage = function(req, res) {
    var params = [];

    //if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'id', type: mssql.Int, value: 19 }); 
    //}

    var query = 'SELECT Post.ID AS PostID, [User].Username, ' +
    '    PostMedia.MediaTypeID, PostMedia.MediaFileUrl, Post.CreationTime,' +
    '    (SELECT Count(PostID) FROM [Like] WHERE PostID = Post.ID) AS Likes ' +
    ' FROM Post INNER JOIN ' +
    '    [User] ON Post.UserID = [User].ID INNER JOIN ' +
    '    PostMedia ON Post.ID = PostMedia.PostID INNER JOIN ' +
    '    Following ON [User].ID = Following.FolloweeID ' +
    ' WHERE Following.FollowerID = @id ' +
    ' ORDER BY Post.CreationTime DESC';
    
    var result = sql.querySqlWithParams(query, params, function(data) {
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

exports.profilePage = function(req, res) {
    // If there's an ID passed along
    var params = [];

    if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'username', type: mssql.NVarChar, value: req.params.id });
    }
    
    var query = 'SELECT ID, Username, Website, Description, ImageUrl, ' +
    '     (SELECT Count(ID) FROM dbo.Post WHERE UserID = [User].ID) AS TotalPosts,  ' +
    '     (SELECT Count(*) FROM dbo.Following WHERE FolloweeID = [User].ID) AS TotalFollowers, ' +
    '     (SELECT Count(*) FROM dbo.Following WHERE FollowerID = [User].ID) AS TotalFollowings ' +
    ' FROM dbo.[User]  ' +
    ' WHERE Username = @username' +

    ' SELECT Post.ID, LocationName, PostMedia.MediaTypeID, PostMedia.MediaFileUrl ' +
    '   FROM dbo.Post INNER JOIN ' +
    '        dbo.[User] ON Post.UserID = [User].ID LEFT OUTER JOIN ' +
    ' 	   dbo.PostMedia ON Post.ID = PostMedia.PostID ' +
    '  WHERE Username = @username' +
    '  ORDER BY Post.CreationTime DESC ';
    
    var result = sql.querySqlWithParams(query, params, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
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

exports.postDetails = function(req, res) {
    // If there's an ID passed along
    var params = [];

    if (typeof(req.params.id) !== 'undefined') {
        params.push({ name: 'id', type: mssql.Int, value: req.params.id });
    }

    var query = 'SELECT Post.ID, Username, [User].ImageUrl, LocationName, Location, ' +
    '     IsNull((SELECT Count(PostID) ' +
    '               FROM dbo.[Like] ' +
    '              WHERE PostID = Post.ID), 0) AS Likes ' +
    '   FROM dbo.Post INNER JOIN ' +
    '        dbo.[User] ON Post.UserID = [User].ID   ' +
    '  WHERE Post.ID = @id' +
    '  ORDER BY Post.CreationTime DESC ' +

    ' SELECT PostMedia.ID, PostMedia.MediaTypeID, PostMedia.MediaFileUrl ' +
    '   FROM dbo.Post INNER JOIN ' +
    '        dbo.PostMedia ON Post.ID = PostMedia.PostID  ' +
    '  WHERE Post.ID = @id' +
    '  ORDER BY Post.CreationTime DESC ' +

    ' SELECT ID AS CommentID, Comment, CreationTime  ' +
    '   FROM Comment ' +
    '  WHERE PostID = @id' +
    '  ORDER BY CreationTime ';

    var result = sql.querySqlWithParams(query, params, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);

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

exports.statistics = function(req, res) {
    var query = 'SELECT ' +
    '     (SELECT Count(ID) FROM dbo.[User]) AS UserCount,' +
    '     (SELECT Count(ID) FROM Post) AS PostCount,' +
    '     (SELECT Avg(PostCount) ' +
    '        FROM (SELECT UserID, Count(ID) AS PostCount FROM Post GROUP BY UserID) PostsPerUser) AS AvgPostsPerUser,' +
    '     (SELECT Max(PostCount) ' +
    '        FROM (SELECT UserID, Count(ID) AS PostCount FROM Post GROUP BY UserID) PostsPerUser) AS MaxPostsPerUser,' +
    '     (SELECT Avg(CommentCount) ' +
    '        FROM (SELECT PostID, Count(ID) AS CommentCount FROM Comment GROUP BY PostID) CommentsPerPost) AS AvgCommentsPerPost,' +
    '     (SELECT Max(CommentCount) ' +
    '        FROM (SELECT PostID, Count(ID) AS CommentCount FROM Comment GROUP BY PostID) CommentsPerPost) AS MaxCommentsPerPost,' +
    '     (SELECT Avg(LikeCount) ' +
    '        FROM (SELECT PostID, Count(PostID) AS LikeCount FROM [Like] GROUP BY PostID) LikesPerPost) AS AvgLikesPerPost,' +
    '     (SELECT Max(LikeCount) ' +
    '        FROM (SELECT PostID, Count(PostID) AS LikeCount FROM [Like] GROUP BY PostID) LikesPerPost) AS MaxLIkesPerPost';
    
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


exports.top10CommentedUsers = function(req, res) {
    var query = 'SELECT TOP 10 [User].ID, [User].Username, Count(Post.ID) AS Posts ' +
    '     FROM Comment INNER JOIN ' +
    '          Post ON Comment.PostID = Post.ID INNER JOIN ' +
    '          [User] ON Post.UserID = [User].ID ' +
    '    GROUP BY [User].ID, [User].Username ' +
    '    ORDER BY Posts desc';
    
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

exports.userRegistrations = function(req, res) {
    var query = 'SELECT CAST(CreationTime AS Date) AS [Date], Count(ID) AS Count ' +
    '     FROM [User] ' +
    '    GROUP BY CAST(CreationTime AS Date) ' +
    '    ORDER BY [Date] ';
    
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

exports.genderDivision = function(req, res) {
    var query = 'SELECT Gender.Name AS Gender, Count([User].ID) AS Users ' +
    '     FROM dbo.[User] INNER JOIN ' +
    '          dbo.Gender ON [User].GenderID = Gender.ID ' +
    '    GROUP BY Gender.Name ';
    
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
