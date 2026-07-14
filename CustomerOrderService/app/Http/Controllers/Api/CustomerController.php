<?php

namespace App\Http\Controllers\Api;

use App\Application\Customers\DTOs\CreateCustomerDTO;
use App\Application\Customers\DTOs\UpdateCustomerDTO;
use App\Application\Shared\Interfaces\ICustomerService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CreateCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\Customer\CustomerCollection;
use App\Http\Resources\Customer\CustomerResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class CustomerController extends Controller
{
    public function __construct(
        private readonly ICustomerService $customerService,
    ) {}

    public function index(): JsonResponse
    {
        $customers = $this->customerService->getAll();
        $data      = (new CustomerCollection(collect($customers)))->toArray(request());

        return ApiResponse::success($data, 'Clientes obtenidos exitosamente');
    }

    public function store(CreateCustomerRequest $request): JsonResponse
    {
        $dto = new CreateCustomerDTO(
            name:    $request->input('name'),
            email:   $request->input('email'),
            phone:   $request->input('phone'),
            address: $request->input('address'),
        );

        $customer = $this->customerService->create($dto);
        $data     = (new CustomerResource($customer))->toArray($request);

        return ApiResponse::success($data, 'Cliente creado exitosamente', 201);
    }

    public function show(int $id): JsonResponse
    {
        $customer = $this->customerService->getById($id);
        $data     = (new CustomerResource($customer))->toArray(request());

        return ApiResponse::success($data, 'Cliente obtenido exitosamente');
    }

    public function update(UpdateCustomerRequest $request, int $id): JsonResponse
    {
        $dto = new UpdateCustomerDTO(
            name:    $request->input('name'),
            email:   $request->input('email'),
            phone:   $request->input('phone'),
            address: $request->input('address'),
        );

        $customer = $this->customerService->update($id, $dto);
        $data     = (new CustomerResource($customer))->toArray($request);

        return ApiResponse::success($data, 'Cliente actualizado exitosamente');
    }

    public function destroy(int $id): JsonResponse
    {
        $this->customerService->delete($id);

        return ApiResponse::success(null, 'Cliente eliminado exitosamente');
    }
}
