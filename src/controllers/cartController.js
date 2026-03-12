import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { presignProductImages } from "../services/s3Service.js";

// @desc    Get cart
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name slug price mrp images stock isActive",
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // ✅ Presign all product images in cart
  const cartObj = cart.toObject ? cart.toObject() : { ...cart };

  if (cartObj.items && cartObj.items.length > 0) {
    for (let i = 0; i < cartObj.items.length; i++) {
      const item = cartObj.items[i];
      if (item.product && item.product.images && item.product.images.length > 0) {
        item.product.images = await presignProductImages(item.product.images);
      }
    }
  }

  return res.success({ cart: cartObj });
});

// @desc    Add to cart
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.notFound("Product not found");
  if (!product.isActive) return res.badRequest("Product is not available");
  if (product.stock < quantity) return res.badRequest("Insufficient stock");

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    if (existingItem.quantity > product.stock) {
      return res.badRequest("Insufficient stock");
    }
    existingItem.price = product.price;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }

  await cart.save();

  // ✅ Re-populate and presign
  await cart.populate({
    path: "items.product",
    select: "name slug price mrp images stock",
  });

  const cartObj = cart.toObject();
  for (const item of cartObj.items) {
    if (item.product?.images?.length > 0) {
      item.product.images = await presignProductImages(item.product.images);
    }
  }

  return res.success({ cart: cartObj }, "Item added to cart");
});

// @desc    Update cart item quantity
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  if (quantity < 1) return res.badRequest("Quantity must be at least 1");

  const product = await Product.findById(productId);
  if (!product) return res.notFound("Product not found");
  if (product.stock < quantity) return res.badRequest("Insufficient stock");

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.notFound("Cart not found");

  const item = cart.items.find(
    (item) => item.product.toString() === productId
  );
  if (!item) return res.notFound("Item not in cart");

  item.quantity = quantity;
  item.price = product.price;

  await cart.save();

  await cart.populate({
    path: "items.product",
    select: "name slug price mrp images stock",
  });

  // ✅ Presign
  const cartObj = cart.toObject();
  for (const item of cartObj.items) {
    if (item.product?.images?.length > 0) {
      item.product.images = await presignProductImages(item.product.images);
    }
  }

  return res.success({ cart: cartObj }, "Cart updated");
});

// @desc    Remove item from cart
export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.notFound("Cart not found");

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== req.params.productId
  );

  await cart.save();

  await cart.populate({
    path: "items.product",
    select: "name slug price mrp images stock",
  });

  // ✅ Presign
  const cartObj = cart.toObject();
  for (const item of cartObj.items) {
    if (item.product?.images?.length > 0) {
      item.product.images = await presignProductImages(item.product.images);
    }
  }

  return res.success({ cart: cartObj }, "Item removed from cart");
});

// @desc    Clear cart
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  return res.success({ cart }, "Cart cleared");
});