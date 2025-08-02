import { Customer, Product, Order, OrderStatus, Supplier, PurchaseOrder, PurchaseOrderStatus, PaymentMethod, PaymentStatus, InventoryMovement, InventoryMovementType, SalesReturn, InventoryAdjustment, Quotation, QuotationStatus, User, UserRole, InventoryItem, StockTransfer, ProductType, BillOfMaterials, WorkOrder, WorkOrderStatus, CompanySettings, PermissionsConfig, Permission, AccountingPeriod, TaxRate, JournalEntry, Account, AccountType, ProductionStep } from './types';

export const mockUsers: User[] = [
    { id: 'user-admin', name: 'Alice Admin', username: 'admin', password: 'admin', role: UserRole.Admin, avatar: 'https://i.pravatar.cc/100?u=admin' },
    { id: 'user-manager', name: 'Mary Manager', username: 'manager', password: 'password123', role: UserRole.Manager, avatar: 'https://i.pravatar.cc/100?u=manager' },
    { id: 'user-sales', name: 'Bob Sales', username: 'sales', password: 'password123', role: UserRole.Sales, avatar: 'https://i.pravatar.cc/100?u=sales' },
    { id: 'user-accountant', name: 'Andy Accountant', username: 'accountant', password: 'password123', role: UserRole.Accountant, avatar: 'https://i.pravatar.cc/100?u=accountant' },
    { id: 'user-warehouse', name: 'Charlie Warehouse', username: 'warehouse', password: 'password123', role: UserRole.Warehouse, avatar: 'https://i.pravatar.cc/100?u=warehouse' },
];

// MOCK DATA
export const mockCustomers: Customer[] = [
    { id: 'KH_VL', name: 'Khách vãng lai', email: '', phone: '', address: 'Tại cửa hàng', type: 'B2C', since: '2024-01-01' },
    { id: 'KH001', name: 'Công ty TNHH ABC', email: 'contact@abc.com', phone: '0901234567', address: '12 Cao Thắng, Phường 2, Quận 3, TP.HCM', type: 'B2B', since: '2023-01-15' },
    { id: 'KH002', name: 'Nguyễn Văn A', email: 'nguyenvana@email.com', phone: '0912345678', address: '45 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM', type: 'B2C', since: '2023-05-20' },
    { id: 'KH003', name: 'Trần Thị B', email: 'tranthib@email.com', phone: '0987654321', address: '30/4 đường Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM', type: 'B2C', since: '2024-02-10' },
    { id: 'KH004', name: 'Tập đoàn XYZ', email: 'info@xyz.corp', phone: '02838123456', address: 'Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM', type: 'B2B', since: '2022-11-30' },
    { id: 'KH005', name: 'Phạm Thị D', email: 'phamd@email.com', phone: '0978123456', address: '102 Cộng Hòa, Phường 4, Tân Bình, TP.HCM', type: 'B2C', since: '2024-01-01' },
];

export const mockSuppliers: Supplier[] = [
    { id: 'NCC001', name: 'Nhà phân phối Anker VN', contactPerson: 'Anh Minh', email: 'sales@anker.vn', phone: '02873001234', address: '123 Võ Văn Tần, Q3, TPHCM' },
    { id: 'NCC002', name: 'Công ty máy tính Phong Vũ', contactPerson: 'Chị Lan', email: 'cskh@phongvu.vn', phone: '18006867', address: '264 Nguyễn Thị Minh Khai, Q3, TPHCM' },
    { id: 'NCC003', name: 'Tổng kho linh kiện Miền Nam', contactPerson: 'Anh Hùng', email: 'tongkhomiennam@email.com', phone: '0909876543', address: 'KCN Sóng Thần, Bình Dương' },
];

