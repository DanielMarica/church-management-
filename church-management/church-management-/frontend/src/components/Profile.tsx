import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/src/types/database";
import { toast } from "sonner";
import { Camera, Save, User } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";

interface ProfileProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

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

export default function ProfilePage({
  profile,
  onProfileUpdate,
}: ProfileProps) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [team, setTeam] = useState<{ id: string; name: string; color: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teachers/profile/${profile.id}`)
      .then((response) => response.json())
      .then((data) => setTeam(data.team ?? null))
      .catch(console.error);
  }, [profile.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifie le type et la taille
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier invalide", {
        description: "Sélectionnez une image",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Fichier trop lourd", { description: "Maximum 2MB" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.id}.${fileExt}`;

      // Upload dans Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("picture-profile") // ← ici
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Récupère l'URL publique
      const { data } = supabase.storage
        .from("picture-profile")
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      toast.success("Photo uploadée !");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur upload";
      toast.error("Erreur", { description: message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;

      onProfileUpdate(data);
      toast.success("Profil mis à jour !");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Erreur", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "teacher":
        return "bg-blue-100 text-blue-700";
      case "parent":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Avatar + Role */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-2xl font-bold">
                  {fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Input file caché */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-900">{fullName}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(profile.role)}`}
                >
                  {profile.role}
                </span>
                {team ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    <div className={`w-2 h-2 rounded-full ${TEAM_COLOR_MAP[team.color ?? ""] ?? "bg-gray-400"}`} />
                    {team.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 italic">
                    Sans équipe
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom complet"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={profile.email}
              disabled
              className="bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">
              L&apos;email ne peut pas être modifié
            </p>
          </div>

          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+32 XXX XX XX XX"
            />
          </div>

          <div className="space-y-2">
            <Label>Rôle</Label>
            <Input
              value={profile.role}
              disabled
              className="bg-gray-50 text-gray-500 cursor-not-allowed capitalize"
            />
            <p className="text-xs text-gray-400">
              Le rôle est attribué par un administrateur
            </p>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info compte */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Membre depuis</span>
            <span>
              {new Date(profile.created_at).toLocaleDateString("fr-BE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>Dernière mise à jour</span>
            <span>
              {new Date(profile.updated_at).toLocaleDateString("fr-BE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
