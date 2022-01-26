const {validationResult} = require('express-validator');

const Product = require('../models/product');
const User = require('../models/user');
const errorFunctionSend = require("../util/errorSend");
const fileHelper = require('../util/file');

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
      price: "",
      description: ""
    }

  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageFile = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const user = req.session.user;
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
        price: price,
        description: description
      }
    });
  }
  if(!imageFile){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      edit: false,
      hasError: true,
      errorMessage: "Pls, add image",
      validationError: [],
      product: {
        title: title,
        price: price,
        description: description
      }
    });
  }
  const imageUrl = `/images/${imageFile.filename}`;
  const newProduct = new Product({title, imageUrl, price, description, userId: user});

  newProduct.save()
    .then(()=>{
      res.redirect('/');
    })
    .catch(err=> {
      return errorFunctionSend(err,next);
    });
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
      return errorFunctionSend(err,next);
    });
};

exports.postEditProduct = (req, res, next) => {
  const title = req.body.title;
  const imageFile = req.file;
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
      if(imageFile){
        fileHelper.deleteFile(`./public/${product.imageUrl}`); 
        const imageUrl = `/images/${imageFile.filename}`;
        product.imageUrl = imageUrl;
      }
      product.price = price;
      product.description = description;
      
      return product.save()
        .then(()=>{
          res.redirect('/admin/products');
        });
    })
    .catch((err)=>{
      return errorFunctionSend(err,next);
    });
};

exports.postDeleteProduct = (req, res, next)=>{
  const productId = req.body.productId;
  const user = req.session.user;

  Product.findById(productId)
    .then(product=>{
      if(product.userId.toString() !== user._id.toString()){
        return res.redirect("/");
      }
      fileHelper.deleteFile(`./public/${product.imageUrl}`); 
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
    .catch((err)=>{
      return errorFunctionSend(err,next);
    });
}

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  const ITEMS_PER_PAGE = 3;
  let totalItems;
  Product.find({userId: req.session.user._id})
    .countDocuments()
    .then(numberOfProducts=>{
      totalItems = numberOfProducts;
      return Product.find().skip((page -1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
    })
    .then(products=>{
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
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
