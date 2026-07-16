import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderRepository } from './order.repository';
import { CreateOrderRequest, OrderFilterParams } from '../domain/models/order.model';
import { OrderPriority } from '../../../shared/constants/app.constants';
import { environment } from '../../../../environments/environment';

const ORDERS_URL = `${environment.customerOrderServiceUrl}/orders`;

describe('OrderRepository — filtro y envío de priority (CR-001)', () => {
  let repo: OrderRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    repo = TestBed.inject(OrderRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('envía el query param "priority" cuando se filtra por prioridad', () => {
    const params: OrderFilterParams = { priority: 3 };
    repo.getAll(params).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === ORDERS_URL && r.params.get('priority') === '3'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      message: '',
      errors: [],
      data: { items: [], pagination: { total: 0, per_page: 15, current_page: 1, last_page: 1 } },
    });
  });

  it('NO envía el query param "priority" cuando no se filtra (comportamiento previo intacto)', () => {
    repo.getAll({}).subscribe();

    const req = httpMock.expectOne(ORDERS_URL);
    expect(req.request.params.has('priority')).toBe(false);
    req.flush({
      success: true,
      message: '',
      errors: [],
      data: { items: [], pagination: { total: 0, per_page: 15, current_page: 1, last_page: 1 } },
    });
  });

  it('mapea el campo "priority" del JSON crudo a la entidad Order', () => {
    repo.getById(1).subscribe((res) => {
      expect(res.data?.priority).toBe(OrderPriority.High);
    });

    const req = httpMock.expectOne(`${ORDERS_URL}/1`);
    req.flush({
      success: true,
      message: '',
      errors: [],
      data: {
        id: 1,
        customer_id: 1,
        status: 'Pending',
        priority: 3,
        total: 100,
        notes: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        items: [],
      },
    });
  });

  it('envía "priority" en el body de create() cuando se especifica', () => {
    const data: CreateOrderRequest = {
      customerId: 1,
      notes: null,
      priority: OrderPriority.High,
      items: [{ description: 'Item', quantity: 1, price: 10 }],
    };
    repo.create(data).subscribe();

    const req = httpMock.expectOne(ORDERS_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.priority).toBe(3);
    req.flush({
      success: true,
      message: '',
      errors: [],
      data: {
        id: 1,
        customer_id: 1,
        status: 'Pending',
        priority: 3,
        total: 10,
        notes: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        items: [],
      },
    });
  });

  it('omite "priority" del body de create() cuando no se especifica (el backend persiste Media por defecto)', () => {
    const data: CreateOrderRequest = {
      customerId: 1,
      notes: null,
      items: [{ description: 'Item', quantity: 1, price: 10 }],
    };
    repo.create(data).subscribe();

    // Nota: HttpTestingController expone el body ANTES de la serialización JSON real;
    // el valor `undefined` aquí es lo que, al serializar (JSON.stringify) para la petición
    // real, hace que la clave "priority" no viaje en el body — el backend recibe el campo
    // ausente y persiste el default (2/Media), tal como especifica el contrato del CR.
    const req = httpMock.expectOne(ORDERS_URL);
    expect(req.request.body.priority).toBeUndefined();
    req.flush({
      success: true,
      message: '',
      errors: [],
      data: {
        id: 1,
        customer_id: 1,
        status: 'Pending',
        priority: 2,
        total: 10,
        notes: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        items: [],
      },
    });
  });
});
