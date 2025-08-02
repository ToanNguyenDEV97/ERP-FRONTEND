// This file simulates a backend API by using mock data.
import {
    User,
    Product,
    Order,
    Customer,
    Supplier,
    PurchaseOrder,
    InventoryMovement,
    SalesReturn,
    InventoryAdjustment,
    Quotation,
    InventoryItem,
    StockTransfer,
    BillOfMaterials,
    WorkOrder,
    CompanySettings,
    PermissionsConfig,
    OrderStatus,
    SalesReturnItem,
    SalesReturnStatus,
    PurchaseOrderStatus,
    QuotationStatus,
    WorkOrderStatus,
    PaymentStatus,
    PaymentMethod,
    InventoryMovementType,
    AccountingPeriod,
    TaxRate,
    StockTransferItem,
    StockTransferStatus,
    InventoryAdjustmentItem,
    JournalEntry,
    Account,
    ProductionStep,
    NavView,
} from './types';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import * as mockData from './data';

// --- SIMULATED DATABASE ---
let users: User[] = [...mockData.mockUsers];
let customers: Customer[] = [...mockData.mockCustomers];
let suppliers: Supplier[] = [...mockData.mockSuppliers];
let products: Product[] = [...mockData.mockProducts];
let inventoryStock: InventoryItem[] = JSON.parse(JSON.stringify(mockData.initialInventoryStock));
let orders: Order[] = JSON.parse(JSON.stringify(mockData.initialOrders));
let quotations: Quotation[] = [...mockData.initialQuotations];
let purchaseOrders: PurchaseOrder[] = [...mockData.initialPurchaseOrders];
let inventoryMovements: InventoryMovement[] = [...mockData.initialInventoryMovements];
let salesReturns: SalesReturn[] = [...mockData.initialSalesReturns];
let inventoryAdjustments: InventoryAdjustment[] = [...mockData.initialInventoryAdjustments];
let journalEntries: JournalEntry[] = [...mockData.initialJournalEntries];
let stockTransfers: StockTransfer[] = [...mockData.initialStockTransfers];
let billsOfMaterials: BillOfMaterials[] = [...mockData.initialBillsOfMaterials];
let workOrders: WorkOrder[] = [...mockData.initialWorkOrders];
let companySettings: CompanySettings = { ...mockData.initialCompanySettings };
let permissions: PermissionsConfig = { ...mockData.initialPermissions };
let accountingPeriods: AccountingPeriod[] = [...mockData.initialAccountingPeriods];
let taxRates: TaxRate[] = [...mockData.initialTaxRates];
let chartOfAccounts: Account[] = [...mockData.initialChartOfAccounts];

// Simulate network latency
const LATENCY = 200;
const delay = (ms: number = LATENCY) => new Promise((res) => setTimeout(res, ms));

// --- HELPERS ---
const findProduct = (productId: string) => products.find((p) => p.id === productId);

const getStock = (productId: string, warehouse: string): number => {
    const stockItem = inventoryStock.find(
        (s) => s.productId === productId && s.warehouse === warehouse
    );
    return stockItem?.stock || 0;
};

const updateStock = (productId: string, warehouse: string, quantityChange: number) => {
    const stockIndex = inventoryStock.findIndex(
        (s) => s.productId === productId && s.warehouse === warehouse
    );
    if (stockIndex > -1) {
        inventoryStock[stockIndex].stock += quantityChange;
    } else if (quantityChange > 0) {
        inventoryStock.push({ productId, warehouse, stock: quantityChange });
    }
};

