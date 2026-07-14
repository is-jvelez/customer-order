<?php

namespace App\Http\Controllers\Api;

use App\Application\Shared\Interfaces\ICustomerService;
use App\Application\Shared\Interfaces\IOrderService;
use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        private readonly IOrderService    $orderService,
        private readonly ICustomerService $customerService,
    ) {}

    public function stats(): JsonResponse
    {
        $orderStats    = $this->orderService->getOrderStats();
        $customerStats = $this->customerService->getCustomerStats();

        return ApiResponse::success(
            array_merge($orderStats, $customerStats),
            'Estadísticas obtenidas exitosamente',
        );
    }

    public function ordersByDay(): JsonResponse
    {
        $data = $this->orderService->getOrdersByDay();

        return ApiResponse::success($data, 'Pedidos por día obtenidos exitosamente');
    }

    public function ordersByMonth(): JsonResponse
    {
        $data = $this->orderService->getOrdersByMonth();

        return ApiResponse::success($data, 'Pedidos por mes obtenidos exitosamente');
    }
}
