import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import childrenRouter from "@/api/children/childrenRouter";
import lessonStocksRouter from "@/api/lessonStocks/lessonStocksRouter";
import { teamsRouter } from './api/teams/teamsRouter';
import { teachersRouter } from './api/teachers/teachersRouter';
import { planningRouter } from './api/planning/planningRouter';
import { attendanceRouter } from './api/attendance/attendanceRouter'
import { controlCenterRouter } from './api/controlCenter/controlCenterRouter';
import { foodStocksRouter } from './api/foodStocks/foodStocksRouter';


const logger = pino({ name: "server start" });
const app: Express = express();

app.set("trust proxy", true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/api/children", childrenRouter);
app.use("/api/lesson-stocks", lessonStocksRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/planning', planningRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/control', controlCenterRouter);
app.use('/api/food-stocks', foodStocksRouter);
// Error handlers
app.use(errorHandler());

export { app, logger };