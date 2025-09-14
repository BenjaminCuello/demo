import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRequireRut } from '../hooks/useRequireRut';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/Confirm';

type ProjSaved = { _id: string; nombre?: string; isFavorite?: boolean; totalCreditos: number; createdAt: string; items: { codigo: string; asignatura: string; creditos: number; nivel: number; nrc?: string }[] };

export default function Projections() {
  const rut = useRequireRut();
  const [list, setList] = useState<ProjSaved[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  async function load() {
    setLoading(true);
    try {
      const data = await api<ProjSaved[]>(`/proyecciones/mias?rut=${encodeURIComponent(rut)}`);
      setList(data);
    } catch (e) {
      toast({ type: 'error', message: (e as Error).message || 'Error al cargar' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (rut) void load();
  }, [rut]);

  async function favorita(id: string) {
    const ok = await confirm({ title: 'Marcar favorita', description: 'Esto reemplazara tu favorita anterior. ¿Continuar?' });
    if (!ok) return;
    await api(`/proyecciones/favorita/${id}`, { method: 'PATCH', body: JSON.stringify({ rut }) });
    toast({ type: 'success', message: 'Marcada como favorita' });
    await load();
  }

  async function borrar(id: string) {
    const ok = await confirm({ title: 'Borrar proyeccion', description: 'Esta accion es irreversible. ¿Continuar?' });
    if (!ok) return;
    await api(`/proyecciones/${id}?rut=${encodeURIComponent(rut)}`, { method: 'DELETE' });
    toast({ type: 'success', message: 'Proyeccion borrada' });
    await load();
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Mis Proyecciones</h2>
      {loading && <div className="mt-2">Cargando...</div>}
      <div className="mt-3 space-y-3">
        {list.map((p) => (
          <div key={p._id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.nombre || p._id} {p.isFavorite ? '⭐' : ''}</div>
              <div className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-sm text-gray-600">Créditos: {p.totalCreditos}</div>
            <div className="mt-2 flex gap-2">
              <button className="btn" onClick={() => favorita(p._id)}>Marcar favorita</button>
              <button className="btn" onClick={() => borrar(p._id)}>Borrar</button>
            </div>
          </div>
        ))}
        {list.length === 0 && !loading && <div>No hay proyecciones</div>}
      </div>
    </div>
  );
}
