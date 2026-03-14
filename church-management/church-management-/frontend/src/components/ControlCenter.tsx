'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import {
  Utensils, Printer, Package, ChevronLeft, ChevronRight, Plus,
  Loader2, AlertCircle, Trash2, CheckCircle2, Clock, ShoppingCart,
  MessageSquare, Upload, FileText, X, Send, Check, AlertTriangle,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Team { id: string; name: string; color: string | null }
interface PlanningSession { id: string; scheduled_date: string; team_id: string }

interface FoodRequest {
  id: string;
  team_id: string;
  planning_id: string;
  children_count: number;
  notes: string | null;
  team?: Team;
  submitter?: { id: string; full_name: string };
}

interface PrintRequest {
  id: string;
  submitted_by: string | null;
  description: string;
  file_url: string | null;
  status: 'pending' | 'printed';
  admin_comment: string | null;
  created_at: string;
  submitter?: { id: string; full_name: string; avatar_url: string | null };
  team?: Team;
}

type FoodCategory = 'biscuit' | 'bonbon' | 'autre';

interface FoodStock {
  id: string;
  name: string;
  category: FoodCategory;
  packets_count: number;
  pieces_per_packet: number;
  total_pieces: number;
  photo_url: string | null;
  purchased_at: string | null;
  expires_at: string | null;
}

interface BasketItem {
  food_stock_id: string;
  stock: FoodStock;
  packets_used: number;
  pieces_used: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL;

const TEAM_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
  red: 'bg-red-500', orange: 'bg-orange-500', pink: 'bg-pink-500',
  teal: 'bg-teal-500', yellow: 'bg-yellow-500',
};

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  biscuit: '🍪 Biscuit', bonbon: '🍬 Bonbon', autre: '📦 Autre',
};

const CATEGORY_COLORS: Record<FoodCategory, string> = {
  biscuit: '#f59e0b', bonbon: '#ec4899', autre: '#6366f1',
};