export const mockProducts: Product[] = [
    // Standard Products
    { id: 'SP001', name: 'Bàn phím cơ ABC', price: 700000, cost: 450000, sku: 'KB-ABC-01', minStock: 20, supplierId: 'NCC001', productType: ProductType.Standard, category: 'Bàn phím & Chuột', imageUrl: 'https://placehold.co/400x400/0ea5e9/ffffff?text=Keyboard' },
    { id: 'SP002', name: 'Chuột không dây XYZ', price: 250000, cost: 150000, sku: 'M-XYZ-02', minStock: 25, supplierId: 'NCC001', productType: ProductType.Standard, category: 'Bàn phím & Chuột', imageUrl: 'https://placehold.co/400x400/34d399/ffffff?text=Mouse' },
    { id: 'SP003', name: 'Màn hình 27" Ultra', price: 8000000, cost: 6500000, sku: 'MON-ULT-27', minStock: 10, supplierId: 'NCC002', productType: ProductType.Standard, category: 'Màn hình', imageUrl: 'https://placehold.co/400x400/f59e0b/ffffff?text=Monitor' },
    { id: 'SP004', name: 'Webcam HD Pro', price: 1200000, cost: 800000, sku: 'WC-PRO-HD', minStock: 15, supplierId: 'NCC003', productType: ProductType.Standard, category: 'Phụ kiện', imageUrl: 'https://placehold.co/400x400/ef4444/ffffff?text=Webcam' },
    { id: 'SP005', name: 'Laptop Pro 16', price: 40000000, cost: 35000000, sku: 'LP-PRO-16', minStock: 5, supplierId: 'NCC002', productType: ProductType.Standard, category: 'Laptop', imageUrl: 'https://placehold.co/400x400/8b5cf6/ffffff?text=Laptop' },
    // Finished Good
    { id: 'SP006', name: 'Bộ PC Gaming ABC', price: 25000000, cost: 0, sku: 'PC-GAM-ABC', minStock: 5, supplierId: '', productType: ProductType.FinishedGood, category: 'PC & Linh kiện', imageUrl: 'https://placehold.co/400x400/14b8a6/ffffff?text=PC+Case' },
    // Raw Materials
    { id: 'SP101', name: 'Vỏ case XYZ', price: 0, cost: 800000, sku: 'CASE-XYZ', minStock: 10, supplierId: 'NCC003', productType: ProductType.RawMaterial, category: 'PC & Linh kiện', imageUrl: 'https://placehold.co/400x400/64748b/ffffff?text=Case' },
    { id: 'SP102', name: 'Nguồn 750W Gold', price: 0, cost: 1500000, sku: 'PSU-750G', minStock: 10, supplierId: 'NCC003', productType: ProductType.RawMaterial, category: 'PC & Linh kiện', imageUrl: 'https://placehold.co/400x400/64748b/ffffff?text=PSU' },
    { id: 'SP103', name: 'CPU Core i5', price: 0, cost: 4500000, sku: 'CPU-I5', minStock: 10, supplierId: 'NCC002', productType: ProductType.RawMaterial, category: 'PC & Linh kiện', imageUrl: 'https://placehold.co/400x400/64748b/ffffff?text=CPU' },
    { id: 'SP104', name: 'RAM 16GB DDR5', price: 0, cost: 1800000, sku: 'RAM-DDR5-16', minStock: 20, supplierId: 'NCC002', productType: ProductType.RawMaterial, category: 'PC & Linh kiện', imageUrl: 'https://placehold.co/400x400/64748b/ffffff?text=RAM' },
    { id: 'SP105', name: 'SSD 1TB NVMe', price: 0, cost: 2200000, sku: 'SSD-1TB-NVME', minStock: 10, supplierId: 'NCC002', productType: ProductType.RawMaterial, category: 'PC & Linh kiện', imageUrl: 'https://placehold.co/400x400/64748b/ffffff?text=SSD' },
];

export const initialChartOfAccounts: Account[] = [
    // Tài sản
    { id: '111', code: '111', name: 'Tiền mặt', type: AccountType.Asset, isSystemAccount: true },
    { id: '112', code: '112', name: 'Tiền gửi ngân hàng', type: AccountType.Asset, isSystemAccount: true },
    { id: '131', code: '131', name: 'Phải thu của khách hàng', type: AccountType.Asset, isSystemAccount: true },
    { id: '133', code: '133', name: 'Thuế GTGT được khấu trừ', type: AccountType.Asset, isSystemAccount: true },
    { id: '156', code: '156', name: 'Hàng hóa', type: AccountType.Asset, isSystemAccount: true },
    // Nợ phải trả
    { id: '331', code: '331', name: 'Phải trả cho người bán', type: AccountType.Liability, isSystemAccount: true },
    { id: '3331', code: '3331', name: 'Thuế GTGT phải nộp', type: AccountType.Liability, isSystemAccount: true },
    // Doanh thu
    { id: '511', code: '511', name: 'Doanh thu bán hàng và cung cấp dịch vụ', type: AccountType.Revenue, isSystemAccount: true },
    { id: '515', code: '515', name: 'Doanh thu hoạt động tài chính', type: AccountType.Revenue, isSystemAccount: false },
    // Chi phí
    { id: '632', code: '632', name: 'Giá vốn hàng bán', type: AccountType.Expense, isSystemAccount: true },
    { id: '642', code: '642', name: 'Chi phí quản lý doanh nghiệp', type: AccountType.Expense, isSystemAccount: false },
    { id: '6421', code: '6421', name: 'Chi phí thuê mặt bằng', type: AccountType.Expense, isSystemAccount: false },
];

