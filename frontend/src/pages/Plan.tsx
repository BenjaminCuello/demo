import { FormEvent, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../store/appStore';
import { useRequireRut } from '../hooks/useRequireRut';
import { useToast } from '../components/Toast';

type Proj = { seleccion: { codigo: string; asignatura: string; creditos: number; nivel: number; nrc?: string; motivo: string }[]; totalCreditos: number };

export default function Plan() {
  const rut = useRequireRut();
  const { seleccion: sel, setSeleccion: setSel, carreras, tope, setTope, period, setPeriod } = useApp();
  const [proj, setProj] = useState<Proj | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const disabled = useMemo(() => !rut || !sel, [rut, sel]);

  async function generar(e: FormEvent) {
    e.preventDefault();
    if (!sel) return;
    setLoading(true);
    try {
      const data = await api<Proj>('/proyecciones/generar', {
        method: 'POST',
        body: JSON.stringify({ rut, codCarrera: sel.codCarrera, catalogo: sel.catalogo, topeCreditos: tope }),
      });
      setProj(data);
      toast({ type: 'success', message: 'Proyeccion generada' });
    } catch (e) {
      toast({ type: 'error', message: (e as Error).message || 'Error al generar' });
    } finally {
      setLoading(false);
    }
  }

  async function generarConOferta(e: FormEvent) {
    e.preventDefault();
    if (!sel) return;
    setLoading(true);
    try {
      const data = await api<Proj>('/proyecciones/generar-con-oferta', {
        method: 'POST',
        body: JSON.stringify({ rut, codCarrera: sel.codCarrera, catalogo: sel.catalogo, topeCreditos: tope, period }),
      });
      setProj(data);
      toast({ type: 'success', message: 'Proyeccion con oferta generada' });
    } catch (e) {
      toast({ type: 'error', message: (e as Error).message || 'Error al generar con oferta' });
    } finally {
      setLoading(false);
    }
  }

  async function guardar(favorite: boolean) {
    if (!sel || !proj) return;
    const saved = await api('/proyecciones/guardar', {
      method: 'POST',
      body: JSON.stringify({ rut, codCarrera: sel.codCarrera, catalogo: sel.catalogo, topeCreditos: tope, favorite, nombre: 'mi plan' }),
    });
    console.log('guardado', saved);
    toast({ type: 'success', message: favorite ? 'Guardada como favorita' : 'Proyeccion guardada' });
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-semibold">Generar Proyeccion</h2>
        <form className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={generar}>
          <div>
            <label className="label">RUT</label>
            <input className="input" value={rut} readOnly />
          </div>
          <div>
            <label className="label">Carrera/Catálogo</label>
            <select
              className="input"
              value={sel ? `${sel.codCarrera}-${sel.catalogo}` : ''}
              onChange={(e) => {
                const [codCarrera, catalogo] = e.target.value.split('-');
                setSel({ codCarrera, catalogo });
              }}
            >
              {carreras.map((c) => (
                <option key={`${c.codigo}-${c.catalogo}`} value={`${c.codigo}-${c.catalogo}`}>
                  {c.nombre} ({c.codigo}-{c.catalogo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tope Creditos</label>
            <input className="input" type="number" value={tope} onChange={(e) => setTope(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Periodo (para oferta)</label>
            <input className="input" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button className="btn" disabled={disabled || loading} type="submit">{loading ? '...' : 'Generar'}</button>
            <button className="btn" disabled={disabled || loading} onClick={generarConOferta}>Con Oferta</button>
          </div>
        </form>
      </div>

      {proj && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Seleccion ({proj.totalCreditos} créditos)</h3>
            <div className="flex gap-2">
              <button className="btn" onClick={() => guardar(false)}>Guardar</button>
              <button className="btn" onClick={() => guardar(true)}>Guardar como Favorita</button>
            </div>
          </div>
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Asignatura</th>
                  <th className="py-2 pr-4">Créditos</th>
                  <th className="py-2 pr-4">Nivel</th>
                  <th className="py-2 pr-4">Motivo</th>
                  <th className="py-2 pr-4">NRC</th>
                </tr>
              </thead>
              <tbody>
                {proj.seleccion.map((c) => (
                  <tr key={c.codigo} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4">{c.codigo}</td>
                    <td className="py-2 pr-4">{c.asignatura}</td>
                    <td className="py-2 pr-4">{c.creditos}</td>
                    <td className="py-2 pr-4">{c.nivel}</td>
                    <td className="py-2 pr-4">{c.motivo}</td>
                    <td className="py-2 pr-4">{c.nrc || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
