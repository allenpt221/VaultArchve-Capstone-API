"use client";

import { useState } from "react";
import { Eye, EyeOff, User, ShieldCheck, Check, AlertCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authUserStore } from "@/Stores/authStores";

const NAVY = "#0B1C33";
const AMBER = "#F5B400";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
    </Label>
  );
}

function Notice({ tone, children }: { tone: "error" | "success"; children?: string }) {
  if (!children) return null;
  const isError = tone === "error";
  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-sm ${
        isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {isError ? (
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
      ) : (
        <Check size={16} className="mt-0.5 shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}

// Shared field styling applied to shadcn Input/Textarea via className
const fieldClass =
  "rounded-lg border-slate-200 h-11 focus-visible:ring-2 focus-visible:ring-offset-0 " +
  "focus-visible:ring-[rgba(245,180,0,0.35)] focus-visible:border-[#F5B400]";

export default function SettingsPage() {
  const { user, updateProfileLoading, updatePasswordLoading, updateProfile, updatePassword } = authUserStore();

  const [tab, setTab] = useState<"profile" | "security">("profile");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Profile fields
  const [firstname, setFirstname] = useState(user?.firstname ?? "");
  const [lastname, setLastname] = useState(user?.lastname ?? "");
  const [familybackground, setFamilybackground] = useState(user?.familybackground ?? "");
  const [familycontact, setFamilycontact] = useState(user?.familycontact ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const initials = `${(firstname[0] || "").toUpperCase()}${(lastname[0] || "").toUpperCase()}` || "—";

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    const result = await updatePassword({ currentPassword, newPassword });
    if (result.success) {
      setPasswordSuccess(result.message ?? "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError(result.message ?? "Failed to update password");
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!firstname.trim() || !lastname.trim()) {
      setProfileError("First and last name are required");
      return;
    }

    const result = await updateProfile({ firstname, lastname, familybackground, familycontact });

    if (result.success) {
      setProfileSuccess(result.message ?? "Profile updated successfully");
    } else {
      setProfileError(result.message ?? "Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-14" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Eyebrow badge, matches the "Academic Digital Repository" pill */}
        <div className="flex justify-center mb-5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium"
            style={{ background: "rgba(245,180,0,0.12)", color: "#8A6400" }}
          >
            <BookOpen size={14} />
            Account settings
          </span>
        </div>

        {/* Header / identity */}
        <div className="flex flex-col items-center text-center mb-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: NAVY }}
          >
            <span className="text-lg font-bold" style={{ color: AMBER }}>
              {initials}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Manage your VaultArchve profile and password</p>
        </div>

        {/* Segmented tabs, matches the nav pill treatment (amber = active) */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-100 rounded-full p-1 gap-1">
            {(
              [
                { id: "profile", label: "Personal information", icon: User },
                { id: "security", label: "Password", icon: ShieldCheck },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors"
                  style={{
                    background: active ? AMBER : "transparent",
                    color: active ? NAVY : "#64748B",
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card body, matches Browse page result cards: white, rounded-xl, soft border */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          {tab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel htmlFor="firstname">First name</FieldLabel>
                  <Input
                    id="firstname"
                    className={fieldClass}
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="lastname">Last name</FieldLabel>
                  <Input
                    id="lastname"
                    className={fieldClass}
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="familybackground">Family background</FieldLabel>
                <Textarea
                  id="familybackground"
                  className={`${fieldClass} h-auto resize-none py-2.5`}
                  value={familybackground}
                  onChange={(e) => setFamilybackground(e.target.value)}
                  placeholder="Brief family background"
                  rows={4}
                />
              </div>

              <div>
                <FieldLabel htmlFor="familycontact">Family contact</FieldLabel>
                <Input
                  id="familycontact"
                  className={fieldClass}
                  value={familycontact}
                  onChange={(e) => setFamilycontact(e.target.value)}
                  placeholder="Phone number or email"
                />
              </div>

              <Notice tone="error">{profileError}</Notice>
              <Notice tone="success">{profileSuccess}</Notice>

              <div className="pt-2 flex justify-end border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={updateProfileLoading}
                  style={{ backgroundColor: AMBER, color: NAVY }}
                  className="mt-4 rounded-full px-6 font-semibold hover:opacity-90"
                >
                  {updateProfileLoading ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          )}

          {tab === "security" && (
            <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
              <div>
                <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    className={`${fieldClass} pr-10`}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel htmlFor="newPassword">New password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      className={`${fieldClass} pr-10`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
                </div>

                <div>
                  <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type={showNew ? "text" : "password"}
                    className={fieldClass}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Notice tone="error">{passwordError}</Notice>
              <Notice tone="success">{passwordSuccess}</Notice>

              <div className="pt-2 flex justify-end border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={updatePasswordLoading}
                  style={{ backgroundColor: AMBER, color: NAVY }}
                  className="mt-4 rounded-full px-6 font-semibold hover:opacity-90"
                >
                  {updatePasswordLoading ? "Updating..." : "Update password"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}