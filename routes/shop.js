const express = require('express');

const shopController = require('../controllers/shop');

const router = express.Router();

const isAuth = require('../middleware/is-auth');

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart);

router.delete("/cart/:productId", isAuth, shopController.deleteCartItem);

router.get('/orders', isAuth, shopController.getOrders);

router.post('/orders', isAuth, shopController.postOrders);

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

router.get('/checkout', isAuth, shopController.getCheckout);

router.post('/checkout', isAuth, shopController.postCheckout);


module.exports = router;