const createMovement = (
    type: InventoryMovementType,
    productId: string,
    quantityChange: number,
    referenceId: string,
    warehouse: string,
    toWarehouse?: string
) => {
    const product = findProduct(productId);
    if (!product) return;
    const movement: InventoryMovement = {
        id: `IM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: new Date().toISOString().split('T')[0],
        productId,
        productName: product.name,
        type,
        quantityChange,
        referenceId,
        fromWarehouse: quantityChange < 0 ? warehouse : toWarehouse ? warehouse : undefined,
        toWarehouse: quantityChange > 0 ? toWarehouse || warehouse : undefined,
    };
    inventoryMovements.unshift(movement);
    return movement;
};

const getNextId = (prefix: string, items: { id: string }[]): string => {
    const maxId = items.reduce((max, item) => {
        if (item.id.startsWith(prefix)) {
            const numPart = item.id.replace(/\D/g, ''); // Extract numbers
            const num = parseInt(numPart, 10);
            if (!isNaN(num) && num < 1000000000) {
                // Avoid timestamps
                return Math.max(max, num);
            }
        }
        return max;
    }, 0);
    return `${prefix}${String(maxId + 1).padStart(3, '0')}`;
};

// --- USER MANAGEMENT & AUTHENTICATION ---
const SESSION_KEY = 'erp_current_user';

export const login = async (username: string, password: string): Promise<User | null> => {
    await delay();
    const user = users.find((u) => u.username === username && u.password === password);
    if (user) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
    }
    return null;
};

export const requestPasswordReset = async (
    email: string
): Promise<{ success: boolean; message: string }> => {
    await delay(500); // Simulate network latency
    console.log(`Password reset requested for email: ${email}`);
    // In a real app, this would trigger a backend process to send an email.
    // For this demo, we always return success to not reveal if an email exists for security reasons.
    return {
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.',
    };
};

export const logout = async (): Promise<void> => {
    sessionStorage.removeItem(SESSION_KEY);
    return Promise.resolve();
};

export const checkSession = async (): Promise<User | null> => {
    const userJson = sessionStorage.getItem(SESSION_KEY);
    if (userJson) {
        try {
            return JSON.parse(userJson);
        } catch (e) {
            return null;
        }
    }
    return null;
};

// --- DATA FETCHING (GETTERS) ---
export const getUsers = async (): Promise<User[]> => {
    await delay();
    return [...users];
};
// Bây giờ:
export const getProducts = async (): Promise<Product[]> => {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
        throw new Error('Failed to fetch products');
    }
    return await response.json();
};
export const getOrders = async (): Promise<Order[]> => {
    await delay();
    return [...orders];
};
export const getCustomers = async (): Promise<Customer[]> => {
    await delay();
    return [...customers];
};
export const getSuppliers = async (): Promise<Supplier[]> => {
    await delay();
    return [...suppliers];
};
export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
    await delay();
    return [...purchaseOrders];
};
export const getInventoryMovements = async (): Promise<InventoryMovement[]> => {
    await delay();
    return [...inventoryMovements];
};
export const getSalesReturns = async (): Promise<SalesReturn[]> => {
    await delay();
    return [...salesReturns];
};
export const getInventoryAdjustments = async (): Promise<InventoryAdjustment[]> => {
    await delay();
    return [...inventoryAdjustments];
};
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
    await delay();
    return [...journalEntries];
};
export const getQuotations = async (): Promise<Quotation[]> => {
    await delay();
    return [...quotations];
};
export const getInventoryStock = async (): Promise<InventoryItem[]> => {
    await delay();
    return [...inventoryStock];
};
export const getStockTransfers = async (): Promise<StockTransfer[]> => {
    await delay();
    return [...stockTransfers];
};
export const getBillsOfMaterials = async (): Promise<BillOfMaterials[]> => {
    await delay();
    return [...billsOfMaterials];
};
export const getWorkOrders = async (): Promise<WorkOrder[]> => {
    await delay();
    return [...workOrders];
};
export const getCompanySettings = async (): Promise<CompanySettings> => {
    await delay();
    return { ...companySettings };
};
export const getPermissions = async (): Promise<PermissionsConfig> => {
    await delay();
    return { ...permissions };
};
export const getAccountingPeriods = async (): Promise<AccountingPeriod[]> => {
    await delay();
    return [...accountingPeriods];
};
export const getTaxRates = async (): Promise<TaxRate[]> => {
    await delay();
    return [...taxRates];
};
export const getChartOfAccounts = async (): Promise<Account[]> => {
    await delay();
    return [...chartOfAccounts];
};

// --- DATA MUTATION ---

// Sales & Customer
export const createOrder = async (orderData: Omit<Order, 'id'>) => {
    // This block runs synchronously to prevent race conditions from multiple quick calls.
    const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });
    return await response.json(); // Trả về { success: true, newOrder: ... }
};

export const updateOrder = async (order: Order) => {
    await delay();
    let found = false;
    orders = orders.map((o) => {
        if (o.id === order.id) {
            found = true;
            return order;
        }
        return o;
    });
    if (!found) return { success: false, message: 'Không tìm thấy đơn hàng để cập nhật.' };
    return { success: true, updatedOrder: order };
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await delay();
    let updatedOrder: Order | null = null;
    orders = orders.map((o) => {
        if (o.id === orderId) {
            updatedOrder = { ...o, status };
            return updatedOrder;
        }
        return o;
    });
    return { success: true, updatedOrder };
};

export const updateOrderPayment = async (
    orderId: string,
    amountToPay: number,
    paymentMethod?: any
) => {
    await delay();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Không tìm thấy đơn hàng.' };

    let updatedOrder: Order | null = null;

    const cashAccount = chartOfAccounts.find((a) => a.code === '111')!; // Assuming cash
    const receivableAccount = chartOfAccounts.find((a) => a.code === '131')!;

    const newJournalEntry: JournalEntry = {
        id: getNextId('JE', journalEntries),
        date: new Date().toISOString().split('T')[0],
        description: `Thanh toán cho đơn hàng ${orderId}`,
        referenceId: orderId,
        lines: [
            {
                accountId: cashAccount.id,
                accountCode: cashAccount.code,
                accountName: cashAccount.name,
                debit: amountToPay,
                credit: 0,
            },
            {
                accountId: receivableAccount.id,
                accountCode: receivableAccount.code,
                accountName: receivableAccount.name,
                debit: 0,
                credit: amountToPay,
            },
        ],
    };
    journalEntries.unshift(newJournalEntry); // Persist the new entry

    orders = orders.map((o) => {
        if (o.id === orderId) {
            const newAmountPaid = o.amountPaid + amountToPay;
            updatedOrder = {
                ...o,
                amountPaid: newAmountPaid,
                paymentStatus:
                    newAmountPaid >= o.total ? PaymentStatus.Paid : PaymentStatus.PartiallyPaid,
            };
            return updatedOrder;
        }
        return o;
    });
    return { success: true, updatedOrder, newJournalEntry };
};

export const completeOrder = async (orderId: string) => {
    await delay();
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return { success: false, message: 'Không tìm thấy đơn hàng' };

    const order = orders[orderIndex];
    if (order.status === OrderStatus.Completed)
        return { success: false, message: 'Đơn hàng đã được hoàn thành trước đó.' };

    const newMovements: InventoryMovement[] = [];
    let stockWarning: any = null;
    let totalCogs = 0;

    order.items.forEach((item) => {
        const product = findProduct(item.productId);
        totalCogs += (product?.cost || 0) * item.quantity;
        updateStock(item.productId, order.warehouse, -item.quantity);
        newMovements.push(
            createMovement(
                InventoryMovementType.SalesIssue,
                item.productId,
                -item.quantity,
                order.id,
                order.warehouse
            )!
        );

        const stockItem = inventoryStock.find(
            (s) => s.productId === item.productId && s.warehouse === order.warehouse
        );
        if (stockItem && product && stockItem.stock < product.minStock) {
            stockWarning = {
                message: `Sản phẩm "${product.name}" sắp hết hàng.`,
                notification: {
                    type: 'warning',
                    icon: 'ArchiveBoxXMarkIcon',
                    title: `Sắp hết hàng: ${product.name}`,
                    message: `Tồn kho tại ${order.warehouse} chỉ còn ${stockItem.stock}.`,
                    nav: { view: 'INVENTORY', params: {} },
                },
            };
        }
    });

    const updatedOrder: Order = {
        ...order,
        status: OrderStatus.Completed,
    };
    orders[orderIndex] = updatedOrder;

    // Create Journal Entries
    const newJournalEntries: JournalEntry[] = [];
    const receivableAccount = chartOfAccounts.find((a) => a.code === '131')!;
    const revenueAccount = chartOfAccounts.find((a) => a.code === '511')!;
    const taxPayableAccount = chartOfAccounts.find((a) => a.code === '3331')!;
    const cogsAccount = chartOfAccounts.find((a) => a.code === '632')!;
    const inventoryAccount = chartOfAccounts.find((a) => a.code === '156')!;

    // 1. Revenue Recognition
    const revenueAmount = order.subtotal - order.discount;
    const taxAmount = order.tax || 0;
    const revenueLines = [
        {
            accountId: receivableAccount.id,
            accountCode: receivableAccount.code,
            accountName: receivableAccount.name,
            debit: order.total,
            credit: 0,
        },
        {
            accountId: revenueAccount.id,
            accountCode: revenueAccount.code,
            accountName: revenueAccount.name,
            debit: 0,
            credit: revenueAmount,
        },
    ];
    if (taxAmount > 0) {
        revenueLines.push({
            accountId: taxPayableAccount.id,
            accountCode: taxPayableAccount.code,
            accountName: taxPayableAccount.name,
            debit: 0,
            credit: taxAmount,
        });
    }

    newJournalEntries.push({
        id: getNextId('JE', journalEntries),
        date: new Date().toISOString().split('T')[0],
        description: `Ghi nhận doanh thu cho ĐH #${orderId}`,
        referenceId: orderId,
        lines: revenueLines,
    });

    // 2. COGS Recognition
    if (totalCogs > 0) {
        newJournalEntries.push({
            id: getNextId('JE', journalEntries),
            date: new Date().toISOString().split('T')[0],
            description: `Ghi nhận giá vốn cho ĐH #${orderId}`,
            referenceId: orderId,
            lines: [
                {
                    accountId: cogsAccount.id,
                    accountCode: cogsAccount.code,
                    accountName: cogsAccount.name,
                    debit: totalCogs,
                    credit: 0,
                },
                {
                    accountId: inventoryAccount.id,
                    accountCode: inventoryAccount.code,
                    accountName: inventoryAccount.name,
                    debit: 0,
                    credit: totalCogs,
                },
            ],
        });
    }

    journalEntries.unshift(...newJournalEntries); // Persist new entries

    return {
        success: true,
        updatedOrder,
        updatedStock: [...inventoryStock],
        newMovements,
        stockWarning,
        newJournalEntries,
    };
};

