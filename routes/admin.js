const express = require('express');
const {body} = require("express-validator");

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();


// /admin/add-product => GET
router.get('/add-product',isAuth, adminController.getAddProduct);

router.get('/edit-product/:productId',isAuth, adminController.getEditProduct);

// /admin/products => GET
router.get('/products',isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  '/add-product',
  isAuth, 
  [
    body("title").isLength({min:1}).isString().trim(),
    body("price").isLength({min:1}).isFloat(),
    body("description").isLength({min:1}).trim()
  ],
  adminController.postAddProduct
);

router.post(
  '/edit-product',
  isAuth,
  [
    body("title").isLength({min:1}).isString().trim(),
    body("price").isLength({min:1}).isFloat(),
    body("description").isLength({min:1}).trim()
  ], 
  adminController.postEditProduct);

router.delete("/product/:productId",isAuth, adminController.deleteProduct);

module.exports = router;
