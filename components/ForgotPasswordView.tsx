import React, { useState } from 'react';

interface ForgotPasswordViewProps {
  onRequestReset: (email: string) => Promise<void>;
  onBackToLogin: () => void;
}

const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onRequestReset, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setMessage('');
    setIsLoading(true);
    await onRequestReset(email);
    setIsLoading(false);
    setMessage('Nếu tài khoản của bạn tồn tại, một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.');
    setEmail('');
  };

  return (
    <div className="min-h-screen font-sans bg-slate-100 dark:bg-slate-900">
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left Pane */}
        <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
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
            <h1 className="text-4xl font-bold mt-16 leading-tight">Quên mật khẩu?</h1>
            <p className="text-slate-400 mt-4 max-w-sm">Đừng lo lắng. Chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào tài khoản của mình.</p>
          </div>
          <div className="text-sm text-slate-500 relative z-10">
            © {new Date().getFullYear()} ERP System. All rights reserved.
          </div>
        </div>

        {/* Right Pane */}
        <div className="w-full md:w-1/2 lg:w-3/5 bg-white dark:bg-slate-800 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <button onClick={onBackToLogin} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại Đăng nhập
            </button>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Đặt lại mật khẩu</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">Nhập email đã đăng ký của bạn để nhận hướng dẫn đặt lại mật khẩu.</p>
            
            {message && <div className="bg-green-100 border border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-500/50 dark:text-green-300 px-4 py-3 rounded-lg relative mb-6" role="alert">{message}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                        </span>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn"
                         />
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 flex items-center justify-center"
                >
                    {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>}
                    {isLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
                </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordView;