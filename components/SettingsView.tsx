import React, { useState, useEffect } from 'react';
import { Product, Customer, ProductType, CompanySettings, Warehouse, PermissionsConfig, Permission, UserRole, AccountingPeriod, TaxRate, Account } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import Papa from 'papaparse';
import AddEditWarehouseModal from './AddEditWarehouseModal';
import AccountingSettingsView from './AccountingSettingsView';


interface SettingsViewProps {
    products: Product[];
    customers: Customer[];
    companySettings: CompanySettings;
    permissions: PermissionsConfig;
    hasPermission: (permission: Permission) => boolean;
    accountingPeriods: AccountingPeriod[];
    taxRates: TaxRate[];
    chartOfAccounts: Account[];
    onUpdateCompanySettings: (settings: CompanySettings) => Promise<any>;
    onUpdatePermissions: (permissions: PermissionsConfig) => Promise<any>;
    onUpdateAccountingPeriods: (periods: AccountingPeriod[]) => Promise<any>;
    onUpdateTaxRates: (rates: TaxRate[]) => Promise<any>;
    onUpdateChartOfAccounts: (accounts: Account[]) => Promise<any>;
    onSaveProduct: (product: Omit<Product, 'id'> | Product) => Promise<any>;
    onDeleteProduct: (productId: string) => Promise<any>;
    onSaveCustomer: (customer: Omit<Customer, 'id' | 'since'> | Customer) => Promise<any>;
    onResetAllData: () => Promise<void>;
    loadData: () => Promise<void>;
}

const PERMISSION_GROUPS: { groupName: string; permissions: { key: Permission; label: string }[] }[] = [
    { groupName: 'Bán hàng', permissions: [
        { key: 'CREATE_ORDER', label: 'Tạo Đơn hàng' },
        { key: 'EDIT_ORDER', label: 'Sửa Đơn hàng (chưa xác nhận)' },
        { key: 'CANCEL_ORDER', label: 'Hủy Đơn hàng' },
        { key: 'UPDATE_ORDER_STATUS', label: 'Cập nhật Trạng thái Đơn hàng' },
        { key: 'PROCESS_ORDER_PAYMENT', label: 'Xử lý Thanh toán Đơn hàng' },
        { key: 'CREATE_RETURN', label: 'Tạo Phiếu trả hàng' },
    ]},
    { groupName: 'Báo giá', permissions: [
        { key: 'CREATE_QUOTATION', label: 'Tạo Báo giá' },
        { key: 'EDIT_QUOTATION', label: 'Sửa Báo giá (dự thảo)' },
        { key: 'DELETE_QUOTATION', label: 'Xóa Báo giá (dự thảo)' },
        { key: 'UPDATE_QUOTATION_STATUS', label: 'Cập nhật Trạng thái Báo giá' },
    ]},
    { groupName: 'Khách hàng (CRM)', permissions: [
        { key: 'CREATE_CUSTOMER', label: 'Tạo Khách hàng' },
        { key: 'EDIT_CUSTOMER', label: 'Sửa Khách hàng' },
        { key: 'DELETE_CUSTOMER', label: 'Xóa Khách hàng' },
    ]},
    { groupName: 'Sản phẩm', permissions: [
        { key: 'CREATE_PRODUCT', label: 'Tạo Sản phẩm' },
        { key: 'EDIT_PRODUCT', label: 'Sửa Sản phẩm' },
        { key: 'DELETE_PRODUCT', label: 'Xóa Sản phẩm' },
        { key: 'PRINT_BARCODE', label: 'In Mã vạch' },
    ]},
    { groupName: 'Kho', permissions: [
        { key: 'CREATE_ADJUSTMENT', label: 'Tạo Phiếu Kiểm kê' },
        { key: 'CREATE_TRANSFER', label: 'Tạo Phiếu Chuyển kho' },
    ]},
    { groupName: 'Mua hàng', permissions: [
        { key: 'CREATE_PO', label: 'Tạo Đơn Mua hàng' },
        { key: 'EDIT_PO', label: 'Sửa Đơn Mua hàng (dự thảo)' },
        { key: 'DELETE_PO', label: 'Xóa Đơn Mua hàng (dự thảo)' },
        { key: 'UPDATE_PO_STATUS', label: 'Cập nhật Trạng thái Đơn Mua hàng' },
        { key: 'PROCESS_PO_PAYMENT', label: 'Xử lý Thanh toán Đơn Mua hàng' },
    ]},
    { groupName: 'Sản xuất', permissions: [
        { key: 'MANAGE_BOM', label: 'Quản lý Định mức NVL (BOM)' },
        { key: 'CREATE_WORK_ORDER', label: 'Tạo Lệnh Sản xuất' },
        { key: 'COMPLETE_WORK_ORDER', label: 'Hoàn thành Lệnh Sản xuất' },
    ]},
    { groupName: 'Kế toán', permissions: [
        { key: 'MANAGE_TRANSACTIONS', label: 'Tạo Giao dịch thủ công' },
    ]},
    { groupName: 'Nhân viên', permissions: [
        { key: 'MANAGE_STAFF', label: 'Quản lý Nhân viên' },
    ]},
    { groupName: 'Cài đặt', permissions: [
        { key: 'EDIT_COMPANY_SETTINGS', label: 'Sửa Cài đặt Công ty' },
        { key: 'MANAGE_DATA', label: 'Quản lý Dữ liệu (Import/Export)' },
        { key: 'MANAGE_PERMISSIONS', label: 'Quản lý Phân quyền' },
    ]}
];

