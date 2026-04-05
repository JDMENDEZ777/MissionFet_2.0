<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Proyecto;
use App\Models\Pasantia;
use App\Models\Seminario;
use App\Models\SolicitudRegistro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // arreglo del error de user/auth del VS

class DashboardController extends Controller
{
    public function index()
    {
        // Usamos la Facada Auth que es mejor reconocida por VS Code
        $user = Auth::user();

        return response()->json([
            // Usamos 'name' que es la columna real en tu tabla 'users'
            'nombreUsuario' => $user?->name ?? 'Administrador',
            
            'usuariosPendientesCount' => SolicitudRegistro::where('estado', 'pendiente')->count(),
            'totalEstudiantes' => User::where('rol', 'estudiante')->count(),
            
            'totalProyectos' => Proyecto::count(),
            'totalPasantias' => Pasantia::count(),
            'totalSeminarios' => Seminario::count(),
            
            // PROYECTOS RECIENTES
            'proyectosRecientes' => Proyecto::with('user')->latest()->take(2)->get()->map(fn($p) => [
                'titulo' => $p->titulo,
                // Ojo: cambiamos 'nombre' por 'name' aquí también
                'tutor_nombre' => $p->user?->name ?? 'Sin asignar',
                'estado' => $p->estado,
                'fecha_creacion' => $p->created_at
            ]),

            // SEMINARIOS RECIENTES
            'seminariosRecientes' => Seminario::latest()->take(2)->get()->map(fn($s) => [
                'titulo' => $s->nombre,
                'tutor_nombre' => 'Por asignar',
                'estado' => $s->estado,
                'fecha' => $s->fecha_realizacion,
                'num_inscritos' => 0,
                'cupos' => $s->cupos_totales
            ]),

            // PASANTÍAS RECIENTES
            'pasantiasRecientes' => Pasantia::with('user')->latest()->take(2)->get()->map(fn($pa) => [
                'titulo' => "Pasantía en " . $pa->empresa,
                // Ojo: cambiamos 'nombre' por 'name' aquí también
                'estudiante_nombre' => $pa->user?->name ?? 'N/A',
                'empresa' => $pa->empresa,
                'estado' => $pa->estado,
                'fecha_inicio' => $pa->created_at
            ])
        ]);
    }
}