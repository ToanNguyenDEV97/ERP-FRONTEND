import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainHeader from './components/MainHeader';
import GlobalSearchModal from './components/GlobalSearchModal';
import NotificationsPopover from './components/NotificationsPopover';
import DashboardView from './components/DashboardView';
import SalesView from './components/SalesView';
import CrmView from './components/CrmView';
import InventoryView from './components/InventoryView';
import SupplierView from './components/SupplierView';
import PurchasingView from './components/PurchasingView';
import AccountingView from './components/AccountingView';
import ReportsView from './components/ReportsView';
import LoginView from './components/LoginView';
import ForgotPasswordView from './components/ForgotPasswordView';
import ProductView from './components/ProductView';
import SettingsView from './components/SettingsView';
import ManufacturingView from './components/ManufacturingView';
import StaffView from './components/StaffView';
import { NavView, User, UserRole, Permission, Product, Order, Customer, Supplier, PurchaseOrder, InventoryMovement, SalesReturn, InventoryAdjustment, Quotation, InventoryItem, StockTransfer, BillOfMaterials, WorkOrder, CompanySettings, PermissionsConfig, AccountingPeriod, TaxRate, JournalEntry, Account, Notification, NotificationType, SalesReturnItem, OrderStatus, PaymentStatus, SalesReturnStatus, StockTransferItem, ProductionStep, WorkOrderStatus, PurchaseOrderStatus, QuotationStatus } from './types';
import * as api from './api';
import { NAV_ITEMS } from './constants';
import { useToast } from './contexts/ToastContext';
import { useConfirm } from './contexts/ConfirmContext';
import ToastContainer from './components/ToastContainer';
import ConfirmationModal from './components/ConfirmationModal';
import { useAddressConfirm } from './contexts/AddressConfirmContext';
import AddressConfirmationModal from './components/AddressConfirmationModal';
import PaymentVoucherModal from './components/PaymentVoucherModal';
import AIChatBot from './components/AIChatBot';
import useTheme from './hooks/useTheme';
import GlobalSpinner from './components/GlobalSpinner';
import ReturnReceiptModal from './components/ReturnReceiptModal';


const VIEW_PERMISSIONS_MAP: Record<NavView, Permission> = {
  DASHBOARD: 'VIEW_DASHBOARD',
  SALES: 'VIEW_SALES',
  CRM: 'VIEW_CRM',
  PRODUCT: 'VIEW_PRODUCT',
  MANUFACTURING: 'VIEW_MANUFACTURING',
  INVENTORY: 'VIEW_INVENTORY',
  SUPPLIER: 'VIEW_SUPPLIER',
  PURCHASING: 'VIEW_PURCHASING',
  ACCOUNTING: 'VIEW_ACCOUNTING',
  REPORTS: 'VIEW_REPORTS',
  STAFF: 'VIEW_STAFF',
  SETTINGS: 'VIEW_SETTINGS',
};


const App: React.FC = () => {
  // --- UI & Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'forgotPassword'>('login');
  const [activeView, setActiveView] = useState<NavView>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [isAIChatOpen, setAIChatOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const [isInitializing, setIsInitializing] = useState(true);

  const [selectedParams, setSelectedParams] = useState<any>({});

  const { addToast } = useToast();
  const confirm = useConfirm();
  const confirmAddress = useAddressConfirm();
  
  // --- Centralized Data Store (Moved from useDataStore) ---
    const [isProcessing, setIsProcessing] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
    const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
    const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [inventoryStock, setInventoryStock] = useState<InventoryItem[]>([]);
    const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
    const [billsOfMaterials, setBillsOfMaterials] = useState<BillOfMaterials[]>([]);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
    const [permissions, setPermissions] = useState<PermissionsConfig | null>(null);
    const [accountingPeriods, setAccountingPeriods] = useState<AccountingPeriod[]>([]);
    const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
    const [chartOfAccounts, setChartOfAccounts] = useState<Account[]>([]);
    
    // UI State managed here for simplicity of access by actions
    const [voucherToPrint, setVoucherToPrint] = useState<{ transaction: JournalEntry; party: Customer | Supplier; type: 'thu' | 'chi' } | null>(null);
    const [returnToPrint, setReturnToPrint] = useState<SalesReturn | null>(null);

    // Notifications state and logic
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
        if (notificationData.type === NotificationType.WARNING && notificationData.nav?.params?.productId) {
            const existing = notifications.find(n =>
                !n.isRead &&
                n.type === NotificationType.WARNING &&
                n.nav?.params?.productId === notificationData.nav?.params.productId
            );
            if (existing) return;
        }

        const newNotification: Notification = {
            ...notificationData,
            id: `N-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    }, [notifications]);

    const handleMarkOneRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }, []);
    
    const handleMarkAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);
    
    const clearNotifications = useCallback(() => setNotifications([]), []);
    
    const clearAllData = useCallback(() => {
        setUsers([]); setProducts([]); setOrders([]); setCustomers([]);
        setSuppliers([]); setPurchaseOrders([]); setInventoryMovements([]);
        setSalesReturns([]); setInventoryAdjustments([]); setJournalEntries([]);
        setQuotations([]); setInventoryStock([]);
        setStockTransfers([]); setBillsOfMaterials([]); setWorkOrders([]);
        setCompanySettings(null); setPermissions(null); setAccountingPeriods([]);
        setTaxRates([]); setChartOfAccounts([]);
    }, []);


  // --- Auth & Session Management ---
  useEffect(() => {
    const initializeApp = async () => {
        setIsInitializing(true);
        const userFromSession = await api.checkSession();
        if (userFromSession) {
            setCurrentUser(userFromSession);
        }
        setIsInitializing(false);
    };
    initializeApp();
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!currentUser || !permissions) return false;
    if (currentUser.role === UserRole.Admin) return true;
    return permissions[currentUser.role]?.includes(permission);
  }, [currentUser, permissions]);

  const handleLogin = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsProcessing(true);
    const user = await api.login(username, password);
    setIsProcessing(false);
    if (user) {
        setCurrentUser(user);
        addToast(`Chào mừng trở lại, ${user.name}!`, 'success');
        return true;
    } else {
        return false;
    }
  }, [addToast]);

  const handleRequestPasswordReset = useCallback(async (email: string) => {
    setIsProcessing(true);
    await api.requestPasswordReset(email);
    // UI feedback is handled inside the ForgotPasswordView component
    setIsProcessing(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await api.logout();
    setCurrentUser(null);
    setActiveView('DASHBOARD');
    setAuthView('login');
    clearAllData();
    clearNotifications();
  }, [clearAllData, clearNotifications]);
  
  const handleNavigate = useCallback((view: NavView, params: any = {}) => {
    setActiveView(view);
    setSelectedParams(params);
    setIsSidebarOpen(false);
    setSearchModalOpen(false);
  }, []);

  const clearSelectedParams = useCallback(() => {
      setSelectedParams({});
  }, []);

  const handleResetAllData = async () => {
    setIsProcessing(true);
    const result = await api.resetAllData();
    if (result.success) {
        addToast('Đã reset toàn bộ dữ liệu thành công! Ứng dụng sẽ tải lại.', 'success');
        setTimeout(() => window.location.reload(), 2000);
    } else {
        addToast('Reset dữ liệu thất bại.', 'error');
        setIsProcessing(false);
    }
  };

  // --- BUSINESS LOGIC HANDLERS (Moved from useDataStore) ---
  const handleSaveOrder = useCallback(async (orderData: Omit<Order, 'id'> | Order) => {
    setIsProcessing(true);
    let result: { success: boolean; message?: string; updatedOrder?: Order; newOrder?: Order };
    
    if ('id' in orderData) { // UPDATE
        result = await api.updateOrder(orderData);
        if (result.success && result.updatedOrder) {
            setOrders(prev => prev.map(o => o.id === result.updatedOrder!.id ? result.updatedOrder! : o));
            addToast(`Đã cập nhật đơn hàng ${result.updatedOrder.id}.`, 'success');
        } else {
            addToast(result.message || 'Lỗi cập nhật đơn hàng.', 'error');
        }
    } else { // CREATE
        result = await api.createOrder(orderData);
        if (result.success && result.newOrder) {
            setOrders(prev => [result.newOrder!, ...prev]);
            addToast(`Đã tạo đơn hàng mới ${result.newOrder.id} thành công!`, 'success');
            addNotification({
                type: NotificationType.INFO,
                icon: 'ShoppingCartIcon',
                title: `Đơn hàng mới #${result.newOrder.id}`,
                message: `Đã tạo đơn hàng cho ${result.newOrder.customerName}.`,
                nav: { view: 'SALES', params: { orderId: result.newOrder.id } }
            });
        } else {
            addToast('Lỗi tạo đơn hàng.', 'error');
        }
    }
    setIsProcessing(false);
    return result;
}, [addToast, addNotification]);

