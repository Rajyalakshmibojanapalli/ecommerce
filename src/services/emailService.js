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

export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"ShopEase" <${envConfig.smtp.user}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: "Welcome to ShopEase! 🛍️",
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome, ${user.name}!</h1>
        <p>Thank you for joining ShopEase. Start shopping now!</p>
        <a href="${envConfig.clientUrl}" 
           style="background: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Start Shopping
        </a>
      </div>
    `,
  });
};

export const sendOrderConfirmation = async (user, order) => {
  await sendEmail({
    to: user.email,
    subject: `Order Confirmed #${order._id}`,
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Order Confirmed! ✅</h1>
        <p>Hi ${user.name}, your order has been placed successfully.</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Total:</strong> ₹${order.totalAmount}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod}</p>
      </div>
    `,
  });
};