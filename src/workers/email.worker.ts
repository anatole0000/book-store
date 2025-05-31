// src/workers/email.worker.ts
import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { connection } from '../utils/redis';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  service: 'gmail', // hoặc 'hotmail', 'yahoo' tuỳ bạn
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const emailWorker = new Worker(
  'emailQueue',
  async job => {
    const { to, subject, text } = job.data;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });

    logger.info(`Sent email to ${to}: ${subject}`);
  },
  { connection }
);
