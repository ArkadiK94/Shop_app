const deleteFile = (filePath,s3)=>{
  const key = filePath.split("/")[3];
  s3.deleteObject({Bucket:process.env.BUCKET, Key:key}).promise()
    .catch(err => {
      throw new Error(err);
    });
}

exports.deleteFile = deleteFile;