const handleCompleteOrder = useCallback(async (orderId: string, options: { skipConfirm?: boolean, isBulk?: boolean } = {}): Promise<{ success: boolean; message?: string; }> => {
    const orderToComplete = orders.find(o => o.id === orderId);
    if (!orderToComplete || orderToComplete.status === OrderStatus.Completed) {
        return { success: false, message: 'Đơn hàng không hợp lệ hoặc đã hoàn thành.' };
    }

    const performComplete = async () => {
        setIsProcessing(true);
        const result = await api.completeOrder(orderId);
        setIsProcessing(false);

        if (result.success) {
            if (result.updatedOrder) setOrders(prev => prev.map(o => o.id === orderId ? result.updatedOrder! : o));
            if (result.updatedStock) setInventoryStock(result.updatedStock);
            if (result.newMovements) setInventoryMovements(prev => [...result.newMovements!, ...prev]);
            if (result.newJournalEntries) setJournalEntries(prev => [...result.newJournalEntries!, ...prev]);

            if (!options.isBulk) addToast(`Đơn hàng #${orderId} đã được hoàn thành.`, 'success', 'Hoàn thành đơn hàng');
            
            addNotification({
                type: NotificationType.SUCCESS, icon: 'CheckCircleIcon', title: `Đơn hàng #${orderId} hoàn thành`,
                message: `Đơn hàng của ${orderToComplete.customerName} đã được giao thành công.`, nav: { view: 'SALES', params: { orderId } }
            });
            if (result.stockWarning) {
                addToast(result.stockWarning.message, 'warning', 'Sắp hết hàng');
                addNotification(result.stockWarning.notification);
            }
            return { success: true };
        } else {
            addToast(result.message || "Có lỗi xảy ra", 'error');
            return { success: false, message: result.message };
        }
    };
    
    if (options.skipConfirm) {
        return await performComplete();
    } else {
        const isConfirmed = await confirm({
            title: 'Xác nhận Hoàn thành Đơn hàng',
            message: 'Bạn có chắc chắn muốn đánh dấu đơn hàng là "Đã hoàn thành" không? Hành động này sẽ cập nhật tồn kho và ghi nhận công nợ.',
            confirmText: 'Hoàn thành'
        });
        if (isConfirmed) return await performComplete();
        else return { success: false, message: 'Người dùng đã hủy' };
    }
}, [orders, confirm, addToast, addNotification]);

const handleUpdateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, options: { skipConfirm?: boolean, isBulk?: boolean } = {}): Promise<{ success: boolean; message?: string; }> => {
    if (status === OrderStatus.Completed) {
        return await handleCompleteOrder(orderId, options);
    }
    
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return { success: false, message: 'Không tìm thấy đơn hàng.' };

    const performUpdate = async () => {
        setIsProcessing(true);
        const result = await api.updateOrderStatus(orderId, status);
        setIsProcessing(false);

        if (result.success) {
            setOrders(prev => prev.map(o => o.id === orderId ? result.updatedOrder! : o));
            if (!options.isBulk) addToast(`Đơn hàng #${orderId} đã được cập nhật trạng thái.`, 'info');
            if (status === OrderStatus.Processing) {
                 addNotification({
                    type: NotificationType.INFO, icon: 'TruckIcon', title: `Đơn hàng #${orderId} đang giao`,
                    message: `Đơn hàng của ${orderToUpdate.customerName} đã bắt đầu được giao.`, nav: { view: 'SALES', params: { orderId } }
                });
            }
            return { success: true };
        } else {
            addToast("Cập nhật thất bại", 'error');
            return { success: false, message: "Cập nhật thất bại" };
        }
    };
    
    if (options.skipConfirm) return await performUpdate();

    if (status === OrderStatus.Processing && orderToUpdate.status === OrderStatus.Pending) {
        const customer = customers.find(c => c.id === orderToUpdate.customerId);
        if (!customer) {
            addToast('Không tìm thấy thông tin khách hàng cho đơn hàng này.', 'error');
            return { success: false, message: 'Không tìm thấy khách hàng.' };
        }

        const result = await confirmAddress({ order: orderToUpdate, customer });
        if (result === null) return { success: false, message: 'Người dùng đã hủy.' };
        
        const { name, phone, address } = result;
        const hasChanged = customer.name !== name || customer.phone !== phone || customer.address !== address;

        if (hasChanged) {
            const updatedCustomer = { ...customer, name, phone, address };
            await api.saveCustomer(updatedCustomer);
            setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c ));
            if (customer.name !== name) {
                setOrders(prev => prev.map(o => o.customerId === customer.id ? { ...o, customerName: name } : o ));
                setSalesReturns(prev => prev.map(r => r.customerId === customer.id ? { ...r, customerName: name } : r ));
                setQuotations(prev => prev.map(q => q.customerId === customer.id ? { ...q, customerName: name } : q ));
            }
        }
        return await performUpdate();
    }

    const statusTextMap = { [OrderStatus.Cancelled]: 'hủy đơn hàng này' };
    const statusText = statusTextMap[status as keyof typeof statusTextMap] || `cập nhật trạng thái thành "${status}"`;
    const isDanger = status === OrderStatus.Cancelled;

    const isConfirmed = await confirm({
        title: 'Xác nhận thay đổi trạng thái', message: `Bạn có chắc chắn muốn ${statusText} không?`,
        variant: isDanger ? 'danger' : 'info', confirmText: isDanger ? 'Hủy đơn hàng' : 'Xác nhận'
    });

    if (isConfirmed) return await performUpdate();
    return { success: false, message: 'Người dùng đã hủy' };
}, [handleCompleteOrder, orders, addToast, addNotification, customers, confirmAddress, confirm]);

