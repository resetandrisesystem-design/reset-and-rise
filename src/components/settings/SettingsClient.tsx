"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Lock, Trash2, CheckCircle2, AlertCircle, Bell, Camera, X } from "lucide-react";

const AVATAR_CATEGORIES = {
  faces: {
    label: "Faces",
    emojis: ["👩", "👩🏻", "👩🏽", "👩🏾", "👩🏿", "👧", "👵", "👩‍🦱", "👩‍🦰", "👩‍🦳", "👩‍🦲", "🧕"],
  },
  animals: {
    label: "Animals",
    emojis: ["🦋", "🦢", "🦊", "🐰", "🐦", "🦄", "🐢", "🦚", "🐝", "🦩", "🐠", "🦌"],
  },
  nature: {
    label: "Nature",
    emojis: ["🌸", "🌿", "✨", "🌙", "☀️", "🌊", "🪷", "🕊️", "🌺", "🍃", "⭐", "🌷"],
  },
} as const;

type AvatarCategory = keyof typeof AVATAR_CATEGORIES;

const TIMEZONES = [
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Australia/Sydney",
];

interface Props {
  userId: string;
  initialName: string;
  initialEmail: string;
  initialTimezone: string;
  initialMotivation: string;
  initialAvatarUrl: string | null;
}

