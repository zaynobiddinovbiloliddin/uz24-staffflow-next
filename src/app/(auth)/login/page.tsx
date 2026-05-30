'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [form,     setForm]     = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      username: form.username.trim(),
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Username yoki parol noto'g'ri");
      return;
    }

    toast.success('Xush kelibsiz! Muvaffaqiyatli kirildi', {
      position: 'top-center',
      duration: 3000,
    });
    await new Promise((r) => setTimeout(r, 500));
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8 fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-xl mb-4 p-2">
            <Image
              src="/logo.png"
              alt="O'zbekiston 24"
              width={80}
              height={80}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">O'zbekiston24</h1>
          <p className="text-blue-300 text-xs sm:text-sm mt-1">O'zbekiston 24 telekanali — Xodimlar tizimi</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden modal-enter">
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-5 sm:mb-6">
              Tizimga kirish
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="username"
                    required
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="input-base pl-10 text-base"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Parol
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                    className="input-base pl-10 pr-12 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showPass ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 slide-up">
                  <span className="text-red-500 text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Kirilmoqda...
                  </>
                ) : 'Kirish →'}
              </button>
            </form>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-blue-400/60 mt-4">
          © 2025 O'zbekiston 24. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
