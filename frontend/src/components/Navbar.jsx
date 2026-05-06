import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-void/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
            <div className="relative w-8 h-8 bg-accent/10 border border-accent/40 rounded-full flex items-center justify-center">
              <Eye className="w-4 h-4 text-accent" />
            </div>
          </div>
          <span className="font-display text-sm font-bold tracking-widest text-text group-hover:text-accent transition-colors">
            DROWSE<span className="text-accent">GUARD</span>
          </span>
        </Link>

        {/* Center HUD info */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
            <span className="font-mono text-xs text-text-dim tracking-widest">SYSTEM ONLINE</span>
          </div>
          <div className="font-mono text-xs text-muted tracking-widest">{time}</div>
        </div>

        {/* Auth buttons */}
        <nav className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-border bg-panel/50">
                <User className="w-3.5 h-3.5 text-accent" />
                <span className="font-mono text-xs text-text-dim">{user.username || user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 font-display text-xs font-semibold tracking-widest text-danger border border-danger/40 px-4 py-2 hover:bg-danger/10 transition-all duration-300"
                style={{ clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LOGOUT</span>
              </button>
            </div>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Link to="/login" className="btn-outline text-xs py-2 px-5">
                  LOGIN
                </Link>
              )}
              {location.pathname !== '/register' && (
                <Link to="/register" className="btn-primary text-xs py-2 px-5">
                  REGISTER
                </Link>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Bottom scan line */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </header>
  );
}
