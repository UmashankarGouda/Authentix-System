import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.FILEBASE_ACCESS_KEY,
  secretAccessKey: process.env.FILEBASE_SECRET_KEY,
  endpoint: process.env.FILEBASE_ENDPOINT,
  region: process.env.FILEBASE_REGION,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

export const uploadToFilebase = async (
  fileBuffer: Buffer,
  fileName: string
): Promise<string> => {
  try {
    const params = {
      Bucket: process.env.FILEBASE_BUCKET!,
      Key: fileName,
      Body: fileBuffer,
      ContentType: 'application/octet-stream',
    };

    const result = await s3.upload(params).promise();
    
    // Extract CID from the result
    // Filebase returns CID in the ETag or we can construct it
    const cid = result.Key; // Simplified - in production, extract actual CID
    
    console.log(`✅ File uploaded to IPFS: ${cid}`);
    return cid;
  } catch (error) {
    console.error('❌ Error uploading to Filebase:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

export const getFromFilebase = async (cid: string): Promise<Buffer> => {
  try {
    const params = {
      Bucket: process.env.FILEBASE_BUCKET!,
      Key: cid,
    };

    const result = await s3.getObject(params).promise();
    return result.Body as Buffer;
  } catch (error) {
    console.error('❌ Error retrieving from Filebase:', error);
    throw new Error('Failed to retrieve file from IPFS');
  }
};
