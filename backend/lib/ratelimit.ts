import { Ratelimit } from "@upstash/ratelimit";
import redis from './ioredis';

export const loginLimiter = new Ratelimit({
  redis,
  prefix: "ratelimit:login:email",
  limiter: Ratelimit.slidingWindow(5, "3 m"), // 5 attempts per 3 minutes, per email
  analytics: true,
});

export const loginIpLimiter = new Ratelimit({
  redis,
  prefix: "ratelimit:login:ip",
  limiter: Ratelimit.slidingWindow(30, "3 m"), // generous backstop against wide-net attacks
  analytics: true,
});

export const downloadLimiter = new Ratelimit({
  redis,
  prefix: "ratelimit:download",
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 downloads per hour, per user
  analytics: true,
});