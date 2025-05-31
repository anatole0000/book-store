// src/queues/email.queue.ts
import { Queue } from 'bullmq';
import { connection } from '../utils/redis'; // Import the Redis connection from your utils

export const emailQueue = new Queue('emailQueue', {
  connection,
});
