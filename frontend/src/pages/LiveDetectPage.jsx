// frontend/src/pages/LiveDetectPage.jsx
// frontend/src/pages/LiveDetectPage.jsx
import {
  Video, VideoOff, AlertTriangle, Activity,
  Eye, Cpu, Wifi, BellOff, Bell,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWebcamDetection } from "../hooks/useWebcamDetection";
import ResultCard from "../components/ResultCard";

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
function StatusBadge({ isRunning, alarmActive, drowsyCount, threshold }) {
  if (alarmActive) return (
    <div className="flex items-center gap-2 bg-danger/20 border border-danger/50 px-3 py-1.5 animate-pulse"
      style={{ clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}>
      <AlertTriangle className="w-3.5 h-3.5 text-danger" />
      <span className="font-mono text-xs text-danger tracking-widest">DROWSINESS ALERT</span>
    </div>
  );
  if (!isRunning) return (
    <div className="flex items-center gap-2 bg-panel/40 border border-border px-3 py-1.5"
      style={{ clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}>
      <div className="w-2 h-2 rounded-full bg-muted" />
      <span className="font-mono text-xs text-muted tracking-widest">STANDBY</span>
    </div>
  );
  if (drowsyCount > 0) return (
    <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 px-3 py-1.5"
      style={{ clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}>
      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
      <span className="font-mono text-xs text-yellow-400 tracking-widest">
        DROWSY {drowsyCount}/{threshold}
      </span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 py-1.5"
      style={{ clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}>
      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      <span className="font-mono text-xs text-accent tracking-widest">LIVE · MONITORING</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ALARM DURATION SELECTOR
// ─────────────────────────────────────────────────────────────
function AlarmDurationControl({ value, onChange, disabled }) {
  const options = [5, 10, 15, 20];
  return (
    <div
      className="border border-border/50 bg-panel/20 p-4 space-y-3"
      style={{ clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-accent" />
          <span className="font-mono text-xs text-accent tracking-widest">ALARM DURATION</span>
        </div>
        <span className="font-mono text-xs font-bold text-text">
          {value / 1000}s
        </span>
      </div>
      <div className="flex gap-2">
        {options.map((sec) => (
          <button
            key={sec}
            disabled={disabled}
            onClick={() => onChange(sec * 1000)}
            className={`flex-1 py-2 font-mono text-xs tracking-wider transition-all duration-200
              ${value === sec * 1000
                ? "bg-accent text-void"
                : "bg-panel/40 border border-border/50 text-text-dim hover:border-accent/40 hover:text-text"
              }
              disabled:opacity-40 disabled:cursor-not-allowed`}
            style={{ clipPath: "polygon(3px 0%, 100% 0%, calc(100% - 3px) 100%, 0% 100%)" }}
          >
            {sec}s
          </button>
        ))}
      </div>
      <p className="font-body text-xs text-muted">
        Alarm rings for selected duration when drowsiness is detected. Can be dismissed early.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function LiveDetectPage() {
  const { token } = useAuth();
  const {
    videoRef, canvasRef,
    isRunning, result, error,
    drowsyCount, alarmActive, frameCount,
    isDrowsyState, alarmDurationMs, setAlarmDurationMs,
    startDetection, stopDetection, stopAlarm,
    ALARM_THRESHOLD, DROWSY_HOLD_MS,
  } = useWebcamDetection(token);

  // STATUS value: ALERT when drowsy state is held, OK otherwise
  const statusValue = isDrowsyState ? "ALERT" : "OK";

  return (
    <div className="min-h-screen bg-void grid-bg pt-24 pb-16 px-6">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* ── ALARM OVERLAY ─────────────────────────────────── */}
      {alarmActive && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 border-4 border-danger animate-pulse" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto">
            <div
              className="bg-danger text-white px-6 py-3 flex items-center gap-3 shadow-2xl"
              style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}
            >
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              <span className="font-mono text-sm font-bold tracking-widest">
                ⚠ DRIVER DROWSINESS DETECTED
              </span>
              <button
                onClick={stopAlarm}
                className="ml-4 bg-white/20 hover:bg-white/30 px-3 py-1 font-mono text-xs transition-colors"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-6xl mx-auto">

        {/* ── PAGE HEADER ───────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-accent/40" />
            <span className="font-mono text-xs text-accent tracking-widest">LIVE ANALYSIS MODULE</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-black text-text tracking-wide">
                REAL-TIME <span className="text-accent">DETECTION</span>
              </h1>
              <p className="font-body text-sm text-text-dim mt-2 max-w-lg">
                Live webcam monitoring with MediaPipe EAR + AI inference.
                Alarm triggers after {ALARM_THRESHOLD} consecutive drowsy detections.
              </p>
            </div>
            <StatusBadge
              isRunning={isRunning}
              alarmActive={alarmActive}
              drowsyCount={drowsyCount}
              threshold={ALARM_THRESHOLD}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* ── LEFT: WEBCAM + CONTROLS ───────────────────── */}
          <div className="space-y-4">

            {/* Camera viewport */}
            <div
              className="relative bg-panel/40 border border-border overflow-hidden"
              style={{
                clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
                aspectRatio: "4/3",
              }}
            >
              <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-accent/40 z-10" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-accent/40 z-10" />

              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ display: isRunning ? "block" : "none" }}
              />

              {/* Standby */}
              {!isRunning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div
                    className="w-20 h-20 border border-border bg-panel/60 flex items-center justify-center opacity-50"
                    style={{ clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)" }}
                  >
                    <Video className="w-9 h-9 text-text-dim" />
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xs text-text-dim tracking-widest">CAMERA OFFLINE</p>
                    <p className="font-body text-xs text-muted mt-1">Press START to begin monitoring</p>
                  </div>
                </div>
              )}

              {/* REC badge */}
              {isRunning && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-void/80 backdrop-blur-sm px-2 py-1">
                  <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  <span className="font-mono text-xs text-danger tracking-widest">REC</span>
                </div>
              )}

              {/* Frame counter */}
              {isRunning && (
                <div className="absolute bottom-3 right-3 z-10 bg-void/80 backdrop-blur-sm px-2 py-1">
                  <span className="font-mono text-xs text-text-dim">
                    FRAMES: <span className="text-accent">{frameCount}</span>
                  </span>
                </div>
              )}

              {/* Drowsy border flash */}
              {(alarmActive || isDrowsyState) && (
                <div className="absolute inset-0 bg-danger/10 border-2 border-danger animate-pulse pointer-events-none z-10" />
              )}

              {/* Scanlines */}
              {isRunning && (
                <div
                  className="absolute inset-0 pointer-events-none z-10 opacity-20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 4px)",
                  }}
                />
              )}
            </div>

            {/* Hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2 bg-danger/10 border border-danger/30 px-4 py-3 text-danger text-xs font-body"
                style={{ clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Start / Stop / Dismiss */}
            <div className="flex gap-3">
              {!isRunning ? (
                <button
                  onClick={startDetection}
                  className="flex-1 btn-primary flex items-center justify-center gap-3 py-4"
                  style={{
                    clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                    boxShadow: "0 0 30px rgba(0,212,255,0.25)",
                  }}
                >
                  <Video className="w-5 h-5" />
                  <span>START MONITORING</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={stopDetection}
                    className="flex-1 btn-outline flex items-center justify-center gap-2 py-4 border-danger/50 text-danger hover:border-danger hover:bg-danger/10"
                    style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}
                  >
                    <VideoOff className="w-4 h-4" />
                    <span>STOP</span>
                  </button>
                  {alarmActive && (
                    <button
                      onClick={stopAlarm}
                      className="flex-1 btn-outline flex items-center justify-center gap-2 py-4 border-yellow-500/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-500/10"
                      style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}
                    >
                      <BellOff className="w-4 h-4" />
                      <span>DISMISS ALARM</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Alarm duration selector — only when not running */}
            {!isRunning && (
              <AlarmDurationControl
                value={alarmDurationMs}
                onChange={setAlarmDurationMs}
                disabled={isRunning}
              />
            )}

            {/* How it works */}
            {!isRunning && (
              <div
                className="border border-border/50 bg-panel/20 p-4 space-y-3"
                style={{ clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}
              >
                <p className="font-mono text-xs text-accent tracking-widest">HOW IT WORKS</p>
                {[
                  ["01", "MediaPipe tracks eye landmarks every 300ms"],
                  ["02", "Low EAR (eye aspect ratio) = eyes closed"],
                  ["03", `${ALARM_THRESHOLD} consecutive drowsy frames trigger alarm`],
                  ["04", `DROWSY state held in results for ${DROWSY_HOLD_MS / 1000}s`],
                  ["05", "All predictions saved to your history"],
                ].map(([num, text]) => (
                  <div key={num} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-accent/40 w-6 flex-shrink-0">{num}</span>
                    <span className="font-body text-xs text-text-dim">{text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: RESULT PANEL ───────────────────────── */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                  <span className="font-mono text-xs text-text-dim tracking-widest">ANALYSIS OUTPUT</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                </div>

                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <ResultCard result={result} />
                </div>

                {/* Session stats */}
                <div
                  className="border border-border/50 bg-panel/20 p-4"
                  style={{ clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}
                >
                  <p className="font-mono text-xs text-accent tracking-widest mb-3">SESSION STATS</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "FRAMES",       value: frameCount,                  icon: Cpu,           alert: false },
                      { label: "DROWSY STREAK", value: `${drowsyCount}/${ALARM_THRESHOLD}`, icon: AlertTriangle, alert: drowsyCount > 0 },
                      { label: "STATUS",        value: statusValue,                icon: Wifi,          alert: isDrowsyState },
                    ].map(({ label, value, icon: Icon, alert }) => (
                      <div key={label} className="text-center p-2 bg-panel/40 border border-border/30">
                        <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${alert ? "text-danger" : "text-accent"}`} />
                        <p className={`font-mono text-lg font-bold ${alert ? "text-danger" : "text-text"}`}>
                          {value}
                        </p>
                        <p className="font-mono text-xs text-muted">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div
                className="border border-dashed border-border bg-panel/20 p-10 flex flex-col items-center justify-center min-h-64 text-center"
                style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}
              >
                <div className="w-14 h-14 border border-border flex items-center justify-center mb-4 opacity-40">
                  {isRunning
                    ? <Activity className="w-6 h-6 text-accent animate-pulse" />
                    : <Eye className="w-6 h-6 text-text-dim" />
                  }
                </div>
                <p className="font-display text-xs text-text-dim tracking-widest">
                  {isRunning ? "ANALYZING..." : "AWAITING CAMERA"}
                </p>
                <p className="font-body text-xs text-muted mt-2">
                  {isRunning
                    ? "First result appears shortly"
                    : "Start monitoring to see live predictions here"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}


// import {
//   Video, VideoOff, AlertTriangle, Activity,
//   Eye, Cpu, Wifi, Camera, Bell, BellOff,
// } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import { useWebcamDetection } from '../hooks/useWebcamDetection';
// import ResultCard from '../components/ResultCard';

// // ── Live status badge ──────────────────────────────────────────
// function StatusBadge({ isRunning, alarmActive, drowsyCount, threshold }) {
//   if (alarmActive) return (
//     <div className="flex items-center gap-2 bg-danger/20 border border-danger/50 px-3 py-1.5 animate-pulse"
//       style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
//       <AlertTriangle className="w-3.5 h-3.5 text-danger" />
//       <span className="font-mono text-xs text-danger tracking-widest">DROWSINESS ALERT</span>
//     </div>
//   );
//   if (!isRunning) return (
//     <div className="flex items-center gap-2 bg-panel/40 border border-border px-3 py-1.5"
//       style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
//       <div className="w-2 h-2 rounded-full bg-muted" />
//       <span className="font-mono text-xs text-muted tracking-widest">STANDBY</span>
//     </div>
//   );
//   if (drowsyCount > 0) return (
//     <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 px-3 py-1.5"
//       style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
//       <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
//       <span className="font-mono text-xs text-yellow-400 tracking-widest">
//         DROWSY DETECTED {drowsyCount}/{threshold}
//       </span>
//     </div>
//   );
//   return (
//     <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 py-1.5"
//       style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
//       <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
//       <span className="font-mono text-xs text-accent tracking-widest">LIVE · MONITORING</span>
//     </div>
//   );
// }

// export default function LiveDetectPage() {
//   const { token } = useAuth();
//   const {
//     videoRef, canvasRef,
//     isRunning, result, error,
//     drowsyCount, alarmActive, frameCount,
//     startDetection, stopDetection, stopAlarm,
//     ALARM_THRESHOLD,
//   } = useWebcamDetection(token);

//   return (
//     <div className="min-h-screen bg-void grid-bg pt-24 pb-16 px-6">
//       <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

//       {/* ── ALARM OVERLAY ───────────────────────────────────── */}
//       {alarmActive && (
//         <div className="fixed inset-0 z-50 pointer-events-none">
//           <div className="absolute inset-0 border-4 border-danger animate-pulse" />
//           <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto">
//             <div className="bg-danger text-white px-6 py-3 flex items-center gap-3 shadow-2xl"
//               style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}>
//               <AlertTriangle className="w-5 h-5 animate-bounce" />
//               <span className="font-mono text-sm font-bold tracking-widest">⚠ DRIVER DROWSINESS DETECTED</span>
//               <button
//                 onClick={stopAlarm}
//                 className="ml-4 bg-white/20 hover:bg-white/30 px-3 py-1 font-mono text-xs transition-colors"
//               >
//                 DISMISS
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="relative max-w-6xl mx-auto">

//         {/* ── PAGE HEADER ─────────────────────────────────── */}
//         <div className="mb-8">
//           <div className="flex items-center gap-3 mb-4">
//             <div className="h-px w-8 bg-accent/40" />
//             <span className="font-mono text-xs text-accent tracking-widest">LIVE ANALYSIS MODULE</span>
//           </div>
//           <div className="flex flex-wrap items-start justify-between gap-4">
//             <div>
//               <h1 className="font-display text-3xl md:text-4xl font-black text-text tracking-wide">
//                 REAL-TIME <span className="text-accent">DETECTION</span>
//               </h1>
//               <p className="font-body text-sm text-text-dim mt-2 max-w-lg">
//                 Live webcam monitoring with continuous AI inference. Alarm triggers after {ALARM_THRESHOLD} consecutive drowsy detections.
//               </p>
//             </div>
//             <StatusBadge
//               isRunning={isRunning}
//               alarmActive={alarmActive}
//               drowsyCount={drowsyCount}
//               threshold={ALARM_THRESHOLD}
//             />
//           </div>
//         </div>

//         <div className="grid lg:grid-cols-2 gap-8 items-start">

//           {/* ── LEFT: WEBCAM FEED ──────────────────────────── */}
//           <div className="space-y-4">

//             {/* Camera viewport */}
//             <div
//               className="relative bg-panel/40 border border-border overflow-hidden"
//               style={{
//                 clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
//                 aspectRatio: '4/3',
//               }}
//             >
//               {/* Corner decorations */}
//               <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-accent/40 z-10" />
//               <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-accent/40 z-10" />

//               {/* Video element */}
//               <video
//                 ref={videoRef}
//                 muted
//                 playsInline
//                 className="w-full h-full object-cover"
//                 style={{ display: isRunning ? 'block' : 'none' }}
//               />

//               {/* Standby screen */}
//               {!isRunning && (
//                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
//                   <div
//                     className="w-20 h-20 border border-border bg-panel/60 flex items-center justify-center opacity-50"
//                     style={{ clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)' }}
//                   >
//                     <Video className="w-9 h-9 text-text-dim" />
//                   </div>
//                   <div className="text-center">
//                     <p className="font-display text-xs text-text-dim tracking-widest">CAMERA OFFLINE</p>
//                     <p className="font-body text-xs text-muted mt-1">Press START to begin monitoring</p>
//                   </div>
//                 </div>
//               )}

//               {/* LIVE badge (top-left when running) */}
//               {isRunning && (
//                 <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-void/80 backdrop-blur-sm px-2 py-1">
//                   <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
//                   <span className="font-mono text-xs text-danger tracking-widest">REC</span>
//                 </div>
//               )}

//               {/* Frame counter (bottom-right when running) */}
//               {isRunning && (
//                 <div className="absolute bottom-3 right-3 z-10 bg-void/80 backdrop-blur-sm px-2 py-1">
//                   <span className="font-mono text-xs text-text-dim">
//                     FRAMES: <span className="text-accent">{frameCount}</span>
//                   </span>
//                 </div>
//               )}

//               {/* Drowsy warning overlay */}
//               {alarmActive && (
//                 <div className="absolute inset-0 bg-danger/10 border-2 border-danger animate-pulse pointer-events-none z-10" />
//               )}

//               {/* Scanline effect */}
//               {isRunning && (
//                 <div
//                   className="absolute inset-0 pointer-events-none z-10 opacity-20"
//                   style={{
//                     backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 4px)',
//                   }}
//                 />
//               )}
//             </div>

//             {/* Hidden canvas for frame capture */}
//             <canvas ref={canvasRef} className="hidden" />

//             {/* Error display */}
//             {error && (
//               <div
//                 className="flex items-start gap-2 bg-danger/10 border border-danger/30 px-4 py-3 text-danger text-xs font-body"
//                 style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
//               >
//                 <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
//                 {error}
//               </div>
//             )}

//             {/* Controls row */}
//             <div className="flex gap-3">
//               {!isRunning ? (
//                 <button
//                   onClick={startDetection}
//                   className="flex-1 btn-primary flex items-center justify-center gap-3 py-4"
//                   style={{
//                     clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
//                     boxShadow: '0 0 30px rgba(0,212,255,0.25)',
//                   }}
//                 >
//                   <Video className="w-5 h-5" />
//                   <span>START MONITORING</span>
//                 </button>
//               ) : (
//                 <>
//                   <button
//                     onClick={stopDetection}
//                     className="flex-1 btn-outline flex items-center justify-center gap-2 py-4 border-danger/50 text-danger hover:border-danger hover:bg-danger/10"
//                     style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
//                   >
//                     <VideoOff className="w-4 h-4" />
//                     <span>STOP</span>
//                   </button>
//                   {alarmActive && (
//                     <button
//                       onClick={stopAlarm}
//                       className="flex-1 btn-outline flex items-center justify-center gap-2 py-4 border-yellow-500/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-500/10"
//                       style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
//                     >
//                       <BellOff className="w-4 h-4" />
//                       <span>DISMISS ALARM</span>
//                     </button>
//                   )}
//                 </>
//               )}
//             </div>

//             {/* How it works — shown when stopped */}
//             {!isRunning && (
//               <div
//                 className="border border-border/50 bg-panel/20 p-4 space-y-3"
//                 style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
//               >
//                 <p className="font-mono text-xs text-accent tracking-widest">HOW IT WORKS</p>
//                 {[
//                   ['01', 'Camera captures frame every 1.5 seconds'],
//                   ['02', 'Frame sent to AI model for classification'],
//                   ['03', `${ALARM_THRESHOLD} consecutive drowsy detections trigger alarm`],
//                   ['04', 'All predictions saved to your history'],
//                 ].map(([num, text]) => (
//                   <div key={num} className="flex items-center gap-3">
//                     <span className="font-mono text-xs text-accent/40 w-6 flex-shrink-0">{num}</span>
//                     <span className="font-body text-xs text-text-dim">{text}</span>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* ── RIGHT: RESULT PANEL ────────────────────────── */}
//           <div className="space-y-4">

//             {result ? (
//               <>
//                 {/* Header label */}
//                 <div className="flex items-center gap-3">
//                   <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
//                   <span className="font-mono text-xs text-text-dim tracking-widest">ANALYSIS OUTPUT</span>
//                   <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
//                 </div>

//                 {/* Exact same ResultCard as image upload tab */}
//                 <div className="animate-[fadeIn_0.3s_ease-out]">
//                   <ResultCard result={result} />
//                 </div>

//                 {/* Session stats strip below card */}
//                 <div
//                   className="border border-border/50 bg-panel/20 p-4"
//                   style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
//                 >
//                   <p className="font-mono text-xs text-accent tracking-widest mb-3">SESSION STATS</p>
//                   <div className="grid grid-cols-3 gap-3">
//                     {[
//                       { label: 'FRAMES', value: frameCount, icon: Cpu },
//                       { label: 'DROWSY STREAK', value: `${drowsyCount}/${ALARM_THRESHOLD}`, icon: AlertTriangle },
//                       { label: 'STATUS', value: alarmActive ? 'ALERT' : 'OK', icon: Wifi },
//                     ].map(({ label, value, icon: Icon }) => (
//                       <div key={label} className="text-center p-2 bg-panel/40 border border-border/30">
//                         <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${label === 'STATUS' && alarmActive ? 'text-danger' : 'text-accent'}`} />
//                         <p className={`font-mono text-lg font-bold ${label === 'STATUS' && alarmActive ? 'text-danger' : 'text-text'}`}>{value}</p>
//                         <p className="font-mono text-xs text-muted">{label}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </>
//             ) : (
//               /* Awaiting state */
//               <div
//                 className="border border-dashed border-border bg-panel/20 p-10 flex flex-col items-center justify-center min-h-64 text-center"
//                 style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
//               >
//                 <div className="w-14 h-14 border border-border flex items-center justify-center mb-4 opacity-40">
//                   {isRunning
//                     ? <Activity className="w-6 h-6 text-accent animate-pulse" />
//                     : <Eye className="w-6 h-6 text-text-dim" />
//                   }
//                 </div>
//                 <p className="font-display text-xs text-text-dim tracking-widest">
//                   {isRunning ? 'ANALYZING...' : 'AWAITING CAMERA'}
//                 </p>
//                 <p className="font-body text-xs text-muted mt-2">
//                   {isRunning
//                     ? 'First result appears in ~1.5 seconds'
//                     : 'Start monitoring to see live predictions here'
//                   }
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// // // frontend/src/pages/LiveDetectPage.jsx
// // import {
// //   Video, VideoOff, AlertTriangle, Activity,
// //   Eye, Cpu, Wifi
// // } from 'lucide-react';
// // import { useAuth } from '../context/AuthContext';
// // import { useWebcamDetection } from '../hooks/useWebcamDetection';
// // import ResultCard from '../components/ResultCard';

// // // ── Live status badge ──────────────────────────────────────────
// // function StatusBadge({ isRunning, alarmActive, drowsyCount, threshold }) {
// //   if (alarmActive) return (
// //     <div className="flex items-center gap-2 bg-danger/20 border border-danger/50 px-3 py-1.5 animate-pulse"
// //       style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
// //       <AlertTriangle className="w-3.5 h-3.5 text-danger" />
// //       <span className="font-mono text-xs text-danger tracking-widest">DROWSINESS ALERT</span>
// //     </div>
// //   );
// //   if (!isRunning) return (
// //     <div className="flex items-center gap-2 bg-panel/40 border border-border px-3 py-1.5"
// //       style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
// //       <div className="w-2 h-2 rounded-full bg-muted" />
// //       <span className="font-mono text-xs text-muted tracking-widest">STANDBY</span>
// //     </div>
// //   );
// //   if (drowsyCount > 0) return (
// //     <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 px-3 py-1.5"
// //       style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
// //       <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
// //       <span className="font-mono text-xs text-yellow-400 tracking-widest">
// //         DROWSY DETECTED {drowsyCount}/{threshold}
// //       </span>
// //     </div>
// //   );
// //   return (
// //     <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 py-1.5"
// //       style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
// //       <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
// //       <span className="font-mono text-xs text-accent tracking-widest">LIVE · MONITORING</span>
// //     </div>
// //   );
// // }

// // export default function LiveDetectPage() {
// //   const { token } = useAuth();
// //   const {
// //     videoRef, canvasRef,
// //     isRunning, result, error,
// //     drowsyCount, alarmActive, frameCount,
// //     startDetection, stopDetection, stopAlarm,
// //     ALARM_THRESHOLD,
// //   } = useWebcamDetection(token);

// //   return (
// //     <div className="min-h-screen bg-void grid-bg pt-24 pb-16 px-6">
// //       <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

// //       {/* ── ALARM OVERLAY ───────────────────────────────────── */}
// //       {alarmActive && (
// //         <div className="fixed inset-0 z-50 pointer-events-none">
// //           <div className="absolute inset-0 border-4 border-danger animate-pulse" />
// //           <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto">
// //             <div className="bg-danger text-white px-6 py-3 flex items-center gap-3 shadow-2xl"
// //               style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}>
// //               <AlertTriangle className="w-5 h-5 animate-bounce" />
// //               <span className="font-mono text-sm font-bold tracking-widest">⚠ DRIVER DROWSINESS DETECTED</span>
// //               <button
// //                 onClick={stopAlarm}
// //                 className="ml-4 bg-white/20 hover:bg-white/30 px-3 py-1 font-mono text-xs transition-colors"
// //               >
// //                 DISMISS
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       <div className="relative max-w-6xl mx-auto">

// //         {/* ── PAGE HEADER ─────────────────────────────────── */}
// //         <div className="mb-8">
// //           <div className="flex items-center gap-3 mb-4">
// //             <div className="h-px w-8 bg-accent/40" />
// //             <span className="font-mono text-xs text-accent tracking-widest">LIVE ANALYSIS MODULE</span>
// //           </div>
// //           <div className="flex flex-wrap items-start justify-between gap-4">
// //             <div>
// //               <h1 className="font-display text-3xl md:text-4xl font-black text-text tracking-wide">
// //                 REAL-TIME <span className="text-accent">DETECTION</span>
// //               </h1>
// //               <p className="font-body text-sm text-text-dim mt-2 max-w-lg">
// //                 Live webcam monitoring with continuous AI inference. Alarm triggers after {ALARM_THRESHOLD} consecutive drowsy detections.
// //               </p>
// //             </div>
// //             <StatusBadge
// //               isRunning={isRunning}
// //               alarmActive={alarmActive}
// //               drowsyCount={drowsyCount}
// //               threshold={ALARM_THRESHOLD}
// //             />
// //           </div>
// //         </div>

// //         <div className="grid lg:grid-cols-2 gap-8 items-start">

// //           {/* ── LEFT: WEBCAM FEED ──────────────────────────── */}
// //           <div className="space-y-4">

// //             {/* Camera viewport */}
// //             <div
// //               className="relative bg-panel/40 border border-border overflow-hidden"
// //               style={{
// //                 clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
// //                 aspectRatio: '4/3',
// //               }}
// //             >
// //               {/* Corner decorations */}
// //               <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-accent/40 z-10" />
// //               <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-accent/40 z-10" />

// //               {/* Video element */}
// //               <video
// //                 ref={videoRef}
// //                 muted
// //                 playsInline
// //                 className="w-full h-full object-cover"
// //                 style={{ display: isRunning ? 'block' : 'none' }}
// //               />

// //               {/* Standby screen */}
// //               {!isRunning && (
// //                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
// //                   <div
// //                     className="w-20 h-20 border border-border bg-panel/60 flex items-center justify-center opacity-50"
// //                     style={{ clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)' }}
// //                   >
// //                     <Video className="w-9 h-9 text-text-dim" />
// //                   </div>
// //                   <div className="text-center">
// //                     <p className="font-display text-xs text-text-dim tracking-widest">CAMERA OFFLINE</p>
// //                     <p className="font-body text-xs text-muted mt-1">Press START to begin monitoring</p>
// //                   </div>
// //                 </div>
// //               )}

// //               {/* LIVE badge (top-left when running) */}
// //               {isRunning && (
// //                 <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-void/80 backdrop-blur-sm px-2 py-1">
// //                   <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
// //                   <span className="font-mono text-xs text-danger tracking-widest">REC</span>
// //                 </div>
// //               )}

// //               {/* Frame counter (bottom-right when running) */}
// //               {isRunning && (
// //                 <div className="absolute bottom-3 right-3 z-10 bg-void/80 backdrop-blur-sm px-2 py-1">
// //                   <span className="font-mono text-xs text-text-dim">
// //                     FRAMES: <span className="text-accent">{frameCount}</span>
// //                   </span>
// //                 </div>
// //               )}

// //               {/* Drowsy warning overlay */}
// //               {alarmActive && (
// //                 <div className="absolute inset-0 bg-danger/10 border-2 border-danger animate-pulse pointer-events-none z-10" />
// //               )}

// //               {/* Scanline effect */}
// //               {isRunning && (
// //                 <div
// //                   className="absolute inset-0 pointer-events-none z-10 opacity-20"
// //                   style={{
// //                     backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 4px)',
// //                   }}
// //                 />
// //               )}
// //             </div>

// //             {/* Hidden canvas for frame capture */}
// //             <canvas ref={canvasRef} className="hidden" />

// //             {/* Error display */}
// //             {error && (
// //               <div
// //                 className="flex items-start gap-2 bg-danger/10 border border-danger/30 px-4 py-3 text-danger text-xs font-body"
// //                 style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
// //               >
// //                 <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
// //                 {error}
// //               </div>
// //             )}

// //             {/* Controls row */}
// //             <div className="flex gap-3">
// //               {!isRunning ? (
// //                 <button
// //                   onClick={startDetection}
// //                   className="flex-1 btn-primary flex items-center justify-center gap-3 py-4"
// //                   style={{
// //                     clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
// //                     boxShadow: '0 0 30px rgba(0,212,255,0.25)',
// //                   }}
// //                 >
// //                   <Video className="w-5 h-5" />
// //                   <span>START MONITORING</span>
// //                 </button>
// //               ) : (
// //                 <>
// //                   <button
// //                     onClick={stopDetection}
// //                     className="flex-1 btn-outline flex items-center justify-center gap-2 py-4 border-danger/50 text-danger hover:border-danger hover:bg-danger/10"
// //                     style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
// //                   >
// //                     <VideoOff className="w-4 h-4" />
// //                     <span>STOP</span>
// //                   </button>
// //                   {alarmActive && (
// //                     <button
// //                       onClick={stopAlarm}
// //                       className="flex-1 btn-outline flex items-center justify-center gap-2 py-4 border-yellow-500/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-500/10"
// //                       style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
// //                     >
// //                       <BellOff className="w-4 h-4" />
// //                       <span>DISMISS ALARM</span>
// //                     </button>
// //                   )}
// //                 </>
// //               )}
// //             </div>

// //             {/* How it works — shown when stopped */}
// //             {!isRunning && (
// //               <div
// //                 className="border border-border/50 bg-panel/20 p-4 space-y-3"
// //                 style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
// //               >
// //                 <p className="font-mono text-xs text-accent tracking-widest">HOW IT WORKS</p>
// //                 {[
// //                   ['01', 'Camera captures frame every 1.5 seconds'],
// //                   ['02', 'Frame sent to AI model for classification'],
// //                   ['03', `${ALARM_THRESHOLD} consecutive drowsy detections trigger alarm`],
// //                   ['04', 'All predictions saved to your history'],
// //                 ].map(([num, text]) => (
// //                   <div key={num} className="flex items-center gap-3">
// //                     <span className="font-mono text-xs text-accent/40 w-6 flex-shrink-0">{num}</span>
// //                     <span className="font-body text-xs text-text-dim">{text}</span>
// //                   </div>
// //                 ))}
// //               </div>
// //             )}
// //           </div>

// //           {/* ── RIGHT: RESULT PANEL ────────────────────────── */}
// //           <div className="space-y-4">

// //             {result ? (
// //               <>
// //                 {/* Header label */}
// //                 <div className="flex items-center gap-3">
// //                   <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
// //                   <span className="font-mono text-xs text-text-dim tracking-widest">ANALYSIS OUTPUT</span>
// //                   <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
// //                 </div>

// //                 {/* Exact same ResultCard as image upload tab */}
// //                 <div className="animate-[fadeIn_0.3s_ease-out]">
// //                   <ResultCard result={result} />
// //                 </div>

// //                 {/* Session stats strip below card */}
// //                 <div
// //                   className="border border-border/50 bg-panel/20 p-4"
// //                   style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
// //                 >
// //                   <p className="font-mono text-xs text-accent tracking-widest mb-3">SESSION STATS</p>
// //                   <div className="grid grid-cols-3 gap-3">
// //                     {[
// //                       { label: 'FRAMES', value: frameCount, icon: Cpu },
// //                       { label: 'DROWSY STREAK', value: `${drowsyCount}/${ALARM_THRESHOLD}`, icon: AlertTriangle },
// //                       { label: 'STATUS', value: alarmActive ? 'ALERT' : 'OK', icon: Wifi },
// //                     ].map(({ label, value, icon: Icon }) => (
// //                       <div key={label} className="text-center p-2 bg-panel/40 border border-border/30">
// //                         <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${label === 'STATUS' && alarmActive ? 'text-danger' : 'text-accent'}`} />
// //                         <p className={`font-mono text-lg font-bold ${label === 'STATUS' && alarmActive ? 'text-danger' : 'text-text'}`}>{value}</p>
// //                         <p className="font-mono text-xs text-muted">{label}</p>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 </div>
// //               </>
// //             ) : (
// //               /* Awaiting state */
// //               <div
// //                 className="border border-dashed border-border bg-panel/20 p-10 flex flex-col items-center justify-center min-h-64 text-center"
// //                 style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
// //               >
// //                 <div className="w-14 h-14 border border-border flex items-center justify-center mb-4 opacity-40">
// //                   {isRunning
// //                     ? <Activity className="w-6 h-6 text-accent animate-pulse" />
// //                     : <Eye className="w-6 h-6 text-text-dim" />
// //                   }
// //                 </div>
// //                 <p className="font-display text-xs text-text-dim tracking-widest">
// //                   {isRunning ? 'ANALYZING...' : 'AWAITING CAMERA'}
// //                 </p>
// //                 <p className="font-body text-xs text-muted mt-2">
// //                   {isRunning
// //                     ? 'First result appears in ~1.5 seconds'
// //                     : 'Start monitoring to see live predictions here'
// //                   }
// //                 </p>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
