const User = require('../models/user');

exports.getLogin = (req, res, next) =>{
  res.render('auth/login',{
    path: '/login',
    pageTitle: "Login",
    isLoggedIn: req.session.isLoggedIn
  })
}
exports.postLogin = (req, res, next) =>{
  User.findById('61c602afbdee57521cfbb9a7')
    .then(user=>{
      req.session.isLoggedIn = true;
      req.session.userId = user._id;
      req.session.save((err)=>{
        if(err){
          console.log(err);
        }
        res.redirect("/");
      });
    })
    .catch(err=>console.log(err));
}

exports.getLogout = (req, res, next) =>{
  req.session.destroy((err)=>{
    if(err){
      console.log(err);
    }
    res.redirect('/');
  });
}

exports.getSignup = (req, res, next) =>{
  res.render('auth/signup',{
    path: '/signup',
    pageTitle: "Singup",
    isLoggedIn: req.session.isLoggedIn
  });
}

exports.postSignup = (req, res, next) =>{
}

