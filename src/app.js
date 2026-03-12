import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import { generalLimiter } from "./middlewares/rateLimiter.js";
import envConfig from "./config/envConfig.js";
import responseHandler from "./utils/response.js";  // ✅ ADD THIS

const app = express();

// Security
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

app.use(cors({
  origin: envConfig.clientUrl,
  credentials: true,
}));

app.use(compression());

if (envConfig.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// ✅ ATTACH RESPONSE HELPER TO EVERY REQUEST
app.use(responseHandler);

app.get("/", (req, res) => {
  res.success({ message: "Welcome to the E-commerce API" });
}
);

app.use("/api", generalLimiter);

app.get("/api/health", (req, res) => {
  res.success({ status: "OK", timestamp: new Date().toISOString() }, "Server is healthy");
});

app.use("/api/v1", routes);

app.use((req, res) => {
  res.notFound("Route not found");
});

app.use(errorHandler);

export default app;