const handleUpdateOrderPaymentStatus = useCallback(async (orderId: string, amountToPay: number, options: { paymentMethod?: any, isBulk?: boolean } = {}): Promise<{ success: boolean; message?: string; }> => {
    setIsProcessing(true);
    const result = await api.updateOrderPayment(orderId, amountToPay, options.paymentMethod);
    setIsProcessing(false);

    if (result.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? result.updatedOrder! : o));
        setJournalEntries(prev => [result.newJournalEntry!, ...prev]);
        if (!options.isBulk) {
            addToast(`Đã ghi nhận thanh toán ${amountToPay.toLocaleString('vi-VN')}đ cho ĐH #${orderId}.`, 'success');
            const customer = customers.find(c => c.id === result.updatedOrder!.customerId);
            if (customer) setVoucherToPrint({ transaction: result.newJournalEntry!, party: customer, type: 'thu' });
        }
        addNotification({
            type: NotificationType.SUCCESS, icon: 'CreditCardIcon', title: `ĐH #${orderId} có thanh toán mới`,
            message: `Đã nhận ${amountToPay.toLocaleString('vi-VN')}đ từ ${result.updatedOrder!.customerName}.`,
            nav: { view: 'SALES', params: { orderId } }
        });
        return { success: true };
    } else {
        if (!options.isBulk) addToast(result.message!, 'error');
        return { success: false, message: result.message! };
    }
}, [customers, addToast, addNotification]);

const handleCreateSalesReturn = useCallback(async (order: Order, itemsToReturn: SalesReturnItem[], totalRefund: number) => {
    if (!order || itemsToReturn.length === 0) return;
    setIsProcessing(true);
    const result = await api.createSalesReturn(order, itemsToReturn, totalRefund);
    setIsProcessing(false);
    if (result.success) {
        setSalesReturns(await api.getSalesReturns());
        setInventoryStock(result.updatedStock!);
        setInventoryMovements(prev => [...result.newMovements!, ...prev]);
        setJournalEntries(prev => [result.newJournalEntry!, ...prev]);
        setReturnToPrint(result.newReturn!);
        addToast(`Đã tạo phiếu trả hàng thành công cho ĐH #${order.id}.`, 'success');
        addNotification({
            type: NotificationType.INFO, icon: 'ArrowUturnLeftIcon', title: `Có hàng bị trả lại từ ĐH #${order.id}`,
            message: `${order.customerName} đã trả lại ${itemsToReturn.length} sản phẩm.`, nav: { view: 'SALES', params: { orderId: order.id } }
        });
    }
}, [addToast, addNotification]);

const handlePrintSalesReturn = useCallback((salesReturn: SalesReturn) => {
    setReturnToPrint(salesReturn);
}, []);

const handleCreateAndCompleteOrder = useCallback(async (orderData: Omit<Order, 'id'>) => {
    setIsProcessing(true);
    const result = await api.createAndCompleteOrder(orderData);
    setIsProcessing(false);
    if(result.success) {
        setOrders(prev => [result.newOrder!, ...prev]);
        setInventoryStock(result.updatedStock!);
        setInventoryMovements(prev => [...result.newMovements!, ...prev]);
        if (result.newJournalEntries) {
            setJournalEntries(prev => [...result.newJournalEntries!, ...prev]);
        }
        addToast(`Đã tạo và hoàn tất đơn hàng tại quầy ${result.newOrder!.id}.`, 'success');
        addNotification({
            type: NotificationType.SUCCESS, icon: 'CheckCircleIcon', title: `Đơn hàng #${result.newOrder!.id} hoàn thành`,
            message: `Đơn hàng của ${result.newOrder!.customerName} đã được hoàn tất tại quầy.`, nav: { view: 'SALES', params: { orderId: result.newOrder!.id } }
        });
    } else {
        addToast(result.message!, 'error');
    }
}, [addToast, addNotification]);

const handleCreateQuotation = useCallback(async (quotation: Omit<Quotation, 'id'>) => {
    const result = await api.createQuotation(quotation);
    if(result.success) {
        setQuotations(prev => [result.newQuotation!, ...prev]);
        addToast(`Đã tạo báo giá nháp ${result.newQuotation!.id}.`, 'success');
    }
}, [addToast]);

const handleUpdateQuotation = useCallback(async (updatedQuotation: Quotation) => {
    const result = await api.updateQuotation(updatedQuotation);
    if(result.success) {
        setQuotations(prev => prev.map(q => q.id === updatedQuotation.id ? result.updatedQuotation! : q));
        addToast(`Đã cập nhật báo giá ${updatedQuotation.id}.`, 'success');
    }
}, [addToast]);

const handleDeleteQuotation = useCallback(async (quotationId: string) => {
    const isConfirmed = await confirm({
        title: 'Xóa báo giá nháp', message: 'Bạn có chắc chắn muốn xóa báo giá nháp này không?',
        variant: 'danger', confirmText: 'Xóa'
    });
    if (isConfirmed) {
        const result = await api.deleteQuotation(quotationId);
        if(result.success) {
            setQuotations(prev => prev.filter(q => q.id !== quotationId));
            addToast(`Đã xóa báo giá ${quotationId}.`, 'success');
        }
    }
}, [confirm, addToast]);

const handleUpdateQuotationStatus = useCallback(async (quotationId: string, status: QuotationStatus) => {
    const result = await api.updateQuotationStatus(quotationId, status);
    if(result.success) {
        const q = result.updatedQuotation!;
        setQuotations(prev => prev.map(p => p.id === quotationId ? q : p));
         if(status === QuotationStatus.Accepted){
             addToast(`Báo giá #${quotationId} đã được khách hàng chấp nhận.`, 'info');
             addNotification({
                type: NotificationType.INFO, icon: 'DocumentCheckIcon', title: `Báo giá #${quotationId} được chấp nhận`,
                message: `${q.customerName} đã đồng ý với báo giá.`, nav: { view: 'SALES', params: { } }
            });
        } else if (status === QuotationStatus.Sent) {
            addToast(`Báo giá #${quotationId} đã được gửi đi.`, 'info');
        }
    }
}, [addToast, addNotification]);

