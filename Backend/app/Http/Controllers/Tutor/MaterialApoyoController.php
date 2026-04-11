<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\MaterialApoyo;
use App\Models\ArchivoMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

/**
 * Controlador de Material de Apoyo para el rol Tutor.
 * Permite subir, listar y eliminar recursos para los estudiantes.
 */
class MaterialApoyoController extends Controller
{
    /**
     * Lista todos los materiales de un seminario.
     * Incluye los archivos descargables de cada material.
     */
    public function index($seminario_id)
    {
        $materiales = MaterialApoyo::with('archivos')
            ->where('seminario_id', $seminario_id)
            ->latest()
            ->get();

        return response()->json(['data' => $materiales]);
    }

    /**
     * Crea un nuevo material con sus archivos adjuntos.
     */
    public function store(Request $request, $seminario_id)
    {
        $request->validate([
            'titulo'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo'        => 'required|in:video,documento,otro',
            'archivos.*'  => 'nullable|file|max:20480', // Máx 20MB
        ]);

        $material = MaterialApoyo::create([
            'seminario_id' => $seminario_id,
            'creado_por'   => Auth::id(),
            'titulo'       => $request->titulo,
            'descripcion'  => $request->descripcion,
            'tipo'         => $request->tipo,
        ]);

        // Procesar y guardar cada archivo adjunto
        if ($request->hasFile('archivos')) {
            foreach ($request->file('archivos') as $archivo) {
                $ruta = $archivo->store("materiales/{$material->id}", 'public');
                ArchivoMaterial::create([
                    'material_id'    => $material->id,
                    'nombre_archivo' => $archivo->getClientOriginalName(),
                    'ruta_archivo'   => $ruta,
                    'tipo_archivo'   => $archivo->getMimeType(),
                    'tamano_archivo' => $archivo->getSize(),
                ]);
            }
        }

        return response()->json(['message' => 'Material creado exitosamente.', 'data' => $material->load('archivos')], 201);
    }

    /**
     * Elimina un material y todos sus archivos físicos del storage.
     */
    public function destroy($seminario_id, $material_id)
    {
        $material = MaterialApoyo::with('archivos')
            ->where('id', $material_id)
            ->where('seminario_id', $seminario_id)
            ->where('creado_por', Auth::id())
            ->firstOrFail();

        // Eliminar archivos físicos del disco
        foreach ($material->archivos as $archivo) {
            Storage::disk('public')->delete($archivo->ruta_archivo);
        }

        $material->delete();

        return response()->json(['message' => 'Material eliminado exitosamente.']);
    }
}
