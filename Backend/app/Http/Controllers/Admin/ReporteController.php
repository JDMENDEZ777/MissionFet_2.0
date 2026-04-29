<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    public function getMetricas()
    {
        try {
            // Totales
            $total_estudiantes = DB::table('users')->where('rol', 'estudiante')->where('estado', 'activo')->count();
            $total_tutores = DB::table('users')->where('rol', 'tutor')->where('estado', 'activo')->count();
            $total_proyectos = DB::table('proyectos')->where('tipo', 'proyecto')->count();
            $total_pasantias = DB::table('pasantias')->count();
            $total_seminarios = DB::table('seminarios')->count();

            // Gráficas - agrupaciones
            $distribucion_opcion_grado = DB::table('users')
                ->where('rol', 'estudiante')
                ->whereNotNull('opcion_grado')
                ->select('opcion_grado', DB::raw('COUNT(*) as total'))
                ->groupBy('opcion_grado')
                ->get();

            $proyectos_por_estado = DB::table('proyectos')
                ->where('tipo', 'proyecto')
                ->select('estado', DB::raw('COUNT(*) as total'))
                ->groupBy('estado')
                ->get();

            $pasantias_por_estado = DB::table('pasantias')
                ->select('estado', DB::raw('COUNT(*) as total'))
                ->groupBy('estado')
                ->get();

            $seminarios_por_estado = DB::table('seminarios')
                ->select('estado', DB::raw('COUNT(*) as total'))
                ->groupBy('estado')
                ->get();

            $estudiantes_por_ciclo = DB::table('users')
                ->where('rol', 'estudiante')
                ->whereNotNull('ciclo')
                ->select('ciclo', DB::raw('COUNT(*) as total'))
                ->groupBy('ciclo')
                ->get();

            // Listados para tablas
            $lista_estudiantes = DB::table('users')
                ->where('rol', 'estudiante')
                ->select('id', 'name as nombre', 'email', 'documento', 'codigo_estudiante', 'opcion_grado', 'ciclo', 'estado')
                ->orderBy('name')
                ->get();

            // Proyectos con sus estudiantes
            $proyectos = DB::table('proyectos as p')
                ->leftJoin('users as u', 'p.tutor_id', '=', 'u.id')
                ->where('p.tipo', 'proyecto')
                ->select('p.id', 'p.titulo', 'p.estado', 'p.created_at as fecha_creacion', 'u.name as tutor_nombre')
                ->orderBy('p.created_at', 'desc')
                ->get();

            foreach ($proyectos as $p) {
                $estudiantes = DB::table('estudiantes_proyecto as pe')
                    ->join('users as u', 'pe.estudiante_id', '=', 'u.id')
                    ->where('pe.proyecto_id', $p->id)
                    ->orderBy('u.name')
                    ->pluck('u.name');
                $p->estudiantes = $estudiantes;
            }

            $lista_pasantias = DB::table('pasantias as p')
                ->leftJoin('users as e', 'p.estudiante_id', '=', 'e.id')
                ->leftJoin('users as t', 'p.tutor_id', '=', 't.id')
                ->select(
                    'p.id', 'p.titulo', 'p.empresa', 'p.estado', 'p.fecha_inicio', 'p.fecha_fin',
                    'e.name as estudiante_nombre', 'e.codigo_estudiante',
                    't.name as tutor_nombre'
                )
                ->orderBy('p.id', 'desc')
                ->get();

            $lista_seminarios = DB::table('seminarios as s')
                ->leftJoin('users as u', 's.tutor_id', '=', 'u.id')
                ->select(
                    's.id', 's.titulo', 's.fecha', 's.estado', 's.modalidad', 's.cupos',
                    'u.name as tutor_nombre'
                )
                ->selectSub(function($query) {
                    $query->from('inscripciones_seminario')
                          ->whereColumn('seminario_id', 's.id')
                          ->selectRaw('COUNT(*)');
                }, 'num_inscritos')
                ->orderBy('s.fecha', 'desc')
                ->get();

            return response()->json([
                'total_estudiantes' => $total_estudiantes,
                'total_tutores' => $total_tutores,
                'total_proyectos' => $total_proyectos,
                'total_pasantias' => $total_pasantias,
                'total_seminarios' => $total_seminarios,
                'distribucion_opcion_grado' => $distribucion_opcion_grado,
                'proyectos_por_estado' => $proyectos_por_estado,
                'pasantias_por_estado' => $pasantias_por_estado,
                'seminarios_por_estado' => $seminarios_por_estado,
                'estudiantes_por_ciclo' => $estudiantes_por_ciclo,
                'lista_estudiantes' => $lista_estudiantes,
                'lista_proyectos' => $proyectos,
                'lista_pasantias' => $lista_pasantias,
                'lista_seminarios' => $lista_seminarios
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al cargar los datos: ' . $e->getMessage()], 500);
        }
    }
}
