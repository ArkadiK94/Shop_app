const crypto = require('crypto');

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
  let errorMessage = req.flash("error");
  let successMessage = req.flash("success");
  if (errorMessage.length >= 1){
    errorMessage = errorMessage[0];
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
    successMessage: successMessage
  })
}
exports.postLogin = (req, res, next) =>{
  User.findOne({"email": req.body.email})
    .then(user=>{
      if(!user){
        req.flash("error","Invalid email or password");
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
    errorMessage: errorMessage
  })
}

exports.postReset = (req, res, next) =>{
  const userEmail = req.body.email;
  User.findOne({email: userEmail})
    .then(user =>{
      if(!user){
        req.flash("error","This user is not exist ");
        return res.redirect("/reset");
      }
      return crypto.randomBytes(32, (err, buffer)=>{
        if(err){
          console.log(err);
          return res.redirect('/');
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
    .catch(err => console.log(err));
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
        resetToken: token
      })
    })
    .catch(err=>console.log(err));
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
    .catch(err=> console.log(err));
}