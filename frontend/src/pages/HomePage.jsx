import { Link } from 'react-router-dom';
import { Eye, Shield, Zap, Activity, ChevronRight, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function StatCard({ value, label, color }) {
  return (
    <div className="relative border border-border bg-panel/40 p-5 corner-cut-sm group hover:border-accent/30 transition-all duration-300">
      <div className={`font-display text-3xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="font-body text-xs text-text-dim tracking-widest uppercase">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, delay }) {
  return (
    <div
      className="relative border border-border bg-panel/30 p-6 hover:border-accent/40 hover:bg-panel/60 transition-all duration-500 group"
      style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))', animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-accent/40 group-hover:border-accent transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-accent/20 group-hover:border-accent/60 transition-colors duration-300" />

      <div className="w-10 h-10 bg-accent/10 border border-accent/30 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-all duration-300">
        <Icon className="w-5 h-5 text-accent" />
      </div>

      <h3 className="font-display text-sm font-semibold tracking-wider text-text mb-2">{title}</h3>
      <p className="font-body text-xs text-text-dim leading-relaxed">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dots, setDots] = useState('');
  const [typed, setTyped] = useState('');
  const fullText = 'REAL-TIME DROWSINESS ANALYSIS';

  useEffect(() => {
    if (user) navigate('/detect');
  }, [user]);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setTyped(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-void grid-bg relative overflow-hidden">
      {/* Radial glow background */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Animated scanline */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent pointer-events-none"
        style={{ animation: 'scan 8s linear infinite', top: 0 }}
      />

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-accent/30 bg-accent/5 px-4 py-2 mb-8"
            style={{ clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-xs text-accent tracking-widest">AI-POWERED DETECTION SYSTEM</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-black leading-none tracking-tight mb-6">
            <span className="text-text">STAY</span>
            <br />
            <span className="text-accent glow-text">ALERT.</span>
            <br />
            <span className="text-text">STAY</span>
            <span className="text-warn"> ALIVE.</span>
          </h1>

          {/* Typing text */}
          <div className="font-mono text-sm text-text-dim tracking-widest mb-6 h-6">
            <span className="text-accent">&gt;</span> {typed}
            <span className="cursor-blink text-accent">_</span>
          </div>

          <p className="font-body text-base text-text-dim max-w-xl leading-relaxed mb-10">
            Advanced computer vision model that detects drowsiness patterns — eyes closing, yawning, and distracted driving — before fatigue becomes fatal.
          </p>

          {/* CTA */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link to="/register" className="btn-primary flex items-center gap-2">
              GET STARTED <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-outline flex items-center gap-2">
              SIGN IN <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* HUD decorative element */}
        <div className="hidden lg:block absolute right-8 top-32 w-72 h-72 opacity-60">
          <div className="relative w-full h-full animate-float">
            <div className="absolute inset-0 border border-accent/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-8 border border-accent/30 rounded-full" />
            <div className="absolute inset-16 border border-accent/40 rounded-full animate-spin" style={{ animationDuration: '12s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Eye className="w-20 h-20 text-accent/40" />
            </div>
            {/* Orbit dots */}
            {[0, 72, 144, 216, 288].map((deg, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-accent rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${deg}deg) translateX(120px) translateY(-50%)`,
                  opacity: 0.4 + i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value="99.2%" label="Accuracy Rate" color="text-safe glow-text-safe" />
          <StatCard value="<50ms" label="Detection Speed" color="text-accent glow-text" />
          <StatCard value="4" label="State Classes" color="text-warn" />
          <StatCard value="24/7" label="Monitoring Ready" color="text-text" />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 max-w-7xl mx-auto mb-24">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <h2 className="font-display text-xs tracking-widest text-text-dim">CAPABILITIES</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={Eye}
            title="Eyes Detection"
            desc="Tracks eyelid closure patterns and blink frequency to detect microsleep events."
            delay={0}
          />
          <FeatureCard
            icon={AlertTriangle}
            title="Yawn Analysis"
            desc="Identifies mouth-open patterns associated with drowsiness and fatigue onset."
            delay={100}
          />
          <FeatureCard
            icon={Activity}
            title="Head Pose Tracking"
            desc="Monitors head direction to catch distracted or inattentive driving behavior."
            delay={200}
          />
          <FeatureCard
            icon={Shield}
            title="Confidence Scoring"
            desc="Multi-class softmax output with per-state confidence percentage breakdown."
            delay={300}
          />
        </div>
      </section>

      {/* Warning strip */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="relative border border-warn/30 bg-warn/5 p-6 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-warn/5 to-transparent pointer-events-none" />
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-warn flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-xs font-semibold tracking-widest text-warn mb-1">SAFETY ADVISORY</p>
              <p className="font-body text-sm text-text-dim leading-relaxed">
                Drowsy driving causes over 6,000 deaths annually in the US alone. This system provides AI-assisted monitoring — always maintain primary attention on the road. Detection results are advisory only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom scan line */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent pointer-events-none" />
    </div>
  );
}
