<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        // Logins are case-insensitive, so check uniqueness on the lowercased form.
        $request->merge(['username' => strtolower((string) $request->input('username'))]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'username' => ['required', 'string', 'min:3', 'max:30', 'alpha_dash:ascii', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
        ], [
            'username.unique' => 'Bu login band. Boshqasini tanlang.',
            'username.alpha_dash' => "Login faqat lotin harflari, raqam, - va _ dan iborat bo'lishi mumkin.",
            'username.min' => "Login kamida 3 ta belgidan iborat bo'lsin.",
            'password.min' => "Parol kamida 6 ta belgidan iborat bo'lsin.",
            'name.required' => 'Ismingizni kiriting.',
        ]);

        $user = User::create($data);

        return $this->tokenResponse($user, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('username', strtolower($data['username']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => "Login yoki parol noto'g'ri.",
            ]);
        }

        return $this->tokenResponse($user);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userPayload($request->user())]);
    }

    private function tokenResponse(User $user, int $status = 200): JsonResponse
    {
        return response()->json([
            'token' => $user->createToken('web')->plainTextToken,
            'user' => $this->userPayload($user),
        ], $status);
    }

    private function userPayload(User $user): array
    {
        $finished = $user->conversations()->whereNotNull('ended_at');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'profile' => $user->profile,
            'stats' => [
                'sessions' => (clone $finished)->count(),
                'minutes' => (int) round((clone $finished)->sum('duration_seconds') / 60),
            ],
        ];
    }
}
