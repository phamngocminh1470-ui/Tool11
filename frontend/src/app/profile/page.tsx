"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { User, Lock, CheckCircle, ShieldAlert, Key, RefreshCw } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  
  // Profile Info States
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  const presetAvatars = [
    { name: "Neon Purple", url: "https://api.dicebear.com/7.x/bottts/svg?seed=purple" },
    { name: "Cyan Tech", url: "https://api.dicebear.com/7.x/bottts/svg?seed=cyan" },
    { name: "Sunset Gold", url: "https://api.dicebear.com/7.x/bottts/svg?seed=sunset" },
    { name: "Emerald Bio", url: "https://api.dicebear.com/7.x/bottts/svg?seed=emerald" }
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setProfileLoading(true);

    try {
      await api.updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl
      });
      updateUser({
        full_name: fullName,
        avatar_url: avatarUrl
      });
      setProfileSuccess("Cập nhật thông tin cá nhân thành công!");
    } catch (err: any) {
      setProfileError(err.message || "Cập nhật hồ sơ thất bại.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải từ 6 ký tự trở lên!");
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordSuccess("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Đổi mật khẩu thất bại. Mật khẩu hiện tại không khớp.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        {/* Header */}
        <div className="border-b border-slate-900 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
            <User className="h-8 w-8 text-purple-400" />
            Hồ sơ cá nhân
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Quản lý thông tin tài khoản, thay đổi ảnh đại diện và mật khẩu bảo mật của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Box 1: Profile Details & Avatar presets */}
          <div className="glass-panel rounded-2xl p-6 lg:p-8 shadow-xl border border-slate-850 space-y-6">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-3">
              <User className="h-5 w-5 text-purple-400" />
              Thông tin cá nhân
            </h2>

            {profileSuccess && (
              <div className="p-3.5 rounded-lg bg-green-950/20 border border-green-500/30 text-green-300 text-xs flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-green-400 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="TUAN ANH STUDIO"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-200 text-sm focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Địa chỉ Email (Không thể thay đổi)
                </label>
                <input
                  type="email"
                  readOnly
                  value={user?.email || ""}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-slate-850 text-slate-500 rounded-lg text-sm cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">
                  Ảnh đại diện (Avatar)
                </label>
                
                <div className="flex flex-wrap gap-4 items-center mb-4">
                  <div className="h-16 w-16 rounded-full border-2 border-purple-500 bg-slate-900 overflow-hidden flex items-center justify-center shadow-lg">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-slate-400">
                        {fullName.charAt(0) || "U"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-4 gap-2">
                    {presetAvatars.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        className={`p-1 bg-slate-900 rounded-lg border hover:border-purple-500/50 transition-colors flex items-center justify-center cursor-pointer ${
                          avatarUrl === preset.url ? "border-purple-500 bg-purple-500/5" : "border-slate-800"
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="h-9 w-9 rounded-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Nhập đường dẫn ảnh tùy chỉnh của bạn..."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-200 text-xs focus:outline-none font-mono placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {profileLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang lưu thay đổi...
                  </>
                ) : (
                  "Lưu thông tin"
                )}
              </button>
            </form>
          </div>

          {/* Box 2: Password Change Form */}
          <div className="glass-panel rounded-2xl p-6 lg:p-8 shadow-xl border border-slate-850 space-y-6">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-3">
              <Lock className="h-5 w-5 text-purple-400" />
              Đổi mật khẩu
            </h2>

            {passwordSuccess && (
              <div className="p-3.5 rounded-lg bg-green-950/20 border border-green-500/30 text-green-300 text-xs flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-green-400 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-505 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-200 text-sm focus:outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-200 text-sm focus:outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-200 text-sm focus:outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {passwordLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang thiết lập mật khẩu...
                  </>
                ) : (
                  "Đổi mật khẩu"
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