export const initialInventoryStock: InventoryItem[] = [
    { productId: 'SP001', warehouse: 'Kho chính', stock: 150 },
    { productId: 'SP002', warehouse: 'Kho chính', stock: 18 },
    { productId: 'SP003', warehouse: 'Kho phụ', stock: 45 },
    { productId: 'SP004', warehouse: 'Kho chính', stock: 5 },
    { productId: 'SP005', warehouse: 'Kho chính', stock: 30 },
    // Raw Materials Stock
    { productId: 'SP101', warehouse: 'Kho chính', stock: 50 },
    { productId: 'SP102', warehouse: 'Kho chính', stock: 40 },
    { productId: 'SP103', warehouse: 'Kho chính', stock: 30 },
    { productId: 'SP104', warehouse: 'Kho chính', stock: 100 },
    { productId: 'SP105', warehouse: 'Kho chính', stock: 60 },
    // Finished Goods Stock
    { productId: 'SP006', warehouse: 'Kho chính', stock: 8 },
];


const today = new Date().toISOString().split('T')[0];

export const initialOrders: Order[] = [
  { id: 'DH001', customerId: 'KH002', customerName: 'Nguyễn Văn A', date: today, items: [{productId: 'SP001', productName: 'Bàn phím cơ ABC', quantity: 2, price: 700000}], subtotal: 1400000, discount: 0, taxRate: 0, tax: 0, total: 1400000, status: OrderStatus.Completed, paymentMethod: PaymentMethod.Card, paymentStatus: PaymentStatus.Paid, amountPaid: 1400000, warehouse: 'Kho chính' },
  { id: 'DH002', customerId: 'KH003', customerName: 'Trần Thị B', date: today, items: [{productId: 'SP003', productName: 'Màn hình 27" Ultra', quantity: 1, price: 8000000}], subtotal: 8000000, discount: 0, taxRate: 0, tax: 0, total: 8000000, status: OrderStatus.Completed, paymentMethod: PaymentMethod.Cash, paymentStatus: PaymentStatus.Paid, amountPaid: 8000000, warehouse: 'Kho phụ' },
  { id: 'DH003', customerId: 'KH001', customerName: 'Công ty TNHH ABC', date: '2024-07-27', items: [{productId: 'SP005', productName: 'Laptop Pro 16', quantity: 5, price: 40000000}], subtotal: 200000000, discount: 10000000, taxRate: 10, tax: 19000000, total: 209000000, status: OrderStatus.Pending, paymentMethod: PaymentMethod.BankTransfer, paymentStatus: PaymentStatus.Unpaid, amountPaid: 0, warehouse: 'Kho chính' },
  { id: 'DH004', customerId: 'KH005', customerName: 'Phạm Thị D', date: '2024-07-26', items: [{productId: 'SP002', productName: 'Chuột không dây XYZ', quantity: 1, price: 250000}], subtotal: 250000, discount: 0, taxRate: 0, tax: 0, total: 250000, status: OrderStatus.Completed, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.Paid, amountPaid: 250000, warehouse: 'Kho chính' },
  { id: 'DH005', customerId: 'KH002', customerName: 'Nguyễn Văn A', date: '2024-07-25', items: [{productId: 'SP004', productName: 'Webcam HD Pro', quantity: 1, price: 1200000}], subtotal: 1200000, discount: 0, taxRate: 0, tax: 0, total: 1200000, status: OrderStatus.Cancelled, paymentMethod: PaymentMethod.Cash, paymentStatus: PaymentStatus.Unpaid, amountPaid: 0, warehouse: 'Kho chính' },
  { id: 'DH006', customerId: 'KH004', customerName: 'Tập đoàn XYZ', date: '2024-07-24', items: [{productId: 'SP003', productName: 'Màn hình 27" Ultra', quantity: 10, price: 8000000}], subtotal: 80000000, discount: 0, taxRate: 8, tax: 6400000, total: 86400000, status: OrderStatus.Completed, paymentMethod: PaymentMethod.BankTransfer, paymentStatus: PaymentStatus.Paid, amountPaid: 86400000, warehouse: 'Kho phụ' },
  { id: 'DH007', customerId: 'KH003', customerName: 'Trần Thị B', date: '2024-07-23', items: [{productId: 'SP001', productName: 'Bàn phím cơ ABC', quantity: 5, price: 700000}], subtotal: 3500000, discount: 0, taxRate: 0, tax: 0, total: 3500000, status: OrderStatus.Processing, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.Unpaid, amountPaid: 0, warehouse: 'Kho chính' },
  { id: 'DH008', customerId: 'KH001', customerName: 'Công ty TNHH ABC', date: '2024-07-22', items: [{productId: 'SP002', productName: 'Chuột không dây XYZ', quantity: 20, price: 250000}], subtotal: 5000000, discount: 500000, taxRate: 10, tax: 450000, total: 4950000, status: OrderStatus.Completed, paymentMethod: PaymentMethod.BankTransfer, paymentStatus: PaymentStatus.PartiallyPaid, amountPaid: 2000000, warehouse: 'Kho chính' },
  { id: 'DH009', customerId: 'KH002', customerName: 'Nguyễn Văn A', date: '2024-07-21', items: [{productId: 'SP004', productName: 'Webcam HD Pro', quantity: 3, price: 1200000}], subtotal: 3600000, discount: 0, taxRate: 0, tax: 0, total: 3600000, status: OrderStatus.Processing, paymentMethod: PaymentMethod.Card, paymentStatus: PaymentStatus.Paid, amountPaid: 3600000, warehouse: 'Kho chính' },
  { id: 'DH010', customerId: 'KH004', customerName: 'Tập đoàn XYZ', date: '2024-07-20', items: [{productId: 'SP005', productName: 'Laptop Pro 16', quantity: 2, price: 40000000}], subtotal: 80000000, discount: 0, taxRate: 0, tax: 0, total: 80000000, status: OrderStatus.Pending, paymentMethod: PaymentMethod.BankTransfer, paymentStatus: PaymentStatus.Unpaid, amountPaid: 0, warehouse: 'Kho chính' },
  { id: 'DH011', customerId: 'KH005', customerName: 'Phạm Thị D', date: '2024-07-19', items: [{productId: 'SP001', productName: 'Bàn phím cơ ABC', quantity: 1, price: 700000}], subtotal: 700000, discount: 0, taxRate: 0, tax: 0, total: 700000, status: OrderStatus.Cancelled, paymentMethod: PaymentMethod.Cash, paymentStatus: PaymentStatus.Unpaid, amountPaid: 0, warehouse: 'Kho chính' },
  { id: 'DH012', customerId: 'KH003', customerName: 'Trần Thị B', date: '2024-07-18', items: [{productId: 'SP003', productName: 'Màn hình 27" Ultra', quantity: 2, price: 8000000}], subtotal: 16000000, discount: 0, taxRate: 0, tax: 0, total: 16000000, status: OrderStatus.Completed, paymentMethod: PaymentMethod.Cash, paymentStatus: PaymentStatus.Paid, amountPaid: 16000000, warehouse: 'Kho phụ' },
];

