<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    /**
     * Actualiza el avatar del usuario autenticado.
     */
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar_url' => 'nullable|string',
            'avatar_file' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($request->hasFile('avatar_file')) {
            // Eliminar avatar anterior si era un archivo local
            if ($user->avatar && Str::startsWith($user->avatar, '/storage/avatars/')) {
                $oldPath = Str::replaceFirst('/storage/', 'public/', $user->avatar);
                Storage::delete($oldPath);
            }

            // Guardar nuevo archivo
            $path = $request->file('avatar_file')->store('public/avatars');
            $user->avatar = Storage::url($path);
        } elseif ($request->avatar_url) {
            // Si el usuario elige un avatar predefinido (URL externa)
            $user->avatar = $request->avatar_url;
        }

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Avatar actualizado correctamente',
            'user' => $user
        ]);
    }
}
