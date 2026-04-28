<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\MaterialApoyo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MaterialController extends Controller
{
    public function index($seminario_id)
    {
        $materiales = MaterialApoyo::with('archivos')
            ->where('seminario_id', $seminario_id)
            ->latest()
            ->get();

        return response()->json(['data' => $materiales]);
    }
}
