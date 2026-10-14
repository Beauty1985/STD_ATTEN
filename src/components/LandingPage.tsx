import React, { useState } from 'react';
import { 
  GraduationCap, 
  Smartphone, 
  Clock, 
  FileSpreadsheet, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { loginWithGoogle, loginAsDemo, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);

  const handleGoogleLogin = async (role: 'teacher' | 'student') => {
    setSelectedRole(role);
    setIsSigningIn(true);
    await loginWithGoogle(role);
    setIsSigningIn(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between">
      
      {/* Top Banner / Hero */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 w-full">
        
        {/* BU Brand Badge */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>BU Check-In System • Geometric Balance Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            ระบบบริหารจัดการการเข้าเรียน
            <span className="block text-indigo-600 mt-1">
              Dynamic QR Code & Real-time Scoring
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            เพิ่มประสิทธิภาพการบริหารเวลาเรียน ป้องกันการทุจริตด้วยรหัสหมุนเวียนทุก 20 วินาที 
            พร้อมระบบประมวลผลคะแนนสัดส่วน (Proportional Scoring) แบบเรียลไทม์
          </p>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3 shadow-xs">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">ข้อผิดพลาดในการยืนยันตัวตน</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-xs text-red-700 hover:text-red-900 underline font-medium"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Dual Portal Cards: Teacher vs Student */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* TEACHER PORTAL */}
          <div className="relative group rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between hover:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200">
              เฉพาะ @bu.ac.th
            </div>

            <div>
              <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mb-6 shadow-sm">
                <GraduationCap className="h-6 w-6" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                สำหรับอาจารย์ผู้สอน
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                เข้าสู่ระบบเพื่อจัดการรายวิชา สร้างรหัส Dynamic QR ฉายขึ้นจอโปรเจกเตอร์ 
                นำเข้ารายชื่อนักศึกษาด้วย CSV ภาษาไทย และตรวจสอบสถิติคะแนน
              </p>

              <div className="space-y-2.5 mb-8 text-xs text-slate-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>สร้าง Dynamic QR หมุนเวียนรหัสความปลอดภัยทุก 20 วินาที</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>คำนวณคะแนนตามสัดส่วน (score = (actual/planned) * max)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>แก้ไขสถานะย้อนหลัง (Manual Override) & ส่งออก CSV</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleGoogleLogin('teacher')}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {isSigningIn && selectedRole === 'teacher' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>เข้าสู่ระบบด้วย Google (@bu.ac.th)</span>
              </button>

              <button
                onClick={() => loginAsDemo('teacher', 'walailuk.p@bu.ac.th', 'ผศ.ดร. วไลลักษณ์ ภิญโญชีพ')}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors flex items-center justify-center space-x-1"
              >
                <span>ทดลองใช้งานเป็นอาจารย์ (Demo Mode)</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* STUDENT PORTAL */}
          <div className="relative group rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between hover:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200">
              เฉพาะ @bumail.net
            </div>

            <div>
              <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white mb-6 shadow-sm">
                <Smartphone className="h-6 w-6" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                สำหรับนักศึกษา
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                เปิดกล้องมือถือสแกน Dynamic QR Code บนจอผู้สอนเพื่อยืนยันเวลาเรียนทันที 
                พร้อมรับการแจ้งเตือน Push Notification และตรวจเช็คคะแนนสะสม
              </p>

              <div className="space-y-2.5 mb-8 text-xs text-slate-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>สแกนกล้องมือถือรวดเร็ว บันทึกเวลาเข้าเรียนแบบเรียลไทม์</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>แจ้งเตือนผลสำเร็จทันทีผ่าน Browser Push Notification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>ดูสถิติการเข้าเรียนและคะแนนสะสม Proportional Score</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleGoogleLogin('student')}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-lg shadow-slate-200 disabled:opacity-50"
              >
                {isSigningIn && selectedRole === 'student' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>เข้าสู่ระบบด้วย Google (@bumail.net)</span>
              </button>

              <button
                onClick={() => loginAsDemo('student', 'somchai.jai@bumail.net', 'นายสมชาย ใจดี', '1640700012')}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors flex items-center justify-center space-x-1"
              >
                <span>ทดลองใช้งานเป็นนักศึกษา (Demo Student)</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>

        </div>

        {/* Feature Highlights */}
        <div className="mt-16 pt-10 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <Clock className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-900">Dynamic 20s QR</div>
            <div className="text-xs text-slate-500">เปลี่ยนรหัสทุก 20 วินาที</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <TrendingUp className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-900">Proportional Score</div>
            <div className="text-xs text-slate-500">คำนวณตามสัดส่วนจริง</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <ShieldCheck className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-900">Spark Plan Free Tier</div>
            <div className="text-xs text-slate-500">Firebase Firestore ฟรี 100%</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-900">Google Apps Script</div>
            <div className="text-xs text-slate-500">Sync Google Sheets ฟรี</div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500 mb-2">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Synced to GitHub</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Deployed on Netlify</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Cloud Firestore (Spark)</div>
        </div>
        <p className="text-[11px] text-slate-400">Bangkok University • Dynamic QR Attendance & Scoring System</p>
      </footer>

    </div>
  );
};

