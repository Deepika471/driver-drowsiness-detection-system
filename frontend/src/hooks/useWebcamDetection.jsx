// frontend/src/hooks/useWebcamDetection.js
import { useState, useRef, useCallback, useEffect } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

// ─────────────────────────────────────────────────────────────
// EYE LANDMARK INDICES (MediaPipe 468-point model)
// ─────────────────────────────────────────────────────────────
const LEFT_EYE  = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const EAR_THRESHOLD       = 0.22;   // below this → eyes closed
const EAR_CONSEC_FRAMES   = 3;      // consecutive closed frames → drowsy
const ALARM_THRESHOLD     = 3;      // consecutive drowsy detections → alarm
const CAPTURE_INTERVAL_MS = 300;    // frame capture rate (ms)
const DROWSY_HOLD_MS      = 10000;  // keep DROWSY in ResultCard for 10s
const DEFAULT_ALARM_DURATION_MS = 10000; // default alarm ring duration

const DROWSY_CLASSES = ["sleepy", "slowBlink", "yawning"];

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
function euclidean(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function calculateEAR(landmarks, indices) {
  const [p1, p2, p3, p4, p5, p6] = indices.map((i) => landmarks[i]);
  const v1 = euclidean(p2, p6);
  const v2 = euclidean(p3, p5);
  const h  = euclidean(p1, p4);
  return (v1 + v2) / (2.0 * h);
}

// ─────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────
export function useWebcamDetection(token) {

  // ── State ──────────────────────────────────────────────────
  const [isRunning,      setIsRunning]      = useState(false);
  const [result,         setResult]         = useState(null);
  const [error,          setError]          = useState("");
  const [drowsyCount,    setDrowsyCount]    = useState(0);
  const [alarmActive,    setAlarmActive]    = useState(false);
  const [frameCount,     setFrameCount]     = useState(0);
  const [earValue,       setEarValue]       = useState(0);
  const [isDrowsyState,  setIsDrowsyState]  = useState(false); // for STATUS widget
  const [alarmDurationMs, setAlarmDurationMsState] = useState(DEFAULT_ALARM_DURATION_MS);
  // Wrap setter to keep ref in sync
  const setAlarmDurationMs = useCallback((val) => {
    alarmDurationRef.current = val;
    setAlarmDurationMsState(val);
  }, []);

  // ── Refs ───────────────────────────────────────────────────
  const videoRef           = useRef(null);
  const canvasRef          = useRef(null);
  const intervalRef        = useRef(null);
  const streamRef          = useRef(null);
  const faceLandmarkerRef  = useRef(null);
  const audioCtxRef        = useRef(null);
  const alarmNodesRef      = useRef([]);   // active oscillator nodes
  const alarmTimerRef      = useRef(null); // auto-stop timer
  const drowsyHoldRef      = useRef(null); // DROWSY UI hold timer
  const eyeClosedFramesRef = useRef(0);
  const drowsyCountRef     = useRef(0);
  const frameCountRef      = useRef(0);
  const alarmActiveRef     = useRef(false); // ref mirror — safe to read inside callbacks
  const isDrowsyRef        = useRef(false);  // ref mirror of isDrowsyState
  const alarmDurationRef   = useRef(DEFAULT_ALARM_DURATION_MS); // ref mirror of alarmDurationMs

  // ─────────────────────────────────────────────────────────
  // ALARM — plays repeating beeps for alarmDurationMs, then
  //         auto-stops. User can also dismiss manually.
  // ─────────────────────────────────────────────────────────
  const stopAlarm = useCallback(() => {
    // Stop all scheduled oscillator nodes
    alarmNodesRef.current.forEach((osc) => {
      try { osc.stop(); } catch (_) {}
    });
    alarmNodesRef.current = [];

    // Close audio context
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (_) {}
      audioCtxRef.current = null;
    }

    clearTimeout(alarmTimerRef.current);
    alarmActiveRef.current = false;
    setAlarmActive(false);
  }, []);

  const playAlarm = useCallback(() => {
    // Don't restart if already ringing — use ref, not state (avoids stale closure)
    if (alarmActiveRef.current) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      alarmNodesRef.current = [];

      const durationSec = alarmDurationRef.current / 1000;
      const beepEvery   = 0.5;   // one beep every 0.5 seconds
      const beepLen     = 0.35;  // each beep lasts 0.35 seconds
      const totalBeeps  = Math.floor(durationSec / beepEvery);

      for (let i = 0; i < totalBeeps; i++) {
        const startTime = ctx.currentTime + i * beepEvery;

        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type          = "square";
        osc.frequency.value = 880;

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + beepLen);

        osc.start(startTime);
        osc.stop(startTime + beepLen);

        alarmNodesRef.current.push(osc);
      }

      alarmActiveRef.current = true;
      setAlarmActive(true);

      // Auto-stop after duration — read from ref so it's always current
      alarmTimerRef.current = setTimeout(() => {
        stopAlarm();
      }, alarmDurationRef.current + 200);

    } catch (e) {
      console.warn("Audio error:", e);
    }
  }, [stopAlarm]); // no state deps — uses refs internally to avoid stale closures

  // ─────────────────────────────────────────────────────────
  // DROWSY TRIGGER — called whenever drowsiness is confirmed
  // (either by EAR or CNN). Handles UI hold + alarm.
  // ─────────────────────────────────────────────────────────
  const triggerDrowsy = useCallback((overrideResult = null, detectedBy = "CNN") => {
    // Update drowsy streak counter
    drowsyCountRef.current += 1;
    setDrowsyCount(drowsyCountRef.current);
    isDrowsyRef.current = true;
    setIsDrowsyState(true);

    // Override result card to show DROWSY
    if (overrideResult) {
      setResult(overrideResult);
    }

    // Hold DROWSY in ResultCard for DROWSY_HOLD_MS even after detection stops
    clearTimeout(drowsyHoldRef.current);
    drowsyHoldRef.current = setTimeout(() => {
      isDrowsyRef.current = false;
      setIsDrowsyState(false);
    }, DROWSY_HOLD_MS);

    // Save to MongoDB + trigger alarm ONCE when streak threshold is first hit
    if (drowsyCountRef.current === ALARM_THRESHOLD) {
      playAlarm();

      // Save this drowsy event to MongoDB (one record per event, not per frame)
      const eventData = overrideResult || {};
      fetch("http://127.0.0.1:3000/api/save-drowsy-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          predicted_class: eventData.predicted_class || "eyes_closed",
          state:           "DROWSY",
          confidence:      eventData.confidence || {},
          detectedBy:      detectedBy,
        }),
      })
        .then((r) => r.json())
        .then((saved) => console.log("💾 Drowsy event saved:", saved._id))
        .catch((err) => console.warn("Save drowsy event failed:", err.message));
    }
  }, [playAlarm, token]);

  // ─────────────────────────────────────────────────────────
  // CAPTURE FRAME (center-cropped 224×224)
  // ─────────────────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const vw   = video.videoWidth;
    const vh   = video.videoHeight;
    const size = Math.min(vw, vh) * 0.7;
    const sx   = (vw - size) / 2;
    const sy   = (vh - size) / 2;

    canvas.width  = 224;
    canvas.height = 224;
    canvas.getContext("2d").drawImage(video, sx, sy, size, size, 0, 0, 224, 224);

    return canvas.toDataURL("image/jpeg", 0.9);
  }, []);

  // ─────────────────────────────────────────────────────────
  // SEND FRAME — EAR check + CNN backend prediction
  // ─────────────────────────────────────────────────────────
  const sendFrame = useCallback(async () => {
    const base64 = captureFrame();
    if (!base64) return;

    // ── 1. MediaPipe EAR Detection ───────────────────────
    if (faceLandmarkerRef.current && videoRef.current) {
      try {
        const mpResult = faceLandmarkerRef.current.detectForVideo(
          videoRef.current,
          performance.now()
        );

        if (mpResult.faceLandmarks?.length > 0) {
          const lm  = mpResult.faceLandmarks[0];
          const ear = (calculateEAR(lm, LEFT_EYE) + calculateEAR(lm, RIGHT_EYE)) / 2;
          setEarValue(ear);

          if (ear < EAR_THRESHOLD) {
            eyeClosedFramesRef.current += 1;

            if (eyeClosedFramesRef.current >= EAR_CONSEC_FRAMES) {
              triggerDrowsy({
                predicted_class: "eyes_closed",
                state:           "DROWSY",
                confidence:      { eyes_closed: 99.9, notdrowsy: 0.1 },
                createdAt:       new Date().toISOString(),
              }, "EAR");
            }
          } else {
            eyeClosedFramesRef.current = 0;
          }
        }
      } catch (e) {
        console.warn("MediaPipe error:", e);
      }
    }

    // ── 2. CNN Backend Prediction ────────────────────────
    try {
      const res = await fetch("http://127.0.0.1:3000/api/detect-frame", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) throw new Error("Prediction failed");

      const data = await res.json();

      const cnnDrowsy = DROWSY_CLASSES.includes(data.predicted_class);

      if (cnnDrowsy) {
        triggerDrowsy(data, "CNN");
      } else {
        // Only update result card if we're NOT currently holding a DROWSY state
        // Only update result if we are NOT currently holding a DROWSY state
        if (!isDrowsyRef.current) {
          setResult(data);
        }
        // Reset streak only if EAR also says not drowsy
        if (eyeClosedFramesRef.current === 0) {
          drowsyCountRef.current = 0;
          setDrowsyCount(0);
        }
      }

      setError("");
      frameCountRef.current += 1;
      setFrameCount(frameCountRef.current);

    } catch (err) {
      setError(err.message);
    }
  }, [captureFrame, token, triggerDrowsy]);

  // ─────────────────────────────────────────────────────────
  // START DETECTION
  // ─────────────────────────────────────────────────────────
  const startDetection = useCallback(async () => {
    setError("");
    setResult(null);
    setIsDrowsyState(false);
    drowsyCountRef.current   = 0;
    eyeClosedFramesRef.current = 0;
    frameCountRef.current    = 0;
    setDrowsyCount(0);
    setFrameCount(0);
    setAlarmActive(false);

    try {
      // Start webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Init MediaPipe FaceLandmarker
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });
      faceLandmarkerRef.current = faceLandmarker;

      // Start capture loop
      setTimeout(() => {
        intervalRef.current = setInterval(sendFrame, CAPTURE_INTERVAL_MS);
        setIsRunning(true);
      }, 1000);

    } catch (err) {
      console.error(err);
      setError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions."
          : "Could not access webcam: " + err.message
      );
    }
  }, [sendFrame]);

  // ─────────────────────────────────────────────────────────
  // STOP DETECTION
  // ─────────────────────────────────────────────────────────
  const stopDetection = useCallback(() => {
    clearInterval(intervalRef.current);
    clearTimeout(alarmTimerRef.current);
    // Note: do NOT clear drowsyHoldRef here — we want DROWSY to persist
    // in ResultCard for DROWSY_HOLD_MS even after camera stops

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    stopAlarm();
    setIsRunning(false);
    drowsyCountRef.current     = 0;
    eyeClosedFramesRef.current = 0;
    setDrowsyCount(0);
  }, [stopAlarm]);

  // ─────────────────────────────────────────────────────────
  // CLEANUP ON UNMOUNT
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopDetection();
      clearTimeout(drowsyHoldRef.current);
    };
  }, [stopDetection]);

  // ─────────────────────────────────────────────────────────
  // EXPORTS
  // ─────────────────────────────────────────────────────────
  return {
    // Refs for video/canvas elements
    videoRef,
    canvasRef,

    // State
    isRunning,
    result,
    error,
    drowsyCount,
    alarmActive,
    frameCount,
    earValue,
    isDrowsyState,    // use this for STATUS widget (true = ALERT, false = OK)
    alarmDurationMs,
    setAlarmDurationMs,

    // Actions
    startDetection,
    stopDetection,
    stopAlarm,

    // Constants (for UI display)
    ALARM_THRESHOLD,
    DROWSY_HOLD_MS,
  };
}


