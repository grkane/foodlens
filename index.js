"use strict"

// include modules
var express = require('express');
var fileUpload = require('express-fileupload');
var bodyParser = require("body-parser");
var session = require("express-session");
var mysql = require("mysql");
var path =  require("path");

// configure the port
var port = "8000";
//var port ="3306";

// create express app object
//var app = express();
var app = require('express')();
var http = require('http').Server(app);

// configure static dir
app.use(express.static("assets"));

app.use('/assets', express.static(path.join(__dirname, 'assets')))

//Configure middlewares
app.use(session({secret: "ttgfhrwgedgnl7qtcoqtcg2uyaugyuegeuagu111",
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 120000}}));
app.set("view-engine", "ejs");
app.set("views", "templates");

app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());

app.use((req, res, next)=> {
    console.log("New Request: " + req.url, req.method)
    if (req.method === "POST") {
        console.log(req.body)
    }
    next()
});

// configure out database connection
//var con = mysql.createConnection({
    /*connectionLimit : 10,
    host: "localhost",
    user: "root",
    password : "idm123!",
    database: "project",*/
// two lines below not in use
   // database: "foodlens"
    //port: "8000"

// configuring rds connection
const con = mysql.createConnection({
    host: "foodlens-data.c1iyfyeavxak.eu-west-1.rds.amazonaws.com",
    user: "admin",
    password: "Hellofoodlens",
    port: "8000"
});


/*var pool  = mysql.createPool({
    connectionLimit : 10,
    host            : "localhost",
    user            : "root",
    password        : "idm123!",
    database        : "foodlens"
});

pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
    if (error) throw error;
    console.log('The solution is: ', results[0].solution);
}); */

// connect to the DB
con.connect( function(err) {
    if (err) {
        console.log("Error: "+err);
    } else {
        con.query("SELECT * FROM users", function (err, results){
            console.log(results);
            if (err) {throw err}
        })
        console.log("Successfully connected to DB");

    }
});


//configure routes
// GET routes



app.get("/", function (req, res){
    var options= {
        root: __dirname,
    }
    res.sendFile("index.html", options )
})

app.get("/create", function(req, res) {
    var sessionData;
    if (req.session.data) {
        sessionData = req.session.data;
    }
    res.render("create.ejs", {"user": sessionData});
})

app.get("/login", function(req, res) {
    res.render("login.ejs");
})

app.get("/register", function (req, res) {
    res.render("register.ejs")
    console.log("register rendered")
})


// /profile is only accessible for logged in users
app.post("/login", function(req, res) {
    var found = false;
    /* var sql = `SELECT * FROM users`; */

    var username = req.body.username;
    var password = req.body.password;
    var sessionData = null;
    req.session.username = req.body.username;
    req.session.password = req.body.password;
    //var sessionData = req.session.data;

    con.query ('SELECT * FROM users WHERE username = ? AND pass = ?', [username, password], function(err, results){
        console.log(err, results);

        // con.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if (results.length > 0) {
                for (var i in results) {
                    if (username == results[i].username && password == results[i].password)
                        // if (req.session.username = req.body.username)
                    { // judge if the username and password that users input are right
                        found = true;
                        console.log("found");
                        req.session.username = username;
                        sessionData = req.session.username;
                    }
                }
                console.log("from login, username: "+ req.session.username)
                res.render("create.ejs", {"user": sessionData});

            }
        }
    })
});

//registration form requiring user input and then inserted into database
app.post("/register", function(req, res){
    //var found = false;
    //   var sql = `SELECT * FROM users`;
    var username = req.body.username;
    var firstname = req.body.firstname;
    var surname = req.body.surname;
    var pass = req.body.password;
    var sessionData = null;
    req.session.username = req.body.username;
    req.session.password = req.body.password;
    req.session.surname = req.body.surname;
    req.session.firstname = req.body.firstname;


    var sql = "INSERT INTO users (firstname, surname, username, pass)VALUES('"+ firstname +"','"+ surname +"','"+ username +"','" + pass +"')";
    //("${username}", "${firstname}", "${surname}", "${pass}")`;
    console.log("register function");
    //('"+ username +"','"+ firstname +",'"+ surname +"','" + pass +"')";
    console.log("after sql setting");
    con.query(sql, function(err, results){
//("${username}", "${firstname}", "${surname}", "${pass}")`;
        //con.query(sql, function(err, results) {
        if (err) {
            res.send("A database error occurred cant go home: "+err);
        } else {
            console.log(results);
            req.session.username = username;
            res.redirect("/create");

        }
    });
});

