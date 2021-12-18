const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
  Product.fetchAll()
    .then(products=>{
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err=>console.log(err));
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
    .catch(err=>console.log(err));
}

exports.getIndex = (req, res, next) => {
  Product.fetchAll()
    .then(products=>{
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err=>console.log(err));
};

exports.getCart = (req, res, next) => {
  req.user.getCart()
    .then(products=>{
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        cartProducts: products
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  const user = req.user;
  
  Product.findById(productId)
    .then(product=>{
      return user.addToCart(product);
    })
    .then(()=>{
      res.redirect("/cart");
    })
    .catch(err => console.log(err));

};

exports.postDeleteCartItem = (req, res, next)=>{
  const productId = req.body.productId;
  const user = req.user;
  user.deleteFromCart(productId)
    .then(()=>{
      res.redirect("/cart");
    })
    .catch(err=> console.log(err));
  
};

exports.getOrders = (req, res, next) => {
  req.user.getOrders()
    .then(orders=>{
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));  
};

exports.postOrders = (req, res, next) => {
  const user = req.user;
  user.addOrder()
    .then(()=>{
      res.redirect("/orders");
    })
    .catch(err=>console.log(err));
}

// exports.getCheckout = (req, res, next) => {
//   res.render('shop/checkout', {
//     path: '/checkout',
//     pageTitle: 'Checkout'
//   });
// };