export const createSalesReturn = async (
    order: Order,
    itemsToReturn: SalesReturnItem[],
    totalRefund: number
) => {
    await delay();

    // totalRefund passed in is pre-tax. Let's calculate the full refund with tax.
    const taxRate = order.taxRate || 0;
    const taxRefund = totalRefund * (taxRate / 100);
    const fullRefundAmount = totalRefund + taxRefund;

    const newId = getNextId('SR', salesReturns);
    const newReturn: SalesReturn = {
        id: newId,
        originalOrderId: order.id,
        customerId: order.customerId,
        customerName: order.customerName,
        date: new Date().toISOString().split('T')[0],
        items: itemsToReturn,
        totalRefund: fullRefundAmount, // Store the full refund amount
        status: SalesReturnStatus.Completed,
    };
    salesReturns.unshift(newReturn);

    const revenueAccount = chartOfAccounts.find((a) => a.code === '511')!;
    const cashAccount = chartOfAccounts.find((a) => a.code === '111')!;
    const taxPayableAccount = chartOfAccounts.find((a) => a.code === '3331')!;

    const jeLines: JournalEntry['lines'] = [
        // Debit to reduce revenue by the pre-tax amount
        {
            accountId: revenueAccount.id,
            accountCode: revenueAccount.code,
            accountName: revenueAccount.name,
            debit: totalRefund,
            credit: 0,
        },
        // Credit cash/receivables for the full refund amount
        {
            accountId: cashAccount.id,
            accountCode: cashAccount.code,
            accountName: cashAccount.name,
            debit: 0,
            credit: fullRefundAmount,
        },
    ];

    if (taxRefund > 0) {
        // Debit to reduce VAT payable
        jeLines.push({
            accountId: taxPayableAccount.id,
            accountCode: taxPayableAccount.code,
            accountName: taxPayableAccount.name,
            debit: taxRefund,
            credit: 0,
        });
    }

    const newJournalEntry: JournalEntry = {
        id: getNextId('JE', journalEntries),
        date: new Date().toISOString().split('T')[0],
        description: `Hoàn tiền hàng trả cho ĐH ${order.id}`,
        referenceId: newReturn.id,
        lines: jeLines,
    };
    journalEntries.unshift(newJournalEntry); // Persist

    const newMovements: InventoryMovement[] = [];
    itemsToReturn.forEach((item) => {
        updateStock(item.productId, order.warehouse, item.quantity);
        newMovements.push(
            createMovement(
                InventoryMovementType.SalesReturn,
                item.productId,
                item.quantity,
                newReturn.id,
                order.warehouse
            )!
        );
    });

    return {
        success: true,
        newReturn,
        updatedStock: [...inventoryStock],
        newMovements,
        newJournalEntry,
    };
};