// import {
//   useState,
//   useRef,
//   useCallback,
//   useEffect,
// } from "react";

// import {
//   FilesetResolver,
//   FaceLandmarker,
// } from "@mediapipe/tasks-vision";

// // =========================================================
// // EYE LANDMARKS
// // =========================================================

// const LEFT_EYE = [33, 160, 158, 133, 153, 144];
// const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

// // =========================================================
// // SETTINGS
// // =========================================================

// const EAR_THRESHOLD = 0.35;
// const EAR_CONSEC_FRAMES = 3;

// const DROWSY_CLASSES = [
//   "sleepy",
//   "slowBlink",
//   "yawning",
// ];

// const ALARM_THRESHOLD = 3;
// const CAPTURE_INTERVAL_MS = 300;
// const DROWSY_COMBINED_THRESHOLD = 20;
// const ALARM_COOLDOWN_MS = 5000;

// // =========================================================
// // UTILITY FUNCTIONS
// // =========================================================

// function distance(a, b) {
//   return Math.sqrt(
//     Math.pow(a.x - b.x, 2) +
//       Math.pow(a.y - b.y, 2)
//   );
// }

// function calculateEAR(
//   landmarks,
//   eyeIndices
// ) {
//   const p1 = landmarks[eyeIndices[0]];
//   const p2 = landmarks[eyeIndices[1]];
//   const p3 = landmarks[eyeIndices[2]];
//   const p4 = landmarks[eyeIndices[3]];
//   const p5 = landmarks[eyeIndices[4]];
//   const p6 = landmarks[eyeIndices[5]];

