<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Usuarios pendientes en solicitudes_registro
        $usuariosPendientesCount = DB::table('solicitudes_registro')
            ->where('estado', 'pendiente')
            ->count();

        // Total estudiantes en la tabla users
        $totalEstudiantes = DB::table('users')
            ->where('rol', 'estudiante')
            ->count();

        // Totales de cada módulo
        $totalProyectos  = DB::table('proyectos')->count();
        $totalPasantias  = DB::table('pasantias')->count();
        $totalSeminarios = DB::table('seminarios')->count();

        // Proyectos recientes con nombre de tutor
        $proyectosRecientes = DB::table('proyectos')
            ->leftJoin('tutores', 'proyectos.tutor_id', '=', 'tutores.id')
            ->leftJoin('users', 'tutores.user_id', '=', 'users.id')
            ->select(
                'proyectos.titulo',
                'users.name as tutor_nombre',
                'proyectos.estado',
                'proyectos.created_at as fecha_creacion'
            )
            ->orderBy('proyectos.created_at', 'desc')
            ->limit(3)
            ->get();

        // Seminarios recientes con conteo de inscritos
        $seminariosRecientes = DB::table('seminarios')
            ->leftJoin('tutores', 'seminarios.tutor_id', '=', 'tutores.id')
            ->leftJoin('users', 'tutores.user_id', '=', 'users.id')
            ->select(
                'seminarios.id',
                'seminarios.titulo',
                'users.name as tutor_nombre',
                'seminarios.estado',
                'seminarios.fecha',
                'seminarios.cupos'
            )
            ->orderBy('seminarios.created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($s) {
                $inscritos = DB::table('inscripciones_seminario')
                    ->where('seminario_id', $s->id)
                    ->count();
                return [
                    'titulo'       => $s->titulo,
                    'tutor_nombre' => $s->tutor_nombre ?? 'Por asignar',
                    'estado'       => $s->estado,
                    'fecha'        => $s->fecha,
                    'num_inscritos' => $inscritos,
                    'cupos'        => $s->cupos,
                ];
            });

        // Pasantías recientes con nombre del estudiante
        $pasantiasRecientes = DB::table('pasantias')
            ->leftJoin('users', 'pasantias.user_id', '=', 'users.id')
            ->select(
                'pasantias.empresa',
                'users.name as estudiante_nombre',
                'pasantias.estado',
                'pasantias.created_at as fecha_inicio'
            )
            ->orderBy('pasantias.created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($p) {
                return [
                    'titulo'            => 'Pasantía en ' . ($p->empresa ?? 'empresa'),
                    'estudiante_nombre' => $p->estudiante_nombre ?? 'N/A',
                    'empresa'           => $p->empresa ?? 'N/A',
                    'estado'            => $p->estado ?? 'pendiente',
                    'fecha_inicio'      => $p->fecha_inicio,
                ];
            });

        return response()->json([
            'nombreUsuario'           => $user?->name ?? 'Administrador',
            'usuariosPendientesCount' => $usuariosPendientesCount,
            'totalEstudiantes'        => $totalEstudiantes,
            'totalProyectos'          => $totalProyectos,
            'totalPasantias'          => $totalPasantias,
            'totalSeminarios'         => $totalSeminarios,
            'proyectosRecientes'      => $proyectosRecientes,
            'seminariosRecientes'     => $seminariosRecientes,
            'pasantiasRecientes'      => $pasantiasRecientes,
        ]);
    }
}