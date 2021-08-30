const AWS = require("aws-sdk");
const mime = require("mime-types");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");

const dryRun = Array.from(process.argv).join(" ").includes("--dry");
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

function uploadDir(s3Path, bucketName) {
  const dirName = path.basename(s3Path);
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

  walkSync(s3Path, function (filePath) {
    const bucketPath = `${dirName}${filePath.split(dirName)[1]}`;
    const params = {
      Bucket: bucketName,
      Key: bucketPath,
      Body: fs.readFileSync(filePath),
    };

    if (bucketPath.endsWith("/")) {
      return;
    }

    params.ContentType = mime.lookup(bucketPath);

    const uploadLog = `${chalk.blueBright(bucketPath)} as ${chalk.whiteBright(
      params.ContentType
    )}`;

    if (dryRun) {
      console.info(`Dry upload: ${mimeLog}`);

      return;
    }

    s3.putObject(params, function (err) {
      if (err) {
        console.log(err.message);
      } else {
        console.info(`Uploaded: ${uploadLog}`);
      }
    });
  });
}
