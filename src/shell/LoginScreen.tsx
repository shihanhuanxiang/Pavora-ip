import React, { useState } from 'react';
import { useAuth } from '../shared/context/AuthContext';

// E4b：強制登入閘的登入頁。僅在 VITE_REQUIRE_LOGIN=true 且未登入時顯示（見 App.tsx）。
// 風格延續 App.tsx 的 RouteTransitionFallback／glass-panel 慣例：黑底、PAVORA 標題、細金線 pulse。
const LoginScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      // 成功後 onAuthStateChanged 會自動更新 user，App.tsx 的閘會自然放行，無需手動導頁。
    } catch (e) {
      console.error('LoginScreen: signInWithGoogle failed', e);
      setErrorMessage('登入失敗，請重試。若問題持續，請聯繫管理員。');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--color-bg-deep)] text-[var(--color-text-main)] animate-fade-in px-6">
      <span className="text-sm font-display font-bold uppercase tracking-[0.6em] text-[var(--color-text-main)]">
        PAVORA
      </span>
      <div className="mt-6 h-px w-24 overflow-hidden bg-white/10">
        <div className={`h-full w-1/3 bg-[var(--color-gold)] ${isSigningIn ? 'animate-pulse' : ''}`} />
      </div>

      <div className="glass-panel rounded-3xl p-10 mt-12 w-full max-w-sm flex flex-col items-center text-center border border-[var(--color-border)]">
        <h1 className="text-lg font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)] mb-3">
          歡迎回來
        </h1>
        <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-8">
          請登入以繼續使用 PAVORA。
        </p>

        <button
          onClick={handleLogin}
          disabled={isSigningIn}
          className="w-full px-6 py-3 rounded-xl bg-[var(--color-gold)] text-black text-[10px] font-black tracking-widest uppercase transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSigningIn ? '登入中…' : '使用 Google 登入'}
        </button>

        {errorMessage && (
          <p className="mt-6 text-[11px] text-red-400 leading-relaxed">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
