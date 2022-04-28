const AWS = require("aws-sdk");
const mime = require("mime-types");
const path = require("path");
const fs = require("fs");

const makePublic = Array.from(process.argv).join(" ").includes("--public");
const dryRun = Array.from(process.argv).join(" ").includes("--dry");
const folder = process.argv[2];
const bucket = process.argv[3];
const relativeTo = process.argv[4]?.startsWith("--") ? "" : process.argv[4];

if (folder && bucket) {
  uploadDir(folder, bucket);
} else {
  if (!folder) {
    console.error("Error: Missing folder path");
  }

  if (!bucket) {
    console.error("Error: Missing bucket name");
  }

  console.info(`
    Usage: 's3-upload-folder folder bucket_name [folder] [--dry] [--public]'

    - 'folder' - folder contents to upload
    - 'bucket_name' - your s3 bucket name
    - 'folder' - relative target path (defaults to folder to upload, can use ..)
    - '--dry' - run example how it would look, without upload
    - '--public' - specify upload objects as public
  `);
}

function uploadDir(s3Path, bucketName) {
  const dirName = path.basename(s3Path);
  const s3 = new AWS.S3();

  function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
      let filePath = path.join(currentDirPath, name);
      let stat = fs.statSync(filePath);

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

    const targetFilePath = path.join(
      dirName,
      relativeTo,
      filePath.split(dirName)[1].substr(1)
    );
    const params = {
      Bucket: bucketName,
      Key: targetFilePath,
      Body: fs.readFileSync(filePath),
      ContentType: mime.lookup(targetFilePath) || "text/plain",
    };

    const uploadLog = `${targetFilePath} as ${params.ContentType}`;

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
