const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const multer = require('multer');

const errorController = require('./controllers/error');
const User = require('./models/user');
const csrf = require('csurf');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorRoutes = require("./routes/error");
const errorFunctionSend = require("./util/errorSend");


const app = express();
const csrfProtection = csrf();
const fileStorage = multer.diskStorage({
  destination: (req, file, cb)=>{
    cb(null, "images");
  },
  filename: (req, file, cb)=>{
    const date = (new Date().toISOString()).replace(/:/g,".");
    cb(null, date +'-name_' + file.originalname);
  }
});
const fileFilter = (req, file, cb)=>{
  if(file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.set('view engine', 'ejs');
app.set('views', 'views');


const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single("image"));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/images",express.static(path.join(__dirname, 'images')));

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
    .catch(err => {
      return errorFunctionSend(err,next);
    });
  } else {
    next();
  }
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorRoutes);

app.use(errorController.get404);

app.use((err, req, res ,next)=>{
  console.log(err);
  let statusCode = err.httpStatusCode
  if(!statusCode){
    statusCode = 500;
  }
  if(!res.locals.isLoggedIn) {
    res.locals.isLoggedIn = false;
  }
  if(!res.locals.csrfToken){
    res.locals.csrfToken = false;
  }
  res.status(statusCode).render('500', { pageTitle: 'Error Occurred', path: '/500', errorMessage: err});
});
mongoose.connect(process.env.MONGODB_URI)
  .then(()=>{
    app.listen(process.env.PORT||3000);
  })
  .catch(err => { 
    console.log(process.env.MONGODB_URI);
    throw new Error(err);
  });