//   const vertical1 = distance(p2, p6);
//   const vertical2 = distance(p3, p5);
//   const horizontal = distance(p1, p4);

//   return (
//     (vertical1 + vertical2) /
//     (2.0 * horizontal)
//   );
// }

// function getCombinedDrowsy(confidence) {
//   if (!confidence) return 0;

//   return DROWSY_CLASSES.reduce(
//     (sum, cls) => sum + (confidence[cls] || 0),
//     0
//   );
// }

// // =========================================================
// // MAIN HOOK
// // =========================================================

// export function useWebcamDetection(token) {
//   const drowsyTimeoutRef = useRef(null);
//   const [isRunning, setIsRunning] =
//     useState(false);

//   const [result, setResult] =
//     useState(null);

//   const [error, setError] =
//     useState("");

//   const [drowsyCount, setDrowsyCount] =
//     useState(0);

//   const [alarmActive, setAlarmActive] =
//     useState(false);

//   const [frameCount, setFrameCount] =
//     useState(0);

//   const [earValue, setEarValue] =
//     useState(0);

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   const intervalRef = useRef(null);
//   const streamRef = useRef(null);

//   const faceLandmarkerRef = useRef(null);

//   const eyeClosedFramesRef = useRef(0);
//   const drowsyCountRef = useRef(0);
//   const frameCountRef = useRef(0);

