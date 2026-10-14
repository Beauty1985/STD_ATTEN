import React from 'react';
import { 
  GraduationCap, 
  LogOut, 
  FileSpreadsheet, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenGasModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenGasModal }) => {
  const { user, isDemoMode, logout, loginAsDemo } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              BU
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                  Check-In System
                </span>
                <span className="text-xs font-normal text-slate-500 ml-1 hidden sm:inline">
                  v2.4.0
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                  Dynamic QR
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                ระบบบริหารจัดการการเข้าเรียน • มหาวิทยาลัยกรุงเทพ
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Google Apps Script Guide / Free Spark Plan helper */}
            <button
              onClick={onOpenGasModal}
              title="คู่มือเชื่อมต่อ Google Sheets & Google Apps Script (ฟรี ไม่ต้องใช้ Cloud Run)"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden md:inline">Google Sheets / GAS</span>
              <span className="md:hidden">GAS</span>
            </button>

            {/* Role Demo Switcher pill (quick role toggle for testing in preview) */}
            {user && (
              <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 px-2 text-[11px] font-medium">สลับมุมมอง:</span>
                <button
                  onClick={() => loginAsDemo('teacher', 'walailuk.p@bu.ac.th', 'ผศ.ดร. วไลลักษณ์ ภิญโญชีพ')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium text-xs ${
                    user.role === 'teacher'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="h-3 w-3 inline mr-1" />
                  อาจารย์
                </button>
                <button
                  onClick={() => loginAsDemo('student', 'somchai.jai@bumail.net', 'นายสมชาย ใจดี', '1640700012')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium text-xs ${
                    user.role === 'student'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="h-3 w-3 inline mr-1" />
                  นักศึกษา
                </button>
              </div>
            )}

            {/* User Profile info */}
            {user ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-[160px]">
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-end space-x-1">
                    {user.role === 'teacher' ? (
                      <span className="text-indigo-600 font-medium">Faculty / Teacher</span>
                    ) : (
                      <span className="text-slate-500 font-medium">ID: {user.studentId || 'Student'}</span>
                    )}
                    {isDemoMode && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 py-0.2 rounded border border-amber-200">
                        Demo
                      </span>
                    )}
                  </div>
                </div>

                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-xs object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-white shadow-xs flex items-center justify-center text-xs font-bold text-indigo-700">
                    {user.displayName.charAt(0)}
                  </div>
                )}

                <button
                  onClick={logout}
                  title="ออกจากระบบ"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}

          </div>

        </div>
      </div>
    </header>
  );
};

