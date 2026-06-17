import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import { Resend } from "resend";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://crispyharvest88.github.io",
      "https://crispyharvest88.github.io/crispyharvest88",
      "https://crispyharvest88.github.io/crispyharvest88/",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Crispy Harvest 88 <onboarding@resend.dev>";

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

app.get("/", (req, res) => {
  res.send("Crispy Harvest backend is running.");
});

app.post("/api/send-reset-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    await admin.auth().getUserByEmail(cleanEmail);

    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url:
        process.env.RESET_REDIRECT_URL ||
        "https://crispyharvest88.github.io/crispyharvest88/",
      handleCodeInApp: false,
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Reset your Crispy Harvest 88 password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Reset your Crispy Harvest 88 password</h2>
          <p>We received a request to reset your password.</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;padding:12px 18px;background:#A37F61;color:#ffffff;text-decoration:none;border-radius:8px;">
              Reset Password
            </a>
          </p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p>${resetLink}</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("RESEND EMAIL ERROR:", error);
      return res.status(500).json({
        message: error.message || "Failed to send reset email.",
      });
    }

    console.log("Reset email sent with Resend:", data?.id);
    return res.json({ message: "Reset email sent." });

    await transporter.sendMail({
      from: `"Crispy Harvest" <${process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: "Reset your Crispy Harvest password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Reset your Crispy Harvest password</h2>

          <p>Hello,</p>

          <p>Click the button below to reset your password.</p>

          <p>
            <a href="${resetLink}" style="background:#A37F61;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;">
              Reset Password
            </a>
          </p>

          <p>If the button does not work, copy and paste this link:</p>

          <p>${resetLink}</p>

          <p>If you did not request this, you can ignore this email.</p>

          <p>Thank you,<br/>Crispy Harvest Team</p>
        </div>
      `,
    });

    return res.json({
      message: "Reset email sent.",
    });
  } catch (error) {
    console.log("RESET EMAIL ERROR:", error);

    if (error.code === "auth/user-not-found") {
      return res.status(404).json({
        message: "No account found with this email.",
      });
    }

    if (
      error.message?.includes("RESET_PASSWORD_EXCEED_LIMIT") ||
      error.code === "auth/internal-error"
    ) {
      return res.status(429).json({
        message: "Too many reset attempts. Please wait and try again later.",
      });
    }

    return res.status(500).json({
      message: "Failed to send reset email.",
      error: error.message,
      code: error.code || "unknown",
    });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Backend running on http://localhost:${process.env.PORT || 5000}`);
});
