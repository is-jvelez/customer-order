import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderRepository } from './order.repository';
import { ORDER_ROUTES } from '../../../shared/constants/api-routes.constants';
import { OrderPriority } from '../../../shared/constants/app.constants';

describe('OrderRepository — CR-001 priority contract', () => {
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

  it('sends ?priority=<n> as a query param when filtering', () => {
    repo.getAll({ priority: OrderPriority.High }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === ORDER_ROUTES.BASE && r.params.get('priority') === '3',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { items: [], pagination: { total: 0, per_page: 15, current_page: 1, last_page: 1 } }, message: '', errors: [] });
  });

  it('omits the priority query param when no filter is given (previous behavior intact)', () => {
    repo.getAll({}).subscribe();

    const req = httpMock.expectOne(ORDER_ROUTES.BASE);
    expect(req.request.params.has('priority')).toBe(false);
    req.flush({ success: true, data: { items: [], pagination: { total: 0, per_page: 15, current_page: 1, last_page: 1 } }, message: '', errors: [] });
  });

  it('maps the raw "priority" field from the API response onto Order.priority', () => {
    repo.getById(1).subscribe((res) => {
      expect(res.data?.priority).toBe(OrderPriority.High);
    });

    const req = httpMock.expectOne(ORDER_ROUTES.BY_ID(1));
    req.flush({
      success: true,
      data: {
        id: 1,
        customer_id: 1,
        status: 'Pending',
        priority: 3,
        total: 10,
        notes: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        items: [],
      },
      message: '',
      errors: [],
    });
  });

  it('sends priority in the create() body when provided', () => {
    repo.create({ customerId: 1, priority: OrderPriority.High, items: [{ description: 'x', quantity: 1, price: 1 }] }).subscribe();

    const req = httpMock.expectOne(ORDER_ROUTES.BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.priority).toBe(3);
    req.flush({ success: true, data: null, message: '', errors: [] });
  });

  it('omits priority from the create() body when not provided, letting the backend default to Media', () => {
    repo.create({ customerId: 1, items: [{ description: 'x', quantity: 1, price: 1 }] }).subscribe();

    const req = httpMock.expectOne(ORDER_ROUTES.BASE);
    expect(req.request.body.priority).toBeUndefined();
    req.flush({ success: true, data: null, message: '', errors: [] });
  });
});
