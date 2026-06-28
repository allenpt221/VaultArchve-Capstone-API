"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadLimiter = exports.loginLimiter = void 0;
const ratelimit_1 = require("@upstash/ratelimit");
const ioredis_1 = __importDefault(require("./ioredis"));
exports.loginLimiter = new ratelimit_1.Ratelimit({
    redis: ioredis_1.default,
    limiter: ratelimit_1.Ratelimit.slidingWindow(5, "3 m"), // 5 attempts per 3 minutes
    analytics: true,
});
exports.downloadLimiter = new ratelimit_1.Ratelimit({
    redis: ioredis_1.default,
    limiter: ratelimit_1.Ratelimit.slidingWindow(5, "1 h"), // 5 downloads per hour
    analytics: true,
});
