const Product = require('../models/product');
const Cart = require("../models/cart");

exports.getProducts = (req, res, next) => {
  Product.fetchAll()
    .then(([rowsOfData, filedData])=>{
      res.render('shop/product-list', {
        prods: rowsOfData,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err=>console.log(err));
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId,product=>{
    res.render("shop/product-detail",{
      product: product,
      pageTitle: product.title,
      path: "/products"
    });
  });
}
exports.getIndex = (req, res, next) => {
  Product.fetchAll()
    .then(([rowsOfData, filedData])=>{
      res.render('shop/index', {
        prods: rowsOfData,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch((err)=>console.log(err));
};

exports.getCart = (req, res, next) => {
  Product.fetchAll(products=>{
    Cart.getProducts(cart=>{
      const cartProducts = [];
      products.forEach(product=>{
        const cartProductData = cart.products.find(prod => prod.id === product.id);
        if(cartProductData){
          cartProducts.push({product: product, quantity: cartProductData.quantity});
        }
      });
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        cartProducts: cartProducts
      });
    });
  });
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId, product=>{
    Cart.addProduct(productId, product.price);
  });
  res.redirect("/cart");
};

exports.postDeleteCartItem = (req, res, next)=>{
  console.log(1);
  const productId = req.body.productId;
  Product.findById(productId, product=>{
    Cart.deleteProduct(productId,product.price);
    res.redirect("/cart");
  });
  
};

exports.getOrders = (req, res, next) => {
  res.render('shop/orders', {
    path: '/orders',
    pageTitle: 'Your Orders'
  });
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
