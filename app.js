const express = require('express');
const app = express();
const userModel = require('./model/user');
const postModel = require('./model/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const path = require("path");
const jwt = require('jsonwebtoken');


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());
 
console.log(`secret ${process.env.SECRET}`)
app.get('/', (req, res) => {
    res.render('index');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/profile',isLoggedIn,async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email})
    console.log(user)
    res.render('profile.ejs', {user});
})

app.post('/register', async (req, res) => {
    let{email, password, username, name, age} = req.body;
    
    let user = await userModel.findOne({email});
    if(user) return res.status(500).send('user already registered');
    
    bcrypt.genSalt(10, (err, salt) =>{
       bcrypt.hash(password, salt, async (err, hash) => {
        let user = await userModel.create({
            username,
            name,
            age,
            email,
            password: hash
        })
        let token = jwt.sign({ email: email, userid: user._id}, 'shhhh')
        res.cookie('token', token);
        res.send('registered');
       })
    })
})

app.post('/login', async (req, res) => {
    let{email, password} = req.body;
    
    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send('Something Went Wrong');

    bcrypt.compare(password, user.password, function(err, result) {
        if(result) {
            let token = jwt.sign({ email: email, userid: user._id}, "shhh")
            res.cookie('token', token); 
            res.status(200).redirect('/profile');
        }
        else res.redirect('/login');
    })
})

app.get('/logout', async (req, res) => {
    res.cookie('token', '');
    res.redirect('/login');
})


function isLoggedIn(req, res, next){
    if (req.cookies.token === '') res.redirect('/profile')
        else{
    let data = jwt.verify(req.cookies.token,"shhh")
            req.user = data
            next();
    }
}


app.listen(3000);