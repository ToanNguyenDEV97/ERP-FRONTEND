import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onForgotPassword: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onForgotPassword }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError('');
    setIsLoading(true);
    const success = await onLogin(username, password);
    if (!success) {
      setTimeout(() => {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
        setIsLoading(false);
      }, 500);
    }
    // On success, the App component will take over, no need to setIsLoading(false)
  };
  
  return (
    <div className="min-h-screen font-sans bg-slate-100 dark:bg-slate-900">
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left Pane - Branding */}
        <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
            {/* Abstract Shapes */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-primary-500 rounded-full mix-blend-lighten filter blur-3xl"></div>
                <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-primary-700 rounded-full mix-blend-lighten filter blur-3xl"></div>
            </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
               <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
               </svg>
               <span className="text-xl font-bold">ERP System</span>
            </div>
            <h1 className="text-4xl font-bold mt-16 leading-tight">Quản lý toàn diện.</h1>
            <h1 className="text-4xl font-bold text-primary-400 leading-tight">Vận hành hiệu quả.</h1>
            <p className="text-slate-400 mt-4 max-w-sm">Nền tảng hợp nhất để tối ưu hóa mọi hoạt động kinh doanh của bạn, từ bán hàng, kho vận đến kế toán.</p>
          </div>
          <div className="text-sm text-slate-500 relative z-10">
            © {new Date().getFullYear()} ERP System. All rights reserved.
          </div>
        </div>

        {/* Right Pane - Form */}
        <div className="w-full md:w-1/2 lg:w-3/5 bg-white dark:bg-slate-800 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Đăng nhập</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">Chào mừng trở lại! Vui lòng nhập thông tin của bạn.</p>
            
            {error && <div className="bg-red-100 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-500/50 dark:text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Tên đăng nhập</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </span>
                        <input
                            type="text"
                            required
                            autoComplete="username"
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nhập tên đăng nhập"
                         />
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mật khẩu</label>
                     <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </span>
                       <input
                         type="password"
                         required
                         autoComplete="current-password"
                         className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         placeholder="Nhập mật khẩu"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-300 text-primary-600 shadow-sm focus:ring-primary-500"/>
                        Ghi nhớ đăng nhập
                    </label>
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="font-medium text-primary-600 hover:text-primary-500"
                    >
                        Quên mật khẩu?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 flex items-center justify-center"
                >
                    {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>}
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;