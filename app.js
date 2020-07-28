//jshint esversion:6

require("dotenv").config(); // Here we need require at top of code it. and we 
                            //not to assign variable as to we need just access this package and call config() method. 
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

// Setting mongodb

mongoose.connect("mongodb://localhost:27017/UserDB", {useNewUrlParser:true, useUnifiedTopology:true})
.then((result) => {
  console.log("MongoDB connected...");
}).catch((err) => {
  console.log(err);
});

// create user mongoose schema
const userSchema = new mongoose.Schema({
email: String,
password: String
});

// encrypting the mongoose db and setting up env variable

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});  // encrypted certain field here that field is password 

// creating model

const User = new mongoose.model('User', userSchema);



app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});


// Setting up usre registration with Mongo DB
app.post("/register", function(req, res){
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save(function(err){
    if(err){
      console.log(err);
    } else{
      res.render("secrets");
    }
  });
});

app.post("/login", function(req, res){
  const username= req.body.username;
  const password= req.body.password 
  
  User.findOne({email: username}, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      if(foundUser){
        if(foundUser.password === password){
          res.render("secrets");
        }
      }
    }
  });

});




// setting up server 
app.listen(5000, function(){
  console.log("Server running on PORT:5000");
});