export const initialQuotations: Quotation[] = [
    {
        id: 'BG001',
        customerId: 'KH001',
        customerName: 'Công ty TNHH ABC',
        date: '2024-07-25',
        expiryDate: '2024-08-01',
        items: [
            { productId: 'SP005', productName: 'Laptop Pro 16', quantity: 10, price: 40000000 },
            { productId: 'SP003', productName: 'Màn hình 27" Ultra', quantity: 10, price: 8000000 },
        ],
        subtotal: 480000000,
        discount: 20000000,
        taxRate: 10,
        tax: 46000000,
        total: 506000000,
        status: QuotationStatus.Sent,
        notes: 'Báo giá cho dự án nâng cấp văn phòng.'
    },
    {
        id: 'BG002',
        customerId: 'KH004',
        customerName: 'Tập đoàn XYZ',
        date: '2024-07-28',
        expiryDate: '2024-08-05',
        items: [
            { productId: 'SP001', productName: 'Bàn phím cơ ABC', quantity: 100, price: 700000 },
        ],
        subtotal: 70000000,
        discount: 0,
        taxRate: 0,
        tax: 0,
        total: 70000000,
        status: QuotationStatus.Draft,
    },
     {
        id: 'BG003',
        customerId: 'KH002',
        customerName: 'Nguyễn Văn A',
        date: '2024-07-29',
        expiryDate: '2024-08-06',
        items: [
            { productId: 'SP002', productName: 'Chuột không dây XYZ', quantity: 5, price: 250000 },
        ],
        subtotal: 1250000,
        discount: 0,
        taxRate: 0,
        tax: 0,
        total: 1250000,
        status: QuotationStatus.Accepted,
    },
];


