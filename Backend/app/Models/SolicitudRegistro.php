<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SolicitudRegistro extends Model
{
    use HasFactory;

    // Indicamos el nombre de la tabla (opcional si sigue la convención)
    protected $table = 'solicitudes_registro';

    // ESTO ES LO QUE TE FALTA:
    protected $fillable = [
        'nombre',
        'email',
        'password',
        'rol',
        'documento',
        'codigo_estudiante',
        'codigo_institucional',
        'opcion_grado',
        'ciclo',
        'telefono',
        'nombre_proyecto',
        'nombre_empresa',
        'estado'
    ];
}