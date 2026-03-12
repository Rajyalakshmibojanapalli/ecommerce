import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";

const seedDB = async () => {
  await connectDB();

  await User.deleteMany();
  await Category.deleteMany();
  await Product.deleteMany();

  const admin = await User.create({
    name: "Admin",
    email: "admin@shopease.com",
    password: "admin123",
    role: "admin",
  });

  await User.create({
    name: "Test User",
    email: "user@shopease.com",
    password: "user123",
  });

  const electronics = await Category.create({ name: "Electronics" });
  const clothing = await Category.create({ name: "Clothing" });
  const books = await Category.create({ name: "Books" });

  const products = [
    {
      name: "Wireless Bluetooth Headphones",
      description: "High quality wireless bluetooth headphones with noise cancellation and 30hr battery.",
      price: 1499,
      mrp: 2999,
      category: electronics._id,
      brand: "SoundMax",
      stock: 50,
      // ✅ S3 format: key + url
      images: [
        {
          key: "ecommerce/products/placeholder-headphones.webp",
          url: "https://via.placeholder.com/400x400?text=Headphones",
        },
      ],
      isFeatured: true,
      createdBy: admin._id,
    },
    {
      name: "Cotton Round Neck T-Shirt",
      description: "Premium cotton t-shirt, comfortable and stylish for everyday wear.",
      price: 499,
      mrp: 999,
      category: clothing._id,
      brand: "StyleWear",
      stock: 100,
      images: [
        {
          key: "ecommerce/products/placeholder-tshirt.webp",
          url: "https://via.placeholder.com/400x400?text=T-Shirt",
        },
      ],
      createdBy: admin._id,
    },
    {
      name: "JavaScript: The Good Parts",
      description: "Classic JavaScript book by Douglas Crockford. A must-read for every developer.",
      price: 350,
      mrp: 500,
      category: books._id,
      brand: "O'Reilly",
      stock: 30,
      images: [
        {
          key: "ecommerce/products/placeholder-book.webp",
          url: "https://via.placeholder.com/400x400?text=JS+Book",
        },
      ],
      isFeatured: true,
      createdBy: admin._id,
    },
  ];

  await Product.insertMany(products);

  console.log("✅ Database seeded!");
  process.exit();
};

seedDB().catch((err) => {
  console.error(err);
  process.exit(1);
});