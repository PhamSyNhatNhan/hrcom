import React from 'react';
import { User, Lock } from 'lucide-react';
import { TabType } from '@/app/user/page';

export const TabsNavigation = ({
  activeTab,
  setActiveTab
}: {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}) => (
  <div className="border-b border-gray-200 bg-gray-50/50">
    <nav className="flex space-x-0 px-6">
      <button
        onClick={() => setActiveTab('personal')}
        className={`relative flex items-center px-6 py-4 text-sm font-medium transition-all duration-300 ${
          activeTab === 'personal'
            ? 'border-b-2 border-cyan-600 bg-white text-cyan-600'
            : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
        }`}
      >
        <User className="mr-2 h-4 w-4" />
        Thông tin cá nhân
      </button>

      <button
        onClick={() => setActiveTab('password')}
        className={`relative flex items-center px-6 py-4 text-sm font-medium transition-all duration-300 ${
          activeTab === 'password'
            ? 'border-b-2 border-cyan-600 bg-white text-cyan-600'
            : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
        }`}
      >
        <Lock className="mr-2 h-4 w-4" />
        Đổi mật khẩu
      </button>
    </nav>
  </div>
);
