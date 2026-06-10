"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Lock, Trash2, CheckCircle2, AlertCircle, Bell } from "lucide-react";

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
}

export default function SettingsClient({
  userId,
  initialName,
  initialEmail,
  initialTimezone,
  initialMotivation,
}: Props) {
  const supabase = createClient();

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
