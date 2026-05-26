import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";

import {
  FilesetResolver,
  FaceLandmarker,
} from "@mediapipe/tasks-vision";

// =========================================================
// EYE LANDMARKS
// =========================================================

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

// =========================================================
// SETTINGS
// =========================================================

const EAR_THRESHOLD = 0.35;
const EAR_CONSEC_FRAMES = 2;

const DROWSY_CLASSES = [
  "sleepy",
  "slowBlink",
  "yawning",
];

const ALARM_THRESHOLD = 3;
const CAPTURE_INTERVAL_MS = 700;
const DROWSY_COMBINED_THRESHOLD = 20;
const ALARM_COOLDOWN_MS = 5000;

// =========================================================
// UTILITY FUNCTIONS
// =========================================================

function distance(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2)
  );
}

function calculateEAR(
  landmarks,
  eyeIndices
) {
  const p1 = landmarks[eyeIndices[0]];
  const p2 = landmarks[eyeIndices[1]];
  const p3 = landmarks[eyeIndices[2]];
  const p4 = landmarks[eyeIndices[3]];
  const p5 = landmarks[eyeIndices[4]];
  const p6 = landmarks[eyeIndices[5]];

  const vertical1 = distance(p2, p6);
  const vertical2 = distance(p3, p5);
  const horizontal = distance(p1, p4);

  return (
    (vertical1 + vertical2) /
    (2.0 * horizontal)
  );
}

function getCombinedDrowsy(confidence) {
  if (!confidence) return 0;

  return DROWSY_CLASSES.reduce(
    (sum, cls) => sum + (confidence[cls] || 0),
    0
  );
}

// =========================================================
// MAIN HOOK
// =========================================================

