import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, Eye, EyeOff, Check, User } from "lucide-react";

export default function Profile() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoadingAuth, user, navigateToLogin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [profilePublic, setProfilePublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    (async () => {
      try {
        const page = await base44.entities.Profile.filter(
          { userId: user.id },
          { limit: 1 }
        );
        const existing = (page.items || [])[0];
        if (existing) {
          setProfile(existing);
          setDisplayName(existing.displayName || user.full_name || "");
          setProfilePublic(existing.profilePublic === true);
        } else {
          // Opt-in by default: private until the user explicitly enables community sharing
          const created = await base44.entities.Profile.create({
            userId: user.id,
            displayName: user.full_name || "",
            profilePublic: false,
          });
          setProfile(created);
          setDisplayName(created.displayName || "");
          setProfilePublic(false);
        }
      } catch {
        /* non-critical */
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, user]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await base44.entities.Profile.update(profile.id, {
        displayName: displayName.trim() || user?.email || "Anonymous",
        profilePublic,
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      /* show error inline */
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <User className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-heading text-xl font-bold">
          {t("profileLoginNeeded") || "Sign in to manage your profile"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("profileLoginDesc") || "Log in to edit your display name and control your community visibility."}
        </p>
        <button
          onClick={navigateToLogin}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 font-semibold text-sm hover:opacity-95 transition-opacity"
        >
          <LogIn className="h-4 w-4" />
          {t("signInNav") || "Sign in"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bba-t bg-white text-[#111827] space-y-1.5">
        <span className="bba-sticker">
          <User className="h-3.5 w-3.5" />
          {t("profileNav") || "Profile"}
        </span>
        <h1 className="font-heading text-3xl font-black tracking-tight text-[#111827]">
          {t("profileTitle") || "Profile settings"}
        </h1>
        <p className="text-sm font-medium text-[#111827]/80">
          {t("profileSubtitle") || "Manage how you appear in the BudgetBite community."}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Display name */}
          <div className="bba-t bg-[#78a71b] p-5 space-y-3">
            <label className="block text-sm font-bold text-[#111827]">
              {t("profileDisplayName") || "Display name"}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user?.full_name || user?.email || "Your name"}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            />
            <p className="text-xs text-muted-foreground">
              {t("profileDisplayNameDesc") || "This name appears next to your shared plans in the community."}
            </p>
          </div>

          {/* Visibility toggle */}
          <div className="bba-t bg-[#FFB020] p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {profilePublic ? (
                    <Eye className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <h3 className="font-heading font-semibold text-sm text-foreground">
                    {t("profileVisibility") || "Community visibility"}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {profilePublic
                    ? (t("profileVisibilityOnDesc") || "Your saved meal plans and grocery lists are visible to other logged-in users in the community. Turn off to hide them.")
                    : (t("profileVisibilityOffDesc") || "Your plans are private. They won't appear in community browsing. Your saved plans remain available to you.")}
                </p>
              </div>
              <Switch
                checked={profilePublic}
                onCheckedChange={setProfilePublic}
                aria-label={t("profileVisibility") || "Community visibility"}
              />
            </div>
            <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl ${profilePublic ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {profilePublic ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  {t("profilePublic") || "Public — visible in community"}
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  {t("profilePrivate") || "Private — hidden from community"}
                </>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("saving") || "Saving..."}
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t("profileSaved") || "Saved!"}
                </>
              ) : (
                t("saveProfile") || "Save changes"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}