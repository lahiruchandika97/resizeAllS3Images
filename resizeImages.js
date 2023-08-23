const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

require('dotenv').config();

const SOURCE_BUCKET = process.env.SOURCE_BUCKET;
const SOURCE_PREFIX = process.env.SOURCE_PREFIX;
const DESTINATION_BUCKET = process.env.DESTINATION_BUCKET;
const DESTINATION_FOLDER = process.env.DESTINATION_FOLDER;
const RESIZE_IMAGE_WIDTH = parseInt(process.env.RESIZE_IMAGE_WIDTH, 10);


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
