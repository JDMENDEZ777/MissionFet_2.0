<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\MaterialApoyo;
use App\Models\ArchivoMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

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

    public function store(Request $request, $seminario_id)
    {
        $request->validate([
            'titulo'        => 'required|string|max:255',
            'descripcion'   => 'nullable|string',
            'tipo'          => 'required|in:video_links,documentation,tools,other',
            'plataforma'    => 'nullable|string',
            'enlace'        => 'nullable|url',
            'thumbnail_url' => 'nullable|url',
            'archivos.*'    => 'nullable|file|max:10240',
        ]);

        $material = MaterialApoyo::create([
            'seminario_id'  => $seminario_id,
            'creado_por'    => Auth::id(),
            'titulo'        => $request->titulo,
            'descripcion'   => $request->descripcion,
            'tipo'          => $request->tipo,
            'plataforma'    => $request->plataforma,
            'enlace'        => $request->enlace,
            'thumbnail_url' => $request->thumbnail_url,
        ]);

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

        return response()->json(['message' => 'Material compartido exitosamente.', 'data' => $material->load('archivos')], 201);
    }

    public function destroy($seminario_id, $id)
    {
        $material = MaterialApoyo::where('id', $id)
            ->where('seminario_id', $seminario_id)
            ->firstOrFail();

        foreach ($material->archivos as $archivo) {
            Storage::disk('public')->delete($archivo->ruta_archivo);
        }

        $material->delete();

        return response()->json(['message' => 'Material eliminado.']);
    }
}
