import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import NotificationModel from '../models/notification.model'; // giả sử bạn có model này

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

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

      // Gửi mail
      await transporter.sendMail({
        from: '"Book App" <no-reply@bookapp.com>',
        to: 'admin@bookapp.com',
        subject: `New Book Created: ${bookTitle}`,
        text: `Admin ${adminId} vừa tạo sách mới với ID: ${bookId}`,
      });

      // Gửi notification (lưu vào DB)
      await NotificationModel.create({
        userId: adminId,
        type: 'new_book',
        message: `Bạn đã tạo sách mới: ${bookTitle}`,
        relatedId: bookId,
        read: false,
        createdAt: new Date(),
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
