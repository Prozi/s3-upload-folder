const AWS = require("aws-sdk/dist/aws-sdk-react-native");
const path = require("path");
const fs = require("fs");

const uploadDir = function (s3Path, bucketName) {
  const s3 = new AWS.S3();

  function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
      var filePath = path.join(currentDirPath, name);
      var stat = fs.statSync(filePath);
      if (stat.isFile()) {
        callback(filePath, stat);
      } else if (stat.isDirectory()) {
        walkSync(filePath, callback);
      }
    });
  }

  walkSync(s3Path, function (filePath, stat) {
    let bucketPath = filePath.substring(s3Path.length + 1);
    let params = {
      Bucket: bucketName,
      Key: bucketPath,
      Body: fs.readFileSync(filePath),
    };
    s3.putObject(params, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log(
          "Successfully uploaded " + bucketPath + " to " + bucketName
        );
      }
    });
  });
};

const folder = process.argv[2];
const bucket = process.argv[3];

if (folder && bucket) {
  uploadDir(folder, bucket);
} else {
  if (!folder) {
    console.error("Missing foler name");
  }
  if (!bucket) {
    console.error("Missing bucket name");
  }
  console.info("Usage: upload2s3 folder bucket");
}