//   const lastAlarmTimeRef = useRef(0);

//   // =========================================================
//   // ALARM
//   // =========================================================

//   const playAlarmTone = useCallback(() => {
//     const now = Date.now();

//     if (
//       now - lastAlarmTimeRef.current <
//       ALARM_COOLDOWN_MS
//     ) {
//       return;
//     }

//     lastAlarmTimeRef.current = now;

//     try {
//       const ctx = new (
//         window.AudioContext ||
//         window.webkitAudioContext
//       )();

//       const playBeep = (
//         startTime,
//         freq = 850
//       ) => {
//         const osc =
//           ctx.createOscillator();

//         const gain =
//           ctx.createGain();

//         osc.connect(gain);
//         gain.connect(ctx.destination);

//         osc.type = "square";
//         osc.frequency.value = freq;

//         gain.gain.setValueAtTime(
//           0.3,
//           startTime
//         );

//         gain.gain.exponentialRampToValueAtTime(
//           0.001,
//           startTime + 0.35
//         );

//         osc.start(startTime);
//         osc.stop(startTime + 0.35);
//       };

//       playBeep(ctx.currentTime);
//       playBeep(ctx.currentTime + 0.4);
//       playBeep(ctx.currentTime + 0.8);

//       setAlarmActive(true);

//     } catch (e) {
//       console.warn("Audio error:", e);
//     }
//   }, []);

//   // =========================================================
//   // CAPTURE FRAME
//   // =========================================================

