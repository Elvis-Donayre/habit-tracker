import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword } from '@/lib/helpers';
import { Activity, Eye, EyeOff } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Debes completar todos los campos');
      return;
    }
    setLoading(true);
    const result = await signIn(loginEmail, loginPassword);
    setLoading(false);
    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      setError(result.message ?? 'Error al iniciar sesión');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!signupName || !signupEmail || !signupPassword || !signupConfirm) {
      setError('Debes completar todos los campos');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!validateEmail(signupEmail)) {
      setError('Email inválido');
      return;
    }
    const pwdCheck = validatePassword(signupPassword);
    if (!pwdCheck.valid) {
      setError(pwdCheck.message);
      return;
    }
    setLoading(true);
    const result = await signUp(signupEmail, signupPassword, signupName);
    setLoading(false);
    if (result.success) {
      setSuccess('¡Cuenta creada! Revisa tu email para verificar tu cuenta.');
      setTab('login');
    } else {
      setError(result.message ?? 'Error al crear cuenta');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Subtle background accent */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-success) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-10" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center shadow-[var(--shadow-md)]">
              <Activity size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Habit Tracker</h1>
          </div>
          <p className="text-[var(--color-text-muted)] text-sm">
            Tu gestor inteligente de hábitos con cruces múltiples
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b border-[var(--color-border)] mb-8"
          style={{ animation: 'fadeIn 0.4s ease-out 50ms both' }}
        >
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {t === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {/* Error/Success */}
        {error && (
          <div className="mb-5 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/15 text-[var(--color-danger)] text-sm font-medium" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-success-soft)] border border-[var(--color-success)]/15 text-[var(--color-success)] text-sm font-medium" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {success}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5" style={{ animation: 'fadeIn 0.3s ease-out 100ms both' }}>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="!pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] active:scale-[0.98]"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Iniciar Sesión
            </button>
          </form>
        )}

        {/* Signup Form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-5" style={{ animation: 'fadeIn 0.3s ease-out 100ms both' }}>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Nombre Completo</label>
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Contraseña</label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Confirmar Contraseña</label>
              <input
                type="password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                placeholder="Repite tu contraseña"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] active:scale-[0.98]"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Crear Cuenta
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-[var(--color-text-muted)]" style={{ animation: 'fadeIn 0.4s ease-out 200ms both' }}>
          <p className="font-medium">Habit Tracker</p>
          <p className="mt-1 opacity-70">Track inteligente · Cruces múltiples · Analytics avanzado</p>
        </div>
      </div>
    </div>
  );
}