export function useWebcamDetection(token) {
  const drowsyTimeoutRef = useRef(null);
  const [isRunning, setIsRunning] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState("");

  const [drowsyCount, setDrowsyCount] =
    useState(0);

  const [alarmActive, setAlarmActive] =
    useState(false);

  const [frameCount, setFrameCount] =
    useState(0);

  const [earValue, setEarValue] =
    useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const intervalRef = useRef(null);
  const streamRef = useRef(null);

  const faceLandmarkerRef = useRef(null);

  const eyeClosedFramesRef = useRef(0);
  const drowsyCountRef = useRef(0);
  const frameCountRef = useRef(0);

  const lastAlarmTimeRef = useRef(0);

  // =========================================================
  // ALARM
  // =========================================================

  const playAlarmTone = useCallback(() => {
    const now = Date.now();

    if (
      now - lastAlarmTimeRef.current <
      ALARM_COOLDOWN_MS
    ) {
      return;
    }

    lastAlarmTimeRef.current = now;

    try {
      const ctx = new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

      const playBeep = (
        startTime,
        freq = 850
      ) => {
        const osc =
          ctx.createOscillator();

        const gain =
          ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "square";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(
          0.3,
          startTime
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          startTime + 0.35
        );

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      };

      playBeep(ctx.currentTime);
      playBeep(ctx.currentTime + 0.4);
      playBeep(ctx.currentTime + 0.8);

      setAlarmActive(true);

    } catch (e) {
      console.warn("Audio error:", e);
    }
  }, []);

  // =========================================================
  // CAPTURE FRAME
  // =========================================================

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return null;

    if (video.readyState < 2) return null;

    const ctx =
      canvas.getContext("2d");

    const videoWidth =
      video.videoWidth;

    const videoHeight =
      video.videoHeight;

    const size =
      Math.min(
        videoWidth,
        videoHeight
      ) * 0.7;

    const sx =
      (videoWidth - size) / 2;

    const sy =
      (videoHeight - size) / 2;

    canvas.width = 224;
    canvas.height = 224;

    ctx.drawImage(
      video,
      sx,
      sy,
      size,
      size,
      0,
      0,
      224,
      224
    );

    return canvas.toDataURL(
      "image/jpeg",
      0.9
    );
  }, []);

  // =========================================================
  // SEND FRAME
  // =========================================================

  const sendFrame = useCallback(async () => {
    const base64 = captureFrame();

    if (!base64) return;

    try {
      // =====================================================
      // MEDIAPIPE EAR DETECTION
      // =====================================================

      if (
        faceLandmarkerRef.current &&
        videoRef.current
      ) {
        const results =
          faceLandmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now()
          );

        if (
          results.faceLandmarks &&
          results.faceLandmarks.length > 0
        ) {
          const landmarks =
            results.faceLandmarks[0];

          const leftEAR =
            calculateEAR(
              landmarks,
              LEFT_EYE
            );

          const rightEAR =
            calculateEAR(
              landmarks,
              RIGHT_EYE
            );

          const avgEAR =
            (leftEAR + rightEAR) / 2;

          setEarValue(avgEAR);

          console.log(
            "EAR:",
            avgEAR
          );

          // =============================================
          // EYE CLOSURE DETECTION
          // =============================================

          if (avgEAR < EAR_THRESHOLD) {
            eyeClosedFramesRef.current += 1;

            console.log(
              "Eyes Closed Frames:",
              eyeClosedFramesRef.current
            );

          if (
            eyeClosedFramesRef.current >=
            EAR_CONSEC_FRAMES
            ) {
            console.log(
                "EAR DROWSINESS DETECTED"
            );

            // =====================================
            // UPDATE DROWSY STREAK
            // =====================================

            drowsyCountRef.current += 1;

            setDrowsyCount(
            drowsyCountRef.current
            );

            // =====================================
            // FORCE UI TO SHOW DROWSY
            // =====================================

            setResult((prev) => ({
                ...prev,

                predicted_class: "eyes_closed",

                state: "DROWSY",

                confidence: {
                    ...(prev?.confidence || {}),
                    eyes_closed: 99.9,
                },
                }));

                // =====================================
                // HOLD DROWSY UI FOR FEW SECONDS
                // =====================================

                if (drowsyTimeoutRef.current) {
                clearTimeout(drowsyTimeoutRef.current);
                }

                drowsyTimeoutRef.current = setTimeout(() => {
                setResult((prev) => ({
                    ...prev,

                    predicted_class: "notDrowsy",

                    state: "NOT DROWSY",
                }));
                }, 10000);

            playAlarmTone();
            }

          } else {
            eyeClosedFramesRef.current = 0;
          }
        }
      }

      // =====================================================
      // CNN BACKEND PREDICTION
      // =====================================================

      const res = await fetch(
        "http://127.0.0.1:3000/api/detect-frame",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify({
            imageBase64: base64,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Prediction failed"
        );
      }

      const data = await res.json();

      setResult(data);
      setError("");

      const combinedDrowsy =
        getCombinedDrowsy(
          data.confidence
        );

      const cnnDrowsy =
        DROWSY_CLASSES.includes(
          data.predicted_class
        ) ||
        combinedDrowsy >=
          DROWSY_COMBINED_THRESHOLD;

      if (cnnDrowsy) {
        drowsyCountRef.current += 1;

        setDrowsyCount(
          drowsyCountRef.current
        );

        if (
          drowsyCountRef.current >=
          ALARM_THRESHOLD
        ) {
          playAlarmTone();
        }

      } else {
        drowsyCountRef.current = 0;

        setDrowsyCount(0);
      }

      frameCountRef.current += 1;

      setFrameCount(
        frameCountRef.current
      );

    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }, [captureFrame, token, playAlarmTone]);

  // =========================================================
  // START DETECTION
  // =========================================================

  const startDetection =
    useCallback(async () => {
      setError("");
      setResult(null);

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                width: 640,
                height: 480,
                facingMode: "user",
              },

              audio: false,
            }
          );

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();
        }

        // =====================================================
        // INITIALIZE MEDIAPIPE
        // =====================================================

        const vision =
          await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );

        const faceLandmarker =
          await FaceLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
              },

              runningMode: "VIDEO",

              numFaces: 1,
            }
          );

        faceLandmarkerRef.current =
          faceLandmarker;

        console.log(
          "Face Landmarker Initialized"
        );

        // =====================================================
        // START LOOP
        // =====================================================

        setTimeout(() => {
          intervalRef.current =
            setInterval(
              sendFrame,
              CAPTURE_INTERVAL_MS
            );

          setIsRunning(true);

        }, 1000);

      } catch (err) {
        console.error(err);

        setError(
          "Could not access webcam"
        );
      }
    }, [sendFrame]);

  // =========================================================
  // STOP DETECTION
  // =========================================================

  const stopDetection =
    useCallback(() => {
      clearInterval(
        intervalRef.current
      );

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject =
          null;
      }

      setIsRunning(false);

      setAlarmActive(false);

      drowsyCountRef.current = 0;
      eyeClosedFramesRef.current = 0;

      setDrowsyCount(0);

    }, []);

  // =========================================================
  // CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    videoRef,
    canvasRef,

    isRunning,
    result,
    error,

    drowsyCount,
    alarmActive,
    frameCount,
    earValue,

    startDetection,
    stopDetection,

    EAR_THRESHOLD,
    ALARM_THRESHOLD,
  };
}