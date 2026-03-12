import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import envConfig from "./src/config/envConfig.js";

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥", err.name, err.message);
  process.exit(1);
});

// Connect DB & Start Server
connectDB().then(() => {
  const server = app.listen(envConfig.port, () => {
    console.log(
      `🚀 Server running in ${envConfig.nodeEnv} mode on port ${envConfig.port}`
    );
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION! 💥", err.name, err.message);
    server.close(() => process.exit(1));
  });
});