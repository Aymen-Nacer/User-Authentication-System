require("dotenv").config()
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const User = require("./models/user.js");


const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const mongoString = 'mongodb://127.0.0.1:27017/user';
mongoose.connect(mongoString);
const db = mongoose.connection;

const app = express();


app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'your secret key',
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({ mongoUrl: db.client.s.url })
}));


const strategy = new LocalStrategy(User.authenticate())
passport.use(strategy);
passport.serializeUser(function(user, done){
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  User.findById(id, function (err, user){
    done(err, user);
  });
});
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/feed",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) =>{
  res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));


  app.get('/auth/google/feed',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect feed.
      res.redirect('/feed');
    });

app.get("/register", (req, res) =>{
  res.render('register');
});

app.get("/login", (req, res) =>{
  res.render('login');
});



app.post('/register', function (req, res) {
  User.register(
    new User({
      username: req.body.username
    }), req.body.password, function (err, msg) {
      if (err) {
        console.log(err);
        res.redirect("/register")
      } else {
        console.log({ message: "Successful" });
        // authenticate
        passport.authenticate("local")(req, res, function(){
          res.redirect("/feed")
        });
      }
    }
  )
})


app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login-failure',
  successRedirect: '/login-success'
}), (err, req, res, next) => {
  if (err) next(err);
});

app.get('/login-failure', (req, res, next) => {
  console.log(req.session);
  console.log('Login Attempt Failed.');
  res.redirect("/login")
});

app.get('/login-success', (req, res, next) => {
  console.log(req.session);
  console.log('Login Attempt was successful.');
  res.redirect("/feed");
});

app.get('/feed', function(req, res) {
  console.log(req.session)
  if (req.isAuthenticated()) {
    console.log({ message: 'You made it to the secured profie' })
    res.render('feed');
  } else {
    console.log({ message: 'You are not authenticated' })
    res.redirect("/login");
  }
})

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});


app.listen(3000, () => { console.log('Server started.') });
