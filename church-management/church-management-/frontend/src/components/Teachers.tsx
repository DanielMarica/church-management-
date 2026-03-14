"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Search,
  X,
  AlertCircle,
  Users,
  Mail,
  Phone,
  Pencil,
  Plus,
} from "lucide-react";
import type { Profile } from "../types/database";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  team?: { id: string; name: string; color: string | null } | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL;

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  teacher: "bg-blue-100 text-blue-700 border-blue-200",
  viewer: "bg-gray-100 text-gray-600 border-gray-200",
};

const TEAM_COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
  yellow: "bg-yellow-500",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarGradient(id: string) {
  const gradients = [
    "from-purple-400 to-purple-600",
    "from-blue-400 to-blue-600",
    "from-emerald-400 to-emerald-600",
    "from-rose-400 to-rose-600",
    "from-amber-400 to-amber-600",
    "from-teal-400 to-teal-600",
  ];
  const index = id.charCodeAt(0) % gradients.length;
  return gradients[index];
}

// ─── Edit Dialog ───────────────────────────────────────────────────────────────

function EditTeacherDialog({
  teacher,
  onUpdated,
}: {
  teacher: Teacher;
  onUpdated: (t: Teacher) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: teacher.full_name,
    phone: teacher.phone ?? "",
    role: teacher.role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/teachers/${teacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur serveur");
        return;
      }
      const updated = await res.json();
      onUpdated({ ...teacher, ...updated });
      setOpen(false);
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setOpen(true)}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nom complet</Label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, full_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+32 470 00 00 00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement…" : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Teacher Card ──────────────────────────────────────────────────────────────

function TeacherCard({
  teacher,
  onUpdated,
}: {
  teacher: Teacher;
  onUpdated: (t: Teacher) => void;
}) {
  const gradient = getAvatarGradient(teacher.id);
  const teamColorBg = teacher.team?.color
    ? (TEAM_COLOR_MAP[teacher.team.color] ?? "bg-gray-400")
    : null;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 text-white font-bold text-sm`}
          >
            {getInitials(teacher.full_name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="font-semibold text-sm truncate">
                {teacher.full_name}
              </p>
              <EditTeacherDialog teacher={teacher} onUpdated={onUpdated} />
            </div>

            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge
                variant="outline"
                className={`text-xs ${ROLE_COLORS[teacher.role] ?? ""}`}
              >
                {teacher.role}
              </Badge>
              {teacher.team && (
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${teamColorBg}`} />
                  <span className="text-xs text-muted-foreground">
                    {teacher.team.name}
                  </span>
                </div>
              )}
              {!teacher.team && (
                <span className="text-xs text-muted-foreground italic">
                  Sans équipe
                </span>
              )}
            </div>

            <div className="mt-2 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{teacher.email}</span>
              </div>
              {teacher.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>{teacher.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Teacher Invitation Dialog ───────────────────────────────────────────────────────────────
function InviteTeacherDialog({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "teacher",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/teachers/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur serveur");
        return;
      }

      toast.success("Invitation envoyée !", {
        description: `Un email a été envoyé à ${form.email}`,
      });
      setOpen(false);
      setForm({ email: "", full_name: "", role: "teacher" });
      onInvited();
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Inviter un professeur
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Inviter un professeur</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Un email d&apos;invitation sera envoyé. Le lien expire après{" "}
            <strong>1h</strong>.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nom complet</Label>
              <Input
                placeholder="Jean Dupont"
                value={form.full_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, full_name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="jean.dupont@church.be"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Envoi…" : "Envoyer l'invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface TeachersProps {
  profile: Profile;
}

export default function Teachers({ profile: _profile }: TeachersProps) {
  void _profile;
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/teachers`);
      if (!res.ok) throw new Error("Erreur chargement");
      setTeachers(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  function handleUpdated(updated: Teacher) {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
    );
  }

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.full_name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.team?.name.toLowerCase().includes(q);
    const matchRole = filterRole === "all" || t.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCount = (role: string) =>
    teachers.filter((t) => t.role === role).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Professeurs</h1>
          <p className="text-muted-foreground">
            {teachers.length} membre{teachers.length !== 1 ? "s" : ""}{" "}
            enregistré{teachers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <InviteTeacherDialog onInvited={fetchTeachers} />
      </div>
      {/* Role filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "all", label: `Tous (${teachers.length})` },
          { value: "admin", label: `Admins (${roleCount("admin")})` },
          { value: "teacher", label: `Teachers (${roleCount("teacher")})` },
          { value: "viewer", label: `Viewers (${roleCount("viewer")})` },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterRole(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filterRole === f.value
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un professeur…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Impossible de charger les professeurs</p>
            <p className="text-sm mt-1">{error}</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun résultat</p>
            {(search || filterRole !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterRole("all");
                }}
                className="text-sm underline mt-1"
              >
                Réinitialiser les filtres
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <TeacherCard key={t.id} teacher={t} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
