// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { Eye, EyeOff, Lock, Mail, User, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// function PasswordStrength({ password }) {
//   const checks = [
//     { label: 'Min 8 chars', pass: password.length >= 8 },
//     { label: 'Uppercase', pass: /[A-Z]/.test(password) },
//     { label: 'Number', pass: /[0-9]/.test(password) },
//     { label: 'Special char', pass: /[^A-Za-z0-9]/.test(password) },
//   ];
//   const score = checks.filter(c => c.pass).length;
//   const colors = ['bg-danger', 'bg-warn', 'bg-warn', 'bg-safe'];

//   return (
//     <div className="mt-2">
//       <div className="flex gap-1 mb-2">
//         {[0, 1, 2, 3].map(i => (
//           <div
//             key={i}
//             className={`h-0.5 flex-1 transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-border'}`}
//           />
//         ))}
//       </div>
//       <div className="flex flex-wrap gap-x-4 gap-y-1">
//         {checks.map(c => (
//           <div key={c.label} className={`flex items-center gap-1 font-mono text-xs ${c.pass ? 'text-safe' : 'text-muted'}`}>
//             <CheckCircle className="w-3 h-3" />
//             {c.label}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default function RegisterPage() {
//   const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
//   const [showPass, setShowPass] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setForm(f => ({ ...f, [e.target.name]: e.target.value }));
//     setError('');
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.username || !form.email || !form.password || !form.confirm) {
//       setError('All fields are required.');
//       return;
//     }
//     if (form.password !== form.confirm) {
//       setError('Passwords do not match.');
//       return;
//     }
//     if (form.password.length < 8) {
//       setError('Password must be at least 8 characters.');
//       return;
//     }
//     setLoading(true);
//     try {
//       const res = await fetch('http://localhost:3000/api/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || 'Registration failed');
//       login(data.user, data.token);
//       navigate('/detect');
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-void grid-bg flex items-center justify-center px-6 pt-16 pb-8">
//       <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

//       <div className="relative w-full max-w-md">
//         {/* Top label */}
//         <div className="flex items-center gap-3 mb-6">
//           <div className="h-px flex-1 bg-gradient-to-r from-transparent to-safe/40" />
//           <span className="font-mono text-xs text-safe tracking-widest">OPERATOR_REGISTRATION</span>
//           <div className="h-px flex-1 bg-gradient-to-l from-transparent to-safe/40" />
//         </div>

//         {/* Card */}
//         <div
//           className="relative bg-panel border border-border p-8"
//           style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))' }}
//         >
//           <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-safe/50" />
//           <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-safe/50" />

//           {/* Header */}
//           <div className="mb-8">
//             <div className="inline-flex items-center gap-2 bg-safe/10 border border-safe/20 px-3 py-1.5 mb-4"
//               style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
//               <User className="w-3 h-3 text-safe" />
//               <span className="font-mono text-xs text-safe tracking-widest">NEW OPERATOR</span>
//             </div>
//             <h1 className="font-display text-2xl font-bold text-text tracking-wide">
//               REGISTER <span className="text-safe">ACCOUNT</span>
//             </h1>
//             <p className="font-body text-xs text-text-dim mt-2">Create your DrowseGuard operator profile</p>
//           </div>

//           {/* Error */}
//           {error && (
//             <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 px-4 py-3 mb-6 text-danger text-xs font-body">
//               <AlertCircle className="w-4 h-4 flex-shrink-0" />
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-5">
//             {/* Username */}
//             <div>
//               <label className="font-mono text-xs text-text-dim tracking-widest block mb-2">USERNAME</label>
//               <div className="relative">
//                 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
//                 <input
//                   type="text"
//                   name="username"
//                   value={form.username}
//                   onChange={handleChange}
//                   className="input-field pl-10"
//                   placeholder="operator_handle"
//                   autoComplete="username"
//                 />
//               </div>
//             </div>

//             {/* Email */}
//             <div>
//               <label className="font-mono text-xs text-text-dim tracking-widest block mb-2">EMAIL_ADDRESS</label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
//                 <input
//                   type="email"
//                   name="email"
//                   value={form.email}
//                   onChange={handleChange}
//                   className="input-field pl-10"
//                   placeholder="operator@domain.com"
//                   autoComplete="email"
//                 />
//               </div>
//             </div>

//             {/* Password */}
//             <div>
//               <label className="font-mono text-xs text-text-dim tracking-widest block mb-2">PASSWORD</label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
//                 <input
//                   type={showPass ? 'text' : 'password'}
//                   name="password"
//                   value={form.password}
//                   onChange={handleChange}
//                   className="input-field pl-10 pr-10"
//                   placeholder="••••••••••••"
//                   autoComplete="new-password"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPass(s => !s)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors"
//                 >
//                   {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                 </button>
//               </div>
//               {form.password && <PasswordStrength password={form.password} />}
//             </div>

//             {/* Confirm */}
//             <div>
//               <label className="font-mono text-xs text-text-dim tracking-widest block mb-2">CONFIRM_PASSWORD</label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
//                 <input
//                   type={showPass ? 'text' : 'password'}
//                   name="confirm"
//                   value={form.confirm}
//                   onChange={handleChange}
//                   className={`input-field pl-10 ${
//                     form.confirm && form.confirm !== form.password
//                       ? 'border-danger/60 focus:border-danger'
//                       : form.confirm && form.confirm === form.password
//                       ? 'border-safe/60'
//                       : ''
//                   }`}
//                   placeholder="••••••••••••"
//                   autoComplete="new-password"
//                 />
//                 {form.confirm && (
//                   <div className="absolute right-3 top-1/2 -translate-y-1/2">
//                     {form.confirm === form.password
//                       ? <CheckCircle className="w-4 h-4 text-safe" />
//                       : <AlertCircle className="w-4 h-4 text-danger" />}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full flex items-center justify-center gap-2 mt-2 font-display text-sm font-semibold tracking-widest text-void bg-safe px-8 py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
//               style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)', boxShadow: '0 0 20px rgba(0,255,136,0.2)' }}
//             >
//               {loading ? (
//                 <>
//                   <span className="w-4 h-4 border-2 border-void/40 border-t-void rounded-full animate-spin" />
//                   REGISTERING...
//                 </>
//               ) : (
//                 <>
//                   ACTIVATE ACCOUNT <ChevronRight className="w-4 h-4" />
//                 </>
//               )}
//             </button>
//           </form>

//           {/* Footer */}
//           <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
//             <span className="font-body text-xs text-text-dim">Existing operator?</span>
//             <Link
//               to="/login"
//               className="font-mono text-xs text-accent hover:text-white transition-colors tracking-widest flex items-center gap-1"
//             >
//               LOGIN <ChevronRight className="w-3 h-3" />
//             </Link>
//           </div>
//         </div>

//         <div className="mt-4 flex items-center justify-between">
//           <span className="font-mono text-xs text-muted">v2.4.1</span>
//           <div className="flex items-center gap-2">
//             <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
//             <span className="font-mono text-xs text-text-dim">REGISTRATION OPEN</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'Min 8 chars', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special char', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['bg-danger', 'bg-warn', 'bg-warn', 'bg-safe'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-0.5 flex-1 ${i < score ? colors[score - 1] : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-1 text-xs ${c.pass ? 'text-safe' : 'text-muted'}`}>
            <CheckCircle className="w-3 h-3" />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
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

    // validations
    if (!form.username || !form.email || !form.password || !form.confirm) {
      setError('All fields are required.');
      return;
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // ✅ IMPORTANT CHANGE
      // Only login if token exists
      if (data.token) {
        login(data.user, data.token);
        navigate('/detect');
      } else {
        // 👉 Better UX: redirect to login
        navigate('/login');
      }

    } catch (err) {
      console.error("Register error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-6 pt-16 pb-8">
      <div className="w-full max-w-md bg-panel border border-border p-8">

        <h1 className="text-xl font-bold mb-4">Register</h1>

        {error && (
          <div className="flex items-center gap-2 bg-danger/10 border border-danger px-3 py-2 mb-4 text-sm text-danger">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="input-field w-full"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="input-field w-full"
          />

          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="input-field w-full"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {form.password && <PasswordStrength password={form.password} />}

          <input
            type={showPass ? 'text' : 'password'}
            name="confirm"
            placeholder="Confirm Password"
            value={form.confirm}
            onChange={handleChange}
            className="input-field w-full"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-sm mt-4">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}