// src/queues/book.queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

export const bookQueue = new Queue('bookQueue', { connection });