export const initialPurchaseOrders: PurchaseOrder[] = [
    {
        id: 'PO001', supplierId: 'NCC002', supplierName: 'Công ty máy tính Phong Vũ', orderDate: '2024-07-15', receivedDate: '2024-07-20',
        items: [{ productId: 'SP005', productName: 'Laptop Pro 16', quantity: 20, cost: 35000000 }, { productId: 'SP003', productName: 'Màn hình 27" Ultra', quantity: 30, cost: 6500000 }],
        subtotal: 895000000,
        taxRate: 10,
        tax: 89500000,
        total: 984500000, status: PurchaseOrderStatus.Received,
        paymentStatus: PaymentStatus.Paid, amountPaid: 984500000, warehouse: 'Kho chính',
    },
    {
        id: 'PO002', supplierId: 'NCC001', supplierName: 'Nhà phân phối Anker VN', orderDate: '2024-07-22',
        items: [{ productId: 'SP002', productName: 'Chuột không dây XYZ', quantity: 50, cost: 150000 }],
        subtotal: 7500000,
        taxRate: 0,
        tax: 0,
        total: 7500000, status: PurchaseOrderStatus.Ordered,
        paymentStatus: PaymentStatus.Unpaid, amountPaid: 0, warehouse: 'Kho chính',
    },
    {
        id: 'PO003', supplierId: 'NCC003', supplierName: 'Tổng kho linh kiện Miền Nam', orderDate: '2024-07-28',
        items: [{ productId: 'SP004', productName: 'Webcam HD Pro', quantity: 40, cost: 800000 }],
        subtotal: 32000000,
        taxRate: 0,
        tax: 0,
        total: 32000000, status: PurchaseOrderStatus.Draft,
        paymentStatus: PaymentStatus.Unpaid, amountPaid: 0, warehouse: 'Kho chính',
    },
     {
        id: 'PO004', supplierId: 'NCC001', supplierName: 'Nhà phân phối Anker VN', orderDate: '2024-07-18', receivedDate: '2024-07-25',
        items: [{ productId: 'SP001', productName: 'Bàn phím cơ ABC', quantity: 100, cost: 450000 }],
        subtotal: 45000000,
        taxRate: 0,
        tax: 0,
        total: 45000000, status: PurchaseOrderStatus.Received,
        paymentStatus: PaymentStatus.PartiallyPaid, amountPaid: 15000000, warehouse: 'Kho chính',
    },
];

export const initialInventoryMovements: InventoryMovement[] = [
    { id: 'IM001', date: '2024-07-25', productId: 'SP001', productName: 'Bàn phím cơ ABC', type: InventoryMovementType.PurchaseReceipt, quantityChange: 100, toWarehouse: 'Kho chính', referenceId: 'PO004' },
    { id: 'IM002', date: '2024-07-22', productId: 'SP002', productName: 'Chuột không dây XYZ', type: InventoryMovementType.SalesIssue, quantityChange: -20, fromWarehouse: 'Kho chính', referenceId: 'DH008' },
    { id: 'IM003', date: '2024-07-20', productId: 'SP005', productName: 'Laptop Pro 16', type: InventoryMovementType.PurchaseReceipt, quantityChange: 20, toWarehouse: 'Kho chính', referenceId: 'PO001' },
    { id: 'IM004', date: '2024-07-20', productId: 'SP003', productName: 'Màn hình 27" Ultra', type: InventoryMovementType.PurchaseReceipt, quantityChange: 30, toWarehouse: 'Kho phụ', referenceId: 'PO001' },
    { id: 'IM005', date: today, productId: 'SP001', productName: 'Bàn phím cơ ABC', type: InventoryMovementType.SalesIssue, quantityChange: -2, fromWarehouse: 'Kho chính', referenceId: 'DH001' },
];

