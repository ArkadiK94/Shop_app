const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
  Product.findAll()
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
  Product.findByPk(productId)
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
  Product.findAll()
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
  const user = req.user;
  user.getCart()
    .then((cart)=>{
      return cart.getProducts()
    })
    .then((products)=>{
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        cartProducts: products
      });
    })
    .catch((err)=>{
      console.log(err);
    });
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  const user = req.user;
  let theCart;
  let theProduct; 

  Product.findByPk(productId)
    .then(product=>{
      theProduct = product;
      return user.getCart();
    })
    .then((cart)=>{
      theCart = cart;
      return theCart.getProducts({where:{id:productId}});
    })
    .then(([product])=>{
      if(!product){
        return theCart.addProduct(theProduct,{through:{quantity:1}});
      } 
      product.cartItem.quantity += 1; 
      return product.cartItem.save(); 
    })
    .then(()=>{
      res.redirect("/cart");
    })
    .catch(err=>console.log(err));
};

exports.postDeleteCartItem = (req, res, next)=>{
  const productId = req.body.productId;
  const user = req.user;
  user.getCart()
    .then(cart=>{
      return cart.getProducts({where:{id:productId}});
    })
    .then(([product])=>{
      return product.cartItem.destroy();
    })
    .then(()=>{
      res.redirect("/cart");
    })
    .catch(err=>console.log(err));
  
};

exports.getOrders = (req, res, next) => {
  req.user.getOrders({include:["products"]})
    .then(orders=>{
      console.log(2);
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
  let orderOfUser;
  let catOfUser;

  user.createOrder()
    .then(order=>{
      orderOfUser = order;
      return user.getCart()
    })
    .then(cart =>{
      catOfUser = cart;
      return cart.getProducts()
    })
    .then(products =>{
      return orderOfUser.addProduct(products.map(prod=>{
        prod.orderItem = {quantity: prod.cartItem.quantity};
        return prod; 
      }));

    })
    .then((p)=>{
      console.log(p)

      return catOfUser.setProducts(null);
    })
    .then(()=>{
      res.redirect("/orders");
    })
    .catch(err=>console.log(err));
}

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