//   const captureFrame = useCallback(() => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;

//     if (!video || !canvas) return null;

//     if (video.readyState < 2) return null;

//     const ctx =
//       canvas.getContext("2d");

//     const videoWidth =
//       video.videoWidth;

//     const videoHeight =
//       video.videoHeight;

//     const size =
//       Math.min(
//         videoWidth,
//         videoHeight
//       ) * 0.7;

//     const sx =
//       (videoWidth - size) / 2;

//     const sy =
//       (videoHeight - size) / 2;

//     canvas.width = 224;
//     canvas.height = 224;

//     ctx.drawImage(
//       video,
//       sx,
//       sy,
//       size,
//       size,
//       0,
//       0,
//       224,
//       224
//     );

//     return canvas.toDataURL(
//       "image/jpeg",
//       0.9
//     );
//   }, []);

//   // =========================================================
//   // SEND FRAME
//   // =========================================================

//   const sendFrame = useCallback(async () => {
//     const base64 = captureFrame();

//     if (!base64) return;

//     try {
//       // =====================================================
//       // MEDIAPIPE EAR DETECTION
//       // =====================================================

//       if (
//         faceLandmarkerRef.current &&
//         videoRef.current
//       ) {
//         const results =
//           faceLandmarkerRef.current.detectForVideo(
//             videoRef.current,
//             performance.now()
//           );

//         if (
//           results.faceLandmarks &&
//           results.faceLandmarks.length > 0
//         ) {
//           const landmarks =
//             results.faceLandmarks[0];

//           const leftEAR =
//             calculateEAR(
//               landmarks,
//               LEFT_EYE
//             );

//           const rightEAR =
//             calculateEAR(
//               landmarks,
//               RIGHT_EYE
//             );

//           const avgEAR =
//             (leftEAR + rightEAR) / 2;

//           setEarValue(avgEAR);

//           console.log(
//             "EAR:",
//             avgEAR
//           );

//           // =============================================
//           // EYE CLOSURE DETECTION
//           // =============================================

//           if (avgEAR < EAR_THRESHOLD) {
//             eyeClosedFramesRef.current += 1;

//             console.log(
//               "Eyes Closed Frames:",
//               eyeClosedFramesRef.current
//             );

//           if (
//             eyeClosedFramesRef.current >=
//             EAR_CONSEC_FRAMES
//             ) {
//             console.log(
//                 "EAR DROWSINESS DETECTED"
//             );

//             // =====================================
//             // UPDATE DROWSY STREAK
//             // =====================================

//             // drowsyCountRef.current += 1;

//             if (!alarmActive) {

//               drowsyCountRef.current += 1;

//               setDrowsyCount(
//                 drowsyCountRef.current
//               );

//               playAlarmTone();
//             }

//             setDrowsyCount(
//             drowsyCountRef.current
//             );

//             // =====================================
//             // FORCE UI TO SHOW DROWSY
//             // =====================================

//             setResult((prev) => ({
//                 ...prev,

//                 predicted_class: "eyes_closed",

//                 state: "DROWSY",

//                 confidence: {
//                     ...(prev?.confidence || {}),
//                     eyes_closed: 99.9,
//                 },
//                 }));

//                 // =====================================
//                 // HOLD DROWSY UI FOR FEW SECONDS
//                 // =====================================

//                 if (drowsyTimeoutRef.current) {
//                 clearTimeout(drowsyTimeoutRef.current);
//                 }

//                 drowsyTimeoutRef.current = setTimeout(() => {

//                   setAlarmActive(false);

//                   setResult((prev) => ({
//                     ...prev,

//                     predicted_class: "notDrowsy",

//                     state: "NOT DROWSY",
//                   }));

//                 }, 1500);

//             // playAlarmTone();
//             }

//           } else {
//             eyeClosedFramesRef.current = 0;
//           }
//         }
//       }

//       // =====================================================
//       // CNN BACKEND PREDICTION
//       // =====================================================

//       const res = await fetch(
//         "http://127.0.0.1:3000/api/detect-frame",
//         {
//           method: "POST",

//           headers: {
//             "Content-Type":
//               "application/json",

