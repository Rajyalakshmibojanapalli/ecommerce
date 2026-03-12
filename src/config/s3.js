import { S3Client } from "@aws-sdk/client-s3";
import envConfig from "./envConfig.js";

const s3 = new S3Client({
  credentials: {
    accessKeyId: envConfig.aws.accessKey,
    secretAccessKey: envConfig.aws.secretKey,
  },
  region: envConfig.aws.region,
});

export default s3;