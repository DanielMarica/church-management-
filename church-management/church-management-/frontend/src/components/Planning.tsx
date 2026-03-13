'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import {
  Calendar, ChevronLeft, ChevronRight, RefreshCw,
  Repeat2, AlertCircle, Users, Loader2, Trash2,
  CheckCircle2, Clock, XCircle
} from 'lucide-react';
import type { Profile } from '../types/database';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface PlanningRole {
  id: string;
  planning_id: string;
  role_position: number;
  role_name: string;
  profile_id: string | null;
  is_replacement: boolean;
  original_profile_id: string | null;
  profile?: Teacher | null;
  original_profile?: { id: string; full_name: string } | null;
}

interface PlanningSession {
  id: string;
  team_id: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  roles: PlanningRole[];
}

interface Team {
  id: string;
  name: string;
  color: string | null;
  members: { profile_id: string }[];
}

interface AvailableTeacher {
  profile_id: string;
  cycle_position: number;
  profile: Teacher;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL;

const ROLE_ICONS: Record<number, string> = {
  0: '🙏', 1: '🎵', 2: '☕', 3: '📖', 4: '☕', 5: '🌍', 6: '✝️', 7: '☕',
};

const ROLE_COLORS: Record<number, string> = {
  0: 'bg-purple-50 border-purple-200 text-purple-700',
  1: 'bg-pink-50 border-pink-200 text-pink-700',
  2: 'bg-gray-50 border-gray-200 text-gray-500',
  3: 'bg-blue-50 border-blue-200 text-blue-700',
  4: 'bg-gray-50 border-gray-200 text-gray-500',
  5: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  6: 'bg-amber-50 border-amber-200 text-amber-700',
  7: 'bg-gray-50 border-gray-200 text-gray-500',
};

const TEAM_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
  red: 'bg-red-500', orange: 'bg-orange-500', pink: 'bg-pink-500',
  teal: 'bg-teal-500', yellow: 'bg-yellow-500',
};

