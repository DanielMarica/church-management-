'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { Badge } from '@/src/components/ui/badge';
import {
  Plus, Search, X, Upload, FileText, Image as ImageIcon,
  Music, BookOpen, Globe, Gamepad2, AlertCircle, ExternalLink
} from 'lucide-react';
import type { Profile } from '../types/database';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'jeux',                label: 'Jeux',                icon: Gamepad2,  color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { value: 'versets',             label: 'Versets',             icon: BookOpen,  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'chansons',            label: 'Chansons',            icon: Music,     color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'images',              label: 'Images',              icon: ImageIcon, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'lesson_missionnaire', label: 'Leçon missionnaire',  icon: Globe,     color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'lesson_biblique',     label: 'Leçon biblique',      icon: FileText,  color: 'bg-orange-100 text-orange-700 border-orange-200' },
] as const;

type CategoryValue = typeof CATEGORIES[number]['value'];

const AGE_GROUPS = ['3-5 ans', '6-8 ans', '8-12 ans', '10-14 ans', 'Tous âges'];

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const CreateLessonStockSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['jeux', 'versets', 'chansons', 'images', 'lesson_missionnaire', 'lesson_biblique'], {
    message: 'Catégorie requise',
  }),
  age_group: z.string().optional(),
  is_public: z.boolean().optional(),
});

type CreateLessonStockPayload = z.infer<typeof CreateLessonStockSchema>;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LessonStock {
  id: string;
  title: string;
  description: string | null;
  category: CategoryValue;
  age_group: string | null;
  file_url: string | null;
  preview_url: string | null;
  is_public: boolean;
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getCategoryMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0];
}

function getFileType(url: string | null): 'pdf' | 'image' | 'audio' | 'other' | null {
  if (!url) return null;
  if (url.includes('.pdf')) return 'pdf';
  if (/\.(jpg|jpeg|png|webp|gif)/.test(url)) return 'image';
  if (/\.(mp3|wav|m4a|ogg)/.test(url)) return 'audio';
  return 'other';
}

// ─── Form Field ────────────────────────────────────────────────────────────────

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

// ─── Add Form ──────────────────────────────────────────────────────────────────

function AddLessonStockForm({ onSuccess }: { onSuccess: (item: LessonStock) => void }) {
  const [form, setForm] = useState<Partial<CreateLessonStockPayload>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof CreateLessonStockPayload, string>>>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof CreateLessonStockPayload, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const parsed = CreateLessonStockSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CreateLessonStockPayload, string>> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as keyof CreateLessonStockPayload] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      let body: FormData | string;
      const headers: Record<string, string> = {};

      if (file) {
        const fd = new FormData();
        fd.append('title', parsed.data.title);
        if (parsed.data.description) fd.append('description', parsed.data.description);
        fd.append('category', parsed.data.category);
        if (parsed.data.age_group) fd.append('age_group', parsed.data.age_group);
        fd.append('is_public', String(parsed.data.is_public ?? true));
        fd.append('file', file);
        body = fd;
      } else {
        body = JSON.stringify({ ...parsed.data, is_public: String(parsed.data.is_public ?? true) });
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lesson-stocks`, {
        method: 'POST',
        headers,
        body,
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? 'Erreur serveur');
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
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Titre" error={errors.title} required>
            <Input placeholder="Ex: Jeu des versets bibliques"
              value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} />
          </Field>
        </div>

        <Field label="Catégorie" error={errors.category} required>
          <Select value={form.category ?? ''} onValueChange={(v) => set('category', v)}>
            <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Groupe d'âge" error={errors.age_group}>
          <Select value={form.age_group ?? ''} onValueChange={(v) => set('age_group', v)}>
            <SelectTrigger><SelectValue placeholder="Tous âges" /></SelectTrigger>
            <SelectContent>
              {AGE_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="col-span-2">
          <Field label="Description" error={errors.description}>
            <Textarea placeholder="Décrivez ce matériel…" rows={3}
              value={form.description ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('description', e.target.value)} />
          </Field>
        </div>

        {/* File upload */}
        <div className="col-span-2">
          <Label className="text-sm font-medium">Fichier</Label>
          <div
            onClick={() => fileRef.current?.click()}
            className="mt-1.5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>PDF, image ou audio</p>
                <p className="text-xs mt-1">Max 20 MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.mp3,.wav,.m4a"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{serverError}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Envoi en cours…' : 'Ajouter le matériel'}
      </Button>
    </form>
  );
}

// ─── Resource Card ─────────────────────────────────────────────────────────────

function ResourceCard({ item }: { item: LessonStock }) {
  const meta = getCategoryMeta(item.category);
  const Icon = meta.icon;
  const fileType = getFileType(item.file_url);

  return (
    <div className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview zone */}
      <div className="relative h-36 bg-muted flex items-center justify-center overflow-hidden">
        {item.preview_url ? (
          <Image src={item.preview_url} alt={item.title} fill
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
            <Icon className="w-10 h-10" />
            <span className="text-xs">{meta.label}</span>
          </div>
        )}
        {/* Category badge overlay */}
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className={`text-xs ${meta.color} backdrop-blur-sm`}>
            <Icon className="w-3 h-3 mr-1" />
            {meta.label}
          </Badge>
        </div>
        {/* File type badge */}
        {fileType && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
              {fileType === 'pdf' ? 'PDF' : fileType === 'audio' ? 'Audio' : fileType === 'image' ? 'Image' : 'Fichier'}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          {item.age_group && (
            <span className="text-xs text-muted-foreground">{item.age_group}</span>
          )}
          {item.file_url && (
            <a href={item.file_url} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline">
              Ouvrir <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface LessonStocksProps {
  profile: Profile;
}

export default function LessonStocks({ profile }: LessonStocksProps) {
  const [items, setItems] = useState<LessonStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryValue | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lesson-stocks`);
      setItems(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleAdded(item: LessonStock) {
    setItems((prev) => [item, ...prev]);
    setDialogOpen(false);
  }

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || item.title.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Count per category
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matériels</h1>
          <p className="text-muted-foreground">
            {items.length} ressource{items.length !== 1 ? 's' : ''} disponible{items.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un matériel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Nouveau matériel</DialogTitle>
            </DialogHeader>
            <AddLessonStockForm onSuccess={handleAdded} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeCategory === 'all'
              ? 'bg-foreground text-background border-foreground'
              : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
          }`}
        >
          Tout ({items.length})
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = counts[cat.value] ?? 0;
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                isActive ? `${cat.color} border-current` : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search + grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Bibliothèque de ressources</CardTitle>
              <CardDescription>Matériels pédagogiques pour l&apos;école du dimanche</CardDescription>
            </div>
            {items.length > 0 && (
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Rechercher…" className="pl-9"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search || activeCategory !== 'all' ? (
                <p>Aucun résultat — <button onClick={() => { setSearch(''); setActiveCategory('all'); }} className="underline">réinitialiser</button></p>
              ) : (
                <>
                  <p>Aucun matériel disponible</p>
                  <p className="text-sm mt-2">Cliquez sur Ajouter un matériel pour commencer</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <ResourceCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}