export const createAndCompleteOrder = async (orderData: Omit<Order, 'id'>) => {
    // Stock check
    for (const item of orderData.items) {
        const stock = getStock(item.productId, orderData.warehouse);
        if (stock < item.quantity) {
            const product = findProduct(item.productId);
            return {
                success: false,
                message: `Không đủ tồn kho cho sản phẩm "${product?.name || item.productId}".`,
            };
        }
    }

    // This block runs synchronously to prevent race conditions from multiple quick calls.
    const newId = getNextId('DH', orders);
    const newOrder: Order = {
        id: newId,
        ...orderData,
        status: OrderStatus.Completed,
        paymentStatus: PaymentStatus.Paid,
        amountPaid: orderData.total,
    };
    orders.unshift(newOrder);

    const newJournalEntries: JournalEntry[] = [];
    const cashAccount = chartOfAccounts.find((a) => a.code === '111')!;
    const revenueAccount = chartOfAccounts.find((a) => a.code === '511')!;
    const taxPayableAccount = chartOfAccounts.find((a) => a.code === '3331')!;
    const cogsAccount = chartOfAccounts.find((a) => a.code === '632')!;
    const inventoryAccount = chartOfAccounts.find((a) => a.code === '156')!;

    let totalCogs = 0;
    const newMovements: InventoryMovement[] = [];

    newOrder.items.forEach((item) => {
        const product = findProduct(item.productId);
        totalCogs += (product?.cost || 0) * item.quantity;
        updateStock(item.productId, newOrder.warehouse, -item.quantity);
        newMovements.push(
            createMovement(
                InventoryMovementType.SalesIssue,
                item.productId,
                -item.quantity,
                newOrder.id,
                newOrder.warehouse
            )!
        );
    });

    // 1. Revenue & Cash Entry
    const revenueAmount = newOrder.subtotal - newOrder.discount;
    const taxAmount = newOrder.tax || 0;
    const revenueLines = [
        {
            accountId: cashAccount.id,
            accountCode: cashAccount.code,
            accountName: cashAccount.name,
            debit: newOrder.total,
            credit: 0,
        },
        {
            accountId: revenueAccount.id,
            accountCode: revenueAccount.code,
            accountName: revenueAccount.name,
            debit: 0,
            credit: revenueAmount,
        },
    ];
    if (taxAmount > 0) {
        revenueLines.push({
            accountId: taxPayableAccount.id,
            accountCode: taxPayableAccount.code,
            accountName: taxPayableAccount.name,
            debit: 0,
            credit: taxAmount,
        });
    }

    newJournalEntries.push({
        id: getNextId('JE', journalEntries),
        date: newOrder.date,
        description: `Thanh toán tại quầy cho ĐH ${newOrder.id}`,
        referenceId: newOrder.id,
        lines: revenueLines,
    });

    // 2. COGS Entry
    if (totalCogs > 0) {
        newJournalEntries.push({
            id: getNextId('JE', journalEntries),
            date: newOrder.date,
            description: `Ghi nhận giá vốn cho ĐH #${newOrder.id}`,
            referenceId: newOrder.id,
            lines: [
                {
                    accountId: cogsAccount.id,
                    accountCode: cogsAccount.code,
                    accountName: cogsAccount.name,
                    debit: totalCogs,
                    credit: 0,
                },
                {
                    accountId: inventoryAccount.id,
                    accountCode: inventoryAccount.code,
                    accountName: inventoryAccount.name,
                    debit: 0,
                    credit: totalCogs,
                },
            ],
        });
    }

    journalEntries.unshift(...newJournalEntries); // Persist new entries

    await delay();
    return {
        success: true,
        newOrder,
        newJournalEntries,
        updatedStock: [...inventoryStock],
        newMovements,
    };
};

export const updateCustomer = async (customer: Customer) => {
    await delay();
    customers = customers.map((c) => (c.id === customer.id ? customer : c));
    return { success: true };
};

// Purchasing
export const createPurchaseOrder = async (poData: Omit<PurchaseOrder, 'id'>) => {
    const newId = getNextId('PO', purchaseOrders);
    const newPO: PurchaseOrder = { id: newId, ...poData };
    purchaseOrders.unshift(newPO);
    await delay();
    return { success: true, newPO };
};

export const updatePurchaseOrderStatus = async (poId: string, status: PurchaseOrderStatus) => {
    await delay();
    const poIndex = purchaseOrders.findIndex((p) => p.id === poId);
    if (poIndex === -1) return { success: false, message: 'Không tìm thấy đơn mua hàng.' };

    const originalPO = purchaseOrders[poIndex];
    let updatedPO = { ...originalPO, status };
    const newMovements: InventoryMovement[] = [];
    let newJournalEntry: JournalEntry | null = null;

    if (
        status === PurchaseOrderStatus.Received &&
        originalPO.status !== PurchaseOrderStatus.Received
    ) {
        updatedPO.receivedDate = new Date().toISOString().split('T')[0];
        updatedPO.items.forEach((item) => {
            updateStock(item.productId, updatedPO.warehouse, item.quantity);
            newMovements.push(
                createMovement(
                    InventoryMovementType.PurchaseReceipt,
                    item.productId,
                    item.quantity,
                    poId,
                    updatedPO.warehouse
                )!
            );
        });

        const inventoryAccount = chartOfAccounts.find((a) => a.code === '156')!;
        const taxReceivableAccount = chartOfAccounts.find((a) => a.code === '133')!;
        const payableAccount = chartOfAccounts.find((a) => a.code === '331')!;

        const inventoryValue = updatedPO.subtotal;
        const taxValue = updatedPO.tax || 0;

        if (inventoryValue > 0) {
            const jeLines: JournalEntry['lines'] = [
                // Debit inventory for pre-tax amount
                {
                    accountId: inventoryAccount.id,
                    accountCode: inventoryAccount.code,
                    accountName: inventoryAccount.name,
                    debit: inventoryValue,
                    credit: 0,
                },
                // Credit payables for the full amount
                {
                    accountId: payableAccount.id,
                    accountCode: payableAccount.code,
                    accountName: payableAccount.name,
                    debit: 0,
                    credit: updatedPO.total,
                },
            ];
            // If there's tax, debit VAT receivable
            if (taxValue > 0) {
                jeLines.push({
                    accountId: taxReceivableAccount.id,
                    accountCode: taxReceivableAccount.code,
                    accountName: taxReceivableAccount.name,
                    debit: taxValue,
                    credit: 0,
                });
            }
            newJournalEntry = {
                id: getNextId('JE', journalEntries),
                date: new Date().toISOString().split('T')[0],
                description: `Ghi nhận nhập kho từ Đơn mua hàng #${poId}`,
                referenceId: poId,
                lines: jeLines,
            };
            journalEntries.unshift(newJournalEntry);
        }
    }

    purchaseOrders[poIndex] = updatedPO;
    return {
        success: true,
        updatedPO,
        newMovements,
        updatedStock: [...inventoryStock],
        newJournalEntry,
    };
};

