// src/utils/redis.ts
import { RedisOptions } from 'bullmq';
import { createClient } from 'redis';

export const connection: RedisOptions = {
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null, // Quan trọng cho BullMQ
};

export const redisClient = createClient({
  socket: {
    host: 'localhost',
    port: 6379,
  },
});

redisClient.on('error', err => {
  console.error('Redis Client Error', err);
});

redisClient.connect();
