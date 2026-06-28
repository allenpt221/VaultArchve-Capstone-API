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
dotenv_1.default.config();
const app = (0, express_1.default)();
const isProd = process.env.NODE_ENV === 'production';
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: isProd ? false : 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
const PORT = process.env.PORT;
// ── API routes ──
app.use('/api/auth', auth_route_1.default);
app.use('/api/repository', repository_route_1.default);
app.use('/api/ai', generativeAI_router_1.default);
// ── Serve Next.js static export in production ──
if (isProd) {
    const frontendPath = path_1.default.join(__dirname, '../frontend/out');
    app.use(express_1.default.static(frontendPath));
    app.get(/^\/(?!api).*/, (_req, res) => {
        res.sendFile(path_1.default.resolve(frontendPath, 'index.html'));
    });
}
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
