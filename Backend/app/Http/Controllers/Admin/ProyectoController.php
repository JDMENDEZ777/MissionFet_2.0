<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProyectoController extends Controller
{
    // 1. OBTENER DATOS PARA EL FORMULARIO (Tutores y Estudiantes libres)
    public function getFormData()
    {
        // 1. Traemos tutores de la tabla 'users', ignorando mayúsculas/minúsculas
        $tutores = DB::table('users')
            ->whereRaw('LOWER(rol) = ?', ['tutor'])
            ->select('id', 'name as nombre') // Transformamos 'name' a 'nombre' para React
            ->get();

        // 2. Buscamos quiénes ya tienen proyecto asignado
        $asignados = DB::table('estudiantes_proyecto')->pluck('estudiante_id')->toArray();

        // 3. Traemos estudiantes de la tabla 'users'
        $query = DB::table('users')
            ->whereRaw('LOWER(rol) = ?', ['estudiante'])
            ->whereRaw('LOWER(opcion_grado) = ?', ['proyecto']);

        // 4. Solo aplicamos el filtro de "No asignados" si la lista no está vacía
        if (count($asignados) > 0) {
            $query->whereNotIn('id', $asignados);
        }

        // Seleccionamos las columnas correctas
        $estudiantes = $query->select('id', 'name as nombre', 'email', 'codigo_estudiante', 'opcion_grado')->get();

        return response()->json([
            'tutores' => $tutores,
            'estudiantes' => $estudiantes
        ]);
    }

    // 2. LISTAR TODOS LOS PROYECTOS
    public function index()
    {
        // Volvemos a unir con la tabla 'users' y traemos 'name'
        $proyectos = DB::table('proyectos as p')
            ->leftJoin('users as u', 'p.tutor_id', '=', 'u.id')
            ->select('p.*', 'u.name as tutor_nombre')
            ->orderBy('p.id', 'desc')
            ->get();

        // Contar cuántos estudiantes tiene cada proyecto
        foreach ($proyectos as $proyecto) {
            $proyecto->num_estudiantes = DB::table('estudiantes_proyecto')
                ->where('proyecto_id', $proyecto->id)
                ->count();
        }

        return response()->json($proyectos);
    }

    // 3. CREAR PROYECTO Y ASIGNAR ESTUDIANTES
    public function store(Request $request)
    {
        // Iniciamos la transacción (Si algo falla, no se guarda nada a medias)
        DB::beginTransaction();

        try {
            $archivo_nombre = null;

            if ($request->hasFile('archivo_proyecto')) {
                $file = $request->file('archivo_proyecto');
                $nombreArchivo = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('public/proyectos', $nombreArchivo);
                $archivo_nombre = $nombreArchivo;
            }

            // 1. Insertar el proyecto
            $proyecto_id = DB::table('proyectos')->insertGetId([
                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion,
                'archivo_proyecto' => $archivo_nombre,
                'estado' => 'propuesto',
                'tipo' => 'proyecto',
                'tutor_id' => $request->tutor_id ?: null,
                'created_at' => now(),
            ]);

            // 2. Insertar estudiantes (Decodificamos el array que nos manda React)
            $estudiantes = json_decode($request->estudiantes);
            
            if (is_array($estudiantes) && count($estudiantes) > 0) {
                foreach ($estudiantes as $index => $estudiante_id) {
                    $rol = ($index === 0) ? 'líder' : 'miembro'; // El primero de la lista siempre es líder
                    
                    DB::table('estudiantes_proyecto')->insert([
                        'proyecto_id' => $proyecto_id,
                        'estudiante_id' => $estudiante_id,
                        'rol_en_proyecto' => $rol,
                        'created_at' => now(),
                    ]);
                }
            }

            // Todo salió bien, confirmamos los cambios en la BD
            DB::commit();

            return response()->json(['message' => 'Proyecto creado exitosamente'], 201);

        } catch (\Exception $e) {
            // Si hay error, cancelamos todo para no dejar datos corruptos
            DB::rollBack();
            return response()->json(['message' => 'Error al crear proyecto: ' . $e->getMessage()], 500);
        }
    }
}