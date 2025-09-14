// servicio de dominio que selecciona cursos segun reglas sin acentos ni punto final
import type { AvanceItem } from '../entities/avance.entity';
import type { Course } from '../entities/course.entity';

export interface ProjectionInput {
  malla: Course[];
  avance: AvanceItem[];
  topeCreditos: number;
}

export interface ProjectionCourse {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  motivo: 'REPROBADO' | 'PENDIENTE';
  nrc?: string; // <- agregado para no usar any en otros archivos
}

export interface ProjectionResult {
  seleccion: ProjectionCourse[];
  totalCreditos: number;
  reglas: {
    topeCreditos: number;
    priorizaReprobados: true;
    verificaPrereq: true;
  };
}

export class ProjectionService {
  static hasPrereqs(course: Course, aprobados: Set<string>): boolean {
    const p = (course.prereq || '').trim();
    if (!p) return true;
    const reqs = p
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return reqs.every((code) => aprobados.has(code));
  }

  static build(input: ProjectionInput): ProjectionResult {
    const { malla, avance } = input;
    const tope =
      Number.isFinite(input.topeCreditos) && input.topeCreditos > 0
        ? input.topeCreditos
        : 22;

    const aprobados = new Set<string>(
      avance.filter((a) => a.status === 'APROBADO').map((a) => a.course),
    );
    const reprobados = new Set<string>(
      avance.filter((a) => a.status === 'REPROBADO').map((a) => a.course),
    );

    const pendientes = malla.filter((c) => !aprobados.has(c.codigo));

    const candidatos: ProjectionCourse[] = pendientes
      .filter(
        (c) =>
          reprobados.has(c.codigo) ||
          ProjectionService.hasPrereqs(c, aprobados),
      )
      .map(
        (c): ProjectionCourse => ({
          codigo: c.codigo,
          asignatura: c.asignatura,
          creditos: c.creditos,
          nivel: c.nivel,
          motivo: reprobados.has(c.codigo) ? 'REPROBADO' : 'PENDIENTE',
        }),
      );

    candidatos.sort((a, b) => {
      if (a.motivo !== b.motivo) return a.motivo === 'REPROBADO' ? -1 : 1;
      if (a.nivel !== b.nivel) return a.nivel - b.nivel;
      return b.creditos - a.creditos;
    });

    const seleccion: ProjectionCourse[] = [];
    let total = 0;
    for (const c of candidatos) {
      if (total + c.creditos <= tope) {
        seleccion.push(c);
        total += c.creditos;
      }
      if (total >= tope) break;
    }

    return {
      seleccion,
      totalCreditos: total,
      reglas: {
        topeCreditos: tope,
        priorizaReprobados: true,
        verificaPrereq: true,
      },
    };
  }
}
