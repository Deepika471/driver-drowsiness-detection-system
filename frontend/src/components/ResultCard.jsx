import { AlertTriangle, CheckCircle, Eye, Wind, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

// ✅ FIXED STATE NAMES
const STATE_CONFIG = {
  NOT_DROWSY: {
    color: 'text-safe',
    borderColor: 'border-safe/40',
    bgColor: 'bg-safe/5',
    glowClass: 'glow-box-safe',
    icon: CheckCircle,
    label: 'NOT DROWSY',
    desc: 'Driver is fully conscious and attentive.',
    barColor: 'bg-safe',
  },
  DROWSY: {
    color: 'text-danger',
    borderColor: 'border-danger/40',
    bgColor: 'bg-danger/5',
    glowClass: 'glow-box-danger',
    icon: AlertTriangle,
    label: 'DROWSY',
    desc: 'WARNING: Fatigue detected — immediate attention required!',
    barColor: 'bg-danger',
  },
};

const CLASS_META = {
  notdrowsy: { label: 'Not Drowsy', icon: CheckCircle, color: 'text-safe', bar: 'bg-safe' },
  sleepy: { label: 'Sleepy', icon: Eye, color: 'text-danger', bar: 'bg-danger' },
  slowBlink: { label: 'Slow Blink', icon: AlertCircle, color: 'text-warn', bar: 'bg-warn' },
  yawning: { label: 'Yawning', icon: Wind, color: 'text-accent', bar: 'bg-accent' },
};

function AnimatedBar({ value, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="h-1.5 bg-border rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function ResultCard({ result }) {

  // ✅ SAFE STATE HANDLING
  const state = result.state === "NOT_DROWSY" ? "NOT_DROWSY" : "DROWSY";

  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;

  const confidence = result.confidence || {};
  const classKeys = Object.keys(confidence);

  const timestamp = result.createdAt
    ? new Date(result.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })
    : '—';

  return (
    <div
      className={`relative border ${cfg.borderColor} ${cfg.bgColor} ${cfg.glowClass} p-6 transition-all duration-500`}
      style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
    >

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 border ${cfg.borderColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <div className="font-mono text-xs text-text-dim tracking-widest">DETECTION RESULT</div>
            <div className={`font-display text-2xl font-black tracking-wider ${cfg.color}`}>
              {cfg.label}
            </div>
          </div>
        </div>

        <div className={`w-4 h-4 rounded-full ${state === 'DROWSY' ? 'bg-danger' : 'bg-safe'}`} />
      </div>

      {/* DESCRIPTION */}
      <p className={`font-body text-xs mb-6 ${cfg.color} opacity-80`}>
        {state === "DROWSY" ? cfg.desc : "Driver is safe. No drowsiness detected."}
      </p>

      {/* PREDICTED CLASS */}
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs text-text-dim tracking-widest">PREDICTED CLASS</span>
        <span className={`font-mono text-xs tracking-widest font-semibold uppercase ${cfg.color}`}>
          {(result.predicted_class || '—').replace(/_/g, ' ')}
        </span>
      </div>

      {/* CONFIDENCE */}
      <div className="mb-6">
        <div className="font-mono text-xs text-text-dim tracking-widest mb-4">CONFIDENCE DISTRIBUTION</div>
        <div className="space-y-3">
          {classKeys.map(key => {
            const meta = CLASS_META[key] || { label: key, color: 'text-text', bar: 'bg-muted' };
            const val = confidence[key] || 0;
            const isPredicted = key === result.predicted_class;

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-mono text-xs ${isPredicted ? meta.color : 'text-text-dim'}`}>
                    {meta.label}
                  </span>
                  <span className={`font-mono text-xs ${isPredicted ? meta.color : 'text-text-dim'}`}>
                    {val.toFixed(1)}%
                  </span>
                </div>
                <AnimatedBar value={val} color={meta.bar} />
              </div>
            );
          })}
        </div>
      </div>

      {/* META */}
      <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
        <div>
          <div className="font-mono text-xs text-text-dim">RECORD ID</div>
          <div className="font-mono text-xs">#{result.id || '—'}</div>
        </div>
        <div>
          <div className="font-mono text-xs text-text-dim">TIMESTAMP</div>
          <div className="font-mono text-xs">{timestamp}</div>
        </div>
      </div>

    </div>
  );
}