//             ...(token
//               ? {
//                   Authorization: `Bearer ${token}`,
//                 }
//               : {}),
//           },

//           body: JSON.stringify({
//             imageBase64: base64,
//           }),
//         }
//       );

//       if (!res.ok) {
//         throw new Error(
//           "Prediction failed"
//         );
//       }

//       const data = await res.json();

//       // setResult(data);
//       if (!alarmActive) {
//         setResult(data);
//       }

//       setError("");

//       const combinedDrowsy =
//         getCombinedDrowsy(
//           data.confidence
//         );

//       const cnnDrowsy =
//         DROWSY_CLASSES.includes(
//           data.predicted_class
//         ) ||
//         combinedDrowsy >=
//           DROWSY_COMBINED_THRESHOLD;

//       if (cnnDrowsy) {
//         drowsyCountRef.current += 1;

//         setDrowsyCount(
//           drowsyCountRef.current
//         );

//         if (
//           drowsyCountRef.current >=
//           ALARM_THRESHOLD
//         ) {
//           playAlarmTone();
//         }

//       } else {
//         drowsyCountRef.current = 0;

//         setDrowsyCount(0);
//       }

//       frameCountRef.current += 1;

//       setFrameCount(
//         frameCountRef.current
//       );

//     } catch (err) {
//       console.error(err);
//       setError(err.message);
//     }
//   }, [captureFrame, token, playAlarmTone]);

//   // =========================================================
//   // START DETECTION
//   // =========================================================

//   const startDetection =
//     useCallback(async () => {
//       setError("");
//       setResult(null);

//       try {
//         const stream =
//           await navigator.mediaDevices.getUserMedia(
//             {
//               video: {
//                 width: 640,
//                 height: 480,
//                 facingMode: "user",
//               },

//               audio: false,
//             }
//           );

//         streamRef.current = stream;

//         if (videoRef.current) {
//           videoRef.current.srcObject =
//             stream;

//           await videoRef.current.play();
//         }

//         // =====================================================
//         // INITIALIZE MEDIAPIPE
//         // =====================================================

//         const vision =
//           await FilesetResolver.forVisionTasks(
//             "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
//           );

//         const faceLandmarker =
//           await FaceLandmarker.createFromOptions(
//             vision,
//             {
//               baseOptions: {
//                 modelAssetPath:
//                   "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
//               },

//               runningMode: "VIDEO",

//               numFaces: 1,
//             }
//           );

//         faceLandmarkerRef.current =
//           faceLandmarker;

//         console.log(
//           "Face Landmarker Initialized"
//         );

//         // =====================================================
//         // START LOOP
//         // =====================================================

//         setTimeout(() => {
//           intervalRef.current =
//             setInterval(
//               sendFrame,
//               CAPTURE_INTERVAL_MS
//             );

//           setIsRunning(true);

//         }, 1000);

//       } catch (err) {
//         console.error(err);

//         setError(
//           "Could not access webcam"
//         );
//       }
//     }, [sendFrame]);

//   // =========================================================
//   // STOP DETECTION
//   // =========================================================

//   const stopDetection =
//     useCallback(() => {
//       clearInterval(
//         intervalRef.current
//       );

//       if (streamRef.current) {
//         streamRef.current
//           .getTracks()
//           .forEach((track) =>
//             track.stop()
//           );

//         streamRef.current = null;
//       }

//       if (videoRef.current) {
//         videoRef.current.srcObject =
//           null;
//       }

//       setIsRunning(false);

//       setAlarmActive(false);

//       drowsyCountRef.current = 0;
//       eyeClosedFramesRef.current = 0;

//       setDrowsyCount(0);

//     }, []);

//   // =========================================================
//   // CLEANUP
//   // =========================================================

//   useEffect(() => {
//     return () => {
//       stopDetection();
//     };
//   }, [stopDetection]);

//   return {
//     videoRef,
//     canvasRef,

//     isRunning,
//     result,
//     error,

//     drowsyCount,
//     alarmActive,
//     frameCount,
//     earValue,

//     startDetection,
//     stopDetection,

//     EAR_THRESHOLD,
//     ALARM_THRESHOLD,
//   };
// }