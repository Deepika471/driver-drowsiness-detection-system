import { useState, useRef, useCallback } from 'react';
import { Upload, ImagePlus, X, Zap, AlertCircle, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ResultCard from '../components/ResultCard';

export default function DetectPage() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Only image files are supported (JPG, PNG, WEBP).');
      return;
    }
    setFile(f);
    setResult(null);
    setError('');
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    handleFile(dropped);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // const handleAnalyze = async () => {
  //   if (!file) { setError('Please upload an image first.'); return; }
  //   setLoading(true);
  //   setError('');
  //   setResult(null);

  //   try {
  //     const formData = new FormData();
  //     formData.append('image', file);

  //     const res = await fetch('http://localhost:3000/api/predict', {
  //       method: 'POST',
  //       headers: token ? { Authorization: `Bearer ${token}` } : {},
  //       body: formData,
  //     });

  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.message || 'Detection failed. Please try again.');
  //     setResult(data);
  //   } catch (err) {
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleAnalyze = async () => {
  if (!file) {
    setError('Please upload an image first.');
    return;
  }

  setLoading(true);
  setError('');
  setResult(null);

  try {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('http://127.0.0.1:3000/api/detect', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Detection failed. Please try again.');
    }

    // ✅ This already includes DB-stored record
    setResult(data);

    console.log("Prediction saved to MongoDB ✅", data);

  } catch (err) {
    console.error("Frontend error:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-void grid-bg pt-24 pb-16 px-6">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-accent/40" />
            <span className="font-mono text-xs text-accent tracking-widest">ANALYSIS MODULE</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black text-text tracking-wide">
            DROWSINESS <span className="text-accent">DETECTOR</span>
          </h1>
          <p className="font-body text-sm text-text-dim mt-2 max-w-lg">
            Upload a driver image for immediate AI analysis. Results include state classification and confidence breakdown.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Upload */}
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed transition-all duration-300 cursor-pointer min-h-64 flex flex-col items-center justify-center overflow-hidden
                ${dragging
                  ? 'border-accent bg-accent/10'
                  : file
                  ? 'border-border cursor-default'
                  : 'border-border hover:border-accent/50 hover:bg-panel/40'
                }`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
            >
              {/* Corner marks */}
              <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-accent/30" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-accent/30" />

              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain max-h-72"
                  />
                  {/* Overlay scanlines */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
                    }}
                  />
                  {/* Clear button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    className="absolute top-3 right-3 w-8 h-8 bg-danger/80 hover:bg-danger flex items-center justify-center transition-colors"
                    style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>

                  {/* Filename bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-void/80 backdrop-blur-sm px-3 py-2 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <span className="font-mono text-xs text-text-dim truncate">{file?.name}</span>
                  </div>
                </>
              ) : (
                <div className="text-center px-8 py-12">
                  <div className="w-16 h-16 border border-border bg-panel/40 flex items-center justify-center mx-auto mb-4"
                    style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}>
                    <ImagePlus className={`w-7 h-7 ${dragging ? 'text-accent' : 'text-muted'} transition-colors`} />
                  </div>
                  <p className="font-body text-sm text-text-dim mb-2">
                    {dragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="font-mono text-xs text-muted tracking-wider">SUPPORTED: JPG · PNG · WEBP</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {/* Upload button if no file yet */}
            {!file && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full btn-outline flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                SELECT IMAGE FILE
              </button>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-danger/10 border border-danger/30 px-4 py-3 text-danger text-xs font-body"
                style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Analyze Button */}
            {file && (
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed py-4"
                style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)', boxShadow: loading ? 'none' : '0 0 30px rgba(0,212,255,0.25)' }}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-void/30 border-t-void rounded-full animate-spin" />
                    <span>ANALYZING IMAGE...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>RUN ANALYSIS</span>
                  </>
                )}
              </button>
            )}

            {/* Loading animation */}
            {loading && (
              <div className="border border-accent/20 bg-panel/40 p-4"
                style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  <span className="font-mono text-xs text-accent tracking-widest">PROCESSING</span>
                </div>
                <div className="space-y-2">
                  {['Loading model weights', 'Preprocessing image', 'Running inference', 'Computing softmax'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                        style={{ animationDelay: `${i * 0.4}s` }}
                      />
                      <span className="font-mono text-xs text-text-dim">{step}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Result */}
          <div>
            {result ? (
              <div className="animate-[fadeIn_0.4s_ease-out]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                  <span className="font-mono text-xs text-text-dim tracking-widest">ANALYSIS OUTPUT</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                </div>
                <ResultCard result={result} />
              </div>
            ) : (
              <div
                className="border border-dashed border-border bg-panel/20 p-10 flex flex-col items-center justify-center min-h-64 text-center"
                style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
              >
                <div className="w-14 h-14 border border-border flex items-center justify-center mb-4 opacity-40">
                  <Eye className="w-6 h-6 text-text-dim" />
                </div>
                <p className="font-display text-xs text-text-dim tracking-widest">AWAITING INPUT</p>
                <p className="font-body text-xs text-muted mt-2">Upload an image and run analysis to see results here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
