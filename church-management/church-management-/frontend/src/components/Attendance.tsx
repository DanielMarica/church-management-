'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import {
  Check, X, Info, Users, Calendar, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, UserX, CheckCircle2, Search, UserPlus,
} from 'lucide-react';
import type { Profile } from '../types/database';

// ─── Types ─────────────────────────────────────────────────────────────────────

type AttendanceStatus = 'present' | 'absent' | 'pending';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  team_id: string | null;
  allergies: string | null;
  medical_notes: string | null;
  emergency_contact: string | null;
  parent_name: string | null;
  parent_phone: string | null;
}

interface AttendanceRecord {
  id: string;
  planning_id: string;
  child_id: string;
  status: AttendanceStatus;
  notes: string | null;
  recorded_at: string;
  child?: Child;
}

interface AttendanceSession {
  planning_id: string;
  scheduled_date: string;
  team_id: string;
  total: number;
  present: number;
  absent: number;
  pending: number;
  records: AttendanceRecord[];
}

interface PlanningSession {
  id: string;
  scheduled_date: string;
  team_id: string;
  total: number;
  present: number;
  absent: number;
  pending: number;
}

interface Team {
  id: string;
  name: string;
  color: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL;

const TEAM_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
  red: 'bg-red-500', orange: 'bg-orange-500', pink: 'bg-pink-500',
  teal: 'bg-teal-500', yellow: 'bg-yellow-500',
};

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function getAvatarGradient(id: string) {
  const g = ['from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600', 'from-rose-400 to-rose-600',
    'from-amber-400 to-amber-600', 'from-teal-400 to-teal-600'];
  return g[id.charCodeAt(0) % g.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Child Info Dialog ─────────────────────────────────────────────────────────

function ChildInfoDialog({ child, onClose }: { child: Child; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Fiche enfant</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(child.id)} flex items-center justify-center text-lg font-bold text-white`}>
              {getInitials(child.first_name, child.last_name)}
            </div>
            <div>
              <p className="font-bold">{child.first_name} {child.last_name}</p>
            </div>
          </div>

          {/* Info rows */}
          {child.parent_name && (
            <div className="text-sm">
              <span className="text-muted-foreground">Parent : </span>
              <span className="font-medium">{child.parent_name}</span>
            </div>
          )}
          {child.parent_phone && (
            <div className="text-sm">
              <span className="text-muted-foreground">Téléphone : </span>
              <a href={`tel:${child.parent_phone}`} className="font-medium text-blue-600">
                {child.parent_phone}
              </a>
            </div>
          )}
          {child.emergency_contact && (
            <div className="text-sm">
              <span className="text-muted-foreground">Urgence : </span>
              <span className="font-medium">{child.emergency_contact}</span>
            </div>
          )}
          {child.allergies && (
            <div className="p-2 rounded-lg bg-orange-50 border border-orange-200 text-sm">
              <p className="font-semibold text-orange-700 mb-0.5">⚠️ Allergies</p>
              <p className="text-orange-600">{child.allergies}</p>
            </div>
          )}
          {child.medical_notes && (
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-sm">
              <p className="font-semibold text-blue-700 mb-0.5">📋 Notes médicales</p>
              <p className="text-blue-600">{child.medical_notes}</p>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Child Row ─────────────────────────────────────────────────────────────────

function ChildRow({
  record,
  onToggle,
  saving,
}: {
  record: AttendanceRecord;
  onToggle: (childId: string, current: AttendanceStatus) => void;
  saving: boolean;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const child = record.child!;
  const status = record.status;

  const isPresent = status === 'present';
  const isAbsent = status === 'absent';
  const isPending = status === 'pending';

  return (
    <>
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
        isPresent ? 'bg-emerald-50 border-emerald-200' :
        isAbsent  ? 'bg-red-50 border-red-200' :
        'bg-white border-gray-100 hover:border-gray-200'
      }`}>
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(child.id)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
          {getInitials(child.first_name, child.last_name)}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {child.first_name} <span className="font-bold">{child.last_name}</span>
          </p>
          {(child.allergies || child.medical_notes) && (
            <p className="text-xs text-orange-500">⚠️ infos médicales</p>
          )}
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          {isPresent && <span className="text-xs font-semibold text-emerald-600">Présent</span>}
          {isAbsent  && <span className="text-xs font-semibold text-red-500">Absent</span>}
          {isPending && <span className="text-xs text-muted-foreground">—</span>}
        </div>

        {/* Info button */}
        <Button
          size="icon" variant="ghost"
          className="w-7 h-7 shrink-0 text-muted-foreground hover:text-blue-600"
          onClick={() => setShowInfo(true)}
        >
          <Info className="w-3.5 h-3.5" />
        </Button>

        {/* Present toggle */}
        <button
          onClick={() => onToggle(child.id, status)}
          disabled={saving}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            isPresent
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
          }`}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className={`w-4 h-4 ${isPresent ? 'text-white' : 'text-gray-300'}`} />
          )}
        </button>
      </div>

      {showInfo && child && (
        <ChildInfoDialog child={child} onClose={() => setShowInfo(false)} />
      )}
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface AttendanceProps {
  profile: Profile;
  onCreateChildRedirect?: () => void;
}

export default function Attendance({ profile, onCreateChildRedirect }: AttendanceProps) {
  void profile;
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [planningSessions, setPlanningSessions] = useState<PlanningSession[]>([]);
  const [selectedPlanningId, setSelectedPlanningId] = useState('');
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [markingAbsent, setMarkingAbsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [childSearch, setChildSearch] = useState('');

  // Load teams
  useEffect(() => {
    fetch(`${API}/api/teams`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data as Team[] : [];
        setTeams(list);
        if (list.length > 0) setSelectedTeamId(list[0].id);
      })
      .catch(() => setError('Impossible de charger les équipes'));
  }, []);

  // Load planning sessions for the team
  useEffect(() => {
    if (!selectedTeamId) return;
    setSelectedPlanningId('');
    setSession(null);
    fetch(`${API}/api/attendance/sessions?team_id=${selectedTeamId}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data as PlanningSession[] : [];
        setPlanningSessions(list);
        if (list.length > 0) setSelectedPlanningId(list[0].id);
      })
      .catch(() => setError('Impossible de charger les dimanches'));
  }, [selectedTeamId]);

  // Load attendance when planning selected
  const fetchSession = useCallback(async (planningId: string) => {
    if (!planningId) return;
    setLoadingSession(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/attendance?planning_id=${planningId}`);
      if (!res.ok) throw new Error('Erreur chargement');
      setSession(await res.json());
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Erreur chargement');
      }
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPlanningId) fetchSession(selectedPlanningId);
  }, [selectedPlanningId, fetchSession]);

  // Toggle presence
  const handleToggle = async (childId: string, current: AttendanceStatus) => {
    if (!selectedPlanningId) return;
    const newStatus: 'present' | 'absent' = current === 'present' ? 'absent' : 'present';

    setSavingIds((s) => new Set(s).add(childId));

    // Optimistic update
    setSession((prev) => {
      if (!prev) return prev;
      const records = prev.records.map((r) =>
        r.child_id === childId ? { ...r, status: newStatus } : r
      );
      return {
        ...prev,
        records,
        present: records.filter((r) => r.status === 'present').length,
        absent: records.filter((r) => r.status === 'absent').length,
        pending: records.filter((r) => r.status === 'pending').length,
      };
    });

    try {
      await fetch(`${API}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planning_id: selectedPlanningId,
          child_id: childId,
          status: newStatus,
        }),
      });
    } catch {
      // Revert on error
      fetchSession(selectedPlanningId);
    } finally {
      setSavingIds((s) => { const n = new Set(s); n.delete(childId); return n; });
    }
  };

  // Mark all absent
  const handleMarkAllAbsent = async () => {
    if (!selectedPlanningId || !session) return;
    if (!confirm(`Marquer ${session.pending} enfant(s) non enregistré(s) comme absent(s) ?`)) return;
    setMarkingAbsent(true);
    try {
      await fetch(`${API}/api/attendance/mark-all-absent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planning_id: selectedPlanningId }),
      });
      await fetchSession(selectedPlanningId);
    } catch {
      setError('Erreur lors du marquage');
    } finally {
      setMarkingAbsent(false);
    }
  };

  // Navigate between sundays
  const currentIndex = planningSessions.findIndex((s) => s.id === selectedPlanningId);
  const canPrev = currentIndex < planningSessions.length - 1;
  const canNext = currentIndex > 0;
  const normalizedSearch = childSearch.trim().toLowerCase();

  const sortedRecords = session?.records
    .slice()
    .sort((a, b) => {
      const order = { present: 0, pending: 1, absent: 2 };
      return (order[a.status] ?? 1) - (order[b.status] ?? 1);
    }) ?? [];

  const filteredRecords = normalizedSearch
    ? sortedRecords.filter((record) => {
      const child = record.child;
      if (!child) return false;
      const fullName = `${child.first_name} ${child.last_name}`.toLowerCase();
      return fullName.includes(normalizedSearch);
    })
    : sortedRecords;

  const canShowNoSearchResult =
    !loadingSession &&
    !!session &&
    session.records.length > 0 &&
    normalizedSearch.length > 0 &&
    filteredRecords.length === 0;

  // const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Présences</h1>
          <p className="text-muted-foreground">Appel du dimanche par équipe</p>
        </div>

        {/* Team selector */}
        {teams.length > 0 && (
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Équipe" />
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
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {planningSessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun dimanche planifié</p>
            <p className="text-sm mt-1">Générez d&#39;abord le planning dans l&#39;onglet Planning</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Sunday navigation */}
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" className="w-8 h-8"
              disabled={!canPrev}
              onClick={() => setSelectedPlanningId(planningSessions[currentIndex + 1].id)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Select value={selectedPlanningId} onValueChange={setSelectedPlanningId}>
              <SelectTrigger className="flex-1 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {planningSessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{formatDate(s.scheduled_date)}</span>
                      {s.pending === 0 && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button size="icon" variant="outline" className="w-8 h-8"
              disabled={!canNext}
              onClick={() => setSelectedPlanningId(planningSessions[currentIndex - 1].id)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Stats bar */}
          {session && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{session.present}</p>
                <p className="text-xs text-emerald-600 font-medium">Présents</p>
              </div>
              <div className="rounded-xl border bg-red-50 border-red-200 p-3 text-center">
                <p className="text-2xl font-bold text-red-500">{session.absent}</p>
                <p className="text-xs text-red-500 font-medium">Absents</p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {session && session.total > 0 && (
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(session.present / session.total) * 100}%` }}
              />
            </div>
          )}

          {/* Children list */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {session ? `${session.total} enfant${session.total !== 1 ? 's' : ''}` : 'Chargement…'}
                </CardTitle>

                <div className="flex items-center gap-2 flex-wrap">
                  {session && session.records.length > 0 && (
                    <div className="relative w-56">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un enfant…"
                        className="pl-9 pr-8 h-8 text-sm"
                        value={childSearch}
                        onChange={(e) => setChildSearch(e.target.value)}
                      />
                      {childSearch && (
                        <button
                          onClick={() => setChildSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label="Effacer la recherche"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {session && session.pending > 0 && (
                    <Button
                      size="sm" variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs gap-1"
                      onClick={handleMarkAllAbsent}
                      disabled={markingAbsent}
                    >
                      {markingAbsent
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <UserX className="w-3.5 h-3.5" />
                      }
                      Absent tous ({session.pending})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4">
              {loadingSession ? (
                <div className="space-y-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : session?.records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Aucun enfant dans cette équipe
                </p>
              ) : canShowNoSearchResult ? (
                <div className="text-center text-muted-foreground py-8 text-sm space-y-3">
                  <p>Aucun enfant trouvé pour « {childSearch.trim()} »</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => onCreateChildRedirect?.()}
                  >
                    <UserPlus className="w-4 h-4" />
                    Créer un enfant
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecords
                    .map((record) => (
                      <ChildRow
                        key={record.child_id}
                        record={record}
                        onToggle={handleToggle}
                        saving={savingIds.has(record.child_id)}
                      />
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
