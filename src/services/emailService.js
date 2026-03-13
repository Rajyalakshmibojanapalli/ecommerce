import nodemailer from "nodemailer";
import envConfig from "../config/envConfig.js";

const transporter = nodemailer.createTransport({
  host: envConfig.smtp.host,
  port: envConfig.smtp.port,
  secure: false,
  auth: {
    user: envConfig.smtp.user,
    pass: envConfig.smtp.pass,
  },
});

// ✅ Send OTP Email
export const sendOTPEmail = async (email, otp, type = "reset") => {
  const subjects = {
    reset: "Password Reset OTP",
    verify: "Email Verification OTP",
  };

  const messages = {
    reset: `Your password reset OTP is: <strong>${otp}</strong>. It expires in 10 minutes.`,
    verify: `Your email verification OTP is: <strong>${otp}</strong>. It expires in 10 minutes.`,
  };

  await transporter.sendMail({
    from: `"Jaimax Ecommerce" <${envConfig.smtp.user}>`,
    to: email,
    subject: subjects[type],
    html: `
      <div style="font-family: Arial; padding: 20px; max-width: 500px;">
        <h2>${subjects[type]}</h2>
        <p>${messages[type]}</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; 
                    font-size: 32px; letter-spacing: 8px; font-weight: bold;">
          ${otp}
        </div>
        <p style="color: #888; margin-top: 15px;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  });
};

// ✅ ADD — Send Order Confirmation
export const sendOrderConfirmation = async (email, order) => {
  const itemsList = order.items
    ?.map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name || item.product?.name || "Product"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">₹${item.price}</td>
        </tr>`
    )
    .join("") || "";

  await transporter.sendMail({
    from: `"Jaimax Ecommerce" <${envConfig.smtp.user}>`,
    to: email,
    subject: `Order Confirmed - #${order._id}`,
    html: `
      <div style="font-family: Arial; padding: 20px; max-width: 600px;">
        <h2 style="color: #2d7d46;">✅ Order Confirmed!</h2>
        <p>Thank you for your order.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Total:</strong> ₹${order.totalAmount || order.total || 0}</p>
          <p><strong>Status:</strong> ${order.status || "Processing"}</p>
        </div>

        <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
          <thead>
            <tr style="background: #f4f4f4;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: left;">Qty</th>
              <th style="padding: 8px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <p style="margin-top: 20px; color: #888;">
          You will receive updates when your order ships.
        </p>
      </div>
    `,
  });
};

// ✅ ADD — Send Order Status Update
export const sendOrderStatusUpdate = async (email, order) => {
  await transporter.sendMail({
    from: `"Jaimax Ecommerce" <${envConfig.smtp.user}>`,
    to: email,
    subject: `Order Update - #${order._id}`,
    html: `
      <div style="font-family: Arial; padding: 20px; max-width: 500px;">
        <h2>Order Status Updated</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>New Status:</strong> ${order.status}</p>
        <p>Thank you for shopping with Jaimax!</p>
      </div>
    `,
  });
};

// ✅ ADD — Send Welcome Email
export const sendWelcomeEmail = async (email, name) => {
  await transporter.sendMail({
    from: `"Jaimax Ecommerce" <${envConfig.smtp.user}>`,
    to: email,
    subject: "Welcome to Jaimax!",
    html: `
      <div style="font-family: Arial; padding: 20px; max-width: 500px;">
        <h2>Welcome, ${name}! 🎉</h2>
        <p>Thank you for joining Jaimax Ecommerce.</p>
        <p>Start shopping now and enjoy amazing deals!</p>
      </div>
    `,
  });
};