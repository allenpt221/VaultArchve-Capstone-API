"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadLimiter = void 0;
const ratelimit_1 = require("@upstash/ratelimit");
const ioredis_1 = __importDefault(require("./ioredis"));
exports.downloadLimiter = new ratelimit_1.Ratelimit({
    redis: ioredis_1.default,
    prefix: "ratelimit:download",
    limiter: ratelimit_1.Ratelimit.slidingWindow(5, "1 h"), // 5 downloads per hour, per user
    analytics: true,
});
