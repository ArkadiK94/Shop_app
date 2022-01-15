const {validationResult} = require('express-validator');

const Product = require('../models/product');
const User = require('../models/user');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    edit: false,
    errorMessage: null,
    validationError: [],
    hasError: false,
    product: {
      title: "",
      imageUrl: "",
      price: "",
      description: ""
    }

  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const user = req.session.user;
  const newProduct = new Product({title, imageUrl, price, description, userId: user});
  const error = validationResult(req);

  if(!error.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      edit: false,
      hasError: true,
      errorMessage: error.array()[0].msg,
      validationError: error.array(),
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description
      }
    });
  }

  newProduct.save()
    .then(()=>{
      res.redirect('/');
    })
    .catch(err=> console.log(err));
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  const productId = req.params.productId;
  if(!editMode){
    return res.redirect("/");
  }
  Product.findById(productId)
    .then(product =>{
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        edit: editMode,
        product: product,
        errorMessage: null,
        validationError: [],
        hasError: false
      });
    })
    .catch(err=>{
      throw err;
    });
};

exports.postEditProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const productId = req.body.productId;
  const user = req.session.user;
  const error = validationResult(req);

  if(!error.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      edit: true,
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,
        _id: productId
      },
      errorMessage: error.array()[0].msg,
      validationError: error.array(),
      hasError: true
    });
  }

  Product.findById(productId)
    .then( product=>{
      if(product.userId.toString() !== user._id.toString()){
        return res.redirect("/");
      } 
      product.title = title;
      product.imageUrl = imageUrl;
      product.price = price;
      product.description = description;
      
      return product.save()
        .then(()=>{
          res.redirect('/admin/products');
        });
    })
    .catch((err)=>console.log(err));
};

exports.postDeleteProduct = (req, res, next)=>{
  const productId = req.body.productId;
  const user = req.session.user;

  Product.findById(productId)
    .then(product=>{
      if(product.userId.toString() !== user._id.toString()){
        return res.redirect("/");
      }
      return product.remove()
        .then(()=>{
          return User.updateMany(
            {"cart.items.productId" : productId},
            {$pull:{"cart.items":{productId:productId}}}
          );
        })
        .then(()=>{
          return res.redirect("/admin/products");
        });
    })
    .catch((err)=>console.log(err));
}

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.session.user._id})
    .then(products =>{
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      });
    })
    .catch(err=>{
      throw err;
    });
};
