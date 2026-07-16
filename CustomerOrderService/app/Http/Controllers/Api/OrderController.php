<?php

namespace App\Http\Controllers\Api;

use App\Application\Orders\DTOs\CreateOrderDTO;
use App\Application\Orders\DTOs\OrderItemDTO;
use App\Application\Orders\DTOs\UpdateOrderDTO;
use App\Application\Shared\Interfaces\IOrderService;
use App\Domain\Customers\Exceptions\CustomerNotFoundException;
use App\Enums\OrderPriority;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\CreateOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Http\Resources\Order\OrderCollection;
use App\Http\Resources\Order\OrderResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private readonly IOrderService $orderService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'status'      => $request->query('status'),
            'customer_id' => $request->query('customer_id'),
            'date_from'   => $request->query('date_from'),
            'date_to'     => $request->query('date_to'),
            'priority'    => $request->query('priority'),
            'per_page'    => $request->query('per_page', 15),
            'page'        => $request->query('page', 1),
        ];

        $result = $this->orderService->getAll($filters);

        $items = array_map(
            fn($order) => (new OrderResource($order))->toArray($request),
            $result['items'],
        );

        return ApiResponse::success([
            'items'      => $items,
            'pagination' => $result['pagination'],
        ], 'Pedidos obtenidos exitosamente');
    }

    public function store(CreateOrderRequest $request): JsonResponse
    {
        try {
            $items = array_map(
                fn(array $item) => new OrderItemDTO(
                    description: $item['description'],
                    quantity:    (int)   $item['quantity'],
                    unitPrice:   (float) $item['unit_price'],
                ),
                $request->input('items'),
            );

            $dto   = new CreateOrderDTO(
                customerId: (int) $request->input('customer_id'),
                items:      $items,
                notes:      $request->input('notes'),
                priority:   OrderPriority::from((int) ($request->input('priority') ?? OrderPriority::Medium->value)),
            );

            $order = $this->orderService->create($dto);
            $data  = (new OrderResource($order))->toArray($request);

            return ApiResponse::success($data, 'Pedido creado exitosamente', 201);
        } catch (CustomerNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), [], 422);
        }
    }

    public function show(int $id): JsonResponse
    {
        $order = $this->orderService->getById($id);
        $data  = (new OrderResource($order))->toArray(request());

        return ApiResponse::success($data, 'Pedido obtenido exitosamente');
    }

    public function update(UpdateOrderRequest $request, int $id): JsonResponse
    {
        $dto   = new UpdateOrderDTO(
            notes:    $request->input('notes'),
            priority: $request->has('priority') && $request->input('priority') !== null
                ? OrderPriority::from((int) $request->input('priority'))
                : null,
        );
        $order = $this->orderService->update($id, $dto);
        $data  = (new OrderResource($order))->toArray($request);

        return ApiResponse::success($data, 'Pedido actualizado exitosamente');
    }

    public function complete(int $id): JsonResponse
    {
        $order = $this->orderService->complete($id);
        $data  = (new OrderResource($order))->toArray(request());

        return ApiResponse::success($data, 'Pedido marcado como completado');
    }

    public function cancel(int $id): JsonResponse
    {
        $order = $this->orderService->cancel($id);
        $data  = (new OrderResource($order))->toArray(request());

        return ApiResponse::success($data, 'Pedido cancelado exitosamente');
    }

    public function destroy(int $id): JsonResponse
    {
        $this->orderService->delete($id);

        return ApiResponse::success(null, 'Pedido eliminado exitosamente');
    }
}