export const updatePurchaseOrderPayment = async (poId: string, amountToPay: number) => {
    await delay();
    const poIndex = purchaseOrders.findIndex((p) => p.id === poId);
    if (poIndex === -1) return { success: false, message: 'Không tìm thấy đơn mua hàng.' };

    const po = purchaseOrders[poIndex];
    const newAmountPaid = po.amountPaid + amountToPay;
    const updatedPO = {
        ...po,
        amountPaid: newAmountPaid,
        paymentStatus: newAmountPaid >= po.total ? PaymentStatus.Paid : PaymentStatus.PartiallyPaid,
    };
    purchaseOrders[poIndex] = updatedPO;

    const payableAccount = chartOfAccounts.find((a) => a.code === '331')!;
    const cashAccount = chartOfAccounts.find((a) => a.code === '111')!;

    const newJournalEntry: JournalEntry = {
        id: getNextId('JE', journalEntries),
        date: new Date().toISOString().split('T')[0],
        description: `Thanh toán cho Đơn mua hàng ${poId}`,
        referenceId: poId,
        lines: [
            {
                accountId: payableAccount.id,
                accountCode: payableAccount.code,
                accountName: payableAccount.name,
                debit: amountToPay,
                credit: 0,
            },
            {
                accountId: cashAccount.id,
                accountCode: cashAccount.code,
                accountName: cashAccount.name,
                debit: 0,
                credit: amountToPay,
            },
        ],
    };
    journalEntries.unshift(newJournalEntry); // Persist

    return { success: true, updatedPO, newJournalEntry };
};

export const updatePurchaseOrder = async (po: PurchaseOrder) => {
    await delay();
    purchaseOrders = purchaseOrders.map((p) => (p.id === po.id ? po : p));
    return { success: true, updatedPO: po };
};

export const deletePurchaseOrder = async (poId: string) => {
    await delay();
    purchaseOrders = purchaseOrders.filter((p) => p.id !== poId);
    return { success: true };
};

// Quotations
export const createQuotation = async (quotation: Omit<Quotation, 'id'>) => {
    const newId = getNextId('BG', quotations);
    const newQuotation: Quotation = { id: newId, ...quotation };
    quotations.unshift(newQuotation);
    await delay();
    return { success: true, newQuotation };
};
export const updateQuotation = async (quotation: Quotation) => {
    await delay();
    quotations = quotations.map((q) => (q.id === quotation.id ? quotation : q));
    return { success: true, updatedQuotation: quotation };
};
export const deleteQuotation = async (id: string) => {
    await delay();
    quotations = quotations.filter((q) => q.id !== id);
    return { success: true };
};
export const updateQuotationStatus = async (id: string, status: QuotationStatus) => {
    await delay();
    let updatedQuotation: Quotation | null = null;
    quotations = quotations.map((q) => {
        if (q.id === id) {
            updatedQuotation = { ...q, status };
            return updatedQuotation;
        }
        return q;
    });
    return { success: true, updatedQuotation };
};
export const convertQuotationToOrder = async (quotationId: string) => {
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation || quotation.status !== QuotationStatus.Accepted) {
        return { success: false, message: 'Báo giá không hợp lệ hoặc chưa được chấp nhận.' };
    }

    // This block runs synchronously to prevent race conditions from multiple quick calls.
    const newId = getNextId('DH', orders);
    const newOrder: Order = {
        id: newId,
        customerId: quotation.customerId,
        customerName: quotation.customerName,
        date: new Date().toISOString().split('T')[0],
        items: quotation.items.map((i) => ({ ...i })),
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        tax: quotation.tax,
        taxRate: quotation.taxRate,
        total: quotation.total,
        status: OrderStatus.Pending,
        paymentMethod: PaymentMethod.BankTransfer,
        paymentStatus: PaymentStatus.Unpaid,
        amountPaid: 0,
        warehouse: companySettings.warehouses[0]?.name || '',
    };
    orders.unshift(newOrder);

    let updatedQuotation: Quotation | null = null;
    quotations = quotations.map((q) => {
        if (q.id === quotationId) {
            updatedQuotation = {
                ...q,
                status: QuotationStatus.Converted,
                createdOrderId: newOrder.id,
            };
            return updatedQuotation;
        }
        return q;
    });

    await delay();
    return { success: true, newOrder, updatedQuotation };
};

// Inventory
export const createInventoryAdjustment = async (
    warehouse: string,
    notes: string,
    items: { productId: string; actualStock: number }[]
) => {
    const newId = getNextId('ADJ', inventoryAdjustments);
    const newAdjustment: InventoryAdjustment = {
        id: newId,
        date: new Date().toISOString().split('T')[0],
        warehouse,
        notes,
        items: [],
    };
    const newMovements: InventoryMovement[] = [];

    items.forEach((item) => {
        const stockItem = inventoryStock.find(
            (s) => s.productId === item.productId && s.warehouse === warehouse
        );
        const systemStock = stockItem?.stock || 0;
        const difference = item.actualStock - systemStock;

        if (difference !== 0) {
            newAdjustment.items.push({
                productId: item.productId,
                productName: findProduct(item.productId)?.name || 'N/A',
                systemStock,
                actualStock: item.actualStock,
                difference,
            });
            updateStock(item.productId, warehouse, difference);
            newMovements.push(
                createMovement(
                    InventoryMovementType.Adjustment,
                    item.productId,
                    difference,
                    newId,
                    warehouse
                )!
            );
        }
    });

    if (newAdjustment.items.length === 0) {
        return { success: false, message: 'Không có thay đổi nào về tồn kho.' };
    }
    inventoryAdjustments.unshift(newAdjustment);
    await delay();
    return { success: true, newAdjustment, newMovements, updatedStock: [...inventoryStock] };
};

