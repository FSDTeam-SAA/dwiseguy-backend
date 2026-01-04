import app from './app';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import config from './config/config';
import chalk from 'chalk';
dotenv.config();

const PORT = config.port ? Number(config.port) : 8000;

connectDB()
      .then(() => {
            app.listen(config.port, () => {
                  console.log(chalk.green(`Server running at http://localhost:${PORT}`));
            });
      })
      .catch((error: unknown) => {
            console.error(chalk.red('Database connection failed!!'), error);
            process.exit(1);
      });
