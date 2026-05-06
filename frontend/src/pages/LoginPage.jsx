import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      login(data.user, data.token);
      navigate('/detect');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void grid-bg flex items-center justify-center px-6 pt-16">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Top label */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/40" />
          <span className="font-mono text-xs text-accent tracking-widest">AUTH_MODULE</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/40" />
        </div>

        {/* Card */}
        <div
          className="relative bg-panel border border-border p-8"
          style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))' }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-accent/50" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-accent/50" />

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 mb-4"
              style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
              <Lock className="w-3 h-3 text-accent" />
              <span className="font-mono text-xs text-accent tracking-widest">SECURE LOGIN</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-text tracking-wide">
              ACCESS <span className="text-accent">TERMINAL</span>
            </h1>
            <p className="font-body text-xs text-text-dim mt-2">Enter your credentials to proceed</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 px-4 py-3 mb-6 text-danger text-xs font-body">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="font-mono text-xs text-text-dim tracking-widest block mb-2">
                EMAIL_ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="operator@domain.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="font-mono text-xs text-text-dim tracking-widest block mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-void/40 border-t-void rounded-full animate-spin" />
                  AUTHENTICATING{'.'.repeat(Math.floor(Date.now() / 400) % 4)}
                </>
              ) : (
                <>
                  INITIATE SESSION <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
            <span className="font-body text-xs text-text-dim">New operator?</span>
            <Link
              to="/register"
              className="font-mono text-xs text-accent hover:text-white transition-colors tracking-widest flex items-center gap-1"
            >
              CREATE ACCOUNT <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">v2.4.1</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
            <span className="font-mono text-xs text-text-dim">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
