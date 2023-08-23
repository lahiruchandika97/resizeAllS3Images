const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

const SOURCE_BUCKET = 'tr-customer-resources-bucket';
const SOURCE_PREFIX = 'pictures/';
const DESTINATION_BUCKET = 'revocare-public';
const DESTINATION_FOLDER = 'resized-images/';
const RESIZE_IMAGE_WIDTH = 200;

async function processImage(srcBucket, srcKey) {
    const typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) return;

    const imageType = typeMatch[1].toLowerCase();
    if (imageType !== 'jpg' && imageType !== 'png') return;

    const dstKey = DESTINATION_FOLDER + srcKey;

    try {
        const origImage = await s3.getObject({ Bucket: srcBucket, Key: srcKey }).promise();
        const resizedImage = await sharp(origImage.Body).resize(RESIZE_IMAGE_WIDTH).toBuffer();

        await s3.putObject({
            Bucket: DESTINATION_BUCKET,
            Key: dstKey,
            Body: resizedImage,
            ContentType: `image/${imageType}`,
        }).promise();

        console.log(`Successfully resized and copied ${srcKey} to ${DESTINATION_BUCKET}`);
    } catch (error) {
        console.error(`Error processing ${srcKey} from ${srcBucket}`, error);
    }
}

async function resizeAllImages() {
    try {
        let isTruncated = true;
        let marker;
        while (isTruncated) {
            const data = await s3.listObjectsV2({
                Bucket: SOURCE_BUCKET,
                Prefix: SOURCE_PREFIX,
                Marker: marker,
            }).promise();

            for (const item of data.Contents) {
                await processImage(SOURCE_BUCKET, item.Key);
            }

            isTruncated = data.IsTruncated;
            if (isTruncated) {
                marker = data.Contents.slice(-1)[0].Key;
            }
        }
    } catch (err) {
        console.error('Error listing objects in the bucket', err);
    }
}

resizeAllImages();
