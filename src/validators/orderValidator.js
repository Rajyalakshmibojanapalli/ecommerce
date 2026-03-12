import Joi from "joi";

export const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    phone: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().optional().allow(""),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().required(),
    country: Joi.string().default("India"),
  }).required(),
  paymentMethod: Joi.string().valid("COD", "ONLINE").required(),
  couponCode: Joi.string().optional().allow(""),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "Processing",
      "Confirmed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned"
    )
    .required(),
});