let sql = require('./sql');

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
            { name: 'Users', url: '/api/users' },         
            { name: 'Front Page', url: '/api/frontpage' },
            { name: 'Profile Page', url: '/api/profile/cbaccup3b' },
            { name: 'Post', url: '/api/posts/19' },
            { name: 'General Statistics', url: '/api/stats' },
            { name: 'TOP 10 Most Commented Users', url: '/api/stats/top10/commentedusers' },
            { name: 'Registrations', url: '/api/stats/registrations' },
            { name: 'Gender Division', url: '/api/stats/genderdivision' }
	    ]
    };
    
    res.render('api-index', vm);
};


exports.users = function(req, res) {
    let query = 'select * from dbo.[User]';
    
    // If there's an ID passed along
    if (typeof(req.params.id) !== 'undefined') {
        if (isNumber(req.params.id)) {
            query = query.concat(' where id=' + req.params.id);
        } else {
            query = query.concat(' where Username=\'' + req.params.id + '\'');            
        }
    }

    let result = sql.querySql(query, function(data) {
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
    let query = `SELECT Post.ID AS PostID, [User].Username, 
    PostMedia.MediaTypeID, PostMedia.MediaFileUrl, Post.CreationTime,
    (SELECT Count(PostID) FROM [Liking] WHERE PostID = Post.ID) AS Likes 
 FROM Post INNER JOIN 
    [User] ON Post.UserID = [User].ID INNER JOIN 
    PostMedia ON Post.ID = PostMedia.PostID INNER JOIN 
    Following ON [User].ID = Following.FolloweeID 
 WHERE Following.FollowerID = 19 
 ORDER BY Post.CreationTime DESC`;
    
 let result = sql.querySql(query, function(data) {
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
    let username = '';

    // If there's an ID passed along
    if (typeof(req.params.id) !== 'undefined') {
        username = req.params.id;           
    }
    
    let query = `SELECT ID, Username, Website, Description, ImageUrl, 
    (SELECT Count(ID) FROM dbo.Post WHERE UserID = [User].ID) AS PostCount, 
    (SELECT Count(*) FROM dbo.Following WHERE FolloweeID = [User].ID) AS Followers, 
    (SELECT Count(*) FROM dbo.Following WHERE FollowerID = [User].ID) AS Followings 
FROM dbo.[User]  
WHERE Username = '${username}'

SELECT Post.ID, LocationName, PostMedia.MediaTypeID, PostMedia.MediaFileUrl 
  FROM dbo.Post INNER JOIN 
       dbo.[User] ON Post.UserID = [User].ID LEFT OUTER JOIN 
       dbo.PostMedia ON Post.ID = PostMedia.PostID 
 WHERE Username = '${username}'
 ORDER BY Post.CreationTime DESC `;
    
 let result = sql.querySql(query, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            let profile = data.recordsets[0][0];

            if (data.recordsets.length > 1) {
                let posts = data.recordsets[1];

                if (posts !== 'undefined')
                    profile.posts = posts;
                else
                    profile.posts = [];
            }
            
            res.send(profile);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.postDetails = function(req, res) {
    let id = '';
    // If there's an ID passed along
    if (typeof(req.params.id) !== 'undefined') {
        id = req.params.id;
    }

    let query = `SELECT Post.ID, Username, [User].ImageUrl, LocationName, Location,
    IsNull((SELECT Count(PostID) 
              FROM dbo.[Liking] 
             WHERE PostID = Post.ID), 0) AS Likes 
  FROM dbo.Post INNER JOIN 
       dbo.[User] ON Post.UserID = [User].ID 
 WHERE Post.ID = ${id}
 ORDER BY Post.CreationTime DESC; 

SELECT PostMedia.ID, PostMedia.MediaTypeID, PostMedia.MediaFileUrl 
  FROM dbo.Post INNER JOIN 
       dbo.PostMedia ON Post.ID = PostMedia.PostID  
 WHERE Post.ID = ${id}
 ORDER BY Post.CreationTime DESC; 

SELECT ID AS CommentID, Comment, CreationTime 
  FROM Comment 
 WHERE PostID = ${id}
 ORDER BY CreationTime`;

 let result = sql.querySql(query, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);

            let postitus = data.recordsets[0][0];
            if (data.recordsets.length > 1) {
                let media = data.recordsets[1];

                postitus.media = media;
            }
            if (data.recordsets.length > 2) {
                let comments = data.recordsets[2];

                postitus.comments = comments;
            }
            
            res.send(postitus);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.statistics = function(req, res) {
    let query = `SELECT 
    (SELECT Count(ID) FROM dbo.[User]) AS UserCount,
    (SELECT Count(ID) FROM Post) AS PostCount,
    (SELECT Avg(PostCount) 
       FROM (SELECT UserID, Count(ID) AS PostCount FROM Post GROUP BY UserID) PostsPerUser) AS AvgPostsPerUser,
    (SELECT Max(PostCount) 
       FROM (SELECT UserID, Count(ID) AS PostCount FROM Post GROUP BY UserID) PostsPerUser) AS MaxPostsPerUser,
    (SELECT Avg(CommentCount) 
       FROM (SELECT PostID, Count(ID) AS CommentCount FROM Comment GROUP BY PostID) CommentsPerPost) AS AvgCommentsPerPost,
    (SELECT Max(CommentCount) 
       FROM (SELECT PostID, Count(ID) AS CommentCount FROM Comment GROUP BY PostID) CommentsPerPost) AS MaxCommentsPerPost,
    (SELECT Avg(LikeCount) 
       FROM (SELECT PostID, Count(PostID) AS LikeCount FROM [Liking] GROUP BY PostID) LikesPerPost) AS AvgLikesPerPost,
    (SELECT Max(LikeCount) 
       FROM (SELECT PostID, Count(PostID) AS LikeCount FROM [Liking] GROUP BY PostID) LikesPerPost) AS MaxLIkesPerPost`;
    
       let result = sql.querySql(query, function(data) {
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
    let query = `SELECT TOP 10 [User].ID, [User].Username, Count(Post.ID) AS Posts 
    FROM Comment INNER JOIN 
         Post ON Comment.PostID = Post.ID INNER JOIN 
         [User] ON Post.UserID = [User].ID 
   GROUP BY [User].ID, [User].Username 
   ORDER BY Posts desc`;

    let result = sql.querySql(query, function(data) {
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
    let query = `SELECT CAST(CreationTime AS Date) AS Kuupaev, Count(ID) AS Arv 
    FROM [User] 
   GROUP BY CAST(CreationTime AS Date) 
   ORDER BY Kuupaev`;
    
    let result = sql.querySql(query, function(data) {
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
    let query = `SELECT Gender.Name AS Gender, Count([User].ID) AS Users 
    FROM dbo.[User] INNER JOIN 
         dbo.Gender ON [User].GenderID = Gender.ID 
   GROUP BY Gender.Name`;
    
    let result = sql.querySql(query, function(data) {
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
