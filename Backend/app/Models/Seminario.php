<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seminario extends Model
{
    protected $table = 'seminarios';

    protected $fillable = [
        'titulo',
        'descripcion',
        'fecha',
        'hora',
        'modalidad',
        'lugar',
        'cupos',
        'tutor_id',
        'archivo_guia',
        'estado',
    ];

    public function tutor()
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function actividades()
    {
        return $this->hasMany(SeminarioActividad::class, 'seminario_id');
    }

    public function recursos()
    {
        return $this->hasMany(SeminarioRecurso::class, 'seminario_id');
    }

    public function inscripciones()
    {
        return $this->hasMany(InscripcionSeminario::class, 'seminario_id'); // si existe, si no, se puede usar DB
    }
}
