const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    edit: false
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  const productId = req.params.productId;
  if(!editMode){
    return res.redirect("/");
  }
  Product.findByPk(productId)
    .then(product=>{
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        edit: editMode,
        product: product
      });
    })
    .catch(err=>{
      console.log(err);
      return res.redirect("/");
    });
  
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  Product.create({
    title,imageUrl,price,description
  })
    .then(()=>{
      res.redirect('/');
    })
    .catch(err=>{
      console.log(err);
    })
};

exports.postEditProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const productId = req.body.productId;
  const product = new Product(title, imageUrl, description, price, productId);
  product.save(cb);
  res.redirect('/admin/products');
};

exports.postDeleteProduct = (req, res, next)=>{
  const productId = req.body.productId;
  Product.deleteById(productId);
  res.redirect("/admin/products");
}

exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then(products=>{
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err=>console.log(err));
};
