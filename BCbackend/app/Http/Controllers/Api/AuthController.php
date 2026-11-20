<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * AuthController constructor.
     *
     * @param  AuthService  $authService
     */
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Register a new user.
     *
     * @param  RegisterRequest  $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully.',
            'data' => $result,
        ], Response::HTTP_CREATED);
    }

    /**
     * Authenticate user and issue access token.
     *
     * @param  LoginRequest  $request
     * @return JsonResponse
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => $result,
        ], Response::HTTP_OK);
    }

    /**
     * Get the authenticated user.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function user(Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Authenticated user profile retrieved successfully.',
            'data' => [
                'user' => $user,
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Revoke authenticated user token (Logout).
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out.',
        ], Response::HTTP_OK);
    }
}