const ROLES_TO_MANAGE = [UserRole.Manager, UserRole.Sales, UserRole.Accountant, UserRole.Warehouse];

const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const { 
        products, customers, companySettings, permissions, hasPermission,
        accountingPeriods, taxRates, chartOfAccounts,
        onUpdateCompanySettings, onUpdatePermissions,
        onUpdateAccountingPeriods, onUpdateTaxRates, onUpdateChartOfAccounts,
        onSaveProduct, onSaveCustomer,
        onResetAllData, loadData
    } = props;

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const [activeTab, setActiveTab] = useState('system');
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.Manager);
    const [isWarehouseModalOpen, setWarehouseModalOpen] = useState(false);
    const [warehouseToEdit, setWarehouseToEdit] = useState<Warehouse | null>(null);
    const { addToast } = useToast();
    const confirm = useConfirm();
    const productFileInputRef = React.useRef<HTMLInputElement>(null);
    const customerFileInputRef = React.useRef<HTMLInputElement>(null);
    const [localSettings, setLocalSettings] = useState<CompanySettings>(companySettings);
    const [logoPreview, setLogoPreview] = useState<string | null>(localSettings.logoUrl);
    
    const [resetStep, setResetStep] = useState(0);
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    const RESET_CONFIRM_PHRASE = "XÓA TẤT CẢ DỮ LIỆU";

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setLocalSettings({ ...localSettings, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogoPreview(base64String);
                setLocalSettings({ ...localSettings, logoUrl: base64String });
            };
            reader.readAsDataURL(file);
        } else {
            addToast('Vui lòng chọn một file hình ảnh.', 'error');
        }
    };

    const handleSaveSettings = () => {
        onUpdateCompanySettings(localSettings);
    };

    const handleOpenAddWarehouse = () => {
        setWarehouseToEdit(null);
        setWarehouseModalOpen(true);
    };

    const handleOpenEditWarehouse = (warehouse: Warehouse) => {
        setWarehouseToEdit(warehouse);
        setWarehouseModalOpen(true);
    };

    const handleSaveWarehouse = (warehouseData: { name: string }) => {
        let updatedWarehouses;
        if (warehouseToEdit) { // Editing
            updatedWarehouses = localSettings.warehouses.map(w =>
                w.id === warehouseToEdit.id ? { ...w, name: warehouseData.name } : w
            );
        } else { // Adding
            const newWarehouse: Warehouse = {
                id: warehouseData.name.toLowerCase().replace(/\s+/g, '_') + `_${Date.now()}`,
                name: warehouseData.name,
            };
            if (localSettings.warehouses.some(w => w.name.toLowerCase() === newWarehouse.name.toLowerCase())) {
                addToast(`Tên kho "${newWarehouse.name}" đã tồn tại.`, 'error');
                return;
            }
            updatedWarehouses = [...localSettings.warehouses, newWarehouse];
        }
        setLocalSettings(prev => ({ ...prev, warehouses: updatedWarehouses }));
        setWarehouseModalOpen(false);
    };

    const handleDeleteWarehouse = async (warehouseId: string) => {
        const isConfirmed = await confirm({
            title: 'Xác nhận xóa kho',
            message: 'Bạn có chắc chắn muốn xóa kho này? Hành động này có thể ảnh hưởng đến dữ liệu tồn kho, đơn hàng và các giao dịch liên quan.',
            variant: 'danger',
            confirmText: 'Xóa Kho',
        });
        if (isConfirmed) {
            setLocalSettings(prev => ({
                ...prev,
                warehouses: prev.warehouses.filter(w => w.id !== warehouseId),
            }));
        }
    };
    
    // --- Data Management Functions ---

    const exportData = (data: any[], filename: string) => {
        if (!data || data.length === 0) {
            addToast('Không có dữ liệu để xuất.', 'info');
            return;
        }
        const csv = Papa.unparse(data);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const downloadTemplate = (type: 'product' | 'customer') => {
        let headers: string;
        let filename: string;

        if (type === 'product') {
            headers = 'id,name,sku,minStock,price,cost,supplierId,productType';
            filename = 'product_template.csv';
        } else {
            headers = 'id,name,email,phone,address,type,since';
            filename = 'customer_template.csv';
        }

        const blob = new Blob([`\uFEFF${headers}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'customer') => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isConfirmed = await confirm({
            title: `Xác nhận Nhập Dữ liệu`,
            message: `Hành động này sẽ CẬP NHẬT ${type === 'product' ? 'sản phẩm' : 'khách hàng'} hiện có nếu trùng ${type === 'product' ? 'SKU' : 'ID'} và THÊM MỚI những mục chưa có. Dữ liệu không có trong file sẽ được giữ nguyên. Bạn có chắc chắn muốn tiếp tục?`,
            variant: 'info',
            confirmText: 'Xác nhận và Nhập',
        });
        
        if (isConfirmed) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        let successCount = 0;
                        let errorCount = 0;
                        for (const row of (results.data as any[])) {
                           if (type === 'product') {
                                const productData = {
                                    id: row.id || undefined,
                                    name: row.name,
                                    sku: row.sku,
                                    price: parseFloat(row.price) || 0,
                                    cost: parseFloat(row.cost) || 0,
                                    minStock: parseInt(row.minStock, 10) || 0,
                                    supplierId: row.supplierId,
                                    productType: Object.values(ProductType).includes(row.productType) ? row.productType : ProductType.Standard,
                                } as Product;
                                if (productData.name && productData.sku) {
                                    const result = await onSaveProduct(productData);
                                    if(result.success) successCount++; else errorCount++;
                                }
                            } else {
                                const customerData = {
                                    id: row.id,
                                    name: row.name,
                                    email: row.email,
                                    phone: row.phone,
                                    address: row.address,
                                    type: row.type === 'B2B' ? 'B2B' : 'B2C',
                                    since: row.since || new Date().toISOString().split('T')[0],
                                } as Customer;
                                if (customerData.id && customerData.name) {
                                    const result = await onSaveCustomer(customerData);
                                    if(result.success) successCount++; else errorCount++;
                                }
                            }
                        }
                        addToast(`Nhập hoàn tất! ${successCount} mục thành công, ${errorCount} mục thất bại.`, errorCount > 0 ? 'warning' : 'success');
                        
                    } catch (error) {
                        console.error("Error processing imported file:", error);
                        addToast("Có lỗi xảy ra khi xử lý file. Vui lòng kiểm tra định dạng file.", "error");
                    }
                }
            });
        }
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const handlePermissionChange = (role: UserRole, permission: Permission, checked: boolean) => {
        const currentPermissions = permissions[role] || [];
        let newPermissions;
        if (checked) {
            newPermissions = [...new Set([...currentPermissions, permission])];
        } else {
            newPermissions = currentPermissions.filter(p => p !== permission);
        }
        onUpdatePermissions({ ...permissions, [role]: newPermissions });
    };

    const handleStartReset = async () => {
        const isConfirmed = await confirm({
            title: 'Bạn có chắc chắn?',
            message: 'Hành động này sẽ XÓA VĨNH VIỄN tất cả dữ liệu (sản phẩm, đơn hàng, khách hàng, v.v.) và khôi phục hệ thống về trạng thái ban đầu. Hành động này không thể hoàn tác.',
            variant: 'danger',
            confirmText: 'Tôi hiểu, tiếp tục'
        });
        if (isConfirmed) {
            setResetStep(1);
        }
    };

    const handleFinalReset = () => {
        if (resetConfirmationText === RESET_CONFIRM_PHRASE) {
            onResetAllData();
        } else {
            addToast('Chuỗi xác nhận không chính xác. Thao tác đã bị hủy.', 'error');
        }
        setResetStep(0);
        setResetConfirmationText('');
    };

    return (
        <>
            <div className="space-y-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="border-b border-slate-200 dark:border-slate-700">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('system')} className={`${activeTab === 'system' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Hệ thống & Kho
                            </button>
                             {hasPermission('EDIT_COMPANY_SETTINGS') && (
                                <button onClick={() => setActiveTab('accounting')} className={`${activeTab === 'accounting' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                    Kế toán
                                </button>
                            )}
                            <button onClick={() => setActiveTab('data')} className={`${activeTab === 'data' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Quản lý Dữ liệu
                            </button>
                            {hasPermission('MANAGE_PERMISSIONS') && (
                                <button onClick={() => setActiveTab('permissions')} className={`${activeTab === 'permissions' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                    Phân quyền
                                </button>
                            )}
                        </nav>
                    </div>
                    <div className="mt-6">
                        {activeTab === 'system' && hasPermission('EDIT_COMPANY_SETTINGS') && (
                            <div className="space-y-10">
                                {/* Company Info Section */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Thông tin Công ty</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-1">
                                            <label htmlFor="logo-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo Công ty</label>
                                            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-900/25 dark:border-slate-100/25 px-6 py-10">
                                                <div className="text-center">
                                                    {logoPreview ? (
                                                        <img src={logoPreview} alt="Logo Preview" className="mx-auto h-24 w-auto object-contain" />
                                                    ) : (
                                                         <svg className="mx-auto h-12 w-12 text-slate-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" /></svg>
                                                    )}
                                                    <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400">
                                                        <label htmlFor="logo-upload" className="relative cursor-pointer rounded-md bg-white dark:bg-slate-800 font-semibold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-500">
                                                            <span>Tải lên một file</span>
                                                            <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} />
                                                        </label>
                                                        <p className="pl-1">hoặc kéo thả</p>
                                                    </div>
                                                    <p className="text-xs leading-5 text-slate-600 dark:text-slate-500">PNG, JPG, SVG tối đa 2MB</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             <div><label htmlFor="name" className="block text-sm font-medium">Tên Công ty</label><input type="text" name="name" id="name" value={localSettings.name} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm"/></div>
                                             <div><label htmlFor="phone" className="block text-sm font-medium">Số điện thoại</label><input type="text" name="phone" id="phone" value={localSettings.phone} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm"/></div>
                                             <div className="sm:col-span-2"><label htmlFor="email" className="block text-sm font-medium">Email</label><input id="email" name="email" type="email" value={localSettings.email} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm"/></div>
                                             <div className="sm:col-span-2"><label htmlFor="address" className="block text-sm font-medium">Địa chỉ</label><input type="text" name="address" id="address" value={localSettings.address} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm"/></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Document Customization Section */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Tùy chỉnh Chứng từ</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="quotationTitle" className="block text-sm font-medium">Tiêu đề Báo giá</label>
                                            <input type="text" name="quotationTitle" id="quotationTitle" value={localSettings.quotationTitle} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm"/>
                                        </div>
                                        <div>
                                            <label htmlFor="invoiceFooter" className="block text-sm font-medium">Chân trang Hóa đơn</label>
                                            <input type="text" name="invoiceFooter" id="invoiceFooter" value={localSettings.invoiceFooter} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm"/>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label htmlFor="bankDetails" className="block text-sm font-medium">Thông tin Ngân hàng</label>
                                            <textarea name="bankDetails" id="bankDetails" rows={3} value={localSettings.bankDetails} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm"/>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label htmlFor="quotationTerms" className="block text-sm font-medium">Điều khoản & Điều kiện (trên Báo giá)</label>
                                            <textarea name="quotationTerms" id="quotationTerms" rows={4} value={localSettings.quotationTerms} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm"/>
                                            <p className="mt-2 text-xs text-slate-500">Mỗi dòng là một điều khoản.</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Warehouse Management Section */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Quản lý Kho hàng</h3>
                                    <ul role="list" className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {localSettings.warehouses.map(warehouse => (
                                            <li key={warehouse.id} className="py-3 flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{warehouse.name}</span>
                                                <div className="space-x-2">
                                                    <button onClick={() => handleOpenEditWarehouse(warehouse)} className="text-sm text-blue-600 hover:underline">Sửa</button>
                                                    <button onClick={() => handleDeleteWarehouse(warehouse.id)} className="text-sm text-red-600 hover:underline">Xóa</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={handleOpenAddWarehouse} className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-800">+ Thêm kho mới</button>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleSaveSettings} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 shadow">Lưu Cài đặt</button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'accounting' && hasPermission('EDIT_COMPANY_SETTINGS') && (
                            <AccountingSettingsView 
                                accountingPeriods={accountingPeriods}
                                taxRates={taxRates}
                                chartOfAccounts={chartOfAccounts}
                                onUpdateAccountingPeriods={onUpdateAccountingPeriods}
                                onUpdateTaxRates={onUpdateTaxRates}
                                onUpdateChartOfAccounts={onUpdateChartOfAccounts}
                            />
                        )}
                        {activeTab === 'data' && hasPermission('MANAGE_DATA') && (
                             <div className="space-y-8">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700">
                                    <h3 className="text-lg font-semibold mb-4">Nhập/Xuất Dữ liệu</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 border rounded-lg">
                                            <h4 className="font-semibold mb-2">Sản phẩm</h4>
                                            <p className="text-sm text-slate-500 mb-3">Xuất danh sách sản phẩm hiện tại hoặc nhập từ file CSV.</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button onClick={() => exportData(products, 'products.csv')} className="px-3 py-1.5 text-sm border rounded-md">Xuất</button>
                                                <button onClick={() => productFileInputRef.current?.click()} className="px-3 py-1.5 text-sm border rounded-md">Nhập</button>
                                                <input type="file" ref={productFileInputRef} className="hidden" accept=".csv" onChange={(e) => handleFileImport(e, 'product')} />
                                                <button onClick={() => downloadTemplate('product')} className="px-3 py-1.5 text-sm border rounded-md">Tải file mẫu</button>
                                            </div>
                                        </div>
                                         <div className="p-4 border rounded-lg">
                                            <h4 className="font-semibold mb-2">Khách hàng</h4>
                                            <p className="text-sm text-slate-500 mb-3">Xuất danh sách khách hàng hiện tại hoặc nhập từ file CSV.</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button onClick={() => exportData(customers, 'customers.csv')} className="px-3 py-1.5 text-sm border rounded-md">Xuất</button>
                                                <button onClick={() => customerFileInputRef.current?.click()} className="px-3 py-1.5 text-sm border rounded-md">Nhập</button>
                                                <input type="file" ref={customerFileInputRef} className="hidden" accept=".csv" onChange={(e) => handleFileImport(e, 'customer')} />
                                                <button onClick={() => downloadTemplate('customer')} className="px-3 py-1.5 text-sm border rounded-md">Tải file mẫu</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-500/50">
                                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Khu vực nguy hiểm</h3>
                                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">Hành động này không thể hoàn tác. Hãy chắc chắn bạn biết mình đang làm gì.</p>
                                    
                                    {resetStep === 0 ? (
                                        <button onClick={handleStartReset} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 shadow">Reset Toàn bộ Dữ liệu</button>
                                    ) : (
                                        <div className="max-w-md">
                                            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Để xác nhận, vui lòng gõ chính xác cụm từ sau vào ô bên dưới: <strong className="font-mono">{RESET_CONFIRM_PHRASE}</strong></p>
                                            <input 
                                                type="text"
                                                value={resetConfirmationText}
                                                onChange={(e) => setResetConfirmationText(e.target.value)}
                                                className="w-full px-3 py-2 border border-red-300 rounded-lg font-mono"
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={handleFinalReset} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Xác nhận Reset</button>
                                                <button onClick={() => setResetStep(0)} className="px-4 py-2 bg-slate-200 rounded-lg">Hủy</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'permissions' && hasPermission('MANAGE_PERMISSIONS') && (
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <label className="font-semibold">Vai trò:</label>
                                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                                        {ROLES_TO_MANAGE.map(role => (
                                            <button 
                                                key={role} 
                                                onClick={() => setSelectedRole(role)}
                                                className={`px-3 py-1.5 text-sm rounded-md ${selectedRole === role ? 'bg-white shadow' : 'hover:bg-slate-200'}`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {PERMISSION_GROUPS.map(group => (
                                        <div key={group.groupName} className="p-4 border rounded-lg">
                                            <h4 className="font-semibold text-lg mb-2">{group.groupName}</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {group.permissions.map(perm => (
                                                    <label key={perm.key} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-slate-50 rounded">
                                                        <input 
                                                            type="checkbox"
                                                            checked={permissions[selectedRole]?.includes(perm.key)}
                                                            onChange={(e) => handlePermissionChange(selectedRole, perm.key, e.target.checked)}
                                                            className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                                                        />
                                                        <span className="text-sm">{perm.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isWarehouseModalOpen && <AddEditWarehouseModal isOpen={isWarehouseModalOpen} onClose={() => setWarehouseModalOpen(false)} onSave={handleSaveWarehouse} warehouseToEdit={warehouseToEdit} />}
        </>
    );
};

export default SettingsView;