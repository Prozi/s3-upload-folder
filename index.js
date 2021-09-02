const AWS = require("aws-sdk");
const mime = require("mime-types");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");

const makePublic = Array.from(process.argv).join(" ").includes("--public");
const dryRun = Array.from(process.argv).join(" ").includes("--dry");
const folder = process.argv[2];
const bucket = process.argv[3];

if (folder && bucket) {
  uploadDir(folder, bucket);
} else {
  if (!folder) {
    console.error("Missing folder path");
  }

  if (!bucket) {
    console.error("Missing bucket name");
  }

  console.info(
    "Usage: s3-upload-folder ./folder bucket_name [--dry] [--public]"
  );
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
    if (filePath.endsWith("/")) {
      return;
    }

    const bucketPath = `${dirName}${filePath.split(dirName)[1]}`;
    const params = {
      Bucket: bucketName,
      Key: bucketPath,
      Body: fs.readFileSync(filePath),
      ContentType: mime.lookup(bucketPath) || "text/plain",
    };

    const uploadLog = `${chalk.blueBright(bucketPath)} as ${chalk.whiteBright(
      params.ContentType
    )}`;

    if (makePublic) {
      params.ACL = "public-read";
    }

    if (dryRun) {
      console.info(`Dry upload: ${uploadLog}`);
    } else {
      s3.putObject(params, function (err) {
        if (err) {
          console.error(err.message);
        } else {
          console.info(`Uploaded: ${uploadLog}`);
        }
      });
    }
  });
}
