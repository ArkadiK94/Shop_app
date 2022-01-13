const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');

const errorController = require('./controllers/error');
const User = require('./models/user');
const csrf = require('csurf');

const app = express();
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const MONGODB_URI = 'mongodb+srv://ArkadiK:Arkadi$29081994@nodeapp.aoeo9.mongodb.net/shop?retryWrites=true&w=majority';
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: "this is a secret code",
  resave: false,
  saveUninitialized: false,
  store: store
}));

app.use(csrfProtection);
app.use((req, res, next)=>{
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(flash());

app.use((req, res, next)=>{
  if(req.session.isLoggedIn){
    User.findById(req.session.userId)
      .then((user)=>{
        req.session.user = user;
        next();
      })
      .catch(err => console.log(err));
  } else {
    next();
  }
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


app.use(errorController.get404);

mongoose.connect(MONGODB_URI)
  .then(()=>{
    app.listen(3000);
  })
  .catch(err => console.log(err));