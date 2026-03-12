'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { Badge } from '@/src/components/ui/badge';
import { Plus, User, Phone, Mail, AlertCircle, Heart, X, Search, Calendar } from 'lucide-react';
import type { Profile } from '../types/database';

// ─── Zod Schema ────────────────────────────────────────────────────────────────

export const CreateChildSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis').max(50),
  last_name: z.string().min(1, 'Le nom est requis').max(50),
  date_of_birth: z
    .string()
    .min(1, 'La date de naissance est requise')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD'),
  gender: z.enum(['male', 'female']),
  parent_name: z.string().max(100).nullable().optional(),
  parent_phone: z.string().max(20).nullable().optional(),
  parent_email: z.string().email('Email invalide').nullable().optional().or(z.literal('')),
  address: z.string().max(200).nullable().optional(),
  medical_notes: z.string().max(500).nullable().optional(),
  allergies: z.string().max(300).nullable().optional(),
  special_needs: z.string().max(500).nullable().optional(),
  emergency_contact: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  photo_url: z.string().url('URL invalide').nullable().optional().or(z.literal('')),
});

export type CreateChildPayload = z.infer<typeof CreateChildSchema>;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Child {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  parent_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  address: string | null;
  medical_notes: string | null;
  allergies: string | null;
  special_needs: string | null;
  emergency_contact: string | null;
  notes: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

const GENDER_COLORS: Record<string, string> = {
  male: 'bg-blue-100 text-blue-700 border-blue-200',
  female: 'bg-pink-100 text-pink-700 border-pink-200',
};

const GENDER_LABELS: Record<string, string> = {
  male: 'Garçon',
  female: 'Fille',
};

const AVATAR_GRADIENTS = [
  'from-violet-400 to-purple-600',
  'from-blue-400 to-cyan-600',
  'from-emerald-400 to-teal-600',
  'from-orange-400 to-rose-500',
  'from-pink-400 to-fuchsia-600',
  'from-amber-400 to-orange-500',
];

function getAvatarGradient(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

// ─── Form Field ────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-rose-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Add Child Form ─────────────────────────────────────────────────────────────

function AddChildForm({ onSuccess }: { onSuccess: (child: Child) => void }) {
  const [form, setForm] = useState<Partial<CreateChildPayload>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof CreateChildPayload, string>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (field: keyof CreateChildPayload, value: string) => {
    setForm((f) => ({ ...f, [field]: value === '' ? null : value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const parsed = CreateChildSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CreateChildPayload, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CreateChildPayload;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? 'Une erreur est survenue');
        return;
      }

      const child = await res.json();
      onSuccess(child);
    } catch {
      setServerError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      {/* Identité */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Identité
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prénom" error={errors.first_name} required>
            <Input
              placeholder="Emma"
              value={form.first_name ?? ''}
              onChange={(e) => set('first_name', e.target.value)}
            />
          </Field>
          <Field label="Nom" error={errors.last_name} required>
            <Input
              placeholder="Dupont"
              value={form.last_name ?? ''}
              onChange={(e) => set('last_name', e.target.value)}
            />
          </Field>
          <Field label="Date de naissance" error={errors.date_of_birth} required>
            <Input
              type="date"
              value={form.date_of_birth ?? ''}
              onChange={(e) => set('date_of_birth', e.target.value)}
            />
          </Field>
          <Field label="Genre" error={errors.gender} required>
            <Select
              value={form.gender ?? ''}
              onValueChange={(v) => set('gender', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Fille</SelectItem>
                <SelectItem value="male">Garçon</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {/* Parents */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Contact parent
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom du parent" error={errors.parent_name}>
            <Input
              placeholder="Marie Dupont"
              value={form.parent_name ?? ''}
              onChange={(e) => set('parent_name', e.target.value)}
            />
          </Field>
          <Field label="Téléphone" error={errors.parent_phone}>
            <Input
              placeholder="+32 470 12 34 56"
              value={form.parent_phone ?? ''}
              onChange={(e) => set('parent_phone', e.target.value)}
            />
          </Field>
          <Field label="Email" error={errors.parent_email}>
            <Input
              type="email"
              placeholder="parent@email.com"
              value={form.parent_email ?? ''}
              onChange={(e) => set('parent_email', e.target.value)}
            />
          </Field>
          <Field label="Contact urgence" error={errors.emergency_contact}>
            <Input
              placeholder="+32 470 98 76 54"
              value={form.emergency_contact ?? ''}
              onChange={(e) => set('emergency_contact', e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Adresse" error={errors.address}>
            <Input
              placeholder="Rue de l'Église 1, 1000 Bruxelles"
              value={form.address ?? ''}
              onChange={(e) => set('address', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Infos médicales */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Informations particulières
        </p>
        <div className="space-y-4">
          <Field label="Allergies" error={errors.allergies}>
            <Input
              placeholder="Arachides, gluten…"
              value={form.allergies ?? ''}
              onChange={(e) => set('allergies', e.target.value)}
            />
          </Field>
          <Field label="Notes médicales" error={errors.medical_notes}>
            <Textarea
              placeholder="Asthme, traitement en cours…"
              rows={2}
              value={form.medical_notes ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('medical_notes', e.target.value)}
            />
          </Field>
          <Field label="Besoins particuliers" error={errors.special_needs}>
            <Textarea
              placeholder="Handicap, adaptations nécessaires…"
              rows={2}
              value={form.special_needs ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('special_needs', e.target.value)}
            />
          </Field>
          <Field label="Notes générales" error={errors.notes}>
            <Textarea
              placeholder="Remarques diverses…"
              rows={2}
              value={form.notes ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('notes', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {serverError}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Enregistrement…' : 'Ajouter l\'enfant'}
      </Button>
    </form>
  );
}

// ─── Child Card ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <div className="space-y-1.5 bg-muted/40 rounded-lg p-3">{children}</div>
    </div>
  );
}

function Row({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`font-medium text-right ${alert ? 'text-amber-600' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function ChildCard({ child }: { child: Child }) {
  const age = calculateAge(child.date_of_birth);
  const gradient = getAvatarGradient(child.id);
  const hasAlerts = child.allergies || child.medical_notes || child.special_needs;
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors group h-[88px] cursor-pointer"
      >
        <div className="shrink-0">
          {child.photo_url ? (
            <Image
              src={child.photo_url}
              alt={`${child.first_name} ${child.last_name}`}
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg ring-2 ring-border`}
            >
              {getInitials(child.first_name, child.last_name)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-semibold text-foreground truncate">
              {child.first_name} {child.last_name}
            </span>
            <Badge variant="outline" className={`text-xs shrink-0 ${GENDER_COLORS[child.gender]}`}>
              {GENDER_LABELS[child.gender]}
            </Badge>
            {hasAlerts && (
              <Badge variant="outline" className="text-xs shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                <Heart className="w-3 h-3 mr-1" />
                Infos santé
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground overflow-hidden">
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              {age} ans
            </span>
            {child.parent_name && (
              <span className="flex items-center gap-1 shrink-0">
                <User className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{child.parent_name}</span>
              </span>
            )}
            {child.parent_phone && (
              <span className="flex items-center gap-1 shrink-0">
                <Phone className="w-3.5 h-3.5" />
                {child.parent_phone}
              </span>
            )}
            {child.parent_email && (
              <span className="flex items-center gap-1 min-w-0">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{child.parent_email}</span>
              </span>
            )}
            {child.allergies && (
              <span className="flex items-center gap-1 text-amber-600 shrink-0">
                <AlertCircle className="w-3 h-3" />
                {child.allergies}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">Inscrit le</p>
          <p className="text-sm font-medium">
            {new Date(child.created_at).toLocaleDateString('fr-BE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shrink-0`}>
                {child.photo_url ? (
                  <Image src={child.photo_url} alt={`${child.first_name} ${child.last_name}`} width={40} height={40} className="rounded-full object-cover" />
                ) : (
                  getInitials(child.first_name, child.last_name)
                )}
              </div>
              {child.first_name} {child.last_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 text-sm">
            <Section title="Identité">
              <Row label="Âge" value={`${age} ans`} />
              <Row label="Date de naissance" value={new Date(child.date_of_birth).toLocaleDateString('fr-BE', { day: '2-digit', month: 'long', year: 'numeric' })} />
              <Row label="Genre" value={GENDER_LABELS[child.gender]} />
            </Section>

            {(child.parent_name || child.parent_phone || child.parent_email || child.emergency_contact || child.address) && (
              <Section title="Contact parent">
                {child.parent_name && <Row label="Nom" value={child.parent_name} />}
                {child.parent_phone && <Row label="Téléphone" value={child.parent_phone} />}
                {child.parent_email && <Row label="Email" value={child.parent_email} />}
                {child.emergency_contact && <Row label="Urgence" value={child.emergency_contact} />}
                {child.address && <Row label="Adresse" value={child.address} />}
              </Section>
            )}

            {hasAlerts && (
              <Section title="Informations particulières">
                {child.allergies && <Row label="Allergies" value={child.allergies} alert />}
                {child.medical_notes && <Row label="Notes médicales" value={child.medical_notes} alert />}
                {child.special_needs && <Row label="Besoins particuliers" value={child.special_needs} alert />}
              </Section>
            )}

            {child.notes && (
              <Section title="Notes générales">
                <p className="text-muted-foreground">{child.notes}</p>
              </Section>
            )}

            <Section title="Inscription">
              <Row label="Inscrit le" value={new Date(child.created_at).toLocaleDateString('fr-BE', { day: '2-digit', month: 'long', year: 'numeric' })} />
            </Section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface ChildrenProps {
  profile: Profile;
}

export default function Children({ profile }: ChildrenProps) {
  void profile;
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  async function fetchChildren() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/children`);
      if (!res.ok) throw new Error('Failed to fetch children');
      const data = await res.json();
      setChildren(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleChildAdded(child: Child) {
    setChildren((prev) => [child, ...prev]);
    setDialogOpen(false);
  }

  const filtered = children.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.parent_name?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enfants</h1>
          <p className="text-muted-foreground">
            {children.length} élève{children.length !== 1 ? 's' : ''} inscrit
            {children.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un enfant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouvel élève</DialogTitle>
            </DialogHeader>
            <AddChildForm onSuccess={handleChildAdded} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Card liste */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Liste des élèves</CardTitle>
              <CardDescription>Tous les enfants inscrits à l&eacute;cole du dimanche</CardDescription>
            </div>
            {children.length > 0 && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? (
                <>
                  <p>Aucun résultat pour « {search} »</p>
                  <p className="text-sm mt-1">Essayez un autre nom</p>
                </>
              ) : (
                <>
                  <p>Aucun enfant inscrit</p>
                  <p className="text-sm mt-2">Cliquez sur Ajouter un enfant pour commencer</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((child) => (
                <ChildCard key={child.id} child={child} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}