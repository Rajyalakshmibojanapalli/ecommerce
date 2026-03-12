import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().min(10).max(5000).required(),
  price: Joi.number().min(0).required(),
  mrp: Joi.number().min(0).required(),
  category: Joi.string().required(),
  brand: Joi.string().trim().max(100).optional(),
  stock: Joi.number().integer().min(0).required(),
  sku: Joi.string().trim().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  specifications: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().required(),
        value: Joi.string().required(),
      })
    )
    .optional(),
  isFeatured: Joi.boolean().optional(),
});

export const updateProductSchema = createProductSchema.fork(
  ["name", "description", "price", "mrp", "category", "stock"],
  (field) => field.optional()
);