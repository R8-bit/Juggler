require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");
const db = require("./database");
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// Security Headers (с разрешениями для админки)
app.use(
  helmet({
    hsts: false, // Disable HSTS to allow HTTP on mobile
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests: null, // Disable HTTPS upgrade
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'", // Нужно для динамического кода в админке
          "https://cdnjs.cloudflare.com",
        ],
        "script-src-attr": ["'unsafe-inline'"],
        connectSrc: ["'self'"], // Для fetch/AJAX к API
      },
    },
  }),
);

// Compression
app.use(compression());

// CORS
app.use(
  cors({
    credentials: true,
    origin: isProd ? process.env.FRONTEND_URL : true,
  }),
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 100 : 1000, // limit each IP to 100 requests per windowMs in prod
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Contact form specific rate limit (more strict)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour
  message: "Too many contact form submissions, please try again later.",
});
app.use("/api/contact", contactLimiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files for uploads (serving from root/uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, "../frontend")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Инициализация дефолтного администратора
async function initAdminUser() {
  try {
    const bcrypt = require("bcryptjs");
    const { Admin } = require("./database");
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Juggler";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_PASSWORD) {
      console.error(
        "[AUTH] ADMIN_PASSWORD not set in .env! Skipping admin init.",
      );
      return;
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const existing = await Admin.findOne({
      where: { username: ADMIN_USERNAME },
    });

    if (!existing) {
      await Admin.create({ username: ADMIN_USERNAME, password: hashed });
      console.log("[AUTH] Admin user created");
    } else {
      await existing.update({ password: hashed });
      console.log("[AUTH] Admin password synced");
    }
  } catch (err) {
    console.error("[AUTH] Failed to init admin user:", err.message);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
  console.log(
    `[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV || "development"}`,
  );
  await initAdminUser();
});