// feed to browse through all images uploaded by users
app.get("/feed" , function(req, res){
    var mysql=("SELECT * FROM uploads")
    con.query(mysql, function(err, results){
        if(err){
            console.log(err)
            res.redirect("/");
        }
        else{
            console.log(results)
        }
        res.render("feed.ejs", {"uploads": results});
    })
});

app.post("/feed", function(req, res) {
    var file = req.files.myimage;
    //file.mv("static/uploads"+file.name);
    res.render("feed.ejs", {"filename": file.name});
});

app.get("/create", function(req, res) {
    var username = req.session.username;
    console.log("from user home, username: "+username)
    if (username){
        con.query('SELECT * FROM users WHERE username =?', [username], function (err, result) {
            if (err){
                res.redirect("/");
            }
            else{
                res.render("create.ejs", {"users": result})
            }

        })
    }
    else {
        res.redirect("/")
    }

})

app.get("/image", function(req, res){
    var username = req.session.username;
    var imageID = req.params.imageID;
    con.query("SELECT * FROM uploads WHERE imageID=?", [imageID], function(err, result){
        if(err){
            console.log(err)
        }
        else{
            res.render("image.ejs", {"uploads": result})
        }
    })


});


app.post("/image/:imageID", function(req, res) {
    //var file = req.files.myimage;
    var username = req.params.username;
    var caption = req.body.caption;
    //var url = req.body.URL;
    //var creator = req.params.username;
    var user= req.session.username;
    var comment = req.params.comment;
    var date = req.body.idate;
    var imageID = req.params.imageID;
    var todayDate = new Date().toISOString().slice(0,10);

    console.log(todayDate)
    console.log(imageID+comment+username);
    var addComment = "INSERT INTO comment(username, comment, imageID, date)VALUES('" + username + "','" + comment + "','" + imageID + "','" + todayDate +" ')"
    //var addComment ="INSERT INTO comment(username, comment, id, date)VALUES('" + user + "','" + comment + "','" + id + "','" + todayDate + "')";
    // var addComment ="INSERT INTO comment(username, comment, id, date)VALUES ? ";
    con.query(addComment, function(err, results) {
        if (err) {
            console.log(err)
            res.redirect("/feed")
            //alert("error occurred");
        } else {
            console.log(username);
            res.render("image.ejs", {"uploads": results});
        }

    });
});

//for future developments of like functionality
/*app.post("/likes", function, res){
    var id =req.body.imageID;
    con.query(SELECT * FROM uploads imageID[id] (err, results)){
         var currentlikes = results[0].likes
        currentlikes++
        con.query( UPDATE 'uploads' set likes=? WHERE imageID=? , [currentlikes, id] (err, results2))
        res.render("/image/" +id, {uploads})
    }
};*/

//upload is only accessible for logged in users
app.get("/upload", function(req, res) {
    var sessionData= req.session.data;
    if (sessionData) {
        res.render("upload.ejs", {"user": sessionData});
    } else {
        res.redirect('/');
    }
});

app.post("/upload", function(req, res) {
    var file = req.files.myimage;
    var user = req.body.username;
    var caption = req.body.caption;
    var url = req.body.URL;

    file.mv("static/uploads/"+file.name);

    var todayDate = new Date().toISOString().slice(0,10);
    var myURL = ("/uploads/"+file.name);
    console.log(myURL)

    var sql = "INSERT INTO uploads (id, username, caption, idate, URL)VALUES('"+ file.name +"','"+ user +"','"+ caption +"','" + todayDate +"', '"+ myURL +"')";
    console.log("upload function");
    console.log("after sql setting");
    con.query(sql, function(err, results){
        if (err) {
            res.send("A database error occurred: "+err);
        } else {
            console.log(results);
            req.session.username = user;
            res.render("upload.ejs", {"filename": file.name});

        }
    });


});

//to end user session
app.get("/delete", function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

// loading comments
app.post("/comment", function (req, res){
    var username = req.session.username;
    var imageID = req.body.imageID;
    var comment = req.body.comment;
    var todayDate = new Date().toISOString().slice(0,10);;

    con.query("INSERT INTO comment(username, comment, imageID, date)VALUES('" + username + "','" + comment + "','" + imageID + "','" + todayDate +" ')", function( err, result){
        if (err){
            console.log("error inserting into comments: "+ err)
        }
        else {
            console.log("added into comments DB: "+ results)
        }

    });


})

//Start the server
app.listen(port);
console.log("Server running on http://localhost:"+port);
