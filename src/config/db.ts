import chalk from 'chalk';
import mongoose from 'mongoose';

export const connectDB = async () => {
      try {
            const dbinfo = await mongoose.connect(process.env.MONGO_URI!);
            console.log(chalk.green(`Database connection successful: ${dbinfo.connection.host}`));
      } catch (error) {
            console.error(chalk.red('MongoDB connection failed!!'), error);
            process.exit(1);
      }
};
