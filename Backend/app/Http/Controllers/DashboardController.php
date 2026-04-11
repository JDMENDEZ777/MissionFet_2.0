<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Proyecto;
use App\Models\Pasantia;
use App\Models\Seminario;
use App\Models\SolicitudRegistro;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'stats' => [
                'estudiantes' => User::where('rol', 'estudiante')->where('estado', 'activo')->count(),
                'proyectos' => Proyecto::count(),
                'pasantias' => Pasantia::count(),
                'seminarios' => Seminario::count(),
                'pendientes' => SolicitudRegistro::where('estado', 'pendiente')->count(),
            ],
            'recientes' => [
                'proyectos' => Proyecto::latest()->limit(2)->get(),
                'seminarios' => Seminario::latest()->limit(2)->get(),
                'pasantias' => Pasantia::latest()->limit(2)->get(),
            ]
        ]);
    }
}