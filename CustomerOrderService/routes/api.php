<?php

use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware('jwt.auth')->group(function () {

    // Clientes
    Route::get('/customers',       [CustomerController::class, 'index']);
    Route::post('/customers',      [CustomerController::class, 'store']);
    Route::get('/customers/{id}',  [CustomerController::class, 'show']);
    Route::put('/customers/{id}',  [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

    // Pedidos
    Route::get('/orders',                     [OrderController::class, 'index']);
    Route::post('/orders',                    [OrderController::class, 'store']);
    Route::get('/orders/{id}',                [OrderController::class, 'show']);
    Route::put('/orders/{id}',                [OrderController::class, 'update']);
    Route::patch('/orders/{id}/complete',     [OrderController::class, 'complete']);
    Route::patch('/orders/{id}/cancel',       [OrderController::class, 'cancel']);
    Route::delete('/orders/{id}',             [OrderController::class, 'destroy']);

    // Dashboard
    Route::get('/dashboard/stats',            [DashboardController::class, 'stats']);
    Route::get('/dashboard/orders-by-day',    [DashboardController::class, 'ordersByDay']);
    Route::get('/dashboard/orders-by-month',  [DashboardController::class, 'ordersByMonth']);
});
