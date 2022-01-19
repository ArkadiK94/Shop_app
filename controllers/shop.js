const Product = require('../models/product');

const errorFunctionSend = require("../util/errorSend");


exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products=>{
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
      });
    })
    .catch(err=>{
      return errorFunctionSend(err,next);
    });
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then(product=>{
      res.render("shop/product-detail",{
        product: product,
        pageTitle: product.title,
        path: "/products"
      });
    })
    .catch(err=>{
      return errorFunctionSend(err,next);
    });
}

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products=>{
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err=>{
      return errorFunctionSend(err,next);
    });
};

exports.getCart = (req, res, next) => {
  const user = req.session.user;
  user.getCart()
    .then(products=>{
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        cartProducts: products,
      });
    })
    .catch(err => { 
      return errorFunctionSend(err,next);
    });
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  const user = req.session.user;
  Product.findById(productId)
    .then(product=>{
      return user.addToCart(product);
    })
    .then(()=>{
      res.redirect("/cart");
    })
    .catch(err => { 
      return errorFunctionSend(err,next);
    });

};

exports.postDeleteCartItem = (req, res, next)=>{
  const productId = req.body.productId;
  const user = req.session.user;
  user.deleteFromCart(productId)
    .then(()=>{
      res.redirect("/cart");
    })
    .catch(err=> { 
      return errorFunctionSend(err,next);
    });
  
};

exports.getOrders = (req, res, next) => {
  req.session.user.getOrders()
    .then(orders=>{
      let total = 0;
      orders.forEach(order=>{
        total += order.totalPrice;
      });
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        total: total
      });
    })
    .catch(err => { 
      return errorFunctionSend(err,next);
    });  
};

exports.postOrders = (req, res, next) => {
  const user = req.session.user;
  user.addOrder()
    .then(()=>{
      res.redirect("/orders");
    })
    .catch(err=>{
      return errorFunctionSend(err,next);
    });
}

// exports.getCheckout = (req, res, next) => {
//   res.render('shop/checkout', {
//     path: '/checkout',
//     pageTitle: 'Checkout',
//   });
// };