const handleConvertQuotationToOrder = useCallback(async (quotationId: string) => {
    if(!companySettings) return;
    setIsProcessing(true);
    const result = await api.convertQuotationToOrder(quotationId);
    setIsProcessing(false);
    if (result.success) {
        setOrders(prev => [result.newOrder!, ...prev]);
        setQuotations(prev => prev.map(q => q.id === quotationId ? result.updatedQuotation! : q));
        addToast(`Đã tạo đơn hàng mới ${result.newOrder!.id} từ báo giá ${quotationId}.`, 'success', 'Thành công');
        addNotification({
            type: NotificationType.SUCCESS, icon: 'ShoppingCartIcon', title: `Đã tạo đơn hàng mới #${result.newOrder!.id}`,
            message: `Tạo từ báo giá ${quotationId} cho khách hàng ${result.newOrder!.customerName}.`,
            nav: { view: 'SALES', params: { orderId: result.newOrder!.id } }
        });
    } else {
        addToast(result.message!, 'warning', "Thao tác không hợp lệ");
    }
}, [companySettings, addToast, addNotification]);

const handleCreateInventoryAdjustment = useCallback(async (warehouse: string, notes: string, items: { productId: string; actualStock: number }[]) => {
    setIsProcessing(true);
    const result = await api.createInventoryAdjustment(warehouse, notes, items);
    setIsProcessing(false);
    if (result.success) {
        setInventoryAdjustments(prev => [result.newAdjustment!, ...prev]);
        setInventoryStock(result.updatedStock!);
        setInventoryMovements(prev => [...result.newMovements!, ...prev]);
        addToast(`Đã tạo phiếu kiểm kho ${result.newAdjustment!.id} thành công.`, 'success');
    } else {
        addToast(result.message || 'Không có thay đổi nào về tồn kho.', 'info');
    }
}, [addToast]);

const handleCreateStockTransfer = useCallback(async (fromWarehouse: string, toWarehouse: string, items: StockTransferItem[], notes?: string) => {
    setIsProcessing(true);
    const result = await api.createStockTransfer(fromWarehouse, toWarehouse, items, notes);
    setIsProcessing(false);
    if (result.success) {
        setStockTransfers(prev => [result.newTransfer!, ...prev]);
        setInventoryStock(result.updatedStock!);
        setInventoryMovements(prev => [...result.newMovements!, ...prev]);
        addToast(`Đã tạo phiếu chuyển kho ${result.newTransfer!.id} thành công.`, 'success');
    } else {
        addToast(result.message || 'Có lỗi xảy ra', 'error');
    }
}, [addToast]);

const handleUpdatePurchaseOrderStatus = useCallback(async (poId: string, status: PurchaseOrderStatus, options: { skipConfirm?: boolean } = {}) => {
  const originalPO = purchaseOrders.find(po => po.id === poId);
  if (!originalPO) return;

  const performUpdate = async () => {
    setIsProcessing(true);
    const result = await api.updatePurchaseOrderStatus(poId, status);
    setIsProcessing(false);
    if (result.success && result.updatedPO) {
        setPurchaseOrders(prev => prev.map(po => po.id === poId ? result.updatedPO! : po));
        if (result.newMovements) setInventoryMovements(prev => [...result.newMovements!, ...prev]);
        if (result.updatedStock) setInventoryStock(result.updatedStock);
        if (result.newJournalEntry) setJournalEntries(prev => [result.newJournalEntry!, ...prev]);

        if (status === 'Đã nhận') {
            addToast(`Đã nhận hàng thành công từ PO #${poId}`, 'success', 'Nhập kho thành công');
            addNotification({
                type: NotificationType.SUCCESS,
                icon: 'TruckIcon',
                title: `Đã nhận hàng từ PO #${poId}`,
                message: `Đã nhập kho ${originalPO.items.length} loại sản phẩm từ ${originalPO.supplierName}.`,
                nav: { view: 'PURCHASING', params: { poId } }
            });
        }
    } else {
      addToast(result.message || "Có lỗi xảy ra", 'error');
    }
  };

  if(options.skipConfirm) {
    await performUpdate();
    return;
  }

  const isConfirmed = await confirm({
      title: 'Xác nhận thay đổi',
      message: `Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "${status}" không?`,
      confirmText: 'Xác nhận',
  });
  if (isConfirmed) await performUpdate();

}, [purchaseOrders, confirm, addToast, addNotification]);

const handleUpdatePurchaseOrderPaymentStatus = useCallback(async (poId: string, amountToPay: number) => {
    setIsProcessing(true);
    const result = await api.updatePurchaseOrderPayment(poId, amountToPay);
    setIsProcessing(false);
    if (result.success) {
        setPurchaseOrders(prev => prev.map(p => p.id === poId ? result.updatedPO! : p));
        setJournalEntries(prev => [result.newJournalEntry!, ...prev]);
        addToast(`Đã ghi nhận thanh toán ${amountToPay.toLocaleString('vi-VN')}đ cho PO #${poId}.`, 'success');
        const supplier = suppliers.find(s => s.id === result.updatedPO!.supplierId);
        if (supplier) setVoucherToPrint({ transaction: result.newJournalEntry!, party: supplier, type: 'chi' });
    } else {
        addToast(result.message!, 'error');
    }
}, [suppliers, addToast]);

const handleCreatePurchaseOrder = useCallback(async (poData: Omit<PurchaseOrder, 'id'>) => {
    setIsProcessing(true);
    const result = await api.createPurchaseOrder(poData);
    setIsProcessing(false);
    if (result.success) {
        setPurchaseOrders(prev => [result.newPO!, ...prev]);
        addToast(`Đã tạo đơn mua hàng nháp ${result.newPO!.id}.`, 'success');
    } else {
        addToast('Lỗi tạo đơn mua hàng.', 'error');
    }
}, [addToast]);

const handleUpdatePurchaseOrder = useCallback(async (updatedPO: PurchaseOrder) => {
    const result = await api.updatePurchaseOrder(updatedPO);
    if(result.success) {
      setPurchaseOrders(prev => prev.map(p => p.id === updatedPO.id ? updatedPO : p));
      addToast(`Đã cập nhật đơn mua hàng ${updatedPO.id}.`, 'success');
    }
}, [addToast]);

