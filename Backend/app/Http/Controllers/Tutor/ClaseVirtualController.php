<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\ClaseVirtual;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Controlador de Clases Virtuales para el rol Tutor.
 * Permite programar, editar y eliminar sesiones de clase virtual.
 */
class ClaseVirtualController extends Controller
{
    /**
     * Lista todas las clases virtuales de un seminario.
     * Las próximas aparecen primero (ordenadas por fecha ascendente).
     */
    public function index($seminario_id)
    {
        $clases = ClaseVirtual::where('seminario_id', $seminario_id)
            ->where('tutor_id', Auth::id())
            ->orderBy('fecha')
            ->orderBy('hora')
            ->get();

        return response()->json(['data' => $clases]);
    }

    /** Crea una nueva clase virtual */
    public function store(Request $request, $seminario_id)
    {
        $request->validate([
            'titulo'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'fecha'       => 'required|date',
            'hora'        => 'required',
            'duracion'    => 'required|integer|min:15',
            'plataforma'  => 'required|string|max:100',
            'enlace'      => 'required|url',
        ]);

        $clase = ClaseVirtual::create([
            'seminario_id' => $seminario_id,
            'tutor_id'     => Auth::id(),
            ...$request->only(['titulo', 'descripcion', 'fecha', 'hora', 'duracion', 'plataforma', 'enlace']),
        ]);

        return response()->json(['message' => 'Clase virtual creada.', 'data' => $clase], 201);
    }

    /** Actualiza los datos de una clase virtual */
    public function update(Request $request, $seminario_id, $clase_id)
    {
        $clase = ClaseVirtual::where('id', $clase_id)
            ->where('seminario_id', $seminario_id)
            ->where('tutor_id', Auth::id())
            ->firstOrFail();

        $clase->update($request->only(['titulo', 'descripcion', 'fecha', 'hora', 'duracion', 'plataforma', 'enlace']));

        return response()->json(['message' => 'Clase virtual actualizada.', 'data' => $clase]);
    }

    /** Elimina una clase virtual */
    public function destroy($seminario_id, $clase_id)
    {
        ClaseVirtual::where('id', $clase_id)
            ->where('seminario_id', $seminario_id)
            ->where('tutor_id', Auth::id())
            ->firstOrFail()
            ->delete();

        return response()->json(['message' => 'Clase virtual eliminada.']);
    }

    /** Sube la URL de la grabación de una clase virtual */
    public function uploadGrabacion(Request $request, $seminario_id, $clase_id)
    {
        $request->validate([
            'url_grabacion' => 'required|url',
        ]);

        $clase = ClaseVirtual::where('id', $clase_id)
            ->where('seminario_id', $seminario_id)
            ->where('tutor_id', Auth::id())
            ->firstOrFail();

        $clase->url_grabacion = $request->url_grabacion;

        if ($request->filled('descripcion')) {
            $clase->descripcion = $clase->descripcion . "\n\nNotas de grabación: " . $request->descripcion;
        }

        $clase->save();

        return response()->json(['message' => 'Grabación guardada.', 'data' => $clase]);
    }

    /** Elimina la URL de la grabación de una clase virtual */
    public function destroyGrabacion($seminario_id, $clase_id)
    {
        $clase = ClaseVirtual::where('id', $clase_id)
            ->where('seminario_id', $seminario_id)
            ->where('tutor_id', Auth::id())
            ->firstOrFail();

        $clase->url_grabacion = null;
        $clase->save();

        return response()->json(['message' => 'Grabación eliminada.']);
    }
}
