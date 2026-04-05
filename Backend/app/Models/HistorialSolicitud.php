<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialSolicitud extends Model
{
    protected $fillable = [
    'solicitud_id', 'nombre', 'email', 'documento', 'rol', 
    'codigo_estudiante', 'ciclo', 'opcion_grado', 
    'nombre_proyecto', 'nombre_empresa', 'estado_final', 'resuelto_por'
];
}
