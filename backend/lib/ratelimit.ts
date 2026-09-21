import { Ratelimit } from "@upstash/ratelimit";
import redis from './ioredis';


export const downloadLimiter = new Ratelimit({
  redis,
  prefix: "ratelimit:download",
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 downloads per hour, per user
  analytics: true,
});