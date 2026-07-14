<?php

namespace App\Exceptions;

use App\Domain\Customers\Exceptions\CustomerNotFoundException;
use App\Domain\Customers\Exceptions\DuplicateEmailException;
use App\Domain\Orders\Exceptions\InvalidOrderStatusException;
use App\Domain\Orders\Exceptions\OrderNotFoundException;
use App\Domain\Shared\Exceptions\DomainException;
use App\Http\Responses\ApiResponse;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function render($request, Throwable $e)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            if ($e instanceof ValidationException) {
                $errors = collect($e->errors())->flatten()->values()->all();
                return ApiResponse::error('Error de validación.', $errors, 422);
            }

            if ($e instanceof CustomerNotFoundException || $e instanceof OrderNotFoundException) {
                return ApiResponse::error($e->getMessage(), [], 404);
            }

            if ($e instanceof DuplicateEmailException || $e instanceof InvalidOrderStatusException) {
                return ApiResponse::error($e->getMessage(), [], 409);
            }

            if ($e instanceof NotFoundHttpException) {
                return ApiResponse::error('Recurso no encontrado.', [], 404);
            }

            if ($e instanceof DomainException) {
                return ApiResponse::error($e->getMessage(), [], 422);
            }

            if (config('app.debug')) {
                return ApiResponse::error($e->getMessage(), [$e->getTraceAsString()], 500);
            }

            return ApiResponse::error('Error interno del servidor.', [], 500);
        }

        return parent::render($request, $e);
    }
}