export const initialSalesReturns: SalesReturn[] = [];

export const initialInventoryAdjustments: InventoryAdjustment[] = [];
export const initialStockTransfers: StockTransfer[] = [];

export const initialJournalEntries: JournalEntry[] = [
    {
        id: 'JE001', date: '2024-07-20', description: 'Thanh toán cho đơn mua hàng PO001', referenceId: 'PO001',
        lines: [
            { accountId: '331', accountCode: '331', accountName: 'Phải trả cho người bán', debit: 984500000, credit: 0 },
            { accountId: '112', accountCode: '112', accountName: 'Tiền gửi ngân hàng', debit: 0, credit: 984500000 }
        ]
    },
    {
        id: 'JE002', date: '2024-07-24', description: 'Thanh toán cho đơn hàng DH006', referenceId: 'DH006',
        lines: [
            { accountId: '112', accountCode: '112', accountName: 'Tiền gửi ngân hàng', debit: 86400000, credit: 0 },
            { accountId: '511', accountCode: '511', accountName: 'Doanh thu bán hàng và cung cấp dịch vụ', debit: 0, credit: 86400000 }
        ]
    },
    {
        id: 'JE003', date: '2024-07-25', description: 'Tiền thuê mặt bằng tháng 7',
        lines: [
            { accountId: '6421', accountCode: '6421', accountName: 'Chi phí thuê mặt bằng', debit: 20000000, credit: 0 },
            { accountId: '112', accountCode: '112', accountName: 'Tiền gửi ngân hàng', debit: 0, credit: 20000000 }
        ]
    },
    // Adding back some other transactions as journal entries
    { id: 'JE004', date: today, description: 'Thanh toán cho đơn hàng DH001', referenceId: 'DH001', lines: [ { accountId: '111', accountCode: '111', accountName: 'Tiền mặt', debit: 1400000, credit: 0 }, { accountId: '131', accountCode: '131', accountName: 'Phải thu của khách hàng', debit: 0, credit: 1400000 } ] },
    { id: 'JE005', date: today, description: 'Thanh toán cho đơn hàng DH002', referenceId: 'DH002', lines: [ { accountId: '111', accountCode: '111', accountName: 'Tiền mặt', debit: 8000000, credit: 0 }, { accountId: '131', accountCode: '131', accountName: 'Phải thu của khách hàng', debit: 0, credit: 8000000 } ] },
    { id: 'JE006', date: '2024-07-25', description: 'Thanh toán cho đơn mua hàng PO004', referenceId: 'PO004', lines: [ { accountId: '331', accountCode: '331', accountName: 'Phải trả cho người bán', debit: 15000000, credit: 0 }, { accountId: '112', accountCode: '112', accountName: 'Tiền gửi ngân hàng', debit: 0, credit: 15000000 } ] },
];

export const initialBillsOfMaterials: BillOfMaterials[] = [
    {
        id: 'BOM001',
        name: 'Cấu hình PC Gaming ABC',
        productId: 'SP006', // ID of the Finished Good
        items: [
            { productId: 'SP101', productName: 'Vỏ case XYZ', quantity: 1, cost: 800000 },
            { productId: 'SP102', productName: 'Nguồn 750W Gold', quantity: 1, cost: 1500000, waste: 2 },
            { productId: 'SP103', productName: 'CPU Core i5', quantity: 1, cost: 4500000 },
            { productId: 'SP104', productName: 'RAM 16GB DDR5', quantity: 2, cost: 1800000 },
            { productId: 'SP105', productName: 'SSD 1TB NVMe', quantity: 1, cost: 2200000 },
        ],
        totalCost: 12630000, // Includes 2% waste on PSU: 1.5M * 1.02 = 1.53M
        lastUpdated: '2024-07-20',
    },
];

const defaultSteps = (): ProductionStep[] => ([
    { name: 'Chuẩn bị Nguyên vật liệu', completed: false },
    { name: 'Lắp ráp', completed: false },
    { name: 'Kiểm tra Chất lượng (QC)', completed: false },
    { name: 'Đóng gói', completed: false },
]);

export const initialWorkOrders: WorkOrder[] = [
    {
        id: 'LSX001',
        productId: 'SP006',
        productName: 'Bộ PC Gaming ABC',
        quantityToProduce: 5,
        bomId: 'BOM001',
        status: WorkOrderStatus.Pending,
        creationDate: '2024-07-28',
        warehouse: 'Kho chính',
        notes: 'Lắp ráp cho đơn hàng của công ty ABC.',
        estimatedCost: 63150000, // 12,630,000 * 5
        productionSteps: defaultSteps(),
    },
    {
        id: 'LSX002',
        productId: 'SP006',
        productName: 'Bộ PC Gaming ABC',
        quantityToProduce: 2,
        bomId: 'BOM001',
        status: WorkOrderStatus.InProgress,
        creationDate: '2024-07-26',
        warehouse: 'Kho chính',
        notes: '',
        estimatedCost: 25260000, // 12,630,000 * 2
        productionSteps: [
            { name: 'Chuẩn bị Nguyên vật liệu', completed: true },
            { name: 'Lắp ráp', completed: true },
            { name: 'Kiểm tra Chất lượng (QC)', completed: false },
            { name: 'Đóng gói', completed: false },
        ],
    },
    {
        id: 'LSX003',
        productId: 'SP006',
        productName: 'Bộ PC Gaming ABC',
        quantityToProduce: 3,
        bomId: 'BOM001',
        status: WorkOrderStatus.Completed,
        creationDate: '2024-07-22',
        completionDate: '2024-07-24',
        warehouse: 'Kho chính',
        notes: 'Sản xuất cho đợt hàng mẫu.',
        estimatedCost: 37890000,
        actualCost: 38100000, // Slightly higher actual cost
        productionSteps: defaultSteps().map(s => ({...s, completed: true})),
    }
];


export const topProducts = [
    { id: 'SP001', name: 'Bàn phím cơ ABC', sales: 350, revenue: '245,000,000đ' },
    { id: 'SP003', name: 'Màn hình 27" Ultra', sales: 120, revenue: '960,000,000đ' },
    { id: 'SP002', name: 'Chuột không dây XYZ', sales: 500, revenue: '125,000,000đ' },
    { id: 'SP005', name: 'Laptop Pro 16', sales: 45, revenue: '1,800,000,000đ' },
];

export const topCustomers = [
    { id: 'KH004', name: 'Tập đoàn XYZ', totalSpent: '2,500,000,000đ', lastOrder: '2024-07-25' },
    { id: 'KH001', name: 'Công ty TNHH ABC', totalSpent: '1,800,000,000đ', lastOrder: '2024-07-28' },
    { id: 'KH007', name: 'Khách hàng VIP 1', totalSpent: '950,000,000đ', lastOrder: '2024-07-20' },
    { id: 'KH002', name: 'Nguyễn Văn A', totalSpent: '75,000,000đ', lastOrder: '2024-07-29' },
];

export const initialCompanySettings: CompanySettings = {
    name: 'Tên Công ty Của Bạn',
    address: '123 Đường ABC, Phường X, Quận Y, Thành phố Z',
    phone: '0123 456 789',
    email: 'lienhe@congty.com',
    logoUrl: '', // e.g., 'https://your-logo-url.com/logo.png'
    invoiceFooter: 'Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi!',
    quotationTitle: 'BÁO GIÁ',
    quotationTerms: '1. Báo giá có hiệu lực trong vòng 07 ngày.\n2. Giá trên chưa bao gồm 10% VAT.\n3. Thanh toán 100% sau khi nhận hàng.',
    bankDetails: 'Tên ngân hàng: VIETCOMBANK\nSố tài khoản: 0123456789\nChủ tài khoản: Tên Công ty Của Bạn',
    warehouses: [
        { id: 'kho_chinh', name: 'Kho chính' },
        { id: 'kho_phu', name: 'Kho phụ' },
    ]
};

export const initialAccountingPeriods: AccountingPeriod[] = [
    { id: 'P202407', name: 'Kỳ tháng 7/2024', startDate: '2024-07-01', endDate: '2024-07-31', status: 'Mở' },
    { id: 'P202406', name: 'Kỳ tháng 6/2024', startDate: '2024-06-01', endDate: '2024-06-30', status: 'Đã đóng' },
];

export const initialTaxRates: TaxRate[] = [
    { id: 'T0', name: 'Không thuế', rate: 0, isDefault: true },
    { id: 'T10', name: 'VAT 10%', rate: 10, isDefault: false },
    { id: 'T8', name: 'VAT 8%', rate: 8, isDefault: false },
];

const ALL_VIEW_PERMISSIONS: Permission[] = [
    'VIEW_DASHBOARD', 'VIEW_SALES', 'VIEW_CRM', 'VIEW_PRODUCT', 'VIEW_MANUFACTURING',
    'VIEW_INVENTORY', 'VIEW_SUPPLIER', 'VIEW_PURCHASING', 'VIEW_ACCOUNTING',
    'VIEW_REPORTS', 'VIEW_STAFF', 'VIEW_SETTINGS'
];

const ALL_CRUD_PERMISSIONS: Permission[] = [
    'CREATE_ORDER', 'EDIT_ORDER', 'CANCEL_ORDER', 'UPDATE_ORDER_STATUS', 'PROCESS_ORDER_PAYMENT',
    'CREATE_RETURN', 'CREATE_QUOTATION', 'EDIT_QUOTATION', 'DELETE_QUOTATION', 'UPDATE_QUOTATION_STATUS',
    'CREATE_CUSTOMER', 'EDIT_CUSTOMER', 'DELETE_CUSTOMER',
    'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'PRINT_BARCODE',
    'CREATE_ADJUSTMENT', 'CREATE_TRANSFER',
    'CREATE_PO', 'EDIT_PO', 'DELETE_PO', 'UPDATE_PO_STATUS', 'PROCESS_PO_PAYMENT',
    'MANAGE_BOM', 'CREATE_WORK_ORDER', 'UPDATE_WORK_ORDER_STATUS', 'COMPLETE_WORK_ORDER', 'UPDATE_WORK_ORDER_STEPS',
    'MANAGE_TRANSACTIONS',
    'MANAGE_STAFF', 'EDIT_COMPANY_SETTINGS', 'MANAGE_DATA', 'MANAGE_PERMISSIONS'
];

export const initialPermissions: PermissionsConfig = {
    [UserRole.Admin]: [], // Admin has all permissions by default, handled in code.
    [UserRole.Manager]: [...ALL_VIEW_PERMISSIONS, ...ALL_CRUD_PERMISSIONS],
    [UserRole.Sales]: [
        'VIEW_DASHBOARD', 'VIEW_SALES', 'VIEW_CRM', 'VIEW_PRODUCT', 'VIEW_INVENTORY',
        'CREATE_ORDER', 'EDIT_ORDER', 'UPDATE_ORDER_STATUS',
        'CREATE_QUOTATION', 'EDIT_QUOTATION', 'DELETE_QUOTATION', 'UPDATE_QUOTATION_STATUS',
        'CREATE_CUSTOMER', 'EDIT_CUSTOMER', 'DELETE_CUSTOMER'
    ],
    [UserRole.Accountant]: [
        'VIEW_DASHBOARD', 'VIEW_SALES', 'VIEW_CRM', 'VIEW_SUPPLIER', 'VIEW_PURCHASING',
        'VIEW_ACCOUNTING', 'VIEW_REPORTS',
        'PROCESS_ORDER_PAYMENT', 'PROCESS_PO_PAYMENT', 'MANAGE_TRANSACTIONS'
    ],
    [UserRole.Warehouse]: [
        'VIEW_DASHBOARD', 'VIEW_INVENTORY', 'VIEW_SUPPLIER', 'VIEW_PURCHASING',
        'VIEW_PRODUCT', 'VIEW_MANUFACTURING',
        'PRINT_BARCODE', 'CREATE_ADJUSTMENT', 'CREATE_TRANSFER',
        'UPDATE_PO_STATUS', 'COMPLETE_WORK_ORDER', 'UPDATE_WORK_ORDER_STATUS', 'UPDATE_WORK_ORDER_STEPS'
    ],
};