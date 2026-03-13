import { Router } from 'express';
import {
  getTeams,
  getMyTeam,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  getProfiles,
} from './teamsController';

const teamsRouter = Router();

teamsRouter.get('/profiles', getProfiles);
teamsRouter.get('/my-team', getMyTeam);
teamsRouter.get('/', getTeams);
teamsRouter.get('/:id', getTeam);
teamsRouter.post('/', createTeam);
teamsRouter.patch('/:id', updateTeam);
teamsRouter.delete('/:id', deleteTeam);
teamsRouter.post('/:id/members', addMember);
teamsRouter.delete('/:id/members/:profileId', removeMember);

export { teamsRouter };
