import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import routes from "./src/routes/index.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import { generalLimiter } from "./src/middlewares/rateLimiter.js";
import envConfig from "./src/config/envConfig.js";
import responseHandler from "./src/utils/response.js";

const app = express();

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

app.use(responseHandler);
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