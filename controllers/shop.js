require("dotenv").config();

const fs = require("fs");
const path = require("path");

const PDFDocument = require('pdfkit');
const paypal = require("@paypal/checkout-server-sdk");

const Product = require('../models/product');
const Order = require("../models/order");
const errorFunctionSend = require("../util/errorSend");


exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  const ITEMS_PER_PAGE = 3;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(numberOfProducts=>{
      totalItems = numberOfProducts;
      return Product.find().skip((page -1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
    })
    .then(products=>{
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        currentPage: page, 
        hasNextPage: ITEMS_PER_PAGE * page < totalItems, 
        hasPriviousPage: page > 1,
        nextPage: page+1,
        priviousPage: page-1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)

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
  const page = +req.query.page || 1;
  const ITEMS_PER_PAGE = 3;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(numberOfProducts=>{
      totalItems = numberOfProducts;
      return Product.find().skip((page -1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
    })
    .then(products=>{
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page, 
        hasNextPage: ITEMS_PER_PAGE * page < totalItems, 
        hasPriviousPage: page > 1,
        nextPage: page+1,
        priviousPage: page-1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)

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

exports.deleteCartItem = (req, res, next)=>{
  const productId = req.params.productId;
  const user = req.session.user;
  user.deleteFromCart(productId)
    .then(()=>{
      res.status(200).json({message: "Success!"});
    })
    .catch(err=> { 
      res.status(500).json({message: `Deleting Product Failed. Err ${err}`});
    });
  
};

exports.getOrders = (req, res, next) => {
  req.session.user.getOrders()
    .then(orders=>{
      let total = 0;
      orders.forEach(order=>{
        total += order.totalPrice;
      });
      total = total.toFixed(2);
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
      res.status(200).json({url: "/orders"});
    })
    .catch(err=>{
      res.status(500).json({err: err.message});
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

exports.getCheckout = (req, res, next) => {
  const user = req.session.user;
  let total = 0;
  user.getCart()
    .then(products=>{
      products.forEach(prod => total += prod.productId.price * prod.quantity);
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        cartProducts: products,
        totalPrice: total
      });
    })
    .catch(err => { 
      return errorFunctionSend(err,next);
    });
};

exports.postCheckout = (req, res, next) => {
  const user = req.session.user;
  // const Environment = process.env.NODE_ENV === 'production' 
  //   ? paypal.core.LiveEnvironment : paypal.core.SandboxEnvironment;
  const Environment = paypal.core.SandboxEnvironment;
  const paypalClient = new paypal.core.PayPalHttpClient(new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET,
  ));
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  let total = 0;
  user.getCart()
    .then(products =>{
      products.forEach(prod => total += +prod.productId.price * +prod.quantity);
      return request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: total,
              breakdown:{
                item_total:{
                  currency_code:"USD",
                  value:total
                }
              }
            },
            items: products.map(prod=>{
              return {
                name: prod.productId.title,
                unit_amount: {
                  currency_code: "USD",
                  value: prod.productId.price
                },
                quantity: prod.quantity
              }
            })
          }
        ]
      });
    })
    .then(request =>{
      return paypalClient.execute(request);
    })
    .then((orderReq)=>{
      res.status(200).json({id: orderReq.result.id});   
    })
    .catch(err => { 
      res.status(500).json({error: err.message})
    });
};
