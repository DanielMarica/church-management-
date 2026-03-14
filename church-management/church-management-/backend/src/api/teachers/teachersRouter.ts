import { Router } from 'express';
import { getTeachers, getTeacher, updateTeacher, inviteTeacher, getMyProfile } from './teachersController';

const teachersRouter = Router();

teachersRouter.get('/', getTeachers);
teachersRouter.get('/profile/:id', getMyProfile);
teachersRouter.post('/invite', inviteTeacher);
teachersRouter.get('/:id', getTeacher);
teachersRouter.patch('/:id', updateTeacher);

export { teachersRouter };
