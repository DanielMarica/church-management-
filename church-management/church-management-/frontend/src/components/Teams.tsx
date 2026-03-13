'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Users, Pencil, Trash2, UserPlus, UserMinus,
  AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import type { Profile } from '../types/database';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  profile_id: string;
  joined_date: string | null;
  profile?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  age_group: string | null;
  color: string | null;
  max_capacity: number | null;
  is_active: boolean;
  members: TeamMember[];
  children_count: number;
  created_at: string;
}

interface ProfileOption {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TEAM_COLORS = [
  { value: 'blue',   label: 'Bleu',   bg: 'bg-blue-500' },
  { value: 'green',  label: 'Vert',   bg: 'bg-green-500' },
  { value: 'purple', label: 'Violet', bg: 'bg-purple-500' },
  { value: 'red',    label: 'Rouge',  bg: 'bg-red-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500' },
  { value: 'pink',   label: 'Rose',   bg: 'bg-pink-500' },
  { value: 'teal',   label: 'Teal',   bg: 'bg-teal-500' },
  { value: 'yellow', label: 'Jaune',  bg: 'bg-yellow-500' },
];

const AGE_GROUPS = ['3-5 ans', '6-8 ans', '8-12 ans', '10-14 ans', 'Tous âges'];

const API = process.env.NEXT_PUBLIC_API_URL;

function getColorBg(color: string | null) {
  return TEAM_COLORS.find((c) => c.value === color)?.bg ?? 'bg-gray-400';
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const TeamSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  age_group: z.string().optional(),
  color: z.string().optional(),
  max_capacity: z.number().positive().optional(),
});

type TeamPayload = z.infer<typeof TeamSchema>;

// ─── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-rose-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

// ─── Team Form ─────────────────────────────────────────────────────────────────

function TeamForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: Partial<TeamPayload & { id: string }>;
  onSuccess: (team: Team) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<TeamPayload>>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    age_group: initial?.age_group ?? '',
    color: initial?.color ?? 'blue',
    max_capacity: initial?.max_capacity,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TeamPayload, string>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (field: keyof TeamPayload, value: string | number | undefined) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const parsed = TeamSchema.safeParse(form);
    if (!parsed.success) {
      const fe: Partial<Record<keyof TeamPayload, string>> = {};
      for (const issue of parsed.error.issues) fe[issue.path[0] as keyof TeamPayload] = issue.message;
      setErrors(fe);
      return;
    }

    setLoading(true);
    try {
      const url = initial?.id ? `${API}/api/teams/${initial.id}` : `${API}/api/teams`;
      const method = initial?.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const d = await res.json();
        setServerError(d.error ?? 'Erreur serveur');
        return;
      }
      onSuccess(await res.json());
    } catch {
      setServerError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nom de l'équipe" error={errors.name} required>
        <Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Équipe Joie" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Groupe d'âge">
          <Select value={form.age_group ?? ''} onValueChange={(v) => set('age_group', v)}>
            <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
            <SelectContent>
              {AGE_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Couleur">
          <Select value={form.color ?? 'blue'} onValueChange={(v) => set('color', v)}>
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getColorBg(form.color ?? null)}`} />
                  {TEAM_COLORS.find((c) => c.value === form.color)?.label ?? 'Bleu'}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TEAM_COLORS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${c.bg}`} />
                    {c.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Capacité max">
        <Input
          type="number" min={1}
          value={form.max_capacity ?? ''}
          onChange={(e) => set('max_capacity', e.target.value ? Number(e.target.value) : undefined)}
          placeholder="Ex: 15"
        />
      </Field>

      <Field label="Description">
        <Textarea
          value={form.description ?? ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('description', e.target.value)}
          placeholder="Description de l'équipe…"
          rows={2}
        />
      </Field>

      {serverError && (
        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{serverError}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement…' : initial?.id ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}

// ─── Add Member Dialog ─────────────────────────────────────────────────────────

function AddMemberDialog({
  team,
  profiles,
  onAdded,
}: {
  team: Team;
  profiles: ProfileOption[];
  onAdded: (teamId: string, profileId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingIds = new Set(team.members.map((m) => m.profile_id));
  const available = profiles.filter((p) => !existingIds.has(p.id));

  const handleAdd = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/teams/${team.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: selectedId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Erreur serveur');
        return;
      }
      onAdded(team.id, selectedId);
      setOpen(false);
      setSelectedId('');
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajouter un membre — {team.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Tous les profils sont déjà membres</p>
          ) : (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue placeholder="Choisir un profil…" /></SelectTrigger>
              <SelectContent>
                {available.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span>{p.full_name}</span>
                      <Badge variant="outline" className="text-xs">{p.role}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {error && (
            <p className="text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{error}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleAdd} disabled={!selectedId || loading}>
              {loading ? 'Ajout…' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Team Card ─────────────────────────────────────────────────────────────────

function TeamCard({
  team,
  profiles,
  onUpdated,
  onDeleted,
  onMemberAdded,
  onMemberRemoved,
}: {
  team: Team;
  profiles: ProfileOption[];
  onUpdated: (t: Team) => void;
  onDeleted: (id: string) => void;
  onMemberAdded: (teamId: string, profileId: string) => void;
  onMemberRemoved: (teamId: string, profileId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const colorBg = getColorBg(team.color);

  const handleDelete = async () => {
    if (!confirm(`Supprimer l'équipe "${team.name}" ?`)) return;
    setDeleting(true);
    try {
      await fetch(`${API}/api/teams/${team.id}`, { method: 'DELETE' });
      onDeleted(team.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveMember = async (profileId: string, name: string) => {
    if (!confirm(`Retirer ${name} de l'équipe ?`)) return;
    await fetch(`${API}/api/teams/${team.id}/members/${profileId}`, { method: 'DELETE' });
    onMemberRemoved(team.id, profileId);
  };

  return (
    <Card className="overflow-hidden">
      {/* Color bar */}
      <div className={`h-1.5 w-full ${colorBg}`} />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colorBg} flex items-center justify-center shrink-0`}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">{team.name}</CardTitle>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {team.age_group && (
                  <Badge variant="secondary" className="text-xs">{team.age_group}</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {team.members.length} teacher{team.members.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-muted-foreground">
                  · {team.children_count} enfant{team.children_count !== 1 ? 's' : ''}
                </span>
                {team.max_capacity && (
                  <span className="text-xs text-muted-foreground">
                    · max {team.max_capacity}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="w-8 h-8">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Modifier l&apos;équipe</DialogTitle>
                </DialogHeader>
                <TeamForm
                  initial={{
                    id: team.id,
                    name: team.name,
                    description: team.description ?? undefined,
                    age_group: team.age_group ?? undefined,
                    color: team.color ?? undefined,
                    max_capacity: team.max_capacity ?? undefined,
                  }}
                  onSuccess={(updated) => { onUpdated(updated); setEditOpen(false); }}
                  onCancel={() => setEditOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Button size="icon" variant="ghost" className="w-8 h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
              onClick={handleDelete} disabled={deleting}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {team.description && (
          <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Members preview */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Membres ({team.members.length})
          </button>
          <AddMemberDialog team={team} profiles={profiles} onAdded={onMemberAdded} />
        </div>

        {/* Avatar stack when collapsed */}
        {!expanded && team.members.length > 0 && (
          <div className="flex -space-x-2">
            {team.members.slice(0, 5).map((m) => (
              <div key={m.id}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-background flex items-center justify-center text-xs font-semibold text-white"
                title={m.profile?.full_name}>
                {m.profile ? getInitials(m.profile.full_name) : '?'}
              </div>
            ))}
            {team.members.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{team.members.length - 5}
              </div>
            )}
          </div>
        )}

        {/* Expanded member list */}
        {expanded && (
          <div className="space-y-2 mt-2">
            {team.members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">Aucun membre</p>
            ) : (
              team.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-xs font-semibold text-white">
                      {m.profile ? getInitials(m.profile.full_name) : '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.profile?.full_name ?? 'Inconnu'}</p>
                      <p className="text-xs text-muted-foreground">{m.profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{m.profile?.role}</Badge>
                    <Button
                      size="icon" variant="ghost"
                      className="w-7 h-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => handleRemoveMember(m.profile_id, m.profile?.full_name ?? '')}
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface TeamsProps {
  profile: Profile;
}

export default function Teams({ profile: _profile }: TeamsProps) {
  void _profile;
  const [teams, setTeams] = useState<Team[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setServerError(null);
    try {
      if (!API) {
        setServerError('NEXT_PUBLIC_API_URL manquante');
        setTeams([]);
        setProfiles([]);
        return;
      }

      const [teamsRes, profilesRes] = await Promise.all([
        fetch(`${API}/api/teams`),
        fetch(`${API}/api/teams/profiles`),
      ]);

      const teamsJson: unknown = await teamsRes.json();
      const profilesJson: unknown = await profilesRes.json();

      if (!teamsRes.ok) {
        const message =
          typeof teamsJson === 'object' && teamsJson !== null && 'error' in teamsJson
            ? String((teamsJson as { error: unknown }).error)
            : 'Erreur chargement équipes';
        throw new Error(message);
      }

      if (!profilesRes.ok) {
        const message =
          typeof profilesJson === 'object' && profilesJson !== null && 'error' in profilesJson
            ? String((profilesJson as { error: unknown }).error)
            : 'Erreur chargement profils';
        throw new Error(message);
      }

      setTeams(Array.isArray(teamsJson) ? (teamsJson as Team[]) : []);
      setProfiles(Array.isArray(profilesJson) ? (profilesJson as ProfileOption[]) : []);
    } catch (e) {
      console.error(e);
      setServerError(e instanceof Error ? e.message : 'Erreur de chargement');
      setTeams([]);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCreated(team: Team) {
    setTeams((prev) => [{ ...team, members: [], children_count: 0 }, ...prev]);
    setCreateOpen(false);
  }

  function handleUpdated(updated: Team) {
    setTeams((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
  }

  function handleDeleted(id: string) {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }

  function handleMemberAdded(teamId: string, profileId: string) {
    const prof = profiles.find((p) => p.id === profileId);
    setTeams((prev) => prev.map((t) => {
      if (t.id !== teamId) return t;
      const newMember: TeamMember = {
        id: `${teamId}-${profileId}`,
        profile_id: profileId,
        joined_date: new Date().toISOString().split('T')[0],
        profile: prof ? { ...prof, avatar_url: null } : undefined,
      };
      return { ...t, members: [...t.members, newMember] };
    }));
  }

  function handleMemberRemoved(teamId: string, profileId: string) {
    setTeams((prev) => prev.map((t) => {
      if (t.id !== teamId) return t;
      return { ...t, members: t.members.filter((m) => m.profile_id !== profileId) };
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Équipes</h1>
          <p className="text-muted-foreground">
            {teams.length} équipe{teams.length !== 1 ? 's' : ''} active{teams.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle équipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une équipe</DialogTitle>
            </DialogHeader>
            <TeamForm onSuccess={handleCreated} onCancel={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : serverError ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Impossible de charger les équipes</p>
            <p className="text-sm mt-1">{serverError}</p>
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune équipe créée</p>
            <p className="text-sm mt-1">Cliquez sur Nouvelle équipe pour commencer</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              profiles={profiles}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onMemberAdded={handleMemberAdded}
              onMemberRemoved={handleMemberRemoved}
            />
          ))}
        </div>
      )}
    </div>
  );
}