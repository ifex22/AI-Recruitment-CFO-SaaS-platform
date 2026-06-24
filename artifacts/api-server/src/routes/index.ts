import { Router, type IRouter } from "express";
import { requireAuth } from "../middleware/auth";
import healthRouter from "./health";
import authRouter from "./auth";
import publicRouter from "./public";
import dashboardRouter from "./dashboard";
import jobsRouter from "./jobs";
import candidatesRouter from "./candidates";
import interviewsRouter from "./interviews";
import employeesRouter from "./employees";
import financeRouter from "./finance";
import payrollRouter from "./payroll";
import adminRouter from "./admin";

const router: IRouter = Router();

// Public: health + auth + public recruitment portal
router.use(healthRouter);
router.use(authRouter);
router.use(publicRouter);

// Protected: all other routes require authentication
router.use(requireAuth);
router.use(dashboardRouter);
router.use(jobsRouter);
router.use(candidatesRouter);
router.use(interviewsRouter);
router.use(employeesRouter);
router.use(financeRouter);
router.use(payrollRouter);
router.use(adminRouter);

export default router;
