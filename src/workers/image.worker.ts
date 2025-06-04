import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import sharp from 'sharp';
import _path from 'path';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'imageQueue',
  async (job) => {
    const { imagePath } = job.data;
    const outputFile = imagePath.replace(/(\.\w+)$/, '_small$1');

    await sharp(imagePath)
      .resize({ width: 800 }) // resize theo chiều rộng 800px, tự động giữ tỷ lệ
      .toFile(outputFile);

    console.log(`Image resized: ${outputFile}`);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`);
});
