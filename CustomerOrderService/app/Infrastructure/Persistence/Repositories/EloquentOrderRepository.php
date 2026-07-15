<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Orders\Entities\Order;
use App\Domain\Orders\Entities\OrderItem;
use App\Domain\Orders\Interfaces\IOrderRepository;
use App\Infrastructure\Persistence\Mappers\OrderMapper;
use App\Infrastructure\Persistence\Models\OrderItemModel;
use App\Infrastructure\Persistence\Models\OrderModel;
use Illuminate\Support\Facades\DB;

class EloquentOrderRepository implements IOrderRepository
{
    public function __construct(
        private readonly OrderMapper $mapper,
    ) {}

    public function findAll(array $filters = []): array
    {
        $query = OrderModel::with('items')->orderByDesc('CreatedAt');

        if (!empty($filters['status'])) {
            $query->where('Status', $filters['status']);
        }
        if (!empty($filters['customer_id'])) {
            $query->where('CustomerId', (int) $filters['customer_id']);
        }
        if (!empty($filters['priority'])) {
            $query->where('Priority', (int) $filters['priority']);
        }
        if (!empty($filters['date_from'])) {
            $query->where('CreatedAt', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->where('CreatedAt', '<=', $filters['date_to'] . ' 23:59:59');
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 100);
        $page    = max((int) ($filters['page'] ?? 1), 1);

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'items' => $paginator->getCollection()
                ->map(fn(OrderModel $m) => $this->mapper->toDomain($m))
                ->all(),
            'pagination' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ],
        ];
    }

    public function findById(int $id): ?Order
    {
        $model = OrderModel::with('items')->find($id);
        return $model ? $this->mapper->toDomain($model) : null;
    }

    /** @param OrderItem[] $items */
    public function create(Order $order, array $items): Order
    {
        return DB::transaction(function () use ($order, $items): Order {
            $orderModel = OrderModel::create([
                'CustomerId' => $order->customerId,
                'Status'     => $order->status->value,
                'Notes'      => $order->notes,
                'Priority'   => $order->priority->value,
            ]);

            foreach ($items as $item) {
                OrderItemModel::create([
                    'OrderId'     => $orderModel->Id,
                    'Description' => $item->description,
                    'Quantity'    => $item->quantity,
                    'UnitPrice'   => $item->unitPrice,
                ]);
            }

            // Reload para que los triggers de SQL Server calculen Total y UpdatedAt
            $orderModel->refresh();
            $orderModel->load('items');

            return $this->mapper->toDomain($orderModel);
        });
    }

    public function update(Order $order): Order
    {
        $model = OrderModel::findOrFail($order->id);

        $model->update([
            'Status'   => $order->status->value,
            'Notes'    => $order->notes,
            'Priority' => $order->priority->value,
        ]);

        $model->refresh();
        $model->load('items');

        return $this->mapper->toDomain($model);
    }

    public function delete(int $id): void
    {
        OrderModel::findOrFail($id)->delete();
    }

    public function getStats(): array
    {
        $result = OrderModel::selectRaw("
            COUNT(*) as total_orders,
            SUM(CASE WHEN Status = 'Pending'    THEN 1 ELSE 0 END) as pending_orders,
            SUM(CASE WHEN Status = 'InProgress' THEN 1 ELSE 0 END) as in_progress_orders,
            SUM(CASE WHEN Status = 'Completed'  THEN 1 ELSE 0 END) as completed_orders,
            SUM(CASE WHEN Status = 'Cancelled'  THEN 1 ELSE 0 END) as cancelled_orders,
            SUM(CASE WHEN Status = 'Completed'  THEN Total ELSE 0 END) as total_revenue
        ")->first();

        return [
            'total_orders'       => (int)   $result->total_orders,
            'pending_orders'     => (int)   $result->pending_orders,
            'in_progress_orders' => (int)   $result->in_progress_orders,
            'completed_orders'   => (int)   $result->completed_orders,
            'cancelled_orders'   => (int)   $result->cancelled_orders,
            'total_revenue'      => (float) $result->total_revenue,
        ];
    }

    public function getOrdersByDay(): array
    {
        return DB::table('Orders')
            ->selectRaw("CAST(CreatedAt AS DATE) as date, COUNT(*) as count, SUM(Total) as total")
            ->where('CreatedAt', '>=', now()->subDays(30))
            ->groupByRaw("CAST(CreatedAt AS DATE)")
            ->orderByRaw("CAST(CreatedAt AS DATE) DESC")
            ->get()
            ->map(fn($row) => [
                'date'  => $row->date,
                'count' => (int)   $row->count,
                'total' => (float) $row->total,
            ])
            ->all();
    }

    public function getOrdersByMonth(): array
    {
        return DB::table('Orders')
            ->selectRaw("FORMAT(CreatedAt, 'yyyy-MM') as date, COUNT(*) as count, SUM(Total) as total")
            ->where('CreatedAt', '>=', now()->subMonths(12))
            ->groupByRaw("FORMAT(CreatedAt, 'yyyy-MM')")
            ->orderByRaw("FORMAT(CreatedAt, 'yyyy-MM') DESC")
            ->get()
            ->map(fn($row) => [
                'date'  => $row->date,
                'count' => (int)   $row->count,
                'total' => (float) $row->total,
            ])
            ->all();
    }
}
