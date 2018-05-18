const express = require('express');
const session = require('express-session');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const app = express();
const COOKIE_SECRET = 'cookie_secret';
//############DATABASE############
//Connexion ) la db
const db = new Sequelize('gamereview', 'root', '', { host: 'localhost', dialect: 'mysql'});
//Definition des USERS
const Users = db.define('users', {
    username: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    }
});

//Defenition des Reviews
const Reviews = db.define('reviews', {
    title: {
        type: Sequelize.STRING
    },
    game: {
        type: Sequelize.STRING
    },
    content: {
        type: Sequelize.STRING
    },
    note: {
        type: Sequelize.DECIMAL
    },
    poster: {
        type: Sequelize.STRING
    },
    useful: {
        type: Sequelize.INTEGER
    }
});



//########AUTHETIFICATION###########
//PASSPORT
passport.use(new LocalStrategy((username, password, cb) => { Users
        .findOne({where: {username: username, password: password}})
        .then((user) => { cb(null, user || false); }); }));
passport.serializeUser((user, cb) => { cb(null, user.username); });
passport.deserializeUser((username, cb) => { Users
        .findOne({where: {username: username}})
        .then((user) => { return cb(null, user || false); }) .catch(cb); });




//##############MIDDLEWARE###########
app.set('view engine', 'pug');
app.use(express.static("public"));
app.use(cookieParser(COOKIE_SECRET));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: COOKIE_SECRET, resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());


//##########ROUTING############
//page d'acceuil
app.get('/', (req, res) => {
    Reviews
        .sync()
        .then(() => {
            Reviews
                .findAll()
                .then((reviews) => {
                    res.render('home', {user: req.user, reviews});
                })
        })
    // res.render('home', {user: req.user});});
});


//page de login
app.get('/login', (req, res) => {
    res.render('login');
});

//à l'inscription
app.post('/api/signup', (req, res) => {
    const name = req.body.username;
    const mail = req.body.email;
    const pwd = req.body.password;
    Users
        .sync()
        .then(() => {
            Users
                .create({username: name, password: pwd, email: mail})
                .then((user) => {
                    req.login(user, () => { res.redirect('/'); }); }) }) });

//à la connexion
app.post('/api/signin', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
    })
);


//###########REVIEWS CREATION   #############
app.post('/api/rev', (req,res) => {
    const gameName = req.body.game;
    const title = req.body.title;
    const content = req.body.content;
    const note = req.body.note;
    const posterT = req.user.username;
    Reviews
        .sync()
        .then(() => {
            Reviews
                .create({game: gameName, title: title, content: content, note: note, poster: posterT})
                .then(() => {
                    res.redirect('/');
                })
        })

});

// noinspection JSAnnotator
app.post('/api/upvote', (req, res) => {
    const rev = req.params.review;

    Reviews
        .findOne(rev)
        .then(() => {
            rev.useful = +1;
        })
});


db.sync().then(() => {
    app.listen(3000, () => {
        console.log("Server listening on port: 3000");
    });
});