// ─── Fake current user — replace with real auth later ──────────────────────────
const CURRENT_USER = {
  id: '29ac3d70-55e5-4bf3-900e-25ff1fbbbb80',
  full_name: 'Alexandru Dima',
  role: 'admin' as 'admin' | 'teacher',
  team_id: '359758ea-e445-4283-9120-100e34b6c8f3',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatShortDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarGradient(id: string) {
  const g = ['from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600', 'from-rose-400 to-rose-600',
    'from-amber-400 to-amber-600', 'from-teal-400 to-teal-600'];
  return g[id.charCodeAt(0) % g.length];
}

function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ════════════════════════════════════════════════════════════════════════════════
// ONGLET 1 — NOURRITURE
// ════════════════════════════════════════════════════════════════════════════════

function FoodRequestForm({
  teamId, planningId, existing, onSaved, onClose,
}: {
  teamId: string; planningId: string;
  existing: FoodRequest | null;
  onSaved: (r: FoodRequest) => void; onClose: () => void;
}) {
  const [count, setCount] = useState(existing?.children_count ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API}/api/control/food-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId, planning_id: planningId, children_count: count, submitted_by: CURRENT_USER.id, notes: notes || undefined }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      onSaved(await res.json()); onClose();
    } catch { setError('Erreur serveur'); } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Demande de nourriture</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre d&#39;enfants</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setCount(Math.max(0, count - 1))} className="w-9 h-9 rounded-full border flex items-center justify-center text-lg font-bold hover:bg-gray-50">−</button>
              <span className="text-3xl font-bold w-16 text-center">{count}</span>
              <button onClick={() => setCount(count + 1)} className="w-9 h-9 rounded-full border flex items-center justify-center text-lg font-bold hover:bg-gray-50">+</button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Notes (optionnel)</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-20"
              placeholder="Remarques particulières…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || count === 0}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}Envoyer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FoodTab({ isAdmin }: { isAdmin: boolean }) {
  const [sessions, setSessions] = useState<PlanningSession[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [myRequest, setMyRequest] = useState<FoodRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/control/planning-sessions`).then((r) => r.json()).then((data) => {
      const list = Array.isArray(data) ? data as PlanningSession[] : [];
      const seen = new Set<string>();
      const unique = list.filter((s) => { if (seen.has(s.scheduled_date)) return false; seen.add(s.scheduled_date); return true; });
      setSessions(unique);
      if (unique.length > 0) setSelectedId(unique[0].id);
    });
  }, []);

  const fetchRequests = useCallback(async (planningId: string) => {
    if (!planningId) return;
    setLoading(true); setError(null);
    try {
      if (isAdmin) {
        const res = await fetch(`${API}/api/control/food-requests?planning_id=${planningId}&is_admin=true`);
        setRequests(await res.json());
      } else {
        const res = await fetch(`${API}/api/control/food-requests?planning_id=${planningId}&team_id=${CURRENT_USER.team_id}`);
        setMyRequest(await res.json());
      }
    } catch { setError('Erreur chargement'); } finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { if (selectedId) fetchRequests(selectedId); }, [selectedId, fetchRequests]);

  const currentIdx = sessions.findIndex((s) => s.id === selectedId);
  const total = requests.reduce((s, r) => s + r.children_count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" className="w-8 h-8" disabled={currentIdx >= sessions.length - 1}
          onClick={() => setSelectedId(sessions[currentIdx + 1].id)}><ChevronLeft className="w-4 h-4" /></Button>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="flex-1 max-w-xs"><SelectValue placeholder="Choisir un dimanche" /></SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}><span className="capitalize">{formatDate(s.scheduled_date)}</span></SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="icon" variant="outline" className="w-8 h-8" disabled={currentIdx <= 0}
          onClick={() => setSelectedId(sessions[currentIdx - 1].id)}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {error && <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3"><AlertCircle className="w-4 h-4" />{error}</div>}

      {isAdmin ? (
        <>
          {requests.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div>
                <p className="text-xs text-amber-600 font-medium">Total nourriture à prévoir</p>
                <p className="text-3xl font-bold text-amber-700">{total} enfants</p>
              </div>
              <Utensils className="w-8 h-8 text-amber-400" />
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{[1,2,3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <Card><CardContent className="text-center py-12 text-muted-foreground"><Utensils className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Aucune demande pour ce dimanche</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {requests.map((r) => (
                <Card key={r.id}><CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${TEAM_COLOR_MAP[r.team?.color ?? ''] ?? 'bg-gray-400'}`} />
                    <span className="font-semibold text-sm">{r.team?.name ?? 'Équipe'}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div><p className="text-4xl font-bold text-amber-600">{r.children_count}</p><p className="text-xs text-muted-foreground">enfants</p></div>
                    {r.notes && <p className="text-xs text-muted-foreground italic max-w-[120px] text-right">{r.notes}</p>}
                  </div>
                  {r.submitter && <p className="text-xs text-muted-foreground mt-2">Par {r.submitter.full_name}</p>}
                </CardContent></Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {loading ? <div className="h-28 rounded-xl bg-muted animate-pulse" /> : myRequest ? (
            <Card className="border-amber-200 bg-amber-50"><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm text-amber-700">Votre demande</p>
                <Badge variant="outline" className="text-amber-600 border-amber-300">Envoyée ✓</Badge>
              </div>
              <p className="text-4xl font-bold text-amber-600">{myRequest.children_count}</p>
              <p className="text-xs text-muted-foreground">enfants</p>
              {myRequest.notes && <p className="text-xs mt-2 italic">{myRequest.notes}</p>}
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>Modifier</Button>
            </CardContent></Card>
          ) : (
            <Card><CardContent className="text-center py-12">
              <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
              <p className="text-muted-foreground text-sm mb-3">Pas encore de demande pour ce dimanche</p>
              <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" />Faire une demande</Button>
            </CardContent></Card>
          )}
        </div>
      )}

      {showForm && (
        <FoodRequestForm teamId={CURRENT_USER.team_id} planningId={selectedId} existing={myRequest}
          onSaved={(r) => { setMyRequest(r); fetchRequests(selectedId); }} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ONGLET 2 — IMPRESSIONS
// ════════════════════════════════════════════════════════════════════════════════

function PrintRequestForm({ onCreated, onClose }: { onCreated: (r: PrintRequest) => void; onClose: () => void }) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!description.trim()) { setError('Description requise'); return; }
    setSaving(true); setError(null);
    try {
      const form = new FormData();
      form.append('description', description);
      form.append('submitted_by', CURRENT_USER.id);
      form.append('team_id', CURRENT_USER.team_id);
      if (file) form.append('file', file);
      const res = await fetch(`${API}/api/control/print-requests`, { method: 'POST', body: form });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      onCreated(await res.json()); onClose();
    } catch { setError('Erreur serveur'); } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Nouvelle demande d&#39;impression</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Description *</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-24"
              placeholder="Décrivez ce que vous souhaitez imprimer…" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Fichier (optionnel)</label>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-blue-50 border-blue-200">
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs text-blue-700 truncate flex-1">{file.name}</span>
                <button onClick={() => setFile(null)}><X className="w-3.5 h-3.5 text-blue-400" /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300">
                <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                <p className="text-xs text-muted-foreground">Cliquer pour ajouter un fichier</p>
              </button>
            )}
          </div>
          {error && <p className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}Envoyer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PrintRequestCard({ request, isAdmin, onUpdated, onDeleted }: {
  request: PrintRequest; isAdmin: boolean;
  onUpdated: (r: PrintRequest) => void; onDeleted: (id: string) => void;
}) {
  const [comment, setComment] = useState(request.admin_comment ?? '');
  const [editingComment, setEditingComment] = useState(false);
  const [saving, setSaving] = useState(false);
  const isPrinted = request.status === 'printed';

  const handleStatusToggle = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/control/print-requests/${request.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: isPrinted ? 'pending' : 'printed' }),
      });
      onUpdated(await res.json());
    } finally { setSaving(false); }
  };

  const handleSaveComment = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/control/print-requests/${request.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_comment: comment }),
      });
      onUpdated(await res.json()); setEditingComment(false);
    } finally { setSaving(false); }
  };

  return (
    <Card className={isPrinted ? 'opacity-70' : ''}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {request.submitter && (
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(request.submitter.id)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                {getInitials(request.submitter.full_name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{request.submitter?.full_name ?? 'Inconnu'}</p>
              {request.team && (
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${TEAM_COLOR_MAP[request.team.color ?? ''] ?? 'bg-gray-400'}`} />
                  <p className="text-xs text-muted-foreground">{request.team.name}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${isPrinted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {isPrinted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {isPrinted ? 'Imprimé' : 'En attente'}
            </span>
            {isAdmin && (
              <Button size="icon" variant="ghost" className="w-6 h-6 text-rose-400 hover:text-rose-600" onClick={() => onDeleted(request.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-sm">{request.description}</p>

        {request.file_url && (
          <a href={request.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
            <FileText className="w-3.5 h-3.5" />Voir le fichier
          </a>
        )}

        {isAdmin ? (
          editingComment ? (
            <div className="space-y-1">
              <textarea className="w-full border rounded-lg px-2 py-1.5 text-xs resize-none h-16"
                placeholder="Commentaire admin…" value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="flex gap-1 justify-end">
                <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setEditingComment(false)}>Annuler</Button>
                <Button size="sm" className="h-6 text-xs px-2" onClick={handleSaveComment} disabled={saving}>
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sauver'}
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditingComment(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              {request.admin_comment ? request.admin_comment : 'Ajouter un commentaire'}
            </button>
          )
        ) : request.admin_comment ? (
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
            <span className="font-semibold">Admin : </span>{request.admin_comment}
          </div>
        ) : null}

        {isAdmin && (
          <Button size="sm" variant={isPrinted ? 'outline' : 'default'} className="w-full h-7 text-xs" onClick={handleStatusToggle} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            {isPrinted ? '↩ Remettre en attente' : '✓ Marquer comme imprimé'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function PrintTab({ isAdmin }: { isAdmin: boolean }) {
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'printed'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (!isAdmin) params.set('profile_id', CURRENT_USER.id);
      if (isAdmin) params.set('is_admin', 'true');
      const res = await fetch(`${API}/api/control/print-requests?${params}`);
      setRequests(await res.json());
    } catch { setError('Erreur chargement'); } finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette demande ?')) return;
    await fetch(`${API}/api/control/print-requests/${id}`, { method: 'DELETE' });
    setRequests((p) => p.filter((r) => r.id !== id));
  };

  const filtered = requests.filter((r) => filter === 'all' || r.status === filter);
  const pending = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['all', 'pending', 'printed'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {f === 'all' ? `Tout (${requests.length})` : f === 'pending' ? `En attente (${pending})` : 'Imprimés'}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />Nouvelle demande
        </Button>
      </div>

      {error && <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3"><AlertCircle className="w-4 h-4" />{error}</div>}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-muted-foreground">
          <Printer className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Aucune demande{filter !== 'all' ? ` ${filter === 'pending' ? 'en attente' : 'imprimée'}` : ''}</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <PrintRequestCard key={r.id} request={r} isAdmin={isAdmin}
              onUpdated={(u) => setRequests((p) => p.map((x) => x.id === u.id ? u : x))}
              onDeleted={handleDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <PrintRequestForm onCreated={(r) => { setRequests((p) => [r, ...p]); setShowForm(false); }} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ONGLET 3 — STOCKS
// ════════════════════════════════════════════════════════════════════════════════

function StockFormDialog({ existing, onSaved, onClose }: {
  existing: FoodStock | null; onSaved: (s: FoodStock) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    category: existing?.category ?? 'biscuit' as FoodCategory,
    packets_count: existing?.packets_count ?? 0,
    pieces_per_packet: existing?.pieces_per_packet ?? 1,
    purchased_at: existing?.purchased_at ?? '',
    expires_at: existing?.expires_at ?? '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existing?.photo_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPhoto(f); setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Nom requis'); return; }
    setSaving(true); setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append('created_by', CURRENT_USER.id);
      if (photo) fd.append('photo', photo);
      const url = existing ? `${API}/api/food-stocks/${existing.id}` : `${API}/api/food-stocks`;
      const res = await fetch(url, { method: existing ? 'PATCH' : 'POST', body: fd });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      onSaved(await res.json()); onClose();
    } catch { setError('Erreur serveur'); } finally { setSaving(false); }
  };

  const total = form.packets_count * form.pieces_per_packet;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{existing ? 'Modifier le produit' : 'Ajouter un produit'}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-4">
            <div onClick={() => fileRef.current?.click()}
              className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-300 overflow-hidden bg-gray-50 shrink-0">
              {preview ? <Image src={preview} alt="" fill className="object-cover" unoptimized /> : <Upload className="w-6 h-6 text-gray-400" />}
            </div>
            <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handlePhoto} />
            <p className="text-xs text-muted-foreground">Cliquer sur l&#39;image pour ajouter une photo</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Nom du produit *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ex: Bonbons Haribo"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Catégorie</label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as FoodCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [FoodCategory, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Nombre de paquets</label>
              <input type="number" min={0} className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.packets_count} onChange={(e) => setForm({ ...form, packets_count: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Pièces / paquet</label>
              <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.pieces_per_packet} onChange={(e) => setForm({ ...form, pieces_per_packet: Number(e.target.value) })} />
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Total :</span>
            <span className="font-bold">{total} pièces</span>
            <span className="text-muted-foreground">({form.packets_count} × {form.pieces_per_packet})</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Date d&#39;achat</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.purchased_at} onChange={(e) => setForm({ ...form, purchased_at: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date d&#39;expiration</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              {existing ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BasketDialog({ stocks, planningId, onDistributed, onClose }: {
  stocks: FoodStock[]; planningId: string; onDistributed: () => void; onClose: () => void;
}) {
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [childrenCount, setChildrenCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToBasket = (stock: FoodStock) => {
    if (basket.find((b) => b.food_stock_id === stock.id)) return;
    setBasket([...basket, { food_stock_id: stock.id, stock, packets_used: 0, pieces_used: 0 }]);
  };

  const updateItem = (id: string, packets: number) => {
    setBasket(basket.map((b) => b.food_stock_id === id
      ? { ...b, packets_used: Math.max(0, Math.min(packets, b.stock.packets_count)), pieces_used: Math.max(0, Math.min(packets, b.stock.packets_count)) * b.stock.pieces_per_packet }
      : b));
  };

  const removeItem = (id: string) => setBasket(basket.filter((b) => b.food_stock_id !== id));

  const handleDistribute = async () => {
    if (basket.length === 0) { setError('Panier vide'); return; }
    if (childrenCount === 0) { setError("Nombre d'enfants requis"); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API}/api/food-stocks/distribute`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planning_id: planningId, children_count: childrenCount,
          distributed_by: CURRENT_USER.id,
          items: basket.map((b) => ({ food_stock_id: b.food_stock_id, packets_used: b.packets_used, pieces_used: b.pieces_used })),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      onDistributed(); onClose();
    } catch { setError('Erreur serveur'); } finally { setSaving(false); }
  };

  const totalPieces = basket.reduce((s, b) => s + b.pieces_used, 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>🛒 Panier de distribution</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre total d&#39;enfants</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))} className="w-9 h-9 rounded-full border flex items-center justify-center text-lg font-bold hover:bg-gray-50">−</button>
              <span className="text-3xl font-bold w-16 text-center">{childrenCount}</span>
              <button onClick={() => setChildrenCount(childrenCount + 1)} className="w-9 h-9 rounded-full border flex items-center justify-center text-lg font-bold hover:bg-gray-50">+</button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Ajouter des produits</label>
            <div className="flex flex-wrap gap-2">
              {stocks.filter((s) => s.packets_count > 0).map((s) => (
                <button key={s.id} onClick={() => addToBasket(s)} disabled={!!basket.find((b) => b.food_stock_id === s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border font-medium transition-all ${basket.find((b) => b.food_stock_id === s.id) ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'hover:bg-gray-50 border-gray-200'}`}>
                  {basket.find((b) => b.food_stock_id === s.id) && <Check className="w-3 h-3" />}
                  {s.name} <span className="text-muted-foreground">({s.packets_count} pkts)</span>
                </button>
              ))}
            </div>
          </div>

          {basket.length > 0 && (
            <div className="space-y-2 border rounded-xl p-3">
              {basket.map((item) => (
                <div key={item.food_stock_id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.stock.name}</p>
                    <p className="text-xs text-muted-foreground">{item.pieces_used} pièces · max {item.stock.packets_count} paquets</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => updateItem(item.food_stock_id, item.packets_used - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-50">−</button>
                    <span className="w-8 text-center text-sm font-bold">{item.packets_used}</span>
                    <button onClick={() => updateItem(item.food_stock_id, item.packets_used + 1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-50">+</button>
                    <span className="text-xs text-muted-foreground">pkts</span>
                    <button onClick={() => removeItem(item.food_stock_id)} className="w-7 h-7 flex items-center justify-center text-rose-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total pièces</span>
                <span className="font-bold">{totalPieces}</span>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleDistribute} disabled={saving || basket.length === 0}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-1" />}
              Distribuer et déduire
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StocksTab() {
  const [stocks, setStocks] = useState<FoodStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBasket, setShowBasket] = useState(false);
  const [selectedStock, setSelectedStock] = useState<FoodStock | null>(null);
  const [sessions, setSessions] = useState<PlanningSession[]>([]);
  const [selectedPlanningId, setSelectedPlanningId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/api/food-stocks`); setStocks(await res.json()); }
    catch { setError('Erreur chargement'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  useEffect(() => {
    fetch(`${API}/api/control/planning-sessions`).then((r) => r.json()).then((data) => {
      const list = Array.isArray(data) ? data as PlanningSession[] : [];
      const seen = new Set<string>();
      const unique = list.filter((s) => { if (seen.has(s.scheduled_date)) return false; seen.add(s.scheduled_date); return true; });
      setSessions(unique);
      if (unique.length > 0) setSelectedPlanningId(unique[0].id);
    });
  }, []);

  const chartData = (['biscuit', 'bonbon', 'autre'] as FoodCategory[]).map((cat) => ({
    name: CATEGORY_LABELS[cat],
    value: stocks.filter((s) => s.category === cat).reduce((sum, s) => sum + s.total_pieces, 0),
    color: CATEGORY_COLORS[cat],
  })).filter((d) => d.value > 0);

  const totalPieces = stocks.reduce((s, st) => s + st.total_pieces, 0);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await fetch(`${API}/api/food-stocks/${id}`, { method: 'DELETE' });
    setStocks((p) => p.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold">{stocks.length} produit{stocks.length !== 1 ? 's' : ''} · {totalPieces} pièces au total</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {sessions.length > 0 && (
            <>
              <Select value={selectedPlanningId} onValueChange={setSelectedPlanningId}>
                <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="Dimanche…" /></SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {new Date(s.scheduled_date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setShowBasket(true)} disabled={!selectedPlanningId}>
                <ShoppingCart className="w-3.5 h-3.5 mr-1" />Distribuer
              </Button>
            </>
          )}
          <Button size="sm" onClick={() => { setSelectedStock(null); setShowForm(true); }}>
            <Plus className="w-3.5 h-3.5 mr-1" />Ajouter
          </Button>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3"><AlertCircle className="w-4 h-4" />{error}</div>}

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Répartition du stock</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} pièces`]} />
                  <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : stocks.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Aucun produit en stock</p>
          <Button size="sm" className="mt-3" onClick={() => { setSelectedStock(null); setShowForm(true); }}>
            <Plus className="w-3.5 h-3.5 mr-1" />Ajouter un produit
          </Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {stocks.map((stock) => {
            const days = daysUntilExpiry(stock.expires_at);
            const isExpiringSoon = days !== null && days <= 7 && days >= 0;
            const isExpired = days !== null && days < 0;
            const isEmpty = stock.packets_count === 0;
            return (
              <div key={stock.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isExpired ? 'bg-red-50 border-red-200' : isExpiringSoon ? 'bg-amber-50 border-amber-200' : isEmpty ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                  {stock.photo_url ? <Image src={stock.photo_url} alt={stock.name} fill className="object-cover" unoptimized />
                    : <span className="text-xl">{stock.category === 'biscuit' ? '🍪' : stock.category === 'bonbon' ? '🍬' : '📦'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{stock.name}</p>
                    <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ borderColor: CATEGORY_COLORS[stock.category], color: CATEGORY_COLORS[stock.category] }}>
                      {CATEGORY_LABELS[stock.category]}
                    </Badge>
                    {isExpired && <Badge variant="destructive" className="text-xs px-1.5 py-0">Expiré</Badge>}
                    {isExpiringSoon && <span className="text-xs text-amber-600 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />Expire dans {days}j</span>}
                    {isEmpty && <span className="text-xs text-gray-400">Stock épuisé</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    <span><span className="font-bold text-foreground">{stock.packets_count}</span> paquets × {stock.pieces_per_packet} pcs = <span className="font-bold text-foreground">{stock.total_pieces}</span> pièces</span>
                    {stock.purchased_at && <span>Acheté le {formatShortDate(stock.purchased_at)}</span>}
                    {stock.expires_at && <span>Expire le {formatShortDate(stock.expires_at)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => { setSelectedStock(stock); setShowForm(true); }}>Modifier</Button>
                  <Button size="icon" variant="ghost" className="w-7 h-7 text-rose-400 hover:text-rose-600" onClick={() => handleDelete(stock.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <StockFormDialog existing={selectedStock}
          onSaved={(s) => { setStocks((p) => selectedStock ? p.map((x) => x.id === s.id ? s : x) : [s, ...p]); setShowForm(false); }}
          onClose={() => setShowForm(false)} />
      )}
      {showBasket && selectedPlanningId && (
        <BasketDialog stocks={stocks} planningId={selectedPlanningId} onDistributed={fetchStocks} onClose={() => setShowBasket(false)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

export default function ControlCenter() {
  const [activeTab, setActiveTab] = useState<'food' | 'print' | 'stocks'>('food');
  const isAdmin = CURRENT_USER.role === 'admin';

  const tabs = [
    { id: 'food' as const,   label: 'Nourriture',  icon: Utensils },
    { id: 'print' as const,  label: 'Impressions', icon: Printer  },
    { id: 'stocks' as const, label: 'Stocks',      icon: Package  },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Centre de Contrôle</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Vue administrateur — toutes les équipes' : 'Vue professeur — vos demandes'}
        </p>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'food'   && <FoodTab isAdmin={isAdmin} />}
      {activeTab === 'print'  && <PrintTab isAdmin={isAdmin} />}
      {activeTab === 'stocks' && <StocksTab />}
    </div>
  );
}