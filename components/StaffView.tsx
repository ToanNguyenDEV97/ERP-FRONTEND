import React, { useState, useMemo } from 'react';
import { User, UserRole, Permission } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import EmptyState from './EmptyState';
import { useSortableData, SortConfig } from '../hooks/useSortableData';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

interface StaffViewProps {
    users: User[];
    currentUser: User;
    hasPermission: (permission: Permission) => boolean;
    onSaveUser: (user: Omit<User, 'id'> | User) => Promise<any>;
    onDeleteUser: (userId: string) => Promise<any>;
}

const AddEditUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id'> | User) => void;
    userToEdit?: User | null;
}> = ({ isOpen, onClose, onSave, userToEdit }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        role: UserRole.Sales,
        avatar: `https://i.pravatar.cc/100?u=${Date.now()}`
    });

    React.useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name,
                username: userToEdit.username,
                password: '', // Don't prefill password for security
                role: userToEdit.role,
                avatar: userToEdit.avatar,
            });
        } else {
            setFormData({
                name: '',
                username: '',
                password: '',
                role: UserRole.Sales,
                avatar: `https://i.pravatar.cc/100?u=${Date.now()}`
            });
        }
    }, [userToEdit, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.username || (!userToEdit && !formData.password)) {
            addToast("Vui lòng điền đầy đủ các trường bắt buộc.", "error");
            return;
        }
        
        const dataToSave: any = { ...formData };
        if (!dataToSave.password) {
            delete dataToSave.password; // Don't send empty password
        }

        onSave(userToEdit ? { ...userToEdit, ...dataToSave } : dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
                    <h3 className="text-xl font-semibold">{userToEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 text-3xl">&times;</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Họ và tên*</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tên đăng nhập*</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full px-3 py-2 border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mật khẩu{userToEdit ? ' (để trống nếu không đổi)' : '*'}</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required={!userToEdit} className="w-full px-3 py-2 border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Vai trò*</label>
                        <select name="role" value={formData.role} onChange={handleChange} required className="w-full px-3 py-2 border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg">
                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">URL Avatar</label>
                        <input type="text" name="avatar" value={formData.avatar} onChange={handleChange} className="w-full px-3 py-2 border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg" />
                    </div>
                </div>
                <div className="flex justify-end p-5 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 rounded-lg">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Lưu</button>
                </div>
            </form>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
    </div>
);


const StaffView: React.FC<StaffViewProps> = ({ users, currentUser, hasPermission, onSaveUser, onDeleteUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'All' | UserRole>('All');
    const { addToast } = useToast();
    const confirm = useConfirm();
    const { items: sortedUsers } = useSortableData(users, { key: 'name', direction: 'ascending' });
    
    const canManageStaff = hasPermission('MANAGE_STAFF');

    const stats = useMemo(() => {
        const roleCounts = Object.values(UserRole).reduce((acc, role) => {
            acc[role] = users.filter(user => user.role === role).length;
            return acc;
        }, {} as Record<UserRole, number>);
        
        return {
            total: users.length,
            ...roleCounts
        };
    }, [users]);

    const animatedTotal = useAnimatedCounter(stats.total);

    const filteredUsers = useMemo(() => {
        return sortedUsers.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.username.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === 'All' || user.role === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [sortedUsers, searchTerm, filterRole]);

    const handleOpenAddModal = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (userId: string) => {
        if (userId === currentUser.id) {
            addToast("Bạn không thể xóa chính mình.", "error");
            return;
        }
        const isConfirmed = await confirm({
            title: "Xác nhận xóa nhân viên",
            message: "Bạn có chắc chắn muốn xóa nhân viên này? Thao tác này không thể hoàn tác.",
            variant: "danger",
            confirmText: "Xóa"
        });
        if (isConfirmed) {
            await onDeleteUser(userId);
        }
    };

     const handleSaveUser = async (userData: Omit<User, 'id'> | User) => {
        const result = await onSaveUser(userData);
        if (result.success) {
            setIsModalOpen(false);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <StatCard title="Tổng số nhân viên" value={String(animatedTotal)} />
                    {Object.values(UserRole).map(role => (
                        stats[role] > 0 && <StatCard key={role} title={role} value={String(stats[role])} />
                    ))}
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                        <div className="w-full md:w-1/3 relative">
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc username..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                             <select
                                value={filterRole}
                                onChange={e => setFilterRole(e.target.value as any)}
                                className="w-full md:w-auto px-3 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700"
                            >
                                <option value="All">Tất cả vai trò</option>
                                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                            {canManageStaff && (
                                <button onClick={handleOpenAddModal} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 w-full md:w-auto">
                                    + Thêm nhân viên
                                </button>
                            )}
                        </div>
                    </div>

                    {filteredUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {filteredUsers.map(user => (
                                <div key={user.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-sm p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:scale-105 border border-slate-200 dark:border-slate-700">
                                    <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full mb-4 ring-4 ring-white dark:ring-slate-700 object-cover" />
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{user.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
                                    <span className="mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
                                        {user.role}
                                    </span>
                                    {canManageStaff && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 w-full flex justify-center gap-2">
                                            <button onClick={() => handleOpenEditModal(user)} className="px-3 py-1 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600">Sửa</button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)} 
                                                disabled={user.id === currentUser.id} 
                                                className="px-3 py-1 text-sm bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-500/50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M10 2a2 2 0 00-2 2v1m10 0V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v1M4 9a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2v-9a2 2 0 00-2-2H4z" /></svg>}
                            title="Không tìm thấy nhân viên"
                            message="Không có nhân viên nào khớp với bộ lọc của bạn."
                        />
                    )}
                </div>
            </div>
            {canManageStaff && (
                <AddEditUserModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUser}
                    userToEdit={userToEdit}
                />
            )}
        </>
    );
};

export default StaffView;