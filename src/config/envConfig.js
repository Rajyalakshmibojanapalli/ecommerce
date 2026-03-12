import dotenv from "dotenv";
dotenv.config();

const envConfig = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,

  // ✅ AWS S3
  aws: {
    accessKey: process.env.AWS_ACCESS_KEY,
    secretKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION || "ap-south-1",
    bucketName: process.env.AWS_BUCKET_NAME,
    folders: {
      products: process.env.S3_FOLDER_PRODUCTS || "ecommerce/products/",
      categories: process.env.S3_FOLDER_CATEGORIES || "ecommerce/categories/",
      avatars: process.env.S3_FOLDER_AVATARS || "ecommerce/avatars/",
    },
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },
  clientUrl: process.env.CLIENT_URL,
};

export default envConfig;