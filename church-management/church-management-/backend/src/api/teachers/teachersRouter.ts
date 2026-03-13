import { Router } from 'express';
import { getTeachers, getTeacher, updateTeacher } from './teachersController';

const teachersRouter = Router();

teachersRouter.get('/', getTeachers);
teachersRouter.get('/:id', getTeacher);
teachersRouter.patch('/:id', updateTeacher);

export { teachersRouter };
