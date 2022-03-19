const path = require('path');
const fs = require("fs");

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const multer = require('multer');
const compression = require("compression");
const helmet = require("helmet");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

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

aws.config.update({
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION
});
const s3 = new aws.S3();
const upload = multer({
  storage:multerS3({
    bucket: process.env.BUCKET,
    s3: s3,
    acl:"public-read",
    key:(req,file,cb)=>{
      const date = (new Date().toISOString()).replace(/:/g,".");
      cb(null, date +'-name_' + file.originalname);
    }
  })
});

app.set('view engine', 'ejs');
app.set('views', 'views');


const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(upload.single("image"));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(compression());
app.use(helmet({
  frameguard:{
    action: "deny"
  },
  contentSecurityPolicy:{
    directives: {
      "default-src": ["'self'","paypal.com","*.paypal.com"],
      "script-src": ["'self'","*.paypal.com"],
      "style-src": ["'self'","https:", "'unsafe-inline'"],
      "img-src": ["'self'","data:","*.amazonaws.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));
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
      req.s3 = s3;
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
    throw new Error(err);
  });