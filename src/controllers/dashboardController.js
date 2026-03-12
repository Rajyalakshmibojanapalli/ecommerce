import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Admin dashboard stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueResult,
    recentOrders,
    ordersByStatus,
    monthlyRevenue,
    lowStockProducts,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.find()
      .populate("user", "name email")
      .sort("-createdAt")
      .limit(10)
      .lean(),
    Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]),
    Product.find({ stock: { $lte: 10 } })
      .select("name stock sku")
      .sort("stock")
      .limit(10)
      .lean(),
  ]);

  return res.success({
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue: revenueResult[0]?.total || 0,
    recentOrders,
    ordersByStatus,
    monthlyRevenue,
    lowStockProducts,
  });
});

// @desc    Get all users (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return res.paginated(
    { users },
    { page: Number(page), limit: Number(limit), total },
    "Users fetched"
  );
});

// @desc    Toggle user status (Admin)
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.notFound("User not found");

  user.isActive = !user.isActive;
  await user.save();

  return res.success(
    { user },
    `User ${user.isActive ? "activated" : "deactivated"}`
  );
});