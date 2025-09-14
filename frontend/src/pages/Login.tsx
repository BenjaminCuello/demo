import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../store/appStore';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

type Carrera = { codigo: string; nombre: string; catalogo: string };

export default function Login() {
  const toast = useToast();
  const nav = useNavigate();
  const [email, setEmail] = useState('juan@example.com');
  const [password, setPassword] = useState('1234');
  const { rut, setRut, setCarreras, setSeleccion } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ rut: string; carreras: Carrera[] }>(
        `/ucn/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
      );
      setRut(res.rut);
      setCarreras(res.carreras);
      if (res.carreras[0]) setSeleccion({ codCarrera: res.carreras[0].codigo, catalogo: res.carreras[0].catalogo });
      toast({ type: 'success', message: 'Login exitoso' });
      nav('/plan');
    } catch (e) {
      const msg = (e as Error).message || 'Error de login';
      setError(msg);
      toast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Login UCN</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
      {rut && (
        <div className="mt-4">
          <div className="text-sm text-gray-600">RUT: {rut}</div>
          <div className="mt-2">
            <label className="label">Carrera y catálogo</label>
            <select
              className="input"
              value={seleccion ? `${seleccion.codCarrera}-${seleccion.catalogo}` : ''}
              onChange={(e) => {
                const [codCarrera, catalogo] = e.target.value.split('-');
                setSeleccion({ codCarrera, catalogo });
              }}
            >
              {carreras.map((c) => (
                <option key={`${c.codigo}-${c.catalogo}`} value={`${c.codigo}-${c.catalogo}`}>
                  {c.nombre} ({c.codigo}-{c.catalogo})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {error && <div className="text-red-600 mt-3">{error}</div>}
    </div>
  );
}
