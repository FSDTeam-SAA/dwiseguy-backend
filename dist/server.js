"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const config_1 = __importDefault(require("./config/config"));
const chalk_1 = __importDefault(require("chalk"));
dotenv_1.default.config();
const PORT = config_1.default.port ? Number(config_1.default.port) : 8000;
(0, db_1.connectDB)()
    .then(() => {
    app_1.default.listen(config_1.default.port, () => {
        console.log(chalk_1.default.green(`Server running at http://localhost:${PORT}`));
    });
})
    .catch((error) => {
    console.error(chalk_1.default.red('Database connection failed!!'), error);
    process.exit(1);
});