const handleDeletePurchaseOrder = useCallback(async (poId: string) => {
    const isConfirmed = await confirm({
        title: 'Xóa đơn mua hàng',
        message: `Bạn có chắc muốn xóa đơn hàng nháp #${poId} không?`,
        variant: 'danger', confirmText: 'Xóa'
    });
    if (!isConfirmed) return;
    const result = await api.deletePurchaseOrder(poId);
    if(result.success) {
      setPurchaseOrders(prev => prev.filter(p => p.id !== poId));
      addToast(`Đã xóa đơn hàng nháp ${poId}.`, 'success');
    }
}, [addToast, confirm]);

const handleCreateJournalEntry = useCallback(async (journalEntry: Omit<JournalEntry, 'id'>) => {
      const result = await api.createJournalEntry(journalEntry);
      if(result.success) {
          setJournalEntries(prev => [result.newJournalEntry!, ...prev]);
          addToast(`Đã tạo bút toán mới thành công.`, 'success');
      }
}, [addToast]);

const handleSaveBOM = useCallback(async (bom: Omit<BillOfMaterials, 'id'> | BillOfMaterials) => {
    setIsProcessing(true);
    const result = await api.saveBOM(bom);
    setIsProcessing(false);
    if(result.success) {
        const savedBOM = result.savedBOM!;
        setBillsOfMaterials(prev => 'id' in bom ? prev.map(b => b.id === bom.id ? savedBOM : b) : [savedBOM, ...prev]);
        addToast(`Đã ${'id' in bom ? 'cập nhật' : 'tạo'} BOM "${savedBOM.name}".`, 'success');
    }
}, [addToast]);

const handleDeleteBOM = useCallback(async (bomId: string) => {
    const result = await api.deleteBOM(bomId);
    if(result.success) {
        setBillsOfMaterials(prev => prev.filter(b => b.id !== bomId));
        addToast(`Đã xóa BOM.`, 'success');
    }
}, [addToast]);

const handleCreateWorkOrder = useCallback(async (workOrder: Omit<WorkOrder, 'id'>) => {
   const result = await api.createWorkOrder(workOrder);
   if(result.success) {
        setWorkOrders(prev => [result.newWorkOrder!, ...prev]);
        addToast(`Đã tạo Lệnh sản xuất ${result.newWorkOrder!.id}.`, 'success');
   }
}, [addToast]);

const handleUpdateWorkOrderStatus = useCallback(async (workOrderId: string, status: WorkOrderStatus) => {
    const wo = workOrders.find(w => w.id === workOrderId);
    if (!wo) return;
    setIsProcessing(true);
    const result = await api.updateWorkOrderStatus(workOrderId, status);
    setIsProcessing(false);
    if (result.success && result.updatedWorkOrder) {
        setWorkOrders(prev => prev.map(w => w.id === workOrderId ? result.updatedWorkOrder! : w));
        addToast(`Đã cập nhật trạng thái Lệnh sản xuất #${workOrderId}.`, 'success');
    }
}, [workOrders, addToast]);

const handleCompleteWorkOrder = useCallback(async (workOrderId: string) => {
    const isConfirmed = await confirm({
        title: 'Hoàn thành Lệnh sản xuất',
        message: `Bạn có chắc muốn hoàn thành LSX #${workOrderId}? Thao tác này sẽ trừ kho NVL và nhập kho thành phẩm.`,
        confirmText: 'Hoàn thành'
    });
    if (!isConfirmed) return;
    
    setIsProcessing(true);
    const result = await api.completeWorkOrder(workOrderId);
    setIsProcessing(false);

    if(result.success) {
        setWorkOrders(prev => prev.map(wo => wo.id === workOrderId ? result.updatedWorkOrder! : wo));
        setInventoryStock(result.updatedStock!);
        setInventoryMovements(prev => [...result.newMovements!, ...prev]);
        addToast(`Đã hoàn thành Lệnh sản xuất #${workOrderId}.`, 'success');
        addNotification({
            type: NotificationType.SUCCESS,
            icon: 'WrenchScrewdriverIcon',
            title: `LSX #${workOrderId} hoàn thành`,
            message: `Sản xuất ${result.updatedWorkOrder!.quantityToProduce} ${result.updatedWorkOrder!.productName} hoàn tất.`,
            nav: { view: 'MANUFACTURING' }
        });
    } else {
        addToast(result.message!, 'error');
    }
}, [confirm, addToast, addNotification]);

