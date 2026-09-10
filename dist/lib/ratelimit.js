"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadLimiter = exports.loginIpLimiter = exports.loginLimiter = void 0;
const ratelimit_1 = require("@upstash/ratelimit");
const ioredis_1 = __importDefault(require("./ioredis"));
exports.loginLimiter = new ratelimit_1.Ratelimit({
    redis: ioredis_1.default,
    prefix: "ratelimit:login:email",
    limiter: ratelimit_1.Ratelimit.slidingWindow(5, "3 m"), // 5 attempts per 3 minutes, per email
    analytics: true,
});
exports.loginIpLimiter = new ratelimit_1.Ratelimit({
    redis: ioredis_1.default,
    prefix: "ratelimit:login:ip",
    limiter: ratelimit_1.Ratelimit.slidingWindow(30, "3 m"), // generous backstop against wide-net attacks
    analytics: true,
});
exports.downloadLimiter = new ratelimit_1.Ratelimit({
    redis: ioredis_1.default,
    prefix: "ratelimit:download",
    limiter: ratelimit_1.Ratelimit.slidingWindow(5, "1 h"), // 5 downloads per hour, per user
    analytics: true,
});
