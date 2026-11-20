<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new user in the system.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower(trim($data['email'])),
            'password' => bcrypt($data['password']),
            'role' => $data['role'] ?? 'operator',
            'is_active' => true,
        ]);

        $token = $user->createToken('biblecast_auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Authenticate an existing user and generate a Sanctum personal access token.
     *
     * @param  array<string, string>  $credentials
     * @return array<string, mixed>
     *
     * @throws ValidationException
     */
    public function login(array $credentials): array
    {
        $email = strtolower(trim($credentials['email']));
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been disabled. Please contact your church administrator.'],
            ]);
        }

        $token = $user->createToken('biblecast_auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Retrieve the currently authenticated user profile.
     *
     * @param  User  $user
     * @return User
     */
    public function getAuthenticatedUser(User $user): User
    {
        return $user;
    }

    /**
     * Revoke the current access token for the authenticated user.
     *
     * @param  User  $user
     * @return bool
     */
    public function logout(User $user): bool
    {
        $currentToken = $user->currentAccessToken();

        if ($currentToken) {
            $currentToken->delete();
        }

        return true;
    }
}
