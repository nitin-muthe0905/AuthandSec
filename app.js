//jshint esversion:6

require("dotenv").config(); // Here we need require at top of code it. and we 
                            //not to assign variable as to we need just access this package and call config() method. 
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session"); // session and cookies
const passport = require("passport");  // session and cookies 
const passportLocalMongoose = require("passport-local-mongoose"); // session and cookies
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const findOrCreate = require('mongoose-findorcreate')  // mongoose packages from nodejs

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(session({
  secret: "session is best.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



// Setting mongodb

mongoose.connect("mongodb://localhost:27017/UserDB", {useNewUrlParser:true, useUnifiedTopology:true})
.then((result) => {
  console.log("MongoDB connected...");
}).catch((err) => {
  console.log(err);
});
mongoose.set('useCreateIndex', true);

// create user mongoose schema
const userSchema = new mongoose.Schema({
email: String,
password: String,
googleId: String,
facebookId: String,
secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model('User', userSchema); // Create new collection/table in database

passport.use(User.createStrategy());
 
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Accessing Google oauth strategies
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:5000/auth/google/secrets",  // puting here Authorised redirect URIs which we create when app set on google console
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) { //If you would like to use findOrCreate, try the npm package mongoose-findorcreate, 
    return cb(err, user);
  });
}
));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.APP_ID,
  clientSecret: process.env.APP_SECRET,
  callbackURL: "http://localhost:5000/auth/facebook/secrets",
  profileFields: ['profile'],
  
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


app.get("/", function(req, res){
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })

  );

  app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['profile'] })

  );


  app.get('/auth/google/secrets', passport.authenticate('google', { failureRedirect: '/login' }),function(req, res){
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

  app.get('/auth/facebook/secrets', passport.authenticate('facebook', { failureRedirect: '/login' }),function(req, res){
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  User.find({"secret": {$ne:null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    } else{
      if(foundUsers){
        res.render("secrets", {userWithSecrets: foundUsers})
      }
    }
  })
 });

 
 app.get("/submit", function(req, res){
  if(req.isAuthenticated()){
    res.render("submit");
  } else{
    res.redirect("/login");
  }
 });

 app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
 });

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;
  console.log(req.user.id);   
  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  })
}) 



// Setting up user registration with Mongo DB
app.post("/register", function(req, res){
  User.register({username: req.body.username},req.body.password, function(err, user){
    if(err){ 
    console.log(err);
    res.redirect("/login");
  } else{
    passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets");
    });
  } 
  });
  
  
});

app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user, function(err){
    if(err){
      console.log(err);
    } else{
      passport.authenticate("local") (req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});




// setting up server 
app.listen(5000, function(){
  console.log("Server running on PORT:5000");
});