const STATUS_CONFIG = {
  scheduled: { label: 'Planifié',   icon: Clock,         color: 'text-blue-600 bg-blue-50' },
  completed: { label: 'Terminé',    icon: CheckCircle2,  color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Annulé',     icon: XCircle,       color: 'text-red-600 bg-red-50' },
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getAvatarGradient(id: string) {
  const g = ['from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600', 'from-rose-400 to-rose-600',
    'from-amber-400 to-amber-600', 'from-teal-400 to-teal-600'];
  return g[id.charCodeAt(0) % g.length];
}

// ─── Replace Dialog ────────────────────────────────────────────────────────────

function ReplaceDialog({
  session,
  role,
  onReplaced,
  onClose,
}: {
  session: PlanningSession;
  role: PlanningRole;
  onReplaced: (updated: PlanningSession) => void;
  onClose: () => void;
}) {
  const [available, setAvailable] = useState<AvailableTeacher[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(
          `${API}/api/planning/${session.id}/available-teachers?exclude=${role.profile_id}`
        );
        const data = await res.json();
        setAvailable(Array.isArray(data) ? data : []);
      } catch {
        setError('Impossible de charger les remplaçants');
      } finally {
        setFetching(false);
      }
    }
    fetch_();
  }, [session.id, role.profile_id]);

  const handleReplace = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/planning/${session.id}/replace`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: role.id, new_profile_id: selectedId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Erreur serveur');
        return;
      }
      onReplaced(await res.json());
      onClose();
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Remplacer pour « {role.role_name} »</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Current teacher */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Actuellement assigné</p>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(role.profile?.id ?? '')} flex items-center justify-center text-xs font-bold text-white`}>
                {role.profile ? getInitials(role.profile.full_name) : '?'}
              </div>
              <span className="font-medium text-sm">{role.profile?.full_name ?? 'Inconnu'}</span>
            </div>
          </div>

          {/* Select replacement */}
          {fetching ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : available.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Aucun autre membre disponible
            </p>
          ) : (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue placeholder="Choisir un remplaçant…" /></SelectTrigger>
              <SelectContent>
                {available.map((t) => (
                  <SelectItem key={t.profile_id} value={t.profile_id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarGradient(t.profile_id)} flex items-center justify-center text-xs font-bold text-white`}>
                        {getInitials(t.profile.full_name)}
                      </div>
                      <span>{t.profile.full_name}</span>
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
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleReplace} disabled={!selectedId || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat2 className="w-4 h-4 mr-1" />}
              Remplacer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Session Card ──────────────────────────────────────────────────────────────

function SessionCard({
  session,
  onUpdated,
  onDeleted,
}: {
  session: PlanningSession;
  onUpdated: (s: PlanningSession) => void;
  onDeleted: (id: string) => void;
}) {
  const [replaceRole, setReplaceRole] = useState<PlanningRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  const statusCfg = STATUS_CONFIG[session.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.scheduled;
  const StatusIcon = statusCfg.icon;

  const isPast = new Date(session.scheduled_date) < new Date();

  const handleDelete = async () => {
    if (!confirm('Supprimer cette session ?')) return;
    setDeleting(true);
    try {
      await fetch(`${API}/api/planning/${session.id}`, { method: 'DELETE' });
      onDeleted(session.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className={`overflow-hidden ${isPast ? 'opacity-70' : ''}`}>
        {/* Date header */}
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm capitalize">{formatDate(session.scheduled_date)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </span>
              </div>
            </div>
            <Button size="icon" variant="ghost"
              className="w-7 h-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
              onClick={handleDelete} disabled={deleting}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        {/* Roles list */}
        <CardContent className="px-4 pb-4 space-y-2">
          {session.roles
            .sort((a, b) => a.role_position - b.role_position)
            .map((role) => (
              <div key={role.id}
                className={`flex items-center justify-between p-2 rounded-lg border text-sm ${ROLE_COLORS[role.role_position] ?? 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{ROLE_ICONS[role.role_position]}</span>
                  <span className="font-medium truncate">{role.role_name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {role.profile ? (
                    <div className="flex items-center gap-1.5">
                      {role.is_replacement && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-orange-300 text-orange-600">
                          Remplaçant
                        </Badge>
                      )}
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarGradient(role.profile.id)} flex items-center justify-center text-xs font-bold text-white`}
                        title={role.profile.full_name}>
                        {getInitials(role.profile.full_name)}
                      </div>
                      <span className="text-xs font-medium max-w-[80px] truncate">
                        {role.profile.full_name.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Non assigné</span>
                  )}

                  {!isPast && (
                    <Button size="icon" variant="ghost"
                      className="w-6 h-6 hover:bg-white/60"
                      title="Remplacer"
                      onClick={() => setReplaceRole(role)}>
                      <Repeat2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {replaceRole && (
        <ReplaceDialog
          session={session}
          role={replaceRole}
          onReplaced={(updated) => { onUpdated(updated); setReplaceRole(null); }}
          onClose={() => setReplaceRole(null)}
        />
      )}
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface PlanningProps {
  profile: Profile;
}

export default function Planning({ profile: _profile }: PlanningProps) {
  void _profile;
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [sessions, setSessions] = useState<PlanningSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load teams on mount
  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch(`${API}/api/teams`);
        const data = await res.json();
        const list = Array.isArray(data) ? data as Team[] : [];
        setTeams(list);
        if (list.length > 0) setSelectedTeamId(list[0].id);
      } catch {
        setError('Impossible de charger les équipes');
      }
    }
    fetchTeams();
  }, []);

  // Load sessions when team changes
  const fetchSessions = useCallback(async (teamId: string) => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/planning?team_id=${teamId}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTeamId) fetchSessions(selectedTeamId);
  }, [selectedTeamId, fetchSessions]);

  const handleGenerate = async () => {
    if (!selectedTeamId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/planning/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: selectedTeamId, months: 3 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erreur génération');
        return;
      }
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setGenerating(false);
    }
  };

  function handleUpdated(updated: PlanningSession) {
    setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  }

  function handleDeleted(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  // Filter sessions by current month view
  const monthSessions = sessions.filter((s) => {
    const d = new Date(s.scheduled_date);
    return d.getMonth() === currentMonth.getMonth() &&
      d.getFullYear() === currentMonth.getFullYear();
  });

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const teamColorBg = selectedTeam?.color ? (TEAM_COLOR_MAP[selectedTeam.color] ?? 'bg-gray-400') : 'bg-gray-400';

  const monthLabel = currentMonth.toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Planning</h1>
          <p className="text-muted-foreground">Gestion des dimanches par équipe</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Team selector */}
          {teams.length > 0 && (
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Choisir une équipe" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${TEAM_COLOR_MAP[t.color ?? ''] ?? 'bg-gray-400'}`} />
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={handleGenerate} disabled={!selectedTeamId || generating} variant="outline">
            {generating
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <RefreshCw className="w-4 h-4 mr-2" />}
            Générer 3 mois
          </Button>
        </div>
      </div>

      {/* Team info */}
      {selectedTeam && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <div className={`w-8 h-8 rounded-lg ${teamColorBg} flex items-center justify-center`}>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">{selectedTeam.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedTeam.members?.length ?? 0} membre{(selectedTeam.members?.length ?? 0) !== 1 ? 's' : ''}
              · {sessions.length} dimanche{sessions.length !== 1 ? 's' : ''} planifié{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" className="w-8 h-8"
            onClick={() => setCurrentMonth((m) => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n; })}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold capitalize min-w-[160px] text-center">{monthLabel}</span>
          <Button size="icon" variant="outline" className="w-8 h-8"
            onClick={() => setCurrentMonth((m) => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n; })}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Badge variant="outline">{monthSessions.length} dimanche{monthSessions.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Sessions grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : monthSessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun dimanche planifié ce mois</p>
            <p className="text-sm mt-1">
              {sessions.length === 0
                ? 'Cliquez sur « Générer 3 mois » pour créer le planning'
                : 'Naviguez vers un autre mois ou régénérez le planning'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {monthSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
