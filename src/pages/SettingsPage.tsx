import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, User, Upload, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user!.id);
    setSaving(false);
    if (error) {
      addNotification({ title: 'Update failed', message: error.message, type: 'error' });
    } else {
      await refreshProfile();
      addNotification({ title: 'Profile updated', message: 'Your profile has been saved.', type: 'success' });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addNotification({ title: 'Invalid file', message: 'Please upload an image file.', type: 'error' });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      addNotification({ title: 'Upload failed', message: upErr.message, type: 'error' });
      setUploadingAvatar(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    const { error: profErr } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user!.id);
    setUploadingAvatar(false);
    if (profErr) {
      addNotification({ title: 'Update failed', message: profErr.message, type: 'error' });
    } else {
      await refreshProfile();
      addNotification({ title: 'Avatar updated', message: 'Your profile photo has been updated.', type: 'success' });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = (profile?.full_name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your profile, appearance, and account preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
                  {initials}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 text-primary-600 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                )}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile?.full_name}</p>
              <p className="text-xs text-gray-400">Click the icon to upload a new photo</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</span>
                <Check className="h-4 w-4 text-success-600 ml-auto" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed in this demo.</p>
            </div>
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Moon className="h-5 w-5 text-gray-600" /> : <Sun className="h-5 w-5 text-amber-400" />}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                </p>
                <p className="text-xs text-gray-400">Toggle between light and dark themes</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardBody>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
