import { Router } from 'express';
import {
  getSessions,
  getSession,
  generatePlanning,
  replaceTeacher,
  getAvailableTeachers,
  deleteSession,
} from './planningController';

const planningRouter = Router();

planningRouter.get('/', getSessions);
planningRouter.post('/generate', generatePlanning);
planningRouter.get('/:id', getSession);
planningRouter.get('/:id/available-teachers', getAvailableTeachers);
planningRouter.patch('/:id/replace', replaceTeacher);
planningRouter.delete('/:id', deleteSession);

export { planningRouter };
