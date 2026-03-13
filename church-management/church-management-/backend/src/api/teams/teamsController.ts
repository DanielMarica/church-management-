import type { Request, Response } from 'express';
import { teamsRepository } from './teamsRepository';
import { CreateTeamSchema, UpdateTeamSchema, AddMemberSchema } from './teamsModel';

function getSingleString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim().length > 0) {
    return value[0];
  }
  return null;
}

// GET /api/teams
export async function getTeams(req: Request, res: Response) {
  try {
    const teams = await teamsRepository.getAllTeams();
    res.json(teams);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/teams/my-team?profileId=xxx
export async function getMyTeam(req: Request, res: Response) {
  try {
    const profileId = getSingleString(req.query.profileId);
    if (!profileId) return void res.status(400).json({ error: 'profileId requis' });

    const team = await teamsRepository.getTeamByProfileId(profileId);
    if (!team) return void res.status(404).json({ error: 'Aucune équipe trouvée pour ce profil' });

    res.json(team);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/teams/:id
export async function getTeam(req: Request, res: Response) {
  try {
    const teamId = getSingleString(req.params.id);
    if (!teamId) return void res.status(400).json({ error: 'id équipe invalide' });

    const team = await teamsRepository.getTeamById(teamId);
    if (!team) return void res.status(404).json({ error: 'Équipe introuvable' });
    res.json(team);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/teams
export async function createTeam(req: Request, res: Response) {
  try {
    const parsed = CreateTeamSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const team = await teamsRepository.createTeam(parsed.data);
    res.status(201).json(team);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/teams/:id
export async function updateTeam(req: Request, res: Response) {
  try {
    const teamId = getSingleString(req.params.id);
    if (!teamId) return void res.status(400).json({ error: 'id équipe invalide' });

    const existing = await teamsRepository.getTeamById(teamId);
    if (!existing) return void res.status(404).json({ error: 'Équipe introuvable' });

    const parsed = UpdateTeamSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const team = await teamsRepository.updateTeam(teamId, parsed.data);
    res.json(team);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/teams/:id
export async function deleteTeam(req: Request, res: Response) {
  try {
    const teamId = getSingleString(req.params.id);
    if (!teamId) return void res.status(400).json({ error: 'id équipe invalide' });

    const existing = await teamsRepository.getTeamById(teamId);
    if (!existing) return void res.status(404).json({ error: 'Équipe introuvable' });

    await teamsRepository.deleteTeam(teamId);
    res.status(204).send();
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/teams/:id/members
export async function addMember(req: Request, res: Response) {
  try {
    const teamId = getSingleString(req.params.id);
    if (!teamId) return void res.status(400).json({ error: 'id équipe invalide' });

    const parsed = AddMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: parsed.error.issues[0].message });
    }
    await teamsRepository.addMember(teamId, parsed.data);
    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/teams/:id/members/:profileId
export async function removeMember(req: Request, res: Response) {
  try {
    const teamId = getSingleString(req.params.id);
    const profileId = getSingleString(req.params.profileId);
    if (!teamId) return void res.status(400).json({ error: 'id équipe invalide' });
    if (!profileId) return void res.status(400).json({ error: 'profileId invalide' });

    await teamsRepository.removeMember(teamId, profileId);
    res.status(204).send();
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/teams/profiles
export async function getProfiles(req: Request, res: Response) {
  try {
    const profiles = await teamsRepository.getAllProfiles();
    res.json(profiles);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
