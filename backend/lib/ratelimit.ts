import { Ratelimit } from "@upstash/ratelimit";
import redis from './ioredis';

export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "3 m"), // 5 attempts per 3 minutes
  analytics: true,
});