'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type ScanFeedback = {
  tone: 'ok' | 'warn' | 'err' | 'idle';
  title: string;
  detail?: string;
};

export default function ScanPage() {
  const [feedback, setFeedback] = useState<ScanFeedback>({
    tone: 'idle',
    title: 'Prêt à scanner',
    detail: 'Placez le QR code dans le cadre',
  });
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);

  const handleScan = useCallback(async (qrPayload: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setFeedback({ tone: 'idle', title: 'Traitement…' });

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          qrPayload,
          appareilId: typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 120) : undefined,
        }),
      });
      const data = await res.json();

      if (data.resultat === 'SUCCES') {
        setFeedback({
          tone: data.statut === 'RETARD' ? 'warn' : 'ok',
          title: data.statut === 'RETARD' ? 'Retard enregistré' : 'Présent',
          detail: data.eleve?.nomComplet
            ? `${data.eleve.nomComplet} · ${data.eleve.classe}`
            : undefined,
        });
        if (navigator.vibrate) navigator.vibrate(80);
      } else if (data.resultat === 'DOUBLON') {
        setFeedback({
          tone: 'warn',
          title: 'Doublon',
          detail: data.message,
        });
      } else {
        setFeedback({
          tone: 'err',
          title: data.message || 'Scan refusé',
          detail: data.eleve?.nomComplet,
        });
      }
    } catch {
      setFeedback({ tone: 'err', title: 'Erreur réseau' });
    } finally {
      setTimeout(() => {
        busyRef.current = false;
      }, 1500);
    }
  }, []);

  useEffect(() => {
    const elementId = 'csf-qr-reader';
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    const start = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 260, height: 260 } },
          (decoded) => {
            void handleScan(decoded);
          },
          () => {}
        );
        setScanning(true);
      } catch (err) {
        console.error(err);
        setFeedback({
          tone: 'err',
          title: 'Caméra indisponible',
          detail: 'Autorisez l\'accès à la caméra ou utilisez HTTPS.',
        });
      }
    };

    void start();

    return () => {
      void scanner.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [handleScan]);

  const toneClass =
    feedback.tone === 'ok'
      ? 'bg-[rgba(18,161,80,0.12)] border-[var(--ok)]'
      : feedback.tone === 'warn'
        ? 'bg-[rgba(255,153,0,0.12)] border-[var(--warn)]'
        : feedback.tone === 'err'
          ? 'bg-[rgba(215,38,30,0.12)] border-[var(--red)]'
          : 'bg-[var(--card)] border-[var(--line)]';

  return (
    <div>
      <h2 className="text-[25px] font-extrabold tracking-[-0.5px] mb-1">Scanner</h2>
      <p className="text-[var(--mut)] text-[13.5px] mb-6">
        Scan à l&apos;entrée · fuseau Kinshasa · {scanning ? 'caméra active' : 'initialisation…'}
      </p>

      <div className={`rounded-[18px] border p-5 mb-5 ${toneClass}`}>
        <b className="block text-[18px]">{feedback.title}</b>
        {feedback.detail && (
          <p className="text-[14px] text-[var(--mut)] mt-1">{feedback.detail}</p>
        )}
      </div>

      <div className="relative max-w-[420px] mx-auto rounded-[22px] overflow-hidden border border-[var(--line)] bg-black">
        <div id="csf-qr-reader" className="w-full min-h-[320px]" />
        <div className="pointer-events-none absolute inset-0 border-[3px] border-[var(--yel)] rounded-[22px] opacity-80" />
      </div>
    </div>
  );
}
