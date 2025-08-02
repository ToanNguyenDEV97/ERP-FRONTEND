import React from 'react';
import { NavView, NavItemType, User } from '../types';

type Theme = 'light' | 'dark' | 'system';

interface SidebarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  onLogout: () => void;
  navItems: NavItemType[];
  currentUser: User;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeIcon: React.FC<{ theme: 'light' | 'dark' | 'system', className?: string }> = ({ theme, className="h-5 w-5" }) => {
    if (theme === 'light') return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 12a5 5 0 100-10 5 5 0 000 10z" /></svg>;
    if (theme === 'dark') return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
};


const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onLogout, navItems, currentUser, theme, setTheme }) => {
  return (
    <div className="flex flex-col w-64 bg-slate-900 text-slate-300">
      <div className="flex items-center justify-center h-20 border-b border-slate-800 flex-shrink-0">
        <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <span className="ml-3 text-xl font-bold text-white">ERP System</span>
      </div>
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-4 py-4">
          {navItems.map((item) => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.id);
              }}
              className={`flex items-center px-3 py-2.5 mt-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeView === item.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </a>
          ))}
        </nav>
        
        <div className="px-4 py-2 mt-auto">
            <div className="p-2 mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Giao diện</p>
                <div className="flex items-center justify-around bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setTheme('light')} className={`p-2 rounded-md transition-colors ${theme === 'light' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} aria-label="Light mode">
                        <ThemeIcon theme="light" />
                    </button>
                    <button onClick={() => setTheme('dark')} className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} aria-label="Dark mode">
                        <ThemeIcon theme="dark" />
                    </button>
                    <button onClick={() => setTheme('system')} className={`p-2 rounded-md transition-colors ${theme === 'system' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} aria-label="System mode">
                        <ThemeIcon theme="system" />
                    </button>
                </div>
            </div>
           <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onLogout();
              }}
              className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-200 hover:bg-slate-700 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              <span className="ml-3">Đăng xuất</span>
            </a>
        </div>
      </div>

       <div className="p-4 border-t border-slate-800 flex-shrink-0">
            <div className="flex items-center">
                <img className="h-10 w-10 rounded-full object-cover" src={currentUser.avatar} alt="User avatar" />
                <div className="ml-3">
                    <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                    <p className="text-xs text-slate-400">{currentUser.role}</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Sidebar;
