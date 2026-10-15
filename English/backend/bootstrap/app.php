<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // This backend is API-only: there is no `login` route to redirect guests to, so opening
        // /api/... in a browser must return the JSON 401 below instead of throwing a 500.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // AI provider failures get a readable message instead of a raw 500; details stay in the log.
        $exceptions->render(fn (RequestException|ConnectionException $e) => response()->json([
            'message' => "AI xizmatiga ulanib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.",
        ], 502));
    })->create();