const handleUpdateWorkOrderSteps = useCallback(async (workOrderId: string, steps: ProductionStep[]) => {
    const result = await api.updateWorkOrderSteps(workOrderId, steps);
    if(result.success && result.updatedWorkOrder) {
        setWorkOrders(prev => prev.map(w => w.id === workOrderId ? result.updatedWorkOrder! : w));
        addToast(`Cập nhật tiến độ cho LSX #${workOrderId}.`, 'info');
    }
}, [addToast]);

    // --- Data Loading Functions ---
    const loadAllInitialData = useCallback(async () => {
        setIsProcessing(true);
        try {
            const [
                loadedUsers, loadedProducts, loadedOrders, loadedCustomers,
                loadedSuppliers, loadedPOs, loadedMovements, loadedReturns,
                loadedAdjustments, loadedJournalEntries, loadedQuotations,
                loadedInventory, loadedTransfers, loadedBOMs, loadedWOs,
                loadedSettings, loadedPermissions, loadedPeriods, loadedTaxes, loadedChartOfAccounts
            ] = await Promise.all([
                api.getUsers(), api.getProducts(), api.getOrders(), api.getCustomers(),
                api.getSuppliers(), api.getPurchaseOrders(), api.getInventoryMovements(),
                api.getSalesReturns(), api.getInventoryAdjustments(), api.getJournalEntries(),
                api.getQuotations(), api.getInventoryStock(), api.getStockTransfers(),
                api.getBillsOfMaterials(), api.getWorkOrders(), api.getCompanySettings(),
                api.getPermissions(), api.getAccountingPeriods(), api.getTaxRates(),
                api.getChartOfAccounts()
            ]);
            
            setUsers(loadedUsers); setProducts(loadedProducts); setOrders(loadedOrders); setCustomers(loadedCustomers);
            setSuppliers(loadedSuppliers); setPurchaseOrders(loadedPOs); setInventoryMovements(loadedMovements);
            setSalesReturns(loadedReturns); setInventoryAdjustments(loadedAdjustments); setJournalEntries(loadedJournalEntries);
            setQuotations(loadedQuotations); setInventoryStock(loadedInventory); setStockTransfers(loadedTransfers);
            setBillsOfMaterials(loadedBOMs); setWorkOrders(loadedWOs);
            setCompanySettings(loadedSettings); setPermissions(loadedPermissions); setAccountingPeriods(loadedPeriods);
            setTaxRates(loadedTaxes); setChartOfAccounts(loadedChartOfAccounts);

        } catch (error) { addToast("Lỗi tải dữ liệu", "error"); }
        finally { setIsProcessing(false); }
    }, [addToast]);

    const loadSalesData = useCallback(async () => {
        setIsProcessing(true);
        try {
            const [orders, customers, products, stock, returns, quotations, taxRates, settings] = await Promise.all([
                api.getOrders(), api.getCustomers(), api.getProducts(), api.getInventoryStock(),
                api.getSalesReturns(), api.getQuotations(), api.getTaxRates(), api.getCompanySettings()
            ]);
            setOrders(orders); setCustomers(customers); setProducts(products); setInventoryStock(stock);
            setSalesReturns(returns); setQuotations(quotations); setTaxRates(taxRates); setCompanySettings(settings);
        } catch (e) { addToast("Lỗi tải dữ liệu bán hàng.", "error"); }
        finally { setIsProcessing(false); }
    }, [addToast]);

    // --- NEW ACTION HANDLERS for API Layer ---
    const createApiHandler = (apiFunction: Function, successMessage: string, failureMessage: string, dataLoader: Function) => 
        useCallback(async (...args: any[]) => {
            setIsProcessing(true);
            const result = await apiFunction(...args);
            setIsProcessing(false);
            if (result.success) {
                addToast(successMessage, 'success');
                await dataLoader();
            } else {
                addToast(result.message || failureMessage, 'error');
            }
            return result;
        }, [addToast, dataLoader]);

    const handleSaveUser = createApiHandler(api.saveUser, 'Đã lưu thông tin nhân viên.', 'Lỗi lưu nhân viên.', loadAllInitialData);
    const handleDeleteUser = createApiHandler(api.deleteUser, 'Đã xóa nhân viên.', 'Lỗi xóa nhân viên.', loadAllInitialData);
    const handleSaveProduct = createApiHandler(api.saveProduct, 'Đã lưu sản phẩm.', 'Lỗi lưu sản phẩm.', loadAllInitialData);
    const handleDeleteProduct = createApiHandler(api.deleteProduct, 'Đã xóa sản phẩm.', 'Lỗi xóa sản phẩm.', loadAllInitialData);
    const handleSaveCustomer = createApiHandler(api.saveCustomer, 'Đã lưu khách hàng.', 'Lỗi lưu khách hàng.', loadAllInitialData);
    const handleDeleteCustomer = createApiHandler(api.deleteCustomer, 'Đã xóa khách hàng.', 'Lỗi xóa khách hàng.', loadAllInitialData);
    const handleSaveSupplier = createApiHandler(api.saveSupplier, 'Đã lưu nhà cung cấp.', 'Lỗi lưu nhà cung cấp.', loadAllInitialData);
    const handleDeleteSupplier = createApiHandler(api.deleteSupplier, 'Đã xóa nhà cung cấp.', 'Lỗi xóa nhà cung cấp.', loadAllInitialData);
    const handleUpdateCompanySettings = createApiHandler(api.updateCompanySettings, 'Đã cập nhật cài đặt công ty.', 'Lỗi cập nhật cài đặt.', loadAllInitialData);
    const handleUpdatePermissions = createApiHandler(api.updatePermissions, 'Đã cập nhật phân quyền.', 'Lỗi cập nhật phân quyền.', loadAllInitialData);
    const handleUpdateAccountingPeriods = createApiHandler(api.updateAccountingPeriods, 'Đã cập nhật kỳ kế toán.', 'Lỗi cập nhật kỳ kế toán.', loadAllInitialData);
    const handleUpdateTaxRates = createApiHandler(api.updateTaxRates, 'Đã cập nhật thuế suất.', 'Lỗi cập nhật thuế.', loadAllInitialData);
    const handleUpdateChartOfAccounts = createApiHandler(api.updateChartOfAccounts, 'Đã cập nhật hệ thống tài khoản.', 'Lỗi cập nhật tài khoản.', loadAllInitialData);


  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchModalOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchModalOpen(false);
        setAIChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Derived State ---
  const visibleNavItems = useMemo(() => {
    if (!currentUser) return [];
    return NAV_ITEMS.filter(item => hasPermission(VIEW_PERMISSIONS_MAP[item.id]));
  }, [currentUser, hasPermission]);

  const activeNavItem = useMemo(() => NAV_ITEMS.find(item => item.id === activeView), [activeView]);
  
  // --- Render Logic ---
  if (isInitializing) {
    return <GlobalSpinner isProcessing={true} />;
  }

  if (!currentUser) {
    if (authView === 'login') {
        return <LoginView onLogin={handleLogin} onForgotPassword={() => setAuthView('forgotPassword')} />;
    }
    return <ForgotPasswordView onRequestReset={handleRequestPasswordReset} onBackToLogin={() => setAuthView('login')} />;
  }
  
  if (!companySettings || !permissions || !chartOfAccounts) {
    if(!isProcessing) loadAllInitialData();
    return <GlobalSpinner isProcessing={true} />;
  }
  
  const hasViewPermission = hasPermission(VIEW_PERMISSIONS_MAP[activeView]);
  
  const actions = {
    handleSaveOrder, handleUpdateOrderStatus, handleUpdateOrderPaymentStatus, handleCompleteOrder, handleCreateSalesReturn,
    handlePrintSalesReturn, handleCreateAndCompleteOrder, handleCreateQuotation, handleUpdateQuotation,
    handleDeleteQuotation, handleUpdateQuotationStatus, handleConvertQuotationToOrder, handleCreateInventoryAdjustment,
    handleCreateStockTransfer, handleUpdatePurchaseOrderStatus, handleUpdatePurchaseOrderPaymentStatus,
    handleCreatePurchaseOrder, handleUpdatePurchaseOrder, handleDeletePurchaseOrder, handleCreateJournalEntry,
    handleSaveBOM, handleDeleteBOM, handleCreateWorkOrder, handleCompleteWorkOrder, handleUpdateWorkOrderStatus,
    handleUpdateWorkOrderSteps,
    handleSaveUser, handleDeleteUser, handleSaveProduct, handleDeleteProduct, handleSaveCustomer, handleDeleteCustomer,
    handleSaveSupplier, handleDeleteSupplier, handleUpdateCompanySettings, handleUpdatePermissions,
    handleUpdateAccountingPeriods, handleUpdateTaxRates, handleUpdateChartOfAccounts,
    loadDashboardData: loadAllInitialData, loadSalesData, loadCrmData: loadSalesData, loadProductData: loadSalesData,
    loadManufacturingData: loadSalesData, loadInventoryData: loadSalesData, loadSupplierData: loadSalesData,
    loadPurchasingData: loadSalesData, loadAccountingData: loadAllInitialData, loadReportsData: loadAllInitialData,
    loadSettingsData: loadAllInitialData,
  };


  return (
    <div className="bg-slate-100 dark:bg-slate-900">
      <GlobalSpinner isProcessing={isProcessing} />
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900 font-sans">
        <div className="hidden lg:flex flex-shrink-0">
          <Sidebar 
            activeView={activeView} 
            onNavigate={handleNavigate} 
            onLogout={handleLogout} 
            navItems={visibleNavItems} 
            currentUser={currentUser} 
            theme={theme}
            setTheme={setTheme}
          />
        </div>

        <div className={`lg:hidden fixed inset-0 z-30 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black opacity-50" onClick={() => setIsSidebarOpen(false)}></div>
            <div className={`relative z-10 w-64 h-full bg-slate-900 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar 
                    activeView={activeView} 
                    onNavigate={handleNavigate}
                    onLogout={() => { handleLogout(); setIsSidebarOpen(false); }} 
                    navItems={visibleNavItems}
                    currentUser={currentUser}
                    theme={theme}
                    setTheme={setTheme}
                />
            </div>
        </div>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-20">
              <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 dark:text-slate-300 p-1">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">{activeNavItem?.label || 'ERP System'}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSearchModalOpen(true)} className="text-slate-600 dark:text-slate-300 p-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
                <NotificationsPopover 
                    notifications={notifications}
                    onNavigate={handleNavigate}
                    onMarkOneRead={handleMarkOneRead}
                    onMarkAllRead={handleMarkAllRead}
                />
              </div>
          </div>

          <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900">
            <div className="container mx-auto px-4 sm:px-6 py-8">
              {activeView !== 'DASHBOARD' && (
                  <div className="hidden lg:block">
                      <MainHeader 
                        activeNavItem={activeNavItem} 
                        onSearchClick={() => setSearchModalOpen(true)}
                        currentUser={currentUser}
                      >
                        <NotificationsPopover 
                            notifications={notifications}
                            onNavigate={handleNavigate}
                            onMarkOneRead={handleMarkOneRead}
                            onMarkAllRead={handleMarkAllRead}
                        />
                      </MainHeader>
                  </div>
              )}
              
              {(!hasViewPermission || activeView === 'DASHBOARD') && <DashboardView 
                  orders={orders} 
                  products={products} 
                  inventoryStock={inventoryStock} 
                  customers={customers}
                  purchaseOrders={purchaseOrders}
                  quotations={quotations}
                  journalEntries={journalEntries}
                  suppliers={suppliers}
                  theme={theme} 
                  onNavigate={handleNavigate} 
                  currentUser={currentUser}
                  loadData={actions.loadDashboardData}
              />}
              {hasViewPermission && activeView === 'SALES' && <SalesView 
                  orders={orders} customers={customers}
                  products={products} inventoryStock={inventoryStock} onNavigate={handleNavigate} 
                  salesReturns={salesReturns} quotations={quotations} currentUser={currentUser}
                  companySettings={companySettings} hasPermission={hasPermission} taxRates={taxRates}
                  initialOrderId={selectedParams.orderId} onClearInitialSelection={clearSelectedParams}
                  onHandleReturn={actions.handleCreateSalesReturn} onPrintSalesReturn={actions.handlePrintSalesReturn}
                  onUpdateOrderStatus={actions.handleUpdateOrderStatus} onUpdateOrderPaymentStatus={actions.handleUpdateOrderPaymentStatus}
                  onHandleCreateAndCompleteOrder={actions.handleCreateAndCompleteOrder}
                  onSaveOrder={actions.handleSaveOrder}
                  onHandleCreateQuotation={actions.handleCreateQuotation} onHandleUpdateQuotation={actions.handleUpdateQuotation}
                  onHandleDeleteQuotation={actions.handleDeleteQuotation} onHandleUpdateQuotationStatus={actions.handleUpdateQuotationStatus}
                  onHandleConvertQuotationToOrder={actions.handleConvertQuotationToOrder}
                  onSaveCustomer={actions.handleSaveCustomer}
                  loadData={actions.loadSalesData}
              />}
              {hasViewPermission && activeView === 'CRM' && <CrmView 
                  customers={customers} orders={orders} 
                  initialCustomerId={selectedParams.customerId} onClearInitialCustomer={clearSelectedParams}
                  onUpdateOrderPaymentStatus={actions.handleUpdateOrderPaymentStatus} currentUser={currentUser}
                  onNavigate={handleNavigate} hasPermission={hasPermission}
                  onSaveCustomer={actions.handleSaveCustomer} onDeleteCustomer={actions.handleDeleteCustomer}
                  loadData={actions.loadCrmData}
              />}
              {hasViewPermission && activeView === 'PRODUCT' && <ProductView 
                  products={products} suppliers={suppliers} 
                  inventoryStock={inventoryStock} currentUser={currentUser} onNavigate={handleNavigate}
                  initialProductId={selectedParams.productId} onClearInitialSelection={clearSelectedParams}
                  hasPermission={hasPermission} orders={orders} inventoryMovements={inventoryMovements}
                  onSaveProduct={actions.handleSaveProduct} onDeleteProduct={actions.handleDeleteProduct}
                  onSaveSupplier={actions.handleSaveSupplier}
                  loadData={actions.loadProductData}
              />}
              {hasViewPermission && activeView === 'MANUFACTURING' && <ManufacturingView 
                  products={products} inventoryStock={inventoryStock} billsOfMaterials={billsOfMaterials}
                  workOrders={workOrders} onSaveBOM={actions.handleSaveBOM} onDeleteBOM={actions.handleDeleteBOM}
                  onCreateWorkOrder={actions.handleCreateWorkOrder} onCompleteWorkOrder={actions.handleCompleteWorkOrder}
                  onUpdateWorkOrderStatus={actions.handleUpdateWorkOrderStatus}
                  onUpdateWorkOrderSteps={actions.handleUpdateWorkOrderSteps}
                  currentUser={currentUser} companySettings={companySettings} hasPermission={hasPermission} theme={theme}
                  loadData={actions.loadManufacturingData}
              />}
              {hasViewPermission && activeView === 'INVENTORY' && <InventoryView 
                  products={products} inventoryStock={inventoryStock} inventoryMovements={inventoryMovements} 
                  suppliers={suppliers} inventoryAdjustments={inventoryAdjustments} stockTransfers={stockTransfers}
                  onCreateAdjustment={actions.handleCreateInventoryAdjustment} onCreateStockTransfer={actions.handleCreateStockTransfer}
                  currentUser={currentUser} companySettings={companySettings} onNavigate={handleNavigate} hasPermission={hasPermission}
                  loadData={actions.loadInventoryData}
               />}
              {hasViewPermission && activeView === 'SUPPLIER' && <SupplierView 
                  suppliers={suppliers} purchaseOrders={purchaseOrders} 
                  products={products}
                  onUpdatePaymentStatus={actions.handleUpdatePurchaseOrderPaymentStatus} currentUser={currentUser}
                  onNavigate={handleNavigate} initialSupplierId={selectedParams.supplierId}
                  onClearInitialSelection={clearSelectedParams} hasPermission={hasPermission}
                  onSaveSupplier={actions.handleSaveSupplier} onDeleteSupplier={actions.handleDeleteSupplier}
                  loadData={actions.loadSupplierData}
              />}
              {hasViewPermission && activeView === 'PURCHASING' && <PurchasingView 
                  purchaseOrders={purchaseOrders} suppliers={suppliers}
                  products={products} onUpdateStatus={actions.handleUpdatePurchaseOrderStatus}
                  onUpdatePaymentStatus={actions.handleUpdatePurchaseOrderPaymentStatus}
                  onCreatePO={actions.handleCreatePurchaseOrder}
                  onUpdatePO={actions.handleUpdatePurchaseOrder} 
                  onDeletePO={actions.handleDeletePurchaseOrder}
                  initialParams={selectedParams} onClearInitialSelection={clearSelectedParams}
                  currentUser={currentUser} companySettings={companySettings} onNavigate={handleNavigate}
                  hasPermission={hasPermission} taxRates={taxRates}
                  loadData={actions.loadPurchasingData}
                />}
              {hasViewPermission && activeView === 'ACCOUNTING' && <AccountingView 
                  journalEntries={journalEntries} onCreateJournalEntry={actions.handleCreateJournalEntry} 
                  currentUser={currentUser} orders={orders} customers={customers} purchaseOrders={purchaseOrders}
                  suppliers={suppliers} onUpdateOrderPaymentStatus={actions.handleUpdateOrderPaymentStatus}
                  onUpdatePurchaseOrderPaymentStatus={actions.handleUpdatePurchaseOrderPaymentStatus}
                  theme={theme} hasPermission={hasPermission} chartOfAccounts={chartOfAccounts}
                  onNavigate={handleNavigate}
                  initialParams={selectedParams}
                  onClearInitialSelection={clearSelectedParams}
                  loadData={actions.loadAccountingData}
              />}
              {hasViewPermission && activeView === 'REPORTS' && <ReportsView 
                  orders={orders} products={products} inventoryStock={inventoryStock}
                  journalEntries={journalEntries} purchaseOrders={purchaseOrders} currentUser={currentUser}
                  customers={customers} suppliers={suppliers} theme={theme} onNavigate={handleNavigate}
                  loadData={actions.loadReportsData}
              />}
              {hasPermission('VIEW_STAFF') && activeView === 'STAFF' && <StaffView 
                  users={users} currentUser={currentUser} hasPermission={hasPermission}
                  onSaveUser={actions.handleSaveUser} onDeleteUser={actions.handleDeleteUser}
              />}
              {hasPermission('VIEW_SETTINGS') && activeView === 'SETTINGS' && <SettingsView 
                  products={products} customers={customers}
                  companySettings={companySettings} permissions={permissions}
                  hasPermission={hasPermission}
                  accountingPeriods={accountingPeriods} taxRates={taxRates} chartOfAccounts={chartOfAccounts}
                  onUpdateCompanySettings={actions.handleUpdateCompanySettings}
                  onUpdatePermissions={actions.handleUpdatePermissions}
                  onUpdateAccountingPeriods={actions.handleUpdateAccountingPeriods}
                  onUpdateTaxRates={actions.handleUpdateTaxRates}
                  onUpdateChartOfAccounts={actions.handleUpdateChartOfAccounts}
                  onResetAllData={handleResetAllData}
                  onSaveProduct={actions.handleSaveProduct} onDeleteProduct={actions.handleDeleteProduct}
                  onSaveCustomer={actions.handleSaveCustomer}
                  loadData={actions.loadSettingsData}
              />}
            </div>
          </div>
        </main>
      </div>
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleNavigate}
      />
       {isAIChatOpen && (
            <AIChatBot
                isOpen={isAIChatOpen} onClose={() => setAIChatOpen(false)}
                customers={customers} products={products} orders={orders} purchaseOrders={purchaseOrders}
                suppliers={suppliers} journalEntries={journalEntries} inventoryStock={inventoryStock}
            />
        )}
      <button 
        onClick={() => setAIChatOpen(true)}
        className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-transform hover:scale-110 z-40"
        aria-label="Mở Trợ lý AI"
        >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.996 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.004Zm4.243 17.58L15.22 19l-2.02-3.03c-.1-.15-.26-.25-.42-.25s-.32.1-.42.25L10.34 19l-1.018-1.42c-.24-.33-.67-.42-1.01-.21s-.58.62-.58 1.01v.01c0 .08.01.16.04.23l1.58 3.52c.26.58.82.95 1.45.95h.01c.63 0 1.19-.37 1.45-.95l1.58-3.52c.03-.07.04-.15-.04-.23v-.01c0-.39-.24-.74-.58-1.01s-.77-.12-1.01.21Zm-.42-10.59L14.8 5l2.02 3.03c.1.15.26.25.42.25s.32-.1.42-.25L19.68 5l1.018 1.42c.24.33.67-.42 1.01.21s.58-.62.58-1.01v-.01c0-.08-.01-.16-.04-.23L20.64 1.87c-.26-.58-.82-.95-1.45-.95h-.01c-.63 0-1.19.37-1.45.95L16.15 5.4c-.03.07-.04.15-.04.23v.01c0 .39.24.74.58 1.01s.77.12 1.01-.21Z M5.013 10.925l-1.42-1.02a.965.965 0 0 1-.21-1.01c.21-.34.62-.58 1.01-.58h.01c.08 0 .16.01.23.04l3.52 1.58c.58.26.95.82.95 1.45v.01c0 .63-.37 1.19-.95 1.45l-3.52 1.58a.965.965 0 0 1-.23.04h-.01c-.39 0-.74-.24-1.01-.58s-.12-.77.21-1.01l1.42-1.02c.15-.1.25-.26.25-.42s-.1-.32-.25-.42Z" />
        </svg>
      </button>
      <ToastContainer />
      <ConfirmationModal />
      <AddressConfirmationModal />
      {voucherToPrint && (
        <PaymentVoucherModal
            isOpen={!!voucherToPrint}
            onClose={() => setVoucherToPrint(null)}
            voucherInfo={voucherToPrint}
            companySettings={companySettings}
        />
      )}
      {returnToPrint && (
        <ReturnReceiptModal
            isOpen={!!returnToPrint}
            onClose={() => setReturnToPrint(null)}
            salesReturn={returnToPrint}
            order={orders.find(o => o.id === returnToPrint.originalOrderId)}
            customer={customers.find(c => c.id === returnToPrint.customerId)}
            companySettings={companySettings}
        />
      )}
    </div>
  );
};

export default App;