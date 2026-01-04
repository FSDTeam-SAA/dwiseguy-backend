"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const validateRequest_middleware_1 = require("../../middlewares/validateRequest.middleware");
const router = express_1.default.Router();
router.post('/registration', (0, validateRequest_middleware_1.validateRequest)(user_validation_1.createUserSchema), user_controller_1.createUser);
router.get('/', user_controller_1.getUsers);
exports.default = router;
