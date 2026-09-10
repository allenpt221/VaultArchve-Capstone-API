"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_route_1 = __importDefault(require("./route/auth.route"));
const repository_route_1 = __importDefault(require("./route/repository.route"));
const generativeAI_router_1 = __importDefault(require("./route/generativeAI.router"));
const saveThesis_route_1 = __importDefault(require("./route/saveThesis.route"));
const EntrepGenerative_route_1 = __importDefault(require("./route/EntrepGenerative.route"));
dotenv_1.default.config();
const isProd = process.env.NODE_ENV === 'production';
const nextApp = require('next')({
    dev: !isProd,
    dir: path_1.default.join(__dirname, '../frontend'),
});
const handle = nextApp.getRequestHandler();
nextApp.prepare().then(() => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)({
        origin: isProd ? false : 'http://localhost:3000',
        credentials: true,
    }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    const PORT = process.env.PORT || 3000;
    // ── API routes ──
    app.use('/api/auth', auth_route_1.default);
    app.use('/api/saved-thesis', saveThesis_route_1.default);
    app.use('/api/repository', repository_route_1.default);
    app.use('/api/ai', generativeAI_router_1.default);
    app.use('/api/entrep-ai', EntrepGenerative_route_1.default);
    // ── Next.js handles all non-API routes ──
    app.all(/^\/(?!api).*/, (req, res) => {
        return handle(req, res);
    });
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});
