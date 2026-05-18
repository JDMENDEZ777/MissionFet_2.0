<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeminarioEntrega extends Model
{
    protected $table = 'seminario_entregas';

    protected $fillable = [
        'actividad_id',
        'estudiante_id',
        'archivo',
        'comentario_estudiante',
        'nota',
        'comentario_tutor',
        'fecha_entrega',
        'estado',
    ];

    protected $casts = [
        'fecha_entrega' => 'datetime',
        'nota' => 'decimal:1',
    ];

    public function actividad()
    {
        return $this->belongsTo(SeminarioActividad::class, 'actividad_id');
    }

    public function estudiante()
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }
}