export const createStockTransfer = async (
    fromWarehouse: string,
    toWarehouse: string,
    items: StockTransferItem[],
    notes?: string
) => {
    await delay();
    if (fromWarehouse === toWarehouse) {
        return { success: false, message: 'Kho xuất và kho nhập phải khác nhau.' };
    }
    const newId = getNextId('ST', stockTransfers);
    const newTransfer: StockTransfer = {
        id: newId,
        date: new Date().toISOString().split('T')[0],
        fromWarehouse,
        toWarehouse,
        items,
        status: StockTransferStatus.Completed,
        notes,
    };
    stockTransfers.unshift(newTransfer);

    const newMovements: InventoryMovement[] = [];
    items.forEach((item) => {
        // Decrease stock from source
        updateStock(item.productId, fromWarehouse, -item.quantity);
        newMovements.push(
            createMovement(
                InventoryMovementType.TransferOut,
                item.productId,
                -item.quantity,
                newTransfer.id,
                fromWarehouse
            )!
        );
        // Increase stock in destination
        updateStock(item.productId, toWarehouse, item.quantity);
        newMovements.push(
            createMovement(
                InventoryMovementType.TransferIn,
                item.productId,
                item.quantity,
                newTransfer.id,
                fromWarehouse,
                toWarehouse
            )!
        );
    });

    return { success: true, newTransfer, newMovements, updatedStock: [...inventoryStock] };
};

// Accounting
export const createJournalEntry = async (journalEntry: Omit<JournalEntry, 'id'>) => {
    const newId = getNextId('JE-M', journalEntries);
    const newJournalEntry: JournalEntry = { id: newId, ...journalEntry };
    journalEntries.unshift(newJournalEntry);
    await delay();
    return { success: true, newJournalEntry };
};

// Manufacturing
export const saveBOM = async (bom: Omit<BillOfMaterials, 'id'> | BillOfMaterials) => {
    await delay();
    const calculateTotalCost = (items: BillOfMaterials['items']) => {
        return items.reduce((total, item) => {
            const wasteFactor = 1 + (item.waste || 0) / 100;
            return total + item.cost * item.quantity * wasteFactor;
        }, 0);
    };

    if ('id' in bom) {
        const updatedBOM = {
            ...bom,
            totalCost: calculateTotalCost(bom.items),
            lastUpdated: new Date().toISOString().split('T')[0],
        };
        billsOfMaterials = billsOfMaterials.map((b) => (b.id === updatedBOM.id ? updatedBOM : b));
        return { success: true, savedBOM: updatedBOM };
    } else {
        const newBOM: BillOfMaterials = {
            id: getNextId('BOM', billsOfMaterials),
            ...bom,
            totalCost: calculateTotalCost(bom.items),
            lastUpdated: new Date().toISOString().split('T')[0],
        };
        billsOfMaterials.unshift(newBOM);
        return { success: true, savedBOM: newBOM };
    }
};

export const deleteBOM = async (bomId: string) => {
    await delay();
    billsOfMaterials = billsOfMaterials.filter((b) => b.id !== bomId);
    return { success: true };
};

export const createWorkOrder = async (workOrder: Omit<WorkOrder, 'id'>) => {
    const bom = billsOfMaterials.find((b) => b.id === workOrder.bomId);
    if (!bom) return { success: false, message: 'BOM not found' };

    const estimatedCost = bom.totalCost * workOrder.quantityToProduce;
    const productionSteps = [
        { name: 'Chuẩn bị Nguyên vật liệu', completed: false },
        { name: 'Lắp ráp', completed: false },
        { name: 'Kiểm tra Chất lượng (QC)', completed: false },
        { name: 'Đóng gói', completed: false },
    ];

    const newWorkOrder: WorkOrder = {
        id: getNextId('LSX', workOrders),
        ...workOrder,
        estimatedCost,
        productionSteps,
    };
    workOrders.unshift(newWorkOrder);
    await delay();
    return { success: true, newWorkOrder };
};

export const updateWorkOrderStatus = async (
    workOrderId: string,
    status: WorkOrderStatus
): Promise<{ success: boolean; updatedWorkOrder?: WorkOrder; message?: string }> => {
    await delay();
    const woIndex = workOrders.findIndex((w) => w.id === workOrderId);
    if (woIndex === -1) return { success: false, message: 'Không tìm thấy Lệnh sản xuất.' };

    const updatedWorkOrder = { ...workOrders[woIndex], status };
    if (status === WorkOrderStatus.InProgress && updatedWorkOrder.productionSteps[0]) {
        updatedWorkOrder.productionSteps[0].completed = true;
    }
    workOrders[woIndex] = updatedWorkOrder;

    return { success: true, updatedWorkOrder };
};

export const updateWorkOrderSteps = async (
    workOrderId: string,
    steps: ProductionStep[]
): Promise<{ success: boolean; updatedWorkOrder?: WorkOrder; message?: string }> => {
    await delay();
    const woIndex = workOrders.findIndex((w) => w.id === workOrderId);
    if (woIndex === -1) return { success: false, message: 'Không tìm thấy Lệnh sản xuất.' };

    const updatedWorkOrder = { ...workOrders[woIndex], productionSteps: steps };
    workOrders[woIndex] = updatedWorkOrder;
    return { success: true, updatedWorkOrder };
};

