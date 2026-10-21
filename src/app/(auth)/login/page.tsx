'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'direction' | 'enseignant' | 'parent'>('direction');
  const [email, setEmail] = useState('direction@lafortune.cd');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const founderName = process.env.NEXT_PUBLIC_FOUNDER_NAME || '';
  const founderTitle = process.env.NEXT_PUBLIC_FOUNDER_TITLE || '';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Identifiants invalides');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleQrLogin = () => {
    // TODO: Implement QR badge login for SURVEILLANT role
    console.log('QR login attempt');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Hero Section */}
      <div className="hero relative overflow-hidden flex flex-col justify-between gap-7 p-11 lg:p-[44px_52px] text-white">
        <div className="absolute -right-[90px] -top-[90px] w-[300px] h-[300px] rounded-full border-[48px] border-[rgba(255,201,40,0.12)]" />
        
        <div className="brand relative flex items-center gap-3.5">
          <div className="w-[58px] h-[58px] rounded-[14px] bg-white p-[3px]">
            <Image
              src="/assets/logo-csf.jpeg"
              alt="CSF Logo"
              width={58}
              height={58}
              className="object-contain"
            />
          </div>
          <div>
            <b className="block text-[17px] tracking-[0.2px]">CSF Présence</b>
            <span className="text-[12px] opacity-70">Complexe Scolaire La Fortune</span>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-[clamp(30px,3.6vw,46px)] leading-[1.1] font-extrabold tracking-[-1px]">
            La présence, <em className="not-italic text-[var(--yel)]">scannée</em>
            <br />
            en une seconde.
          </h1>
          <p className="lead mt-3.5 opacity-78 max-w-[460px] leading-[1.6] text-[15px] relative">
            Chaque élève possède un QR code personnel. Un scan à l'entrée, et les parents, les enseignants et la direction sont informés en temps réel.
          </p>
          <div className="feats flex gap-2.5 flex-wrap mt-5.5 relative">
            <span className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.16)] px-3 py-1.5 rounded-[99px] text-[12.5px] font-semibold">
              ⚡ Scan instantané
            </span>
            <span className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.16)] px-3 py-1.5 rounded-[99px] text-[12.5px] font-semibold">
              🔔 Alertes parents
            </span>
            <span className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.16)] px-3 py-1.5 rounded-[99px] text-[12.5px] font-semibold">
              📊 Rapports automatiques
            </span>
          </div>
        </div>

        <div className="founder relative flex items-center gap-4 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] backdrop-blur-[8px] rounded-[20px] p-3.5 max-w-[440px]">
          <Image
            src="/assets/founder-photo.jpeg"
            alt="Précurseur de l'idée"
            width={84}
            height={104}
            className="w-[84px] h-[104px] rounded-[14px] object-cover object-[50%_14%] border-2 border-[var(--yel)] flex-none"
          />
          <div>
            <small className="text-[var(--yel)] text-[11px] font-bold tracking-[1.4px] uppercase">
              Précurseur de l'idée
            </small>
            {founderName && <b className="block text-[16px] my-1">{founderName}</b>}
            {founderTitle && <p className="text-[12.5px] opacity-75 leading-[1.5]">{founderTitle}</p>}
            {!founderName && !founderTitle && (
              <p className="text-[12.5px] opacity-75 leading-[1.5]">
                À l'origine de la vision : digitaliser le suivi de présence pour une école plus moderne et transparente.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="formside grid place-items-center p-9 bg-[var(--bg)]">
        <form className="box w-full max-w-[400px]" onSubmit={handleLogin}>
          <h2 className="text-[28px] font-extrabold tracking-[-0.6px]">Bon retour 👋</h2>
          <p className="sub text-[var(--mut)] my-1.5 mb-6.5 text-[14.5px]">
            Connectez-vous pour accéder à votre espace.
          </p>

          {error && (
            <div className="bg-[rgba(215,38,30,0.1)] border border-[var(--red)] text-[var(--red)] p-3 rounded-[12px] mb-5 text-[13px]">
              {error}
            </div>
          )}

          <div className="seg grid grid-cols-3 bg-[var(--line)] rounded-[12px] p-1 mb-5">
            <button
              type="button"
              className={`border-0 bg-none p-2 px-1 rounded-[9px] font-semibold text-[13px] cursor-pointer transition-all ${
                selectedRole === 'direction'
                  ? 'bg-[var(--card)] text-[var(--ink)] shadow-[0_1px_4px_rgba(10,20,50,0.12)]'
                  : 'text-[var(--mut)]'
              }`}
              onClick={() => setSelectedRole('direction')}
            >
              Direction
            </button>
            <button
              type="button"
              className={`border-0 bg-none p-2 px-1 rounded-[9px] font-semibold text-[13px] cursor-pointer transition-all ${
                selectedRole === 'enseignant'
                  ? 'bg-[var(--card)] text-[var(--ink)] shadow-[0_1px_4px_rgba(10,20,50,0.12)]'
                  : 'text-[var(--mut)]'
              }`}
              onClick={() => setSelectedRole('enseignant')}
            >
              Enseignant
            </button>
            <button
              type="button"
              className={`border-0 bg-none p-2 px-1 rounded-[9px] font-semibold text-[13px] cursor-pointer transition-all ${
                selectedRole === 'parent'
                  ? 'bg-[var(--card)] text-[var(--ink)] shadow-[0_1px_4px_rgba(10,20,50,0.12)]'
                  : 'text-[var(--mut)]'
              }`}
              onClick={() => setSelectedRole('parent')}
            >
              Parent
            </button>
          </div>

          <label htmlFor="em" className="block text-[12.5px] font-bold my-3.5 mb-1.5">
            Adresse e-mail
          </label>
          <input
            id="em"
            type="email"
            className="inp w-full p-3.5 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 transition-all focus:border-[var(--blue)] focus:shadow-[0_0_0_4px_rgba(31,95,191,0.15)]"
            placeholder="nom@lafortune.cd"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="pw" className="block text-[12.5px] font-bold my-3.5 mb-1.5">
            Mot de passe
          </label>
          <input
            id="pw"
            type="password"
            className="inp w-full p-3.5 rounded-[12px] border-[1.5px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-0 transition-all focus:border-[var(--blue)] focus:shadow-[0_0_0_4px_rgba(31,95,191,0.15)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="row flex justify-between items-center my-3.5 mb-5.5 text-[13px] text-[var(--mut)]">
            <label className="m-0 font-medium flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Rester connecté
            </label>
            <a href="#" className="text-[var(--blue)] font-semibold no-underline">
              Mot de passe oublié ?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn w-full border-0 rounded-[12px] p-3.5 font-bold text-[15px] cursor-pointer bg-gradient-to-br from-[var(--red)] to-[#b81a14] text-white shadow-[0_8px_20px_rgba(215,38,30,0.28)] transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <button
            type="button"
            className="btn ghost w-full border-0 rounded-[12px] p-3.5 font-bold text-[15px] cursor-pointer bg-[var(--card)] text-[var(--ink)] border-[1.5px] border-[var(--line)] shadow-none mt-2.5 transition-all hover:-translate-y-px"
            onClick={handleQrLogin}
          >
            ▣ Se connecter avec mon badge QR
          </button>

          <div className="foot mt-6.5 text-center text-[12px] text-[var(--mut)]">
            Maquette de démonstration · Av. Sep-Congo N°12865, Masina/Petro-Congo
          </div>
        </form>
      </div>
    </div>
  );
}
