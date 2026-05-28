'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Users, ClipboardList, Calendar, DollarSign, Bell, BarChart2,
  ArrowRight, CheckCircle, ChevronRight, Shield, Zap, Globe,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Users,
    title: 'Xodimlar boshqaruvi',
    desc: 'Xodim qo\'shish, tahrirlash, faollashtirish va profillarni to\'liq boshqarish',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
  {
    icon: ClipboardList,
    title: 'Vazifalar tizimi',
    desc: 'Vazifa tayinlash, ustuvorlik belgilash va bajarish holatini real-time kuzatish',
    color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  },
  {
    icon: Calendar,
    title: 'Ish jadvali',
    desc: 'Haftalik jadval tuzish, smena turlarini belgilash va tarixni ko\'rish',
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  },
  {
    icon: DollarSign,
    title: 'Maosh hisoblash',
    desc: 'Oylik maosh, bonuslar va to\'lovlar holatini avtomatik kuzatish',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  },
  {
    icon: Bell,
    title: 'Bildirishnomalar',
    desc: 'Real-time xabarnomalar: yangi vazifa, jadval o\'zgarishi, to\'lov holati',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  },
  {
    icon: BarChart2,
    title: 'Analitika va hisobotlar',
    desc: 'Bo\'lim samaradorligi, vazifalar statistikasi va keng qamrovli hisobotlar',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  },
];

const ROLES = [
  {
    badge: '⭐',
    title: 'SuperAdmin',
    desc: 'Tizimni to\'liq boshqarish',
    items: [
      'Barcha xodimlarni boshqarish',
      'Barcha bo\'limlarni ko\'rish',
      'Maosh va to\'lovlar',
      'Audit log va xavfsizlik',
    ],
    from: 'from-blue-600',
    to: 'to-blue-800',
    border: 'border-blue-500/30',
  },
  {
    badge: '🔹',
    title: 'Admin',
    desc: 'Bo\'lim rahbari paneli',
    items: [
      'O\'z xodimlarini boshqarish',
      'Vazifa tayinlash va kuzatish',
      'Ish jadvali tuzish',
      'Bo\'lim bildirishnomalari',
    ],
    from: 'from-violet-600',
    to: 'to-violet-800',
    border: 'border-violet-500/30',
  },
  {
    badge: '👤',
    title: 'Xodim',
    desc: 'Shaxsiy panel',
    items: [
      'O\'z vazifalarini ko\'rish',
      'Jadvalini kuzatish',
      'Bildirishnomalar',
      'Profil tahrirlash',
    ],
    from: 'from-slate-600',
    to: 'to-slate-700',
    border: 'border-slate-500/30',
  },
];

const STATS = [
  { icon: Shield, value: '3', label: 'Rol tizimi', color: 'text-blue-400' },
  { icon: Zap, value: '10+', label: 'Funksiya', color: 'text-violet-400' },
  { icon: Globe, value: '24/7', label: 'Ishlaydi', color: 'text-cyan-400' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-blue-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white shadow flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="Uz24" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">Uz24 StaffFlow</span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow"
          >
            Tizimga kirish <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 min-h-[100svh] flex items-center bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-800/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-blue-200 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            O'zbekiston 24 Telekanali
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-2xl flex items-center justify-center p-2">
              <Image src="/logo.png" alt="O'zbekiston 24" width={80} height={80} className="object-contain" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            Xodimlar boshqaruv{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
              tizimi
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            O'zbekiston 24 telekanali xodimlari uchun zamonaviy HR platformasi.
            Vazifalar, jadvallar, maosh va bildirishnomalar — hammasi bir joyda.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-base px-8 py-3.5 rounded-2xl shadow-xl transition-all duration-200 hover:scale-105"
            >
              Tizimga kirish <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-base px-8 py-3.5 rounded-2xl backdrop-blur transition-all duration-200"
            >
              Ko'proq ma'lumot <ChevronRight size={18} />
            </a>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap justify-center gap-4">
            {STATS.map(({ icon: Icon, value, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 bg-white/10 backdrop-blur border border-white/15 rounded-2xl px-5 py-3"
              >
                <Icon size={18} className={color} />
                <span className="text-white font-bold text-lg">{value}</span>
                <span className="text-blue-300 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full text-white dark:text-slate-950">
            <path d="M0 60L1440 60L1440 20C1200 60 800 0 480 30C240 50 120 10 0 30L0 60Z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Imkoniyatlar
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Kerakli hamma narsa bir tizimda
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
              Zamonaviy HR jarayonlarini avtomatlashtirish uchun keng funksional platforma
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group bg-gray-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 sm:py-28 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Rol tizimi
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Har xodimga mos panel
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
              Tizimga kirgan zahoti, sizning rolingizga mos panel avtomatik ochiladi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ROLES.map(({ badge, title, desc, items, from, to, border }) => (
              <div
                key={title}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${from} ${to} border ${border} shadow-xl text-white`}
              >
                {/* Glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

                <div className="relative p-6">
                  <div className="text-4xl mb-3">{badge}</div>
                  <h3 className="text-xl font-bold mb-1">{title}</h3>
                  <p className="text-white/70 text-sm mb-5">{desc}</p>

                  <ul className="space-y-2.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle size={15} className="text-white/60 flex-shrink-0" />
                        <span className="text-white/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Hoziroq boshlang
          </h2>
          <p className="text-blue-200 text-lg mb-8">
            O'zbekiston 24 xodimi sifatida tizimga kiring va o'z jadval, vazifa va xabarlarini bir joyda ko'ring.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-base px-8 py-3.5 rounded-2xl shadow-xl transition-all duration-200 hover:scale-105"
          >
            Tizimga kirish <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white shadow flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="Uz24" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-white font-bold">Uz24 StaffFlow</span>
          </div>
          <p className="text-blue-400/60 text-sm text-center">
            © 2025 O'zbekiston 24. Barcha huquqlar himoyalangan.
          </p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            Tizimga kirish →
          </Link>
        </div>
      </footer>
    </div>
  );
}
