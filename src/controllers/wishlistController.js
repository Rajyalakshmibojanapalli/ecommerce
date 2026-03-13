// controllers/wishlistController.js
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { presignProductList } from "../services/s3Service.js";

// GET /api/wishlist
export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: "products.product",
      select: "name price images stock slug ratingsAverage comparePrice",
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
      return res.json({
        success: true,
        data: { wishlist },
      });
    }

    // Filter out deleted products
    wishlist.products = wishlist.products.filter((p) => p.product);

    // ✅ Presign product images using S3
    const productsList = wishlist.products.map((p) => p.product);
    const presignedProducts = await presignProductList(
      productsList.map((p) => (p.toObject ? p.toObject() : p))
    );

    // Map presigned images back to wishlist
    const wishlistData = wishlist.toObject();
    wishlistData.products = wishlistData.products
      .filter((p) => p.product)
      .map((p, index) => ({
        ...p,
        product: presignedProducts[index] || p.product,
      }));

    res.json({
      success: true,
      data: { wishlist: wishlistData },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/wishlist/:productId
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [{ product: productId }],
      });
    } else {
      const exists = wishlist.products.some(
        (p) => p.product.toString() === productId
      );

      if (exists) {
        return res.status(400).json({ success: false, message: "Already in wishlist" });
      }

      wishlist.products.push({ product: productId });
      await wishlist.save();
    }

    await wishlist.populate({
      path: "products.product",
      select: "name price images stock slug ratingsAverage comparePrice",
    });

    // ✅ Presign images
    const productsList = wishlist.products
      .filter((p) => p.product)
      .map((p) => (p.product.toObject ? p.product.toObject() : p.product));
    const presignedProducts = await presignProductList(productsList);

    const wishlistData = wishlist.toObject();
    wishlistData.products = wishlistData.products
      .filter((p) => p.product)
      .map((p, index) => ({
        ...p,
        product: presignedProducts[index] || p.product,
      }));

    res.status(201).json({
      success: true,
      message: "Added to wishlist",
      data: { wishlist: wishlistData },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/wishlist/:productId
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.product.toString() !== productId
    );
    await wishlist.save();

    await wishlist.populate({
      path: "products.product",
      select: "name price images stock slug ratingsAverage comparePrice",
    });

    // ✅ Presign images
    const productsList = wishlist.products
      .filter((p) => p.product)
      .map((p) => (p.product.toObject ? p.product.toObject() : p.product));
    const presignedProducts = await presignProductList(productsList);

    const wishlistData = wishlist.toObject();
    wishlistData.products = wishlistData.products
      .filter((p) => p.product)
      .map((p, index) => ({
        ...p,
        product: presignedProducts[index] || p.product,
      }));

    res.json({
      success: true,
      message: "Removed from wishlist",
      data: { wishlist: wishlistData },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/wishlist
export const clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.json({
      success: true,
      message: "Wishlist cleared",
      data: { wishlist: wishlist || { products: [] } },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/wishlist/:productId/move-to-cart
export const moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const Cart = (await import("../models/Cart.js")).default;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: "Product out of stock" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity: 1 }],
      });
    } else {
      const cartItem = cart.items.find(
        (i) => i.product.toString() === productId
      );
      if (cartItem) {
        cartItem.quantity += 1;
      } else {
        cart.items.push({ product: productId, quantity: 1 ,price: product.price});
      }
      await cart.save();
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (p) => p.product.toString() !== productId
      );
      await wishlist.save();
    }

    res.json({
      success: true,
      message: "Moved to cart",
    });
  } catch (err) {
    next(err);
  }
};