export const completeWorkOrder = async (workOrderId: string) => {
    await delay();
    const woIndex = workOrders.findIndex((w) => w.id === workOrderId);
    if (woIndex === -1) return { success: false, message: 'Không tìm thấy Lệnh sản xuất.' };

    const wo = workOrders[woIndex];
    const bom = billsOfMaterials.find((b) => b.id === wo.bomId);
    if (!bom) return { success: false, message: 'Không tìm thấy BOM cho Lệnh sản xuất này.' };

    // Check stock for raw materials
    for (const item of bom.items) {
        const requiredQty = item.quantity * wo.quantityToProduce * (1 + (item.waste || 0) / 100);
        const stock = getStock(item.productId, wo.warehouse);
        if (stock < requiredQty) {
            return {
                success: false,
                message: `Không đủ NVL: "${item.productName}". Cần ${Math.ceil(
                    requiredQty
                )}, chỉ có ${stock}.`,
            };
        }
    }

    const newMovements: InventoryMovement[] = [];
    // Consume raw materials
    bom.items.forEach((item) => {
        const quantityToConsume =
            item.quantity * wo.quantityToProduce * (1 + (item.waste || 0) / 100);
        updateStock(item.productId, wo.warehouse, -quantityToConsume);
        newMovements.push(
            createMovement(
                InventoryMovementType.ProductionIssue,
                item.productId,
                -quantityToConsume,
                wo.id,
                wo.warehouse
            )!
        );
    });

    // Add finished goods to stock
    updateStock(wo.productId, wo.warehouse, wo.quantityToProduce);
    newMovements.push(
        createMovement(
            InventoryMovementType.ProductionReceipt,
            wo.productId,
            wo.quantityToProduce,
            wo.id,
            wo.warehouse
        )!
    );

    // Simulate slight variance in actual cost
    const actualCost = wo.estimatedCost * (1 + (Math.random() - 0.5) * 0.05);

    const updatedWorkOrder = {
        ...wo,
        status: WorkOrderStatus.Completed,
        completionDate: new Date().toISOString().split('T')[0],
        actualCost: Math.round(actualCost),
        productionSteps: wo.productionSteps.map((s) => ({ ...s, completed: true })),
    };
    workOrders[woIndex] = updatedWorkOrder;

    return { success: true, updatedWorkOrder, newMovements, updatedStock: [...inventoryStock] };
};

// --- GENERIC SAVE/DELETE/UPDATE ---

// A helper for creating/updating items in an array
const saveItem = <T extends { id: string }>(
    items: T[],
    itemData: Omit<T, 'id'> | T,
    prefix: string
): { items: T[]; savedItem: T } => {
    if ('id' in itemData && itemData.id) {
        let savedItem: T | null = null;
        const newItems = items.map((i) => {
            if (i.id === itemData.id) {
                savedItem = { ...i, ...itemData };
                return savedItem;
            }
            return i;
        });
        return { items: newItems, savedItem: savedItem! };
    } else {
        const newItem = { ...itemData, id: getNextId(prefix, items) } as T;
        return { items: [newItem, ...items], savedItem: newItem };
    }
};

export const saveUser = async (
    user: Omit<User, 'id'> | User
): Promise<{ success: boolean; savedUser?: User }> => {
    await delay();
    const { items: newUsers, savedItem } = saveItem(users, user, 'user-');
    users = newUsers;
    return { success: true, savedUser: savedItem };
};

export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
    await delay();
    users = users.filter((u) => u.id !== userId);
    return { success: true };
};

export const saveProduct = async (
    product: Omit<Product, 'id'> | Product
): Promise<{ success: boolean; savedProduct?: Product }> => {
    await delay();
    const { items: newProducts, savedItem } = saveItem(products, product, 'SP');
    products = newProducts;
    return { success: true, savedProduct: savedItem };
};

export const deleteProduct = async (productId: string): Promise<{ success: boolean }> => {
    await delay();
    products = products.filter((p) => p.id !== productId);
    return { success: true };
};

export const saveCustomer = async (
    customer: Omit<Customer, 'id' | 'since'> | Customer
): Promise<{ success: boolean; savedCustomer?: Customer }> => {
    await delay();
    if ('id' in customer) {
        let savedCustomer: Customer | null = null;
        const newCustomers = customers.map((c) => {
            if (c.id === customer.id) {
                savedCustomer = { ...c, ...customer };
                return savedCustomer;
            }
            return c;
        });
        customers = newCustomers;
        return { success: true, savedCustomer: savedCustomer! };
    } else {
        const newCustomer: Customer = {
            id: getNextId('KH', customers),
            ...customer,
            since: new Date().toISOString().split('T')[0],
        };
        customers.unshift(newCustomer);
        return { success: true, savedCustomer: newCustomer };
    }
};

export const deleteCustomer = async (customerId: string): Promise<{ success: boolean }> => {
    await delay();
    customers = customers.filter((c) => c.id !== customerId);
    return { success: true };
};

export const saveSupplier = async (
    supplier: Omit<Supplier, 'id'> | Supplier
): Promise<{ success: boolean; savedSupplier?: Supplier }> => {
    await delay();
    const { items: newSuppliers, savedItem } = saveItem(suppliers, supplier, 'NCC');
    suppliers = newSuppliers;
    return { success: true, savedSupplier: savedItem };
};

export const deleteSupplier = async (supplierId: string): Promise<{ success: boolean }> => {
    await delay();
    suppliers = suppliers.filter((s) => s.id !== supplierId);
    return { success: true };
};

export const updateCompanySettings = async (
    settings: CompanySettings
): Promise<{ success: boolean }> => {
    await delay();
    companySettings = settings;
    return { success: true };
};

