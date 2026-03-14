import { Router } from 'express';
import {
  getByPlanning,
  getSessions,
  upsertAttendance,
  markAllAbsent,
} from './attendanceController';

const attendanceRouter = Router();

attendanceRouter.get('/sessions', getSessions);
attendanceRouter.get('/', getByPlanning);
attendanceRouter.post('/', upsertAttendance);
attendanceRouter.post('/mark-all-absent', markAllAbsent);

export { attendanceRouter };
