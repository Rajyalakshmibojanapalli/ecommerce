import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import mongoose from "mongoose";
import routes from "./src/routes/index.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import { generalLimiter } from "./src/middlewares/rateLimiter.js";
import envConfig from "./src/config/envConfig.js";
import responseHandler from "./src/utils/response.js";

const app = express();

// ✅ 1. CORS FIRST — before everything
console.log("🔧 CORS origin set to:", envConfig.clientUrl);

app.use(cors({
  origin: true,           // ← allows ANY origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ 2. Then helmet with crossOrigin disabled
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

if (envConfig.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.use(responseHandler);

app.get("/api/health", (req, res) => {
  res.success({ status: "OK", timestamp: new Date().toISOString() }, "Server is healthy");
});

app.use("/api", routes);
app.get("/api", (req, res) => {
  res.send("Welcome to the jaimax API");
});
app.get("/", (req, res) => {
  res.send("Welcome to the E-commerce API");
});

app.use((req, res) => {
  res.notFound("Route not found");
});

app.use(errorHandler);

const PORT = envConfig.port || 5000;

mongoose.connect(envConfig.mongoUri)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ CORS allowing: ${envConfig.clientUrl}`);
    });
  })
  .catch((err) => {
    console.log("❌ DB connection error:", err.message);
  });