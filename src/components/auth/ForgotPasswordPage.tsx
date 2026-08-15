import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset password</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter your email and we will send you a reset link
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-error-50 dark:bg-error-600/10 text-error-700 dark:text-error-400 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {sent ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center rounded-xl bg-success-50 dark:bg-success-600/10">
            <CheckCircle2 className="h-10 w-10 text-success-600" />
            <p className="text-sm text-success-700 dark:text-success-400">
              Reset link sent! Check your email inbox.
            </p>
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-[34px] h-4 w-4 text-gray-400 z-10" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
                label="Email"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Send reset link
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
