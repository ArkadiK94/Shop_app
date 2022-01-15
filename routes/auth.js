const express = require('express');
const {body} = require('express-validator');

const authController = require('../controllers/auth');
const User = require("../models/user");

const router = express.Router();

router.get('/login', authController.getLogin);

router.post(
  '/login', 
  [
    body("email","Invalid email or password").isEmail().normalizeEmail().custom((value)=>{
      return User.findOne({"email": value})
        .then(user=>{
          if(!user){
            return Promise.reject("This user is not exist");
          }
        });
    }),
    body("password","Pls,enter a password").isLength({min:1}).trim()
  ],
  authController.postLogin
);

router.get('/signup', authController.getSignup);

router.post(
  '/signup', 
  [
    body("email","Invalid email or password")
      .isEmail()
      .normalizeEmail()
      .custom((value)=>{
        return User.findOne({"email": value})
          .then(user=>{
            if(user){
              return Promise.reject("This user is already exists");
            }
          });
      }),

    body("password","Pls,enter a password with length greater than 5 and contains only letters and/or numbers")
      .isLength({min:5})
      .isAlphanumeric()
      .trim(),
    
    body("confirmPassword").isLength({min:1}).trim().custom((value,{req})=>{
      if(value !== req.body.password){
        throw new Error("Passwords dont match");
      }
      return true;
    })
  ],
  authController.postSignup
);

router.get('/logout', authController.getLogout);

router.get('/reset', authController.getReset);

router.post(
  '/reset', 
  body("email","Invalid email")
    .isEmail()
    .normalizeEmail()
    .custom((value)=>{
      return User.findOne({"email": value})
        .then(user=>{
          if(!user){
            return Promise.reject("This user is not exists");
          }
        });
    }),
  authController.postReset
);

router.get('/reset/:token', authController.getNewPassword);

router.post(
  '/new-password', 
  [    
    body("password","Pls,enter a password with length greater than 5 and contains only letters and/or numbers")
      .isLength({min:5})
      .isAlphanumeric()
      .trim(),
      
    body("confirmPassword").trim().custom((value,{req})=>{
      if(value !== req.body.password){
        throw new Error("Passwords dont match");
      }
      return true;
    })
  ],
  authController.postNewPassword
);

module.exports = router;
