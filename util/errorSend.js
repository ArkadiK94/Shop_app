module.exports = (err, next, errStatus=500)=>{
  const error = new Error(err);
  error.httpStatusCode = errStatus;
  return next(error);
}