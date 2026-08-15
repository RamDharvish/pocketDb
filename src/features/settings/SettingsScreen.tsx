import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { PocketDbLogo } from '../../components/ui/PocketDbLogo';
import {
  User,
  Edit3,
  Check,
  Download,
  Upload,
  ShieldCheck,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Terminal,
  Database,
  Lock,
  Cpu,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../constants';
import { CurrencyCode } from '../../types';
import {
  checkNotificationPermissions,
  requestNotificationPermissions,
  isNativePlatform,
  NotificationPermissionState,
} from '../../utils/notificationService';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    profile,
    updateUserProfile,
    exportData,
    importData,
    resetApp,
    accounts,
    transactions,
    transfers,
    adjustments,
  } = useAppStore();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editCurrency, setEditCurrency] = useState<CurrencyCode>(profile?.currency || 'INR');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState(false);

  const [permState, setPermState] = useState<NotificationPermissionState>({ granted: true, canRequest: false });
  const [permMessage, setPermMessage] = useState<string>('');

  useEffect(() => {
    checkNotificationPermissions().then((state) => {
      setPermState(state);
    });
  }, []);

  const handleToggleReminder = async (enabled: boolean) => {
    if (enabled && isNativePlatform()) {
      const state = await checkNotificationPermissions();
      if (!state.granted) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          setPermMessage('Notification permission denied. Please allow notifications in Android settings.');
          setPermState({ granted: false, canRequest: false });
          return;
        }
      }
    }
    setPermMessage('');
    await updateSettings({
      notifications: {
        enabled,
        reminderTime: settings.notifications.reminderTime || '20:00',
      },
    });
  };

  const handleTimeChange = async (newTime: string) => {
    await updateSettings({
      notifications: {
        enabled: settings.notifications.enabled,
        reminderTime: newTime,
      },
    });
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermissions();
    const state = await checkNotificationPermissions();
    setPermState(state);
    if (granted) {
      setPermMessage('Permission granted!');
      setTimeout(() => setPermMessage(''), 3000);
    } else {
      setPermMessage('Permission was denied. Please enable notifications in device settings.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;

    await updateUserProfile(trimmed, editCurrency);
    setIsEditingProfile(false);
    setProfileSuccessMsg('Profile updated successfully!');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  const handleExport = async () => {
    const jsonStr = await exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PocketDB_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importData(content);
      if (success) {
        setImportError(false);
        setImportMessage('PocketDB backup data imported successfully!');
      } else {
        setImportError(true);
        setImportMessage('Failed to import backup. Please ensure the file is a valid PocketDB JSON schema.');
      }
      setTimeout(() => setImportMessage(''), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Brand Identity / About Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <PocketDbLogo size="lg" variant="icon-only" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-mono tracking-tight text-white">
                Pocket<span className="text-blue-400">DB</span>
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Your finances. Your device. Your database.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Private, local-first finance tracking built for developers.
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-2xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                {profile?.name || 'Developer Profile'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                Currency: {profile?.currencySymbol} ({profile?.currency}) • Local Ledger
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditName(profile?.name || '');
              setEditCurrency(profile?.currency || 'INR');
              setIsEditingProfile(!isEditingProfile);
            }}
            className="py-1.5 px-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold font-mono rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span>{isEditingProfile ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        {profileSuccessMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3 animate-in fade-in">
            <div>
              <label className="block text-xs font-mono font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Preferred Currency
              </label>
              <select
                value={editCurrency}
                onChange={(e) => setEditCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} — {curr.name} ({curr.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="py-2 px-3.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-mono font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold rounded-xl shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Database Developer Experience & Architecture Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-extrabold text-gray-900 dark:text-slate-200 uppercase tracking-wider font-mono">
              Database & Storage Specifications
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            LOCAL AIR-GAPPED
          </span>
        </div>

        {/* Structured Spec Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-gray-400 uppercase block">Storage</span>
            <span className="font-bold text-gray-800 dark:text-slate-200">Local Device</span>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-gray-400 uppercase block">Database</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">SQLite Engine</span>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-gray-400 uppercase block">Connectivity</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Offline-first</span>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-gray-400 uppercase block">Cloud Database</span>
            <span className="font-bold text-gray-500 dark:text-slate-400">None (Zero Sync)</span>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-gray-400 uppercase block">Ledger Math</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Integer Paiese</span>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-gray-400 uppercase block">Active Records</span>
            <span className="font-bold text-gray-800 dark:text-slate-200">
              {transactions.length + transfers.length} entries
            </span>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-[11px] text-gray-600 dark:text-slate-400 flex items-start gap-2.5 border border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-gray-900 dark:text-slate-200">Local Data Ownership</p>
            <p className="leading-relaxed text-gray-500 dark:text-slate-400">
              PocketDB stores your financial data locally on this device. No remote servers or third-party trackers are used.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Reminder Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">Daily Reminder</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                Local notification to log daily ledger entries
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications.enabled}
              onChange={(e) => handleToggleReminder(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {permMessage && (
          <div className="p-3 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{permMessage}</span>
          </div>
        )}

        {isNativePlatform() && !permState.granted && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 rounded-2xl flex items-center justify-between gap-2 text-xs text-red-700 dark:text-red-300">
            <span>Notification permission required on Android</span>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Allow
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Reminder Time</span>
          </div>

          <input
            type="time"
            value={settings.notifications.reminderTime || '20:00'}
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={!settings.notifications.enabled}
            className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-extrabold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 font-mono pt-1">
          <span>Schedule Status</span>
          <span className={`font-bold flex items-center gap-1 ${settings.notifications.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
            {settings.notifications.enabled ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active ({settings.notifications.reminderTime || '20:00'})</span>
              </>
            ) : (
              <span>Disabled</span>
            )}
          </span>
        </div>
      </div>

      {/* JSON Backup & Migration */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-extrabold text-gray-900 dark:text-slate-200 uppercase tracking-wider font-mono">
            Data Portability & JSON Backup
          </h3>
        </div>

        {importMessage && (
          <div className={`p-3 text-xs rounded-xl font-mono flex items-center gap-2 ${
            importError
              ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}>
            <Info className="w-4 h-4 shrink-0" />
            <span>{importMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Export JSON</span>
          </button>

          <label className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>Restore JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-rose-100 dark:border-rose-950/60 shadow-2xs space-y-3">
        <h3 className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono">
          Danger Zone
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
          Resetting will permanently wipe all local accounts, transactions, and categories from your device's SQLite database.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to permanently reset PocketDB? All local ledger data will be wiped.')) {
              resetApp();
            }
          }}
          className="w-full py-2.5 px-4 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold rounded-xl border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
        >
          Purge Local SQLite Database
        </button>
      </div>
    </div>
  );
};
