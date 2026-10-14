import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Play, 
  Square, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Course, ClassSession, AttendanceRecord, CourseStudent } from '../types';
import { generateDynamicQrPayload, getSecondsRemainingInRotation } from '../utils/security';
import { playSuccessChime } from '../utils/notifications';

interface TeacherDynamicQrProps {
  course: Course;
  activeSession: ClassSession | null;
  attendanceList: AttendanceRecord[];
  students: CourseStudent[];
  onStartSession: (sessionNumber: number, title: string) => Promise<void>;
  onEndSession: (sessionId: string) => Promise<void>;
  existingSessionsCount: number;
}

export const TeacherDynamicQr: React.FC<TeacherDynamicQrProps> = ({
  course,
  activeSession,
  attendanceList,
  students,
  onStartSession,
  onEndSession,
  existingSessionsCount,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20);
  const [qrString, setQrString] = useState<string>('');
  const [tokenPreview, setTokenPreview] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [newSessionTitle, setNewSessionTitle] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const prevAttendanceCountRef = useRef<number>(attendanceList.length);

  // Play sound chime when a new student checks in
  useEffect(() => {
    if (soundEnabled && attendanceList.length > prevAttendanceCountRef.current) {
      playSuccessChime();
    }
    prevAttendanceCountRef.current = attendanceList.length;
  }, [attendanceList.length, soundEnabled]);

  // Dynamic QR Code 20-second timer and token regeneration
  useEffect(() => {
    if (!activeSession || !activeSession.isActive) return;

    const updateQr = () => {
      const remaining = getSecondsRemainingInRotation();
      setSecondsRemaining(remaining);

      const { payloadString, payload } = generateDynamicQrPayload(
        course.id,
        activeSession.id,
        activeSession.sessionNumber
      );
      setQrString(payloadString);
      setTokenPreview(payload.token);
    };

    updateQr();
    const interval = setInterval(updateQr, 1000);

    return () => clearInterval(interval);
  }, [activeSession, course.id]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const sessionNum = existingSessionsCount + 1;
      const title = newSessionTitle.trim() || `การบรรยายครั้งที่ ${sessionNum}`;
      await onStartSession(sessionNum, title);
      setNewSessionTitle('');
    } finally {
      setIsStarting(false);
    }
  };

  const attendancePercentage = students.length > 0
    ? Math.round((attendanceList.length / students.length) * 100)
    : 0;

  return (
    <div ref={containerRef} className={`space-y-6 ${isFullscreen ? 'bg-slate-900 p-8 min-h-screen flex flex-col justify-center overflow-y-auto' : ''}`}>
      
      {/* Session Active State */}
      {activeSession && activeSession.isActive ? (
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Main QR Projector Card */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xs">
            
            {/* Top Bar inside Projector */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    กำลังเปิดรับการเช็คชื่อ
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  ครั้งที่ {activeSession.sessionNumber}: {activeSession.title}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
                </button>

                <button
                  onClick={toggleFullscreen}
                  title="โหมดเต็มจอสำหรับโปรเจกเตอร์"
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4 text-indigo-600" />}
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="my-2 p-5 sm:p-6 bg-white rounded-2xl shadow-sm border-4 border-indigo-100 flex flex-col items-center justify-center relative">
              {qrString ? (
                <QRCodeSVG
                  value={qrString}
                  size={isFullscreen ? 320 : 250}
                  level="H"
                  includeMargin={false}
                />
              ) : (
                <div className="h-60 w-60 flex items-center justify-center text-slate-400 text-xs">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              )}

              {/* Dynamic Security Watermark */}
              <div className="mt-3 flex items-center space-x-2 text-[11px] font-mono text-slate-700 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span>SEC-HASH: {tokenPreview || '------'}</span>
              </div>
            </div>

            {/* 20-Second Dynamic Rotation Indicator */}
            <div className="w-full max-w-md mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center space-x-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  <span>หมุนเวียนรหัสใหม่ใน:</span>
                </span>
                <span className="font-mono font-bold text-indigo-600 text-sm">
                  {secondsRemaining} วินาที
                </span>
              </div>

              {/* Progress Bar for 20s cycle */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(secondsRemaining / 20) * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * ภาพถ่าย QR Code จะไม่สามารถส่งต่อหรือใช้งานได้หากเกิน 20 วินาที
              </p>
            </div>

            {/* End Session Button */}
            <div className="w-full pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                รายวิชา: <b className="text-slate-800">{course.courseCode} ({course.section})</b>
              </span>
              <button
                onClick={() => {
                  if (confirm('คุณต้องการปิดการเช็คชื่อสำหรับคาบเรียนนี้ใช่หรือไม่?')) {
                    onEndSession(activeSession.id);
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Square className="h-3.5 w-3.5 text-rose-600" />
                <span>ปิดรับการเช็คชื่อ (End Session)</span>
              </button>
            </div>

          </div>

          {/* Right Live Ticker & Attendees Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
            
            <div>
              {/* Header Stats */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <div className="text-xs text-slate-500">จำนวนผู้เข้าเรียนแบบเรียลไทม์</div>
                  <div className="text-2xl font-black text-slate-900 flex items-baseline space-x-2">
                    <span className="text-emerald-600">{attendanceList.length}</span>
                    <span className="text-sm font-normal text-slate-500">/ {students.length} คน</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ml-2">
                      {attendancePercentage}%
                    </span>
                  </div>
                </div>

                <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600 border border-slate-100">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              {/* Real-time Ticker List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>รายชื่อที่เช็คชื่อสำเร็จล่าสุด</span>
                  <span className="text-[10px] text-slate-400 font-normal">อัปเดตอัตโนมัติ</span>
                </div>

                <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                  {attendanceList.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-slate-400 animate-pulse" />
                      กำลังรอให้นักศึกษาสแกน QR Code...
                    </div>
                  ) : (
                    attendanceList.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs animate-fadeIn hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold border border-emerald-200">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{att.studentName}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              รหัส: {att.studentId}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>{att.status === 'present' ? 'มาเรียน' : att.status}</span>
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(att.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Quick Helper */}
            <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>วิธีบันทึก: <b>สแกนผ่านกล้องมือถือ</b></span>
              <span className="text-indigo-600 flex items-center space-x-1 font-medium">
                <Sparkles className="h-3 w-3" />
                <span>Sync Firestore Spark</span>
              </span>
            </div>

          </div>

        </div>
      ) : (
        /* Session Start Banner */
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-5">
            <Play className="h-8 w-8 ml-0.5" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            พร้อมเริ่มเช็คชื่อคาบเรียนใหม่
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            เปิดห้องเช็คชื่อสำหรับ <b>{course.courseCode} ({course.courseName})</b> ระบบจะสร้าง Dynamic QR Code หมุนเวียนรหัสความปลอดภัยทุก 20 วินาทีโดยอัตโนมัติ
          </p>

          <div className="max-w-md mx-auto space-y-4 mb-6 text-left">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                หัวข้อการบรรยาย / ครั้งที่ {existingSessionsCount + 1}
              </label>
              <input
                type="text"
                placeholder={`เช่น บทที่ ${existingSessionsCount + 1}: การออกแบบ Web Architecture`}
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={isStarting}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isStarting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>เริ่มเปิดห้องเช็คชื่อ (ครั้งที่ {existingSessionsCount + 1})</span>
          </button>
        </div>
      )}

    </div>
  );
};
