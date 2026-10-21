'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  userEmail: string;
  userRole: string;
}

export default function Sidebar({ userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="bg-[var(--navy)] text-white p-[22px_16px] flex flex-col gap-1.5 sticky top-0 h-screen">
      <div className="brand m-0 mx-1.5 mb-5.5 flex items-center gap-3.5">
        <div className="w-[42px] h-[42px] rounded-[10px] bg-white p-[3px]">
          <Image
            src="/assets/logo-csf-2.jpeg"
            alt="CSF Logo"
            width={42}
            height={42}
            className="object-contain"
          />
        </div>
      </div>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/dashboard')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/dashboard')}
      >
        <i className="not-italic w-5 text-center">▦</i>
        Tableau de bord
      </button>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/classes')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/classes')}
      >
        <i className="not-italic w-5 text-center">☰</i>
        Classes
      </button>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/eleves')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/eleves')}
      >
        <i className="not-italic w-5 text-center">👤</i>
        Élèves
      </button>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/parents')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/parents')}
      >
        <i className="not-italic w-5 text-center">👪</i>
        Parents
      </button>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/enseignants')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/enseignants')}
      >
        <i className="not-italic w-5 text-center">👨‍🏫</i>
        Enseignants
      </button>

      <div className="my-2 border-t border-[rgba(255,255,255,0.1)]"></div>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/calendrier')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/calendrier')}
      >
        <i className="not-italic w-5 text-center">📅</i>
        Calendrier
      </button>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/regles-horaires')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/regles-horaires')}
      >
        <i className="not-italic w-5 text-center">⏰</i>
        Règles horaires
      </button>

      <div className="my-2 border-t border-[rgba(255,255,255,0.1)]"></div>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/scan')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/scan')}
      >
        <i className="not-italic w-5 text-center">◎</i>
        Scanner
      </button>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/card')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/card')}
      >
        <i className="not-italic w-5 text-center">▣</i>
        Carte élève
      </button>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/presences')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/presences')}
      >
        <i className="not-italic w-5 text-center">✓</i>
        Présences
      </button>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/justificatifs')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/justificatifs')}
      >
        <i className="not-italic w-5 text-center">📄</i>
        Justificatifs
      </button>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/donnees-excel')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/donnees-excel')}
      >
        <i className="not-italic w-5 text-center">📊</i>
        Données Excel
      </button>

      <button
        className={`nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left transition-all ${
          isActive('/rapports')
            ? 'bg-[rgba(255,201,40,0.14)] text-[var(--yel)]'
            : 'text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)]'
        }`}
        onClick={() => router.push('/rapports')}
      >
        <i className="not-italic w-5 text-center">⎙</i>
        Rapports
      </button>

      <div className="me mt-auto flex gap-2.5 items-center p-3 bg-[rgba(255,255,255,0.07)] rounded-[14px] text-[13px]">
        <div className="av w-9 h-9 rounded-full bg-[var(--yel)] text-[var(--navy)] grid place-items-center font-extrabold">
          {userRole.charAt(0)}
        </div>
        <div>
          <b className="block capitalize">{userRole}</b>
          <small className="block opacity-60 text-[11px]">{userEmail}</small>
        </div>
      </div>

      <button
        className="nav flex items-center gap-3 p-2.5 px-3 rounded-[12px] font-semibold text-[14px] border-0 bg-none cursor-pointer text-left text-[#b8c4e0] hover:bg-[rgba(255,255,255,0.07)] transition-all"
        onClick={handleLogout}
      >
        <i className="not-italic w-5 text-center">↩</i>
        Déconnexion
      </button>
    </aside>
  );
}