export const updatePermissions = async (
    newPermissions: PermissionsConfig
): Promise<{ success: boolean }> => {
    await delay();
    permissions = newPermissions;
    return { success: true };
};

export const updateAccountingPeriods = async (
    periods: AccountingPeriod[]
): Promise<{ success: boolean }> => {
    await delay();
    accountingPeriods = periods;
    return { success: true };
};

export const updateTaxRates = async (rates: TaxRate[]): Promise<{ success: boolean }> => {
    await delay();
    taxRates = rates;
    return { success: true };
};

export const updateChartOfAccounts = async (accounts: Account[]): Promise<{ success: boolean }> => {
    await delay();
    chartOfAccounts = accounts;
    return { success: true };
};

// --- DATA MANAGEMENT ---
export const resetAllData = async () => {
    await delay();
    users = [...mockData.mockUsers];
    customers = [...mockData.mockCustomers];
    suppliers = [...mockData.mockSuppliers];
    products = [...mockData.mockProducts];
    inventoryStock = JSON.parse(JSON.stringify(mockData.initialInventoryStock));
    orders = JSON.parse(JSON.stringify(mockData.initialOrders));
    quotations = [...mockData.initialQuotations];
    purchaseOrders = [...mockData.initialPurchaseOrders];
    inventoryMovements = [...mockData.initialInventoryMovements];
    salesReturns = [...mockData.initialSalesReturns];
    inventoryAdjustments = [...mockData.initialInventoryAdjustments];
    journalEntries = [...mockData.initialJournalEntries];
    stockTransfers = [...mockData.initialStockTransfers];
    billsOfMaterials = [...mockData.initialBillsOfMaterials];
    workOrders = [...mockData.initialWorkOrders];
    companySettings = { ...mockData.initialCompanySettings };
    permissions = { ...mockData.initialPermissions };
    accountingPeriods = [...mockData.initialAccountingPeriods];
    taxRates = [...mockData.initialTaxRates];
    chartOfAccounts = [...mockData.initialChartOfAccounts];
    return { success: true };
};

// --- GLOBAL SEARCH ---
export interface GlobalSearchResultItem {
    type: 'Khách hàng' | 'Sản phẩm' | 'Đơn hàng' | 'Đơn mua hàng' | 'Nhà cung cấp';
    id: string;
    title: string;
    description: string;
    nav: {
        view: NavView;
        params?: any;
    };
}

export interface GlobalSearchResult {
    type: 'Khách hàng' | 'Sản phẩm' | 'Đơn hàng' | 'Đơn mua hàng' | 'Nhà cung cấp';
    results: GlobalSearchResultItem[];
}

export const globalSearch = async (term: string): Promise<GlobalSearchResult[]> => {
    await delay();
    const lowercasedTerm = term.toLowerCase();
    const results: GlobalSearchResult[] = [];

    // Search Customers
    const customerResults = customers
        .filter(
            (c) =>
                c.name.toLowerCase().includes(lowercasedTerm) ||
                c.id.toLowerCase().includes(lowercasedTerm)
        )
        .map((c) => ({
            type: 'Khách hàng' as const,
            id: c.id,
            title: c.name,
            description: `ID: ${c.id}, Phân loại: ${c.type}`,
            nav: { view: 'CRM' as NavView, params: { customerId: c.id } },
        }));
    if (customerResults.length > 0) {
        results.push({ type: 'Khách hàng', results: customerResults });
    }

    // Search Products
    const productResults = products
        .filter(
            (p) =>
                p.name.toLowerCase().includes(lowercasedTerm) ||
                p.sku.toLowerCase().includes(lowercasedTerm)
        )
        .map((p) => ({
            type: 'Sản phẩm' as const,
            id: p.id,
            title: p.name,
            description: `SKU: ${p.sku}`,
            nav: { view: 'PRODUCT' as NavView, params: { productId: p.id } },
        }));
    if (productResults.length > 0) {
        results.push({ type: 'Sản phẩm', results: productResults });
    }

    // Search Orders
    const orderResults = orders
        .filter(
            (o) =>
                o.id.toLowerCase().includes(lowercasedTerm) ||
                o.customerName.toLowerCase().includes(lowercasedTerm)
        )
        .map((o) => ({
            type: 'Đơn hàng' as const,
            id: o.id,
            title: `Đơn hàng #${o.id}`,
            description: `Khách hàng: ${o.customerName}, Ngày: ${o.date}`,
            nav: { view: 'SALES' as NavView, params: { orderId: o.id } },
        }));
    if (orderResults.length > 0) {
        results.push({ type: 'Đơn hàng', results: orderResults });
    }

    // Search Purchase Orders
    const poResults = purchaseOrders
        .filter(
            (po) =>
                po.id.toLowerCase().includes(lowercasedTerm) ||
                po.supplierName.toLowerCase().includes(lowercasedTerm)
        )
        .map((po) => ({
            type: 'Đơn mua hàng' as const,
            id: po.id,
            title: `Đơn mua hàng #${po.id}`,
            description: `NCC: ${po.supplierName}, Ngày: ${po.orderDate}`,
            nav: { view: 'PURCHASING' as NavView, params: { poId: po.id } },
        }));
    if (poResults.length > 0) {
        results.push({ type: 'Đơn mua hàng', results: poResults });
    }

    // Search Suppliers
    const supplierResults = suppliers
        .filter(
            (s) =>
                s.name.toLowerCase().includes(lowercasedTerm) ||
                s.id.toLowerCase().includes(lowercasedTerm)
        )
        .map((s) => ({
            type: 'Nhà cung cấp' as const,
            id: s.id,
            title: s.name,
            description: `ID: ${s.id}, Liên hệ: ${s.contactPerson}`,
            nav: { view: 'SUPPLIER' as NavView, params: { supplierId: s.id } },
        }));
    if (supplierResults.length > 0) {
        results.push({ type: 'Nhà cung cấp', results: supplierResults });
    }

    return results;
};
