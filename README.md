# Prerequisites

Get your AWS credentials and place them where [aws-sdk](https://www.npmjs.com/package/aws-sdk) package needs them: [docs.aws.amazon.com](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html)

# Usage

Usage: `s3-upload-folder folder bucket_name [folder] [--dry] [--public]`

- `folder` - folder contents to upload
- `bucket_name` - your s3 bucket name
- `folder` - relative target path (defaults to folder to upload, can use ..)
- `--dry` - run example how it would look, without upload
- `--public` - specify upload objects as public
