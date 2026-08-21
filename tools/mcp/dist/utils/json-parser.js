"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeJsonParse = safeJsonParse;
const logger_1 = require("./logger");
function safeJsonParse(raw) {
    try {
        return {
            ok: true,
            data: JSON.parse(raw),
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown JSON parse error';
        logger_1.logger.error('Failed to parse JSON payload.', { message });
        return {
            ok: false,
            error: {
                code: 'INVALID_JSON',
                message,
            },
        };
    }
}
//# sourceMappingURL=json-parser.js.map