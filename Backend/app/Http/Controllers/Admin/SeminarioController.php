<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SeminarioController extends Controller
{
    // 1. OBTENER LA LISTA DE TUTORES PARA EL SELECTOR
    public function getTutores()
    {
        $tutores = DB::table('users')->where('rol', 'tutor')->select('id', 'name')->get();
        return response()->json($tutores);
    }

    // 2. LISTAR TODOS LOS SEMINARIOS
    public function index()
    {
        // Traemos los seminarios cruzando datos con el tutor y contando los inscritos
        $seminarios = DB::table('seminarios as s')
            ->leftJoin('users as u', 's.tutor_id', '=', 'u.id')
            ->select('s.*', 'u.name as tutor_nombre')
            ->orderBy('s.fecha', 'desc')
            ->orderBy('s.hora', 'desc')
            ->get();

        // Le agregamos el conteo de inscritos a cada seminario
        foreach ($seminarios as $seminario) {
            $seminario->num_inscritos = DB::table('inscripciones_seminario')
                ->where('seminario_id', $seminario->id)
                ->count();
        }

        return response()->json($seminarios);
    }

    // 3. CREAR UN SEMINARIO (Y SUBIR EL ARCHIVO PDF/WORD)
    public function store(Request $request)
    {
        try {
            $archivo_guia = null;

            // Verificamos si React envió un archivo
            if ($request->hasFile('archivo_guia')) {
                $file = $request->file('archivo_guia');
                // Guardamos el archivo en 'storage/app/public/seminarios'
                $nombreArchivo = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('public/seminarios', $nombreArchivo);
                $archivo_guia = $nombreArchivo;
            }

            // Insertamos en PostgreSQL
            DB::table('seminarios')->insert([
                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion,
                'fecha' => $request->fecha,
                'hora' => $request->hora,
                'modalidad' => $request->modalidad,
                'lugar' => $request->lugar,
                'cupos' => $request->cupos,
                'tutor_id' => $request->tutor_id ?: null,
                'archivo_guia' => $archivo_guia,
                'estado' => 'activo',
                'created_at' => now(),
            ]);

            return response()->json(['message' => 'Seminario creado exitosamente'], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al crear: ' . $e->getMessage()], 500);
        }
    }


    // 4. VER DETALLES DE UN SEMINARIO Y SUS ESTUDIANTES
    public function show($id)
    {
        $seminario = DB::table('seminarios as s')
            ->leftJoin('users as u', 's.tutor_id', '=', 'u.id')
            ->select('s.*', 'u.name as tutor_nombre')
            ->where('s.id', $id)
            ->first();

        if (!$seminario) {
            return response()->json(['message' => 'Seminario no encontrado'], 404);
        }

        $estudiantes = DB::table('inscripciones_seminario as i')
            ->join('users as u', 'i.estudiante_id', '=', 'u.id')
            ->where('i.seminario_id', $id)
            // Usamos 'name as nombre' para que coincida con lo que espera tu React
            ->select('u.id', 'u.name as nombre', 'u.email', 'u.codigo_estudiante as codigo', 'i.estado', 'i.asistencia', 'i.nota')
            ->get();

        return response()->json([
            'seminario' => $seminario,
            'estudiantes' => $estudiantes
        ]);
    }

    // 5. OBTENER ESTUDIANTES DISPONIBLES PARA MATRICULAR
    public function getEstudiantesDisponibles($id)
    {
        // Buscamos quiénes ya están inscritos para no mostrarlos
        $inscritos = DB::table('inscripciones_seminario')
            ->where('seminario_id', $id)
            ->pluck('estudiante_id');

        // Traemos a los estudiantes (rol = estudiante) que NO estén en la lista de inscritos
        $disponibles = DB::table('users')
            ->where('rol', 'estudiante')
            ->whereNotIn('id', $inscritos)
            ->select('id', 'name as nombre', 'documento', 'codigo_estudiante')
            ->get();

        return response()->json($disponibles);
    }

    // 6. INSCRIBIR UN ESTUDIANTE
    public function inscribir(Request $request, $id)
    {
        try {
            DB::table('inscripciones_seminario')->insert([
                'seminario_id' => $id,
                'estudiante_id' => $request->estudiante_id,
                'estado' => 'inscrito',
                'created_at' => now(),
            ]);
            return response()->json(['message' => 'Estudiante inscrito correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al inscribir estudiante'], 500);
        }
    }

    // 7. ELIMINAR LA INSCRIPCIÓN DE UN ESTUDIANTE
    public function eliminarInscripcion($id, $estudiante_id)
    {
        DB::table('inscripciones_seminario')
            ->where('seminario_id', $id)
            ->where('estudiante_id', $estudiante_id)
            ->delete();

        return response()->json(['message' => 'Inscripción eliminada']);
    }

    // 8. ACTUALIZAR UN SEMINARIO
    public function update(Request $request, $id)
    {
        try {
            $seminario = DB::table('seminarios')->where('id', $id)->first();
            if (!$seminario) return response()->json(['message' => 'No encontrado'], 404);

            $archivo_guia = $seminario->archivo_guia; // Mantenemos el archivo viejo por defecto

            // Si React nos envía un archivo nuevo
            if ($request->hasFile('archivo_guia')) {
                $file = $request->file('archivo_guia');
                $nombreArchivo = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('public/seminarios', $nombreArchivo);
                $archivo_guia = $nombreArchivo; // Actualizamos con el nuevo
            }

            DB::table('seminarios')->where('id', $id)->update([
                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion,
                'fecha' => $request->fecha,
                'hora' => $request->hora,
                'modalidad' => $request->modalidad,
                'lugar' => $request->lugar,
                'cupos' => $request->cupos,
                'tutor_id' => $request->tutor_id ?: null,
                'estado' => $request->estado,
                'archivo_guia' => $archivo_guia,
                'updated_at' => now(),
            ]);

            return response()->json(['message' => 'Seminario actualizado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
    }

    // 9. ELIMINAR UN SEMINARIO POR COMPLETO
    public function destroy($id)
    {
        try {
            DB::table('seminarios')->where('id', $id)->delete();
            return response()->json(['message' => 'Seminario eliminado']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar. Verifique que no tenga alumnos matriculados.'], 500);
        }
    }
}