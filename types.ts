import { SortConfig } from "./hooks/useSortableData";

export type NavView = 'DASHBOARD' | 'SALES' | 'CRM' | 'INVENTORY' | 'SUPPLIER' | 'ACCOUNTING' | 'REPORTS' | 'PURCHASING' | 'PRODUCT' | 'SETTINGS' | 'MANUFACTURING' | 'STAFF';

export interface NavItemType {
  id: NavView;
  label: string;
  icon: React.ReactNode;
}

export enum UserRole {
    Admin = 'Quản trị viên',
    Manager = 'Quản lý',
    Sales = 'Nhân viên Bán hàng',
    Accountant = 'Nhân viên Kế toán',
    Warehouse = 'Nhân viên Kho',
}

// --- NEW GRANULAR PERMISSIONS ---
export type Permission =
  // View permissions
  | 'VIEW_DASHBOARD' | 'VIEW_SALES' | 'VIEW_CRM' | 'VIEW_PRODUCT' | 'VIEW_MANUFACTURING'
  | 'VIEW_INVENTORY' | 'VIEW_SUPPLIER' | 'VIEW_PURCHASING' | 'VIEW_ACCOUNTING'
  | 'VIEW_REPORTS' | 'VIEW_STAFF' | 'VIEW_SETTINGS'

  // Sales permissions
  | 'CREATE_ORDER' | 'EDIT_ORDER' | 'CANCEL_ORDER' | 'UPDATE_ORDER_STATUS'
  | 'PROCESS_ORDER_PAYMENT' | 'CREATE_RETURN'
  | 'CREATE_QUOTATION' | 'EDIT_QUOTATION' | 'DELETE_QUOTATION' | 'UPDATE_QUOTATION_STATUS'

  // CRM permissions
  | 'CREATE_CUSTOMER' | 'EDIT_CUSTOMER' | 'DELETE_CUSTOMER'

  // Product permissions
  | 'CREATE_PRODUCT' | 'EDIT_PRODUCT' | 'DELETE_PRODUCT' | 'PRINT_BARCODE'

  // Inventory permissions
  | 'CREATE_ADJUSTMENT' | 'CREATE_TRANSFER'

  // Purchasing permissions
  | 'CREATE_PO' | 'EDIT_PO' | 'DELETE_PO' | 'UPDATE_PO_STATUS' | 'PROCESS_PO_PAYMENT'
  
  // Manufacturing permissions
  | 'MANAGE_BOM' | 'CREATE_WORK_ORDER' | 'UPDATE_WORK_ORDER_STATUS' | 'COMPLETE_WORK_ORDER' | 'UPDATE_WORK_ORDER_STEPS'
  
  // Accounting permissions
  | 'MANAGE_TRANSACTIONS'

  // Staff permissions
  | 'MANAGE_STAFF'

  // Settings permissions
  | 'EDIT_COMPANY_SETTINGS' | 'MANAGE_DATA' | 'MANAGE_PERMISSIONS';

export type PermissionsConfig = Record<UserRole, Permission[]>;


export interface User {
    id: string;
    name: string;
    username: string;
    password?: string; // Password should be handled securely, optional on client
    role: UserRole;
    avatar: string;
}

export enum OrderStatus {
  Pending = 'Chờ xác nhận',
  Processing = 'Đang giao',
  Completed = 'Đã hoàn thành',
  Cancelled = 'Đã huỷ',
}

// ---- NEW TYPES FOR PAYMENT ----
export enum PaymentMethod {
    Cash = 'Tiền mặt',
    BankTransfer = 'Chuyển khoản',
    Card = 'Thẻ',
    COD = 'COD',
}

export enum PaymentStatus {
    Paid = 'Đã thanh toán',
    PartiallyPaid = 'Thanh toán một phần',
    Unpaid = 'Chưa thanh toán',
}


export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id:string;
  customerId: string; 
  customerName: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax?: number;
  taxRate?: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  warehouse: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'B2C' | 'B2B';
  since: string;
}

export enum ProductType {
    Standard = 'Tiêu chuẩn',
    FinishedGood = 'Thành phẩm',
    RawMaterial = 'Nguyên vật liệu',
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    minStock: number;
    price: number; // Selling price
    cost: number; // Purchase cost
    supplierId: string;
    productType: ProductType;
    category?: string;
    imageUrl?: string;
}

// ---- NEW TYPES FOR QUOTATIONS ----
export enum QuotationStatus {
    Draft = 'Dự thảo',
    Sent = 'Đã gửi',
    Accepted = 'Đã chấp nhận',
    Rejected = 'Đã từ chối',
    Converted = 'Đã tạo ĐH',
}

export interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Quotation {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  expiryDate: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  tax?: number;
  taxRate?: number;
  total: number;
  status: QuotationStatus;
  notes?: string;
  createdOrderId?: string; // To link to the created order
}


// ---- NEW TYPES FOR PURCHASING AND SUPPLIERS ----

export interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
}

export interface EnrichedSupplier extends Supplier {
    totalSpent: number;
    debt: number;
    poCount: number;
}


export enum PurchaseOrderStatus {
    Draft = 'Dự thảo',
    Ordered = 'Đã đặt hàng',
    Received = 'Đã nhận',
}

export interface PurchaseOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    cost: number; // Cost per unit
}

export interface PurchaseOrder {
    id: string;
    supplierId: string;
    supplierName: string;
    orderDate: string;
    receivedDate?: string;
    items: PurchaseOrderItem[];
    subtotal: number;
    tax?: number;
    taxRate?: number;
    total: number;
    status: PurchaseOrderStatus;
    paymentStatus: PaymentStatus;
    amountPaid: number;
    warehouse: string;
}

