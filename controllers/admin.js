const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    edit: false
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;

  const newProduct = new Product(title, price, imageUrl, description);
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
        product: product
      });
    })
    .catch(err=>{
      throw err;
    });
};

// exports.postEditProduct = (req, res, next) => {
//   const title = req.body.title;
//   const imageUrl = req.body.imageUrl;
//   const price = req.body.price;
//   const description = req.body.description;
//   const productId = req.body.productId;
//   const user = req.user;

//   user.getProducts({where:{id:productId}})
//     .then((products)=>{
//       let product = products[0];
//       product.title = title;
//       product.imageUrl = imageUrl;
//       product.price = price;
//       product.description = description;
//       return product.save();
//     })
//     .then(()=>{
//       res.redirect('/admin/products');
//     })
//     .catch((err)=>{
//       console.log(err);
//     })
// };

// exports.postDeleteProduct = (req, res, next)=>{
//   const productId = req.body.productId;
//   const user = req.user;
//   user.getProducts({where:{id:productId}})
//     .then((products)=>{
//       const product = products[0];
//       return product.destroy();
//     })
//     .then(()=>{
//       res.redirect("/admin/products");
//     })
//     .catch((err)=>{
//       console.log(err);
//     });
// }

exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then(products =>{
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err=>{
      throw err;
    });
};
