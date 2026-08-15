import { useEffect, useState } from 'react';
import {
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  type LucideIcon,
  Check,
  Loader2,
  Share2,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { PLATFORMS, type Platform, type SocialAccount } from '@/lib/types';
import { DEMO_ACCOUNTS } from '@/lib/constants';

const iconMap: Record<Platform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
};

export function SocialAccountsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [connectStep, setConnectStep] = useState(0);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('social_accounts').select('*').order('created_at', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setAccounts(data as SocialAccount[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleConnect = async (platform: Platform) => {
    setConnecting(platform);
    setConnectStep(0);

    // Simulate connection steps
    const steps = [0, 1, 2];
    for (const step of steps) {
      setConnectStep(step);
      await new Promise((r) => setTimeout(r, 800));
    }

    const demo = DEMO_ACCOUNTS[platform];
    const { data, error } = await supabase
      .from('social_accounts')
      .insert({
        user_id: user!.id,
        platform,
        account_name: demo.name,
        account_username: demo.username,
        status: 'connected',
      })
      .select('*')
      .single();

    if (error) {
      setError(error.message);
    } else {
      setAccounts((prev) => [...prev, data as SocialAccount]);
      addNotification({
        title: 'Account connected',
        message: `${PLATFORMS.find((p) => p.id === platform)?.name} has been connected successfully.`,
        type: 'success',
      });
    }
    setConnecting(null);
    setConnectStep(0);
  };

  const handleDisconnect = async (account: SocialAccount) => {
    const { error } = await supabase.from('social_accounts').delete().eq('id', account.id);
    if (error) {
      setError(error.message);
    } else {
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      addNotification({
        title: 'Account disconnected',
        message: `${PLATFORMS.find((p) => p.id === account.platform)?.name} has been disconnected.`,
        type: 'info',
      });
    }
  };

  const connectStepsText = [
    'Authenticating...',
    'Fetching account details...',
    'Connection established!',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Social Accounts</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Connect your social media accounts to publish content across platforms.
        </p>
      </div>

      <div className="rounded-xl bg-primary-50 dark:bg-primary-600/10 border border-primary-100 dark:border-primary-600/20 p-4 flex items-start gap-3">
        <Zap className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-primary-700 dark:text-primary-400">Demo Mode</p>
          <p className="text-sm text-primary-600/80 dark:text-primary-400/70 mt-0.5">
            Account connections are simulated. No real social media APIs are used and no passwords are ever requested.
          </p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadAccounts} />}

      <div className="grid sm:grid-cols-2 gap-4">
        {PLATFORMS.map((p) => {
          const account = accounts.find((a) => a.platform === p.id);
          const Icon = iconMap[p.id];
          return (
            <Card key={p.id} hover>
              <CardBody className="flex items-center gap-4">
                <div
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: `${p.color}15` }}
                >
                  <Icon style={{ color: p.color }} className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-50">{p.name}</p>
                  {account ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      @{account.account_username ?? account.account_name}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Not connected</p>
                  )}
                </div>
                {account ? (
                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-success-100 text-success-700 dark:bg-success-600/15 dark:text-success-500">
                      <Check className="h-3 w-3" /> Connected
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect(account)}
                      className="text-error-600 hover:bg-error-50 dark:hover:bg-error-600/10"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => handleConnect(p.id)}>
                    Connect
                  </Button>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Connection Modal */}
      <Modal open={connecting !== null} onClose={() => {}} title="Connecting Account">
        <div className="py-6 flex flex-col items-center gap-6">
          {connecting && (
            <>
              <div
                className="p-4 rounded-2xl animate-pulse-soft"
                style={{ backgroundColor: `${PLATFORMS.find((p) => p.id === connecting)?.color}15` }}
              >
                {(() => {
                  const Icon = iconMap[connecting];
                  return <Icon style={{ color: PLATFORMS.find((p) => p.id === connecting)?.color }} className="h-10 w-10" />;
                })()}
              </div>
              <div className="w-full space-y-3">
                {connectStepsText.map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {i < connectStep ? (
                      <Check className="h-5 w-5 text-success-600 flex-shrink-0" />
                    ) : i === connectStep ? (
                      <Loader2 className="h-5 w-5 text-primary-600 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-200 dark:border-gray-700 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        i <= connectStep
                          ? 'text-gray-900 dark:text-gray-100 font-medium'
                          : 'text-gray-400'
                      }`}
                    >
                      {text}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center">
                This is a simulated connection for demo purposes. No real credentials are used.
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
