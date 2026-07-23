import winston from "winston";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(dirname(__dirname)); // Go up to project root

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),

  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: join(projectRoot, "logs", "error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: join(projectRoot, "logs", "combined.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

export default logger;
