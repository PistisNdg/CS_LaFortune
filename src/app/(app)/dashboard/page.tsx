'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [date, setDate] = useState('');

  useEffect(() => {
    setDate(
      new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);

  const [stats, setStats] = useState({
    inscrits: 0,
    presents: 0,
    retards: 0,
    absents: 0,
  });
  const [recentScans, setRecentScans] = useState<
    { name: string; class: string; time: string; status: string }[]
  >([]);

  useEffect(() => {
    fetch('/api/dashboard/stats', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.recentScans) setRecentScans(data.recentScans);
      })
      .catch(() => {});
  }, []);

  const classes = [
    { name: 'Maternelle', percentage: stats.inscrits ? Math.min(100, Math.round((stats.presents / stats.inscrits) * 100)) : 0 },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('');
  };

  return (
    <div>
      <div className="top flex justify-between items-center gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="text-[25px] font-extrabold tracking-[-0.5px]">Tableau de bord</h2>
          <p className="text-[var(--mut)] text-[13.5px] mt-0.5">{date}</p>
        </div>
        <div className="pill bg-[var(--card)] border border-[var(--line)] p-2 px-4 rounded-[99px] text-[13px] font-semibold flex gap-2 items-center">
          <span className="dot w-2 h-2 rounded-full bg-[var(--ok)] shadow-[0_0_0_4px_rgba(18,161,80,0.18)]"></span>
          Scanner de l'entrée en ligne
        </div>
      </div>

      <div className="stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="stat bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-4.5">
          <span className="text-[var(--mut)] text-[12.5px] font-semibold">Élèves inscrits</span>
          <b className="block text-[30px] font-extrabold mt-1.5 tracking-[-1px]">{stats.inscrits}</b>
          <em className="not-italic text-[12px] font-semibold text-[var(--mut)]">Maternelle à 6e</em>
        </div>
        <div className="stat bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-4.5">
          <span className="text-[var(--mut)] text-[12.5px] font-semibold">Présents</span>
          <b className="block text-[30px] font-extrabold mt-1.5 tracking-[-1px]">{stats.presents}</b>
          <em className="not-italic text-[12px] font-semibold text-[var(--ok)]">
            {stats.inscrits
              ? Math.round((stats.presents / stats.inscrits) * 100)
              : 0}{' '}
            %
          </em>
        </div>
        <div className="stat bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-4.5">
          <span className="text-[var(--mut)] text-[12.5px] font-semibold">Retards</span>
          <b className="block text-[30px] font-extrabold mt-1.5 tracking-[-1px]">{stats.retards}</b>
          <em className="not-italic text-[12px] font-semibold text-[var(--warn)]">Après 7h30</em>
        </div>
        <div className="stat bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-4.5">
          <span className="text-[var(--mut)] text-[12.5px] font-semibold">Absents</span>
          <b className="block text-[30px] font-extrabold mt-1.5 tracking-[-1px]">{stats.absents}</b>
          <em className="not-italic text-[12px] font-semibold text-[var(--red)]">Parents alertés</em>
        </div>
      </div>

      <div className="g2 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-4">
        <div className="card bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-4.5">
          <h3 className="text-[15px] font-extrabold mb-3.5 flex justify-between items-center">
            Présence par classe
            <small className="text-[var(--mut)] font-semibold text-[12px]">Aujourd'hui</small>
          </h3>
          <div className="bars flex flex-col gap-3">
            {classes.map((cls) => (
              <div key={cls.name} className="bar grid grid-cols-[96px_1fr_44px] gap-2.5 items-center text-[13px] font-semibold">
                <span>{cls.name}</span>
                <div className="h-2.5 bg-[var(--line)] rounded-[9px] overflow-hidden">
                  <i className="block h-full rounded-[9px] bg-gradient-to-r from-[var(--blue)] to-[#4c8df0]" style={{ width: `${cls.percentage}%` }}></i>
                </div>
                <span className="text-right text-[var(--mut)]">{cls.percentage} %</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-4.5">
          <h3 className="text-[15px] font-extrabold mb-3.5 flex justify-between items-center">
            Derniers scans
            <small className="text-[var(--mut)] font-semibold text-[12px]">En direct</small>
          </h3>
          <div className="list flex flex-col gap-1 max-h-[330px] overflow-auto">
            {recentScans.map((scan, index) => (
              <div
                key={index}
                className="it flex items-center gap-3 p-2.5 rounded-[12px] animate-in"
                style={{ animation: 'in 0.4s ease-out' }}
              >
                <div className="av w-[38px] h-[38px] rounded-[12px] bg-[var(--bg)] grid place-items-center font-extrabold text-[13px] text-[var(--blue)] flex-none">
                  {getInitials(scan.name)}
                </div>
                <div>
                  <b className="block text-[13.5px]">{scan.name}</b>
                  <small className="text-[var(--mut)] text-[12px]">
                    {scan.class} · {scan.time}
                  </small>
                </div>
                <span
                  className={`tag ml-auto text-[11.5px] font-semibold p-1 px-2.5 rounded-[99px] whitespace-nowrap ${
                    scan.status === 'late'
                      ? 'bg-[rgba(224,138,0,0.16)] text-[var(--warn)]'
                      : 'bg-[rgba(18,161,80,0.14)] text-[var(--ok)]'
                  }`}
                >
                  {scan.status === 'late' ? 'En retard' : 'Présent'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
