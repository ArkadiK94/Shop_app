const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const {validationResult} = require("express-validator");

const User = require('../models/user');
const errorFunctionSend = require("../util/errorSend");


const transporter = nodemailer.createTransport(sendgridTransport({
  auth:{
    api_key: process.env.SendGrid_API
  }
})); 

exports.getLogin = (req, res, next) =>{
  let email = null ,password= null, errorArray=[];
  let errorMessage = req.flash("error");
  let successMessage = req.flash("success");
  if (errorMessage.length >= 1){
    errorMessage = errorMessage[0];
    email = req.flash("email");
    password = req.flash("password");
    errorArray = [{param:"email"},{param:"password"}];

  } else{
    errorMessage = null;
  }
  if (successMessage.length >= 1){
    successMessage = successMessage[0];
  } else{
    successMessage = null;
  }
  res.render('auth/login',{
    path: '/login',
    pageTitle: "Login",
    errorMessage: errorMessage,
    successMessage: successMessage,
    oldInputs: {email:email, password:password},
    validationErrors : errorArray
  })
}
exports.postLogin = (req, res, next) =>{
  const errorResult = validationResult(req);
  if(!errorResult.isEmpty()){
    const errorMessage = errorResult.array();
    return res.status(422).render('auth/login',{
      path: '/login',
      pageTitle: "Login",
      errorMessage: errorMessage[0].msg,
      oldInputs: {email: req.body.email, password: req.body.password},
      validationErrors : errorMessage
    })
  }
  User.findOne({"email": req.body.email})
    .then(user=>{
      return bcrypt.compare(req.body.password, user.password)
        .then(doMatch=>{
          if(!doMatch){
            req.flash("error","Invalid email or password");
            req.flash("email",`${req.body.email}`);
            req.flash("password",`${req.body.password}`);
            return res.redirect("/login");
          }
          req.session.isLoggedIn = true;
          req.session.userId = user._id;
          req.session.save((err)=>{
            if(err){
              return errorFunctionSend(err,next);
            }
            res.redirect("/");
          });
        })
    })
    .catch(err=>{
      return errorFunctionSend(err,next);
    });
}

exports.getLogout = (req, res, next) =>{
  req.session.destroy((err)=>{
    if(err){
      return errorFunctionSend(err,next);
    }
    res.redirect('/');
  });
}

exports.getSignup = (req, res, next) =>{
  res.render('auth/signup',{
    path: '/signup',
    pageTitle: "Singup",
    errorMessage: null,
    oldInputs: {email: null, password: null, confirmPassword: null},
    validationErrors : []
  });
}

exports.postSignup = (req, res, next) =>{
  const errorResult = validationResult(req);
  if(!errorResult.isEmpty()){
    const errorMessage = errorResult.array();
    return res.status(422).render('auth/signup',{
      path: '/signup',
      pageTitle: "Singup",
      errorMessage: errorMessage[0].msg,
      oldInputs: {email: req.body.email, password: req.body.password, confirmPassword: req.body.confirmPassword},
      validationErrors : errorMessage
    })
  }
  bcrypt.hash(req.body.password, 12)
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
    .catch(err => {
      return errorFunctionSend(err,next);
    });
}

exports.getReset = (req, res, next) =>{
  let errorMessage = req.flash("error");
  if (errorMessage.length >= 1){
    errorMessage = errorMessage[0];
  } else{
    errorMessage = null;
  }  
  res.render('auth/reset',{
    path: '/reset',
    pageTitle: "Reset Password",
    errorMessage: errorMessage,
    oldInputs: {email: null},
    validationErrors : []
  })
}

exports.postReset = (req, res, next) =>{
  const errorResult = validationResult(req);
  const userEmail = req.body.email;

  if(!errorResult.isEmpty()){
    const errorMessage = errorResult.array();
    return res.status(422).render('auth/reset',{
      path: '/reset',
      pageTitle: "Reset Password",
      errorMessage: errorMessage[0].msg,
      oldInputs: {email: req.body.email},
      validationErrors : errorMessage
    })
  }
  User.findOne({email: userEmail})
    .then(user =>{
      return crypto.randomBytes(32, (err, buffer)=>{
        if(err){
          return errorFunctionSend(err,next);
        }
        const token = buffer.toString('hex');
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save()
          .then(()=>{
            res.redirect('/login');
            return transporter.sendMail({
              to: req.body.email,
              from: "arkadi29081994@gmail.com",
              subject: "Set A New Password",
              html: `
                <p>You asked for restrating your password</p>
                <p>Pls, Click on the <a href='http://localhost:3000/reset/${token}'>link</a> to set a new password</p>
              `
            });
          })
      })
    })
    .catch(err => { 
      return errorFunctionSend(err,next);
    });
}

exports.getNewPassword = (req, res, next)=>{
  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration:{$gt: Date.now()}})
    .then(user=>{
      if(!user){
        req.flash("error","This link expired");
        return res.redirect("/reset");
      }
      res.render('auth/new-password',{
        path: '/new-password',
        pageTitle: "New Password",
        userId: user._id,
        resetToken: token,
        errorMessage: null,
        oldInputs: {password: null, confirmPassword: null},
        validationErrors : []
      })
    })
    .catch(err=>{
      return errorFunctionSend(err,next);
    });
}

exports.postNewPassword = (req, res, next)=>{
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const resetToken = req.body.resetToken;
  User.findOne({resetToken: resetToken, resetTokenExpiration:{$gt: Date.now()}, _id: userId})
    .then(user=>{
      if(!user){
        req.flash("error","Something went wrong");
        return res.redirect("/login");
      }
      const errorResult = validationResult(req);
      if(!errorResult.isEmpty()){
        const errorMessage = errorResult.array();
        return res.status(422).render('auth/new-password',{
          path: '/new-password',
          pageTitle: "New Password",
          userId: user._id,
          resetToken: resetToken,
          errorMessage: errorMessage[0].msg,
          oldInputs: {password: req.body.password, confirmPassword: req.body.confirmPassword},
          validationErrors : errorMessage
        })
      }
      return bcrypt.hash(newPassword, 12)
        .then(hashedPassword=>{
          user.password = hashedPassword;
          user.resetToken = undefined;
          user.resetTokenExpiration = undefined;
          return user.save();
        })
        .then(()=>{
          req.flash("success", "The password was changed. Now, you can login");
          return res.redirect('/login');
        })        
    })
    .catch(err=> { 
      return errorFunctionSend(err,next);
    });
}