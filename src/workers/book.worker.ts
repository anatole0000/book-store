// src/workers/book.worker.ts
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});


// Cấu hình nodemailer (dùng SMTP hoặc dịch vụ mail khác)
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com', // đổi thành SMTP bạn dùng
  port: 587,
  secure: false,
  auth: {
    user: 'your_email@example.com',
    pass: 'your_password',
  },
});

const worker = new Worker(
  'bookQueue',
  async (job) => {
    if (job.name === 'sendNewBookEmail') {
      const { bookId, adminId, bookTitle } = job.data;
      console.log(`Sending mail for new book ${bookTitle} (${bookId}) created by admin ${adminId}`);

      // Gửi mail cho admin hoặc người dùng nào đó
      await transporter.sendMail({
        from: '"Book App" <no-reply@bookapp.com>',
        to: 'admin@bookapp.com', // hoặc email admin
        subject: `New Book Created: ${bookTitle}`,
        text: `Admin ${adminId} vừa tạo sách mới với ID: ${bookId}`,
      });
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`);
});
