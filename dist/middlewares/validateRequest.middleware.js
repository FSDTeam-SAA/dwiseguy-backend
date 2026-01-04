"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                params: req.params,
                query: req.query,
            });
            next();
        }
        catch (err) {
            res.status(400).json({
                success: false,
                errors: err.errors,
            });
        }
    };
};
exports.validateRequest = validateRequest;
