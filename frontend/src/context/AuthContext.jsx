// import { createContext, useContext, useState, useEffect } from 'react';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const storedToken = localStorage.getItem('dg_token');
//     const storedUser = localStorage.getItem('dg_user');
//     if (storedToken && storedUser) {
//       setToken(storedToken);
//       setUser(JSON.parse(storedUser));
//     }
//     setLoading(false);
//   }, []);

//   const login = (userData, authToken) => {
//     setUser(userData);
//     setToken(authToken);
//     localStorage.setItem('dg_token', authToken);
//     localStorage.setItem('dg_user', JSON.stringify(userData));
//   };

//   const logout = () => {
//     setUser(null);
//     setToken(null);
//     localStorage.removeItem('dg_token');
//     localStorage.removeItem('dg_user');
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be inside AuthProvider');
//   return ctx;
// };

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 LOAD FROM LOCAL STORAGE
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Auth load error:", err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔐 LOGIN
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// 🔁 CUSTOM HOOK
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};