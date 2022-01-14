const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth:{
    api_key: process.env.SendGrid_API
  }
})); 

exports.getLogin = (req, res, next) =>{
  const errorMessage = req.flash("error")[0];
  const successMessage = req.flash("success")[0];
  res.render('auth/login',{
    path: '/login',
    pageTitle: "Login",
    errorMessage: errorMessage,
    successMessage: successMessage
  })
}
exports.postLogin = (req, res, next) =>{
  User.findOne({"email": req.body.email})
    .then(user=>{
      if(!user){
        req.flash("error","Wrong email or password");
        return res.redirect("/login");
      }
      return bcrypt.compare(req.body.password, user.password)
        .then(doMatch=>{
          if(!doMatch){
            req.flash("error","Wrong email or password");
            return res.redirect("/login");
          }
          req.session.isLoggedIn = true;
          req.session.userId = user._id;
          req.session.save((err)=>{
            if(err){
              console.log(err);
            }
            res.redirect("/");
          });
        })
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
  });
}

exports.postSignup = (req, res, next) =>{
  User.findOne({"email": req.body.email})
    .then(user =>{
      if(user){
        req.flash("error","This user is already exists");
        return res.redirect("/login");
      }
      return bcrypt.hash(req.body.password, 12)
        .then(hashedPassword=>{
          const newUser = new User({
            email: req.body.email, 
            password: hashedPassword, 
            cart:[]
          });
          return newUser.save()
            .then(()=>{
              req.flash("success", "The user was created. Now, you can login");
              res.redirect("/login");
              return transporter.sendMail({
                to: req.body.email,
                from: "arkadi29081994@gmail.com",
                subject: "Signup succeded!",
                html: '<h1>You successfully signed up</h1>'
              });
            });
        })
    })
    .catch(err => console.log(err));
}

