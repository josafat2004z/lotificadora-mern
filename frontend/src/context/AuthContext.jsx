import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/cliente';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('lotificadora_usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  const iniciarSesion = useCallback(async (nombreUsuario, contrasena) => {
    const { data } = await api.post('/auth/login', { nombreUsuario, contrasena });
    localStorage.setItem('lotificadora_token', data.token);
    localStorage.setItem('lotificadora_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem('lotificadora_token');
    localStorage.removeItem('lotificadora_usuario');
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
