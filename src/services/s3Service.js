import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import s3 from "../config/s3.js";
import envConfig from "../config/envConfig.js";

const bucketName = envConfig.aws.bucketName;
const region = envConfig.aws.region;
const folders = envConfig.aws.folders;

// Log on startup
console.log("");
console.log("=== S3 CONFIG ===");
console.log("Bucket:", bucketName || "MISSING!");
console.log("Region:", region || "MISSING!");
console.log("AccessKey:", envConfig.aws.accessKey ? envConfig.aws.accessKey.slice(0, 6) + "..." : "MISSING!");
console.log("SecretKey:", envConfig.aws.secretKey ? "SET" : "MISSING!");
console.log("=================");
console.log("");

// ==========================================
//  HELPERS
// ==========================================

function generateFileName(originalName) {
  const ext = path.extname(originalName) || ".jpg";
  return Date.now() + "-" + crypto.randomBytes(8).toString("hex") + ext;
}

function buildS3Url(key) {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

function extractKeyFromUrl(url) {
  if (!url || url === "") return null;
  const marker = "amazonaws.com/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.substring(index + marker.length));
}

// ==========================================
//  PRESIGNED URL — THE KEY FUNCTION
// ==========================================

/**
 * Generate a temporary presigned GET URL from a stored S3 URL
 * @param {string} s3Url - Full S3 URL stored in DB
 * @param {number} expiresIn - Seconds (default 1 hour)
 * @returns {string} Presigned URL or original URL if failed
 */
async function generatePresignedUrl(s3Url, expiresIn = 3600) {
  if (!s3Url || s3Url === "") return "";

  try {
    const key = extractKeyFromUrl(s3Url);
    if (!key) return s3Url;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error("Presigned URL error:", error.message);
    return s3Url; // Return original URL as fallback
  }
}

/**
 * Convert single image object { key, url } to presigned URL
 */
async function presignImage(image) {
  if (!image || !image.url) return image;
  return {
    ...image,
    url: await generatePresignedUrl(image.url),
  };
}

/**
 * Convert array of image objects to presigned URLs
 */
async function presignImages(images) {
  if (!images || images.length === 0) return [];
  return Promise.all(images.map((img) => presignImage(img)));
}

/**
 * Convert a product's images to presigned URLs
 */
async function presignProductImages(product) {
  if (!product) return product;

  const obj = product.toObject ? product.toObject() : { ...product };

  if (obj.images && obj.images.length > 0) {
    obj.images = await presignImages(obj.images);
  }

  return obj;
}

/**
 * Convert multiple products' images to presigned URLs
 */
async function presignProductList(products) {
  if (!products || products.length === 0) return [];
  return Promise.all(products.map((p) => presignProductImages(p)));
}

/**
 * Convert user avatar to presigned URL
 */
async function presignUserAvatar(user) {
  if (!user) return user;

  const obj = user.toObject ? user.toObject() : { ...user };

  if (obj.avatar && obj.avatar.url && obj.avatar.url !== "") {
    obj.avatar.url = await generatePresignedUrl(obj.avatar.url);
  }

  return obj;
}

/**
 * Convert category image to presigned URL
 */
async function presignCategoryImage(category) {
  if (!category) return category;

  const obj = category.toObject ? category.toObject() : { ...category };

  if (obj.image && obj.image.url) {
    obj.image.url = await generatePresignedUrl(obj.image.url);
  }

  return obj;
}

/**
 * Convert multiple categories' images to presigned URLs
 */
async function presignCategoryList(categories) {
  if (!categories || categories.length === 0) return [];
  return Promise.all(categories.map((c) => presignCategoryImage(c)));
}

// ==========================================
//  UPLOAD
// ==========================================

async function uploadToS3(buffer, originalName, folder) {
  console.log(">> UPLOAD:", originalName, "→", folder);

  if (!buffer) throw new Error("No file buffer");
  if (!bucketName) throw new Error("AWS_BUCKET_NAME missing in .env");

  const fileName = generateFileName(originalName);
  const key = folder + fileName;

  const ext = path.extname(originalName).toLowerCase();
  const ctMap = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  const contentType = ctMap[ext] || "image/jpeg";

  try {
    const result = await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    // ✅ Store the raw S3 URL in DB (NOT presigned)
    const url = buildS3Url(key);
    console.log(">> UPLOAD OK:", url);

    return { key, url };
  } catch (err) {
    console.error("!! UPLOAD FAILED:", err.name, "-", err.message);
    throw err;
  }
}

async function uploadMultipleToS3(files, folder) {
  if (!files || !files.length) return [];
  const results = [];
  for (const file of files) {
    const r = await uploadToS3(file.buffer, file.originalname, folder);
    results.push(r);
  }
  return results;
}

async function uploadProductImages(files) {
  return uploadMultipleToS3(files, folders.products);
}

async function uploadCategoryImage(file) {
  return uploadToS3(file.buffer, file.originalname, folders.categories);
}

async function uploadAvatar(file) {
  return uploadToS3(file.buffer, file.originalname, folders.avatars);
}

// ==========================================
//  DELETE
// ==========================================

async function deleteFromS3(key) {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
    console.log("DELETED:", key);
  } catch (e) {
    console.error("DELETE ERR:", e.message);
  }
}

async function deleteFromS3ByUrl(url) {
  const key = extractKeyFromUrl(url);
  if (key) await deleteFromS3(key);
}

async function deleteMultipleFromS3(images) {
  if (!images || !images.length) return;
  for (const img of images) {
    await deleteFromS3(img.key || extractKeyFromUrl(img.url));
  }
}

// ==========================================
//  EXPORTS
// ==========================================

export {
  // Upload
  uploadToS3,
  uploadMultipleToS3,
  uploadProductImages,
  uploadCategoryImage,
  uploadAvatar,

  // Delete
  deleteFromS3,
  deleteFromS3ByUrl,
  deleteMultipleFromS3,

  // ✅ Presigned URL generators
  generatePresignedUrl,
  presignImage,
  presignImages,
  presignProductImages,
  presignProductList,
  presignUserAvatar,
  presignCategoryImage,
  presignCategoryList,

  // Helpers
  extractKeyFromUrl,
  buildS3Url,
  generateFileName,
};