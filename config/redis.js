// config\redis.js

import redis from 'redis';
import { config } from './index.js';

export const redisClient = redis.createClient({
  url: `redis://default:${config.redis.password}@${config.redis.url}`
});

redisClient.on('connect', () => {
  console.log("Redis client connected");
});

redisClient.on('error', (err) => {
  console.error("Redis connection error:", err);
});

export default redisClient;