
import React, { useState } from 'react';

interface RegisterViewProps {
  onRegister: () => void;
  onNavigateToLogin: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegister, onNavigateToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Mật khẩu và xác nhận mật khẩu không khớp!");
      return;
    }
    // In a real app, you would have API call here for registration
    console.log('Registering with:', { username, email, password });
    onRegister();
  };

  return (
    <div className="min-h-screen w-full font-sans bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-10">
           <h2 className="text-3xl font-bold text-blue-600">Tạo tài khoản</h2>
           <p className="text-xs text-gray-400 tracking-widest mt-1">MAKE F&B BUSINESS BETTER</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài khoản</label>
            <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
             />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
             />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
               <input
                 type="password"
                 required
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                />
          </div>
            <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
               <input
                 type="password"
                 required
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{ backgroundColor: '#1b75bc' }}
          >
            Đăng ký
          </button>

          <div className="text-center pt-4 text-sm">
             <p className="text-gray-600">
                Đã có tài khoản?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }} className="font-semibold text-blue-600 hover:underline" style={{ color: '#1b75bc'}}>
                    Đăng nhập ngay
                </a>
             </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterView;
