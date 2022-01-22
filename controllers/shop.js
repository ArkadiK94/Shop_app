const fs = require("fs");
const path = require("path");

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require("../models/order");
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
exports.getInvoice = (req, res, next)=>{
  const orderId = req.params.orderId;
  Order.findById(orderId)
  .then(order=>{
    if(order.user._id.toString() !== req.session.user._id.toString()){
      return res.redirect("/");
    }
    const invoiceName = `Order-invoice-${orderId}.pdf`
    const invoicePath = path.join("data","invoices",invoiceName);
    const pdfDoc = new PDFDocument();
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${invoiceName}`);
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text("Invoice",{
      underline: true
    });
    pdfDoc.fontSize(26).text("----------------------------------------");
    order.items.forEach((item,i) =>{
      pdfDoc.fontSize(14).text(`${i+1}. ${item.title}, qty: ${item.quantity}, price: $${item.price*item.quantity}`);
    });
    pdfDoc.fontSize(26).text("----------------------------------------");
    pdfDoc.fontSize(20).text(`Total price: $${order.totalPrice}`);
    pdfDoc.end();
  })
  .catch(err=> {
    return errorFunctionSend(err,next);
  });

}

// exports.getCheckout = (req, res, next) => {
//   res.render('shop/checkout', {
//     path: '/checkout',
//     pageTitle: 'Checkout',
//   });
// };
