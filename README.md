# resizeAllS3Images

It's possible to run the script locally. However, you'll need to ensure your local environment has the necessary AWS credentials to access the S3 buckets. Use AWS CLI or SDK to configure credentials.

1. Environment Setup:

- Install necessary node modules: npm install aws-sdk sharp.
- Make sure you've configured your AWS credentials. If not, install the AWS CLI and configure it using aws configure.

2. Run Script:

- Execute the script: `node resizeImages.js`

### Note: This script processes one image at a time, which is simple but not the most efficient. For processing a large number of images, consider implementing parallel processing or using AWS Lambda with S3 Event triggers to distribute the load.