"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, User, ShieldCheck, Check, AlertCircle, BookOpen, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const {
    user,
    updateProfileLoading,
    updatePasswordLoading,
    updateProfile,
    updatePassword,
    updateAvatar,
  } = authUserStore();

  const [tab, setTab] = useState<"profile" | "security">("profile");

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

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
  const [middleInitial, setMiddleInitial] = useState(user?.middleInitial ?? "");
  const [lastname, setLastname] = useState(user?.lastname ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [contactNumber, setContactNumber] = useState(user?.contactNumber ?? "");
  const [addressLine, setAddressLine] = useState(user?.addressLine ?? "");
  const [barangay, setBarangay] = useState(user?.barangay ?? "");
  const [municipality, setMunicipality] = useState(user?.municipality ?? "");
  const [province, setProvince] = useState(user?.province ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const initials = `${(firstname[0] || "").toUpperCase()}${(lastname[0] || "").toUpperCase()}` || "—";

  // True only when at least one profile field differs from the last saved user data
  const hasProfileChanges =
    firstname !== (user?.firstname ?? "") ||
    middleInitial !== (user?.middleInitial ?? "") ||
    lastname !== (user?.lastname ?? "") ||
    gender !== (user?.gender ?? "") ||
    contactNumber !== (user?.contactNumber ?? "") ||
    addressLine !== (user?.addressLine ?? "") ||
    barangay !== (user?.barangay ?? "") ||
    municipality !== (user?.municipality ?? "") ||
    province !== (user?.province ?? "");

  // Auto-dismiss profile notices after a few seconds
  useEffect(() => {
    if (!profileSuccess) return;
    const timer = setTimeout(() => setProfileSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [profileSuccess]);

  useEffect(() => {
    if (!profileError) return;
    const timer = setTimeout(() => setProfileError(""), 4000);
    return () => clearTimeout(timer);
  }, [profileError]);

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

  const handleAvatarClick = () => {
    if (!avatarUploading) fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setAvatarError("");

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 5MB");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setAvatarUploading(true);

    const result = await updateAvatar(file);

    setAvatarUploading(false);
    URL.revokeObjectURL(localPreview);
    setAvatarPreview(null);

    if (!result?.success) {
      setAvatarError(result?.message || "Failed to upload photo");
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

    const result = await updateProfile({
      firstname,
      middleInitial,
      lastname,
      gender,
      contactNumber,
      addressLine,
      barangay,
      municipality,
      province,
    });

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

      <div className="max-w-5xl mx-auto px-4 py-14" style={{ fontFamily: "'Inter', sans-serif" }}>
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={avatarUploading}
            className="relative w-28 h-28 rounded-full mb-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ outlineColor: AMBER }}
            aria-label="Change profile photo"
          >
            {avatarPreview || user?.profile ? (
              <img
                src={avatarPreview || user?.profile}
                alt={`${firstname} ${lastname}`}
                className="w-28 h-28 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ background: NAVY }}
              >
                <span className="text-3xl font-bold" style={{ color: AMBER }}>
                  {initials}
                </span>
              </div>
            )}

            {/* Hover / uploading overlay */}
            <div
              className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/40 transition-opacity ${
                avatarUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {avatarUploading ? (
                <Loader2 size={22} className="text-white animate-spin" />
              ) : (
                <Camera size={22} className="text-white" />
              )}
            </div>
          </button>
          <h2 className="text-lg font-semibold text-slate-800">
            {firstname} {lastname}
          </h2>
          <p className="text-slate-500 text-sm mt-1">{user?.program}</p>
          {avatarError && <p className="text-xs text-red-600 mt-1">{avatarError}</p>}
        </div>

        {/* Segmented tabs, matches the nav pill treatment (amber = active) */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-100 rounded-full p-1 gap-1 cursor-pointer">
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
                  className="flex cursor-pointer items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors"
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
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px] gap-5">
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
                  <FieldLabel htmlFor="middleInitial">Middle Name</FieldLabel>
                  <Input
                    id="middleInitial"
                    className={fieldClass}
                    value={middleInitial}
                    onChange={(e) => setMiddleInitial(e.target.value.slice(0, 10))}
                    placeholder="M.I."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    className={fieldClass}
                    value={user?.email ?? ""}
                    disabled
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="gender">Gender</FieldLabel>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender" className={fieldClass}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="contactNumber">Contact number</FieldLabel>
                <Input
                  id="contactNumber"
                  className={fieldClass}
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 0917 123 4567"
                />
              </div>

              <div>
                <FieldLabel htmlFor="addressLine">Address (House #/Block/Street/Subdivision/Building)</FieldLabel>
                <Input
                  id="addressLine"
                  className={fieldClass}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. Blk 3 Lot 12, Sunrise St., Greenfield Subdivision"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <FieldLabel htmlFor="barangay">Barangay</FieldLabel>
                  <Input
                    id="barangay"
                    className={fieldClass}
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    placeholder="Barangay"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="municipality">Municipality/City</FieldLabel>
                  <Input
                    id="municipality"
                    className={fieldClass}
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    placeholder="Municipality or City"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="province">Province</FieldLabel>
                  <Input
                    id="province"
                    className={fieldClass}
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Province"
                  />
                </div>
              </div>

              <Notice tone="error">{profileError}</Notice>
              <Notice tone="success">{profileSuccess}</Notice>

              <div className="pt-2 flex justify-end border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={updateProfileLoading || !hasProfileChanges}
                  style={{ backgroundColor: AMBER, color: NAVY }}
                  className="mt-4 rounded-full p-5 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="mt-4 rounded-full p-5 font-semibold hover:opacity-90"
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