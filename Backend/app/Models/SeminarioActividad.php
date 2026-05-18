<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeminarioActividad extends Model
{
    protected $table = 'seminario_actividades';

    protected $fillable = [
        'seminario_id',
        'titulo',
        'descripcion',
        'puntaje',
        'fecha_limite',
        'hora_limite',
        'permite_entregas_tardias',
    ];

    public function seminario()
    {
        return $this->belongsTo(Seminario::class, 'seminario_id');
    }

    public function entregas()
    {
        return $this->hasMany(SeminarioEntrega::class, 'actividad_id');
    }
}