export default function SettingsClient({
  userId,
  initialName,
  initialEmail,
  initialTimezone,
  initialMotivation,
  initialAvatarUrl,
}: Props) {
  const supabase = createClient();

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeAvatarTab, setActiveAvatarTab] = useState<AvatarCategory>("faces");

  // Profile state
  const [fullName, setFullName]           = useState(initialName);
  const [timezone, setTimezone]           = useState(initialTimezone || "Europe/London");
  const [motivation, setMotivation]       = useState(initialMotivation);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved]   = useState(false);
  const [profileError, setProfileError]   = useState("");

  // Password state
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [passwordSaving, setPasswordSaving]     = useState(false);
  const [passwordMsg, setPasswordMsg]           = useState("");
  const [passwordError, setPasswordError]       = useState("");

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting]           = useState(false);

  // Save profile
  async function saveProfile() {
    setProfileSaving(true);
    setProfileError("");
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name:        fullName,
        timezone:         timezone,
        motivation_text:  motivation,
      })
      .eq("id", userId);

    if (error) {
      setProfileError("Failed to save. Please try again.");
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
    setProfileSaving(false);
  }

  // Upload photo from camera or device
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileError("");

    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setProfileError("Failed to upload photo. Please try again.");
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (!updateError) {
      setAvatarUrl(publicUrl);
      setShowAvatarPicker(false);
    } else {
      setProfileError("Photo uploaded but failed to save. Please try again.");
    }
    setUploadingAvatar(false);
  }

  // Select a preset emoji avatar
  async function selectPresetAvatar(emoji: string) {
    setUploadingAvatar(true);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: `emoji:${emoji}` })
      .eq("id", userId);

    if (!error) {
      setAvatarUrl(`emoji:${emoji}`);
      setShowAvatarPicker(false);
    }
    setUploadingAvatar(false);
  }

  async function removeAvatar() {
    setUploadingAvatar(true);
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    setAvatarUrl(null);
    setShowAvatarPicker(false);
    setUploadingAvatar(false);
  }

  // Change password
  async function changePassword() {
    setPasswordError("");
    setPasswordMsg("");

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMsg("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  }

  // Delete account
  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="section-title mb-0">Settings</h2>
        <p className="text-navy-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* ── Profile Section ── */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-gold-400/20 flex items-center justify-center">
            <User size={16} className="text-gold-400" />
          </div>
          <div>
            <p className="text-navy-500 font-medium text-sm">Profile Details</p>
            <p className="text-navy-400 text-xs">Update your name and preferences</p>
          </div>
        </div>

        {/* Avatar picker */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-ivory-200">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gold-400/15 border-2 border-gold-300 flex items-center justify-center overflow-hidden text-3xl">
              {avatarUrl?.startsWith("emoji:")
                ? <span>{avatarUrl.replace("emoji:", "")}</span>
                : avatarUrl
                  ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-gold-400 font-serif text-2xl">{fullName?.[0]?.toUpperCase() || "?"}</span>
              }
            </div>
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-navy-500 border-2 border-white flex items-center justify-center hover:bg-navy-400 transition-colors"
            >
              <Camera size={12} className="text-gold-400" />
            </button>
          </div>
          <div>
            <p className="text-sm text-navy-500 font-medium">Profile picture</p>
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="text-xs text-gold-500 hover:text-gold-600 font-medium"
            >
              Change photo or avatar
            </button>
          </div>
        </div>

        {/* Avatar picker modal */}
        {showAvatarPicker && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAvatarPicker(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl text-navy-500 font-medium">Profile Picture</h3>
                <button onClick={() => setShowAvatarPicker(false)} className="text-navy-300 hover:text-navy-500">
                  <X size={18} />
                </button>
              </div>

              {/* Camera / upload */}
              <label className="btn-primary w-full flex items-center justify-center gap-2 mb-4 cursor-pointer">
                <Camera size={14} />
                {uploadingAvatar ? "Uploading…" : "Take photo or upload"}
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingAvatar}
                />
              </label>

              <p className="text-xs text-navy-400 text-center mb-3">— or choose an avatar —</p>

              {/* Category tabs */}
              <div className="flex gap-1 bg-ivory-200 rounded-xl p-1 mb-3">
                {(Object.keys(AVATAR_CATEGORIES) as AvatarCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveAvatarTab(cat)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeAvatarTab === cat
                        ? "bg-white text-navy-500 shadow-sm"
                        : "text-navy-400 hover:text-navy-500"
                    }`}
                  >
                    {AVATAR_CATEGORIES[cat].label}
                  </button>
                ))}
              </div>

              {/* Preset avatars — active category */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {AVATAR_CATEGORIES[activeAvatarTab].emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => selectPresetAvatar(emoji)}
                    disabled={uploadingAvatar}
                    className="text-2xl bg-ivory-100 hover:bg-gold-50 border border-ivory-200 hover:border-gold-300 rounded-xl py-2.5 transition-all disabled:opacity-50"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {avatarUrl && (
                <button
                  onClick={removeAvatar}
                  disabled={uploadingAvatar}
                  className="text-xs text-red-400 hover:text-red-500 w-full text-center"
                >
                  Remove current picture
                </button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Email (read only) */}
          <div>
            <label className="label">Email Address</label>
            <input
              className="input bg-ivory-100 text-navy-400 cursor-not-allowed"
              value={initialEmail}
              readOnly
            />
            <p className="text-xs text-navy-300 mt-1 italic">Email cannot be changed</p>
          </div>

          {/* Timezone */}
          <div>
            <label className="label">Timezone</label>
            <select
              className="input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          {/* Motivational Message */}
          <div>
            <label className="label">Your Motivational Message ✦</label>
            <p className="text-xs text-navy-400 italic mb-2">
              This will greet you when you open the app. Make it yours.
            </p>
            <input
              className="input"
              placeholder='e.g. "Hey girl, one step closer to success!" or "No one is coming to save us."'
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={saveProfile}
            disabled={profileSaving}
            className="btn-primary disabled:opacity-50"
          >
            {profileSaving ? "Saving…" : "Save Changes"}
          </button>
          {profileSaved && (
            <span className="flex items-center gap-1.5 text-sm text-gold-600">
              <CheckCircle2 size={14} /> Saved successfully
            </span>
          )}
          {profileError && (
            <span className="flex items-center gap-1.5 text-sm text-red-500">
              <AlertCircle size={14} /> {profileError}
            </span>
          )}
        </div>
      </div>

      {/* ── Password Section ── */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-gold-400/20 flex items-center justify-center">
            <Lock size={16} className="text-gold-400" />
          </div>
          <div>
            <p className="text-navy-500 font-medium text-sm">Change Password</p>
            <p className="text-navy-400 text-xs">Keep your account secure</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={changePassword}
            disabled={passwordSaving}
            className="btn-primary disabled:opacity-50"
          >
            {passwordSaving ? "Updating…" : "Update Password"}
          </button>
          {passwordMsg && (
            <span className="flex items-center gap-1.5 text-sm text-gold-600">
              <CheckCircle2 size={14} /> {passwordMsg}
            </span>
          )}
          {passwordError && (
            <span className="flex items-center gap-1.5 text-sm text-red-500">
              <AlertCircle size={14} /> {passwordError}
            </span>
          )}
        </div>
      </div>

      {/* ── Notifications Section ── */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-gold-400/20 flex items-center justify-center">
            <Bell size={16} className="text-gold-400" />
          </div>
          <div>
            <p className="text-navy-500 font-medium text-sm">Preferences</p>
            <p className="text-navy-400 text-xs">Customise your experience</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: "Daily planning reminder",      sub: "Remind me to fill my daily planner"   },
            { label: "Weekly reflection prompt",     sub: "Nudge me to complete my weekly review" },
            { label: "Money check-in reminder",      sub: "Monthly budget review reminder"        },
          ].map(({ label, sub }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-ivory-200 last:border-0">
              <div>
                <p className="text-sm text-navy-500 font-medium">{label}</p>
                <p className="text-xs text-navy-400">{sub}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-10 h-5 bg-ivory-300 rounded-full peer peer-checked:bg-gold-400 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="card border-red-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-red-500 font-medium text-sm">Danger Zone</p>
            <p className="text-navy-400 text-xs">Permanent actions — cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-navy-400 mb-4">
          Deleting your account will permanently remove all your data including journal entries,
          planner data, and account information.
        </p>

        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <label className="label text-red-400">Type DELETE to confirm</label>
          <input
            className="input border-red-200 focus:border-red-400 focus:ring-red-400/30 mb-3"
            placeholder="DELETE"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <button
            onClick={deleteAccount}
            disabled={deleteConfirm !== "DELETE" || deleting}
            className="bg-red-500 text-white px-5 py-2.5 rounded-full text-sm font-medium
                       hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting…" : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
