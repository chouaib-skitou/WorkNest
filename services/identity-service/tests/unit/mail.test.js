import dotenv from "dotenv";
dotenv.config();

// Mock nodemailer BEFORE importing mail.js
jest.mock("nodemailer", () => {
  const mockSendMail = jest.fn().mockResolvedValue(true);
  return {
    createTransport: jest.fn(() => ({
      sendMail: mockSendMail,
    })),
    __mockSendMail: mockSendMail, // Expose the mock function for tests
  };
});

import nodemailer from "nodemailer";
import { sendMail } from "../../config/mail.js"; // We don't import transporter here to force re-creation in isolated modules

describe("📧 Mail Service Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("✅ Successfully send an email", async () => {
    const mailOptions = {
      to: "test@example.com",
      subject: "Test Subject",
      text: "Test Text",
      html: "<p>Test HTML</p>",
    };

    await sendMail(mailOptions.to, mailOptions.subject, mailOptions.text, mailOptions.html);

    expect(nodemailer.__mockSendMail).toHaveBeenCalledWith({
      from: process.env.EMAIL_FROM,
      to: mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
    });
  });

  test("🚫 Handle error when sending email fails", async () => {
    nodemailer.__mockSendMail.mockRejectedValue(new Error("SMTP Error"));

    await expect(sendMail("test@example.com", "Subject", "Text", "<p>HTML</p>")).rejects.toThrow(
      "SMTP Error"
    );

    expect(nodemailer.__mockSendMail).toHaveBeenCalled();
  });

  describe("Transporter configuration", () => {
    test("should create transporter with auth when SMTP_USER is defined", () => {
      // Set environment variables so that SMTP_USER is defined
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "myuser";
      process.env.SMTP_PASS = "mypassword";
      process.env.EMAIL_FROM = "from@example.com";

      // Use isolateModules to force reimport of mail.js
      jest.isolateModules(() => {
        require("../../config/mail.js");
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.example.com",
        port: "587",
        secure: false,
        auth: {
          user: "myuser",
          pass: "mypassword",
        },
      });
    });

    test("should create transporter without auth when SMTP_USER is not defined", () => {
      // Remove SMTP_USER and SMTP_PASS from env
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "587";
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      process.env.EMAIL_FROM = "from@example.com";

      jest.isolateModules(() => {
        require("../../config/mail.js");
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.example.com",
        port: "587",
        secure: false,
        auth: undefined,
      });
    });
  });
});