// ---- NEW TYPES FOR INVENTORY MANAGEMENT ----
export enum InventoryMovementType {
    PurchaseReceipt = 'Nhập kho (mua hàng)',
    SalesIssue = 'Xuất kho (bán hàng)',
    SalesReturn = 'Hàng bán bị trả lại',
    TransferOut = 'Chuyển kho (xuất)',
    TransferIn = 'Chuyển kho (nhập)',
    Adjustment = 'Kiểm kê (điều chỉnh)',
    ProductionIssue = 'Xuất sản xuất',
    ProductionReceipt = 'Nhập thành phẩm',
}

export interface InventoryMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: InventoryMovementType;
  quantityChange: number; // positive for in, negative for out
  fromWarehouse?: string;
  toWarehouse?: string;
  referenceId: string; // PO-xxx, DH-xxx, T-xxx, SR-xxx
  notes?: string;
}

export interface InventoryItem {
    productId: string;
    warehouse: string;
    stock: number;
}

// ---- NEW TYPES FOR STOCK TRANSFER ----
export enum StockTransferStatus {
    Completed = 'Hoàn thành',
}

export interface StockTransferItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  date: string;
  fromWarehouse: string;
  toWarehouse: string;
  items: StockTransferItem[];
  status: StockTransferStatus;
  notes?: string;
}


// ---- NEW TYPES FOR SALES RETURNS ----
export enum SalesReturnStatus {
    Completed = 'Hoàn thành',
}

export interface SalesReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // The price at which it was sold
}

export interface SalesReturn {
  id: string;
  originalOrderId: string;
  customerId: string;
  customerName: string;
  date: string;
  items: SalesReturnItem[];
  totalRefund: number;
  status: SalesReturnStatus;
}

// ---- NEW TYPES FOR INVENTORY ADJUSTMENT ----
export interface InventoryAdjustmentItem {
  productId: string;
  productName: string;
  systemStock: number; // Stock before adjustment
  actualStock: number; // The real count
  difference: number; // actualStock - systemStock
}

export interface InventoryAdjustment {
  id: string;
  date: string;
  warehouse: string;
  notes?: string;
  items: InventoryAdjustmentItem[];
}


// ---- NEW & REVISED TYPES FOR ACCOUNTING ----
export enum AccountType {
    Asset = 'Tài sản',
    Liability = 'Nợ phải trả',
    Equity = 'Vốn chủ sở hữu',
    Revenue = 'Doanh thu',
    Expense = 'Chi phí',
}

// Replaces TransactionCategorySetting
export interface Account {
    id: string;
    code: string; // e.g., "111", "511"
    name: string; // e.g., "Tiền mặt", "Doanh thu bán hàng"
    type: AccountType;
    isSystemAccount?: boolean; // To prevent deletion of core accounts like Cash, AR, AP
}

export interface JournalEntryLine {
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number; // Ghi Nợ
    credit: number; // Ghi Có
}

// Replaces Transaction
export interface JournalEntry {
    id: string;
    date: string;
    description: string;
    lines: JournalEntryLine[];
    referenceId?: string; // e.g., Order ID, PO ID
}


export interface AccountSummary {
  name: string;
  type: 'asset' | 'revenue' | 'expense';
  balance: number;
  transactions: any[]; // This will be refactored
}

// ---- NOTIFICATIONS ----
export enum NotificationType {
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
    INFO = 'info',
}

export type NotificationIconType =
  | 'ShoppingCartIcon'
  | 'ArchiveBoxXMarkIcon'
  | 'CheckCircleIcon'
  | 'TruckIcon'
  | 'CreditCardIcon'
  | 'ArrowUturnLeftIcon'
  | 'DocumentCheckIcon'
  | 'WrenchScrewdriverIcon';

export interface Notification {
    id: string;
    timestamp: string;
    isRead: boolean;
    type: NotificationType;
    icon: NotificationIconType;
    title: string;
    message: string;
    nav?: {
        view: NavView;
        params?: any;
    };
}

// ---- MANUFACTURING ----
export interface BillOfMaterialsItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  waste?: number; // Optional waste percentage (e.g., 5 for 5%)
}
export interface BillOfMaterials {
  id: string;
  name: string;
  productId: string; // Finished Good ID
  items: BillOfMaterialsItem[];
  totalCost: number;
  lastUpdated: string;
}

export enum WorkOrderStatus {
    Pending = 'Chờ sản xuất',
    InProgress = 'Đang sản xuất',
    Completed = 'Hoàn thành',
}

export interface ProductionStep {
    name: string;
    completed: boolean;
}

export interface WorkOrder {
    id: string;
    productId: string;
    productName: string;
    quantityToProduce: number;
    bomId: string;
    status: WorkOrderStatus;
    creationDate: string;
    completionDate?: string;
    warehouse: string;
    notes?: string;
    estimatedCost: number;
    actualCost?: number;
    productionSteps: ProductionStep[];
}

// ---- SETTINGS ----
export interface Warehouse {
    id: string;
    name: string;
}

export interface CompanySettings {
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl: string;
    invoiceFooter: string;
    quotationTitle: string;
    quotationTerms: string;
    bankDetails: string;
    warehouses: Warehouse[];
}

// --- ACCOUNTING SETTINGS ---
export interface AccountingPeriod {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'Mở' | 'Đã đóng';
}

export interface TaxRate {
    id: string;
    name: string;
    rate: number; // percentage
    isDefault: boolean;
}

// --- AI CHAT ---
export interface AIChatMessage {
    sender: 'user' | 'ai';
    text: string;
    isError?: boolean;
}

// --- API TYPES for PAGINATION/FILTERING ---
export interface ApiListOptions<T> {
    page?: number;
    limit?: number;
    search?: string;
    filters?: any;
    sortConfig?: SortConfig<T> | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
}