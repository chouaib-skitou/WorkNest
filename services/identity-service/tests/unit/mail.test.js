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
import { transporter, sendMail } from "../../config/mail.js";

describe("📧 Mail Service Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // test("✅ Ensure transporter is properly configured", () => {
  //   expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
  //   expect(nodemailer.createTransport).toHaveBeenCalledWith({
  //     host: process.env.SMTP_HOST,
  //     port: process.env.SMTP_PORT,
  //     secure: false,
  //     auth: process.env.SMTP_USER
  //       ? {
  //           user: process.env.SMTP_USER,
  //           pass: process.env.SMTP_PASS,
  //         }
  //       : undefined,
  //   });
  // });

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
});
