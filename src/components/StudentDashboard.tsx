import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  getDocs
} from 'firebase/firestore';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Award, 
  Clock, 
  Calendar, 
  Sparkles,
  RefreshCw,
  Smartphone,
  Layers,
  ChevronRight
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Course, ClassSession, AttendanceRecord } from '../types';
import { validateDynamicQrCode, calculateProportionalScore } from '../utils/security';
import { 
  requestNotificationPermission, 
  sendAttendancePushNotification, 
  playSuccessChime, 
  triggerSuccessConfetti 
} from '../utils/notifications';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  
  // Scanner States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<{
    sessionNumber: number;
    courseCode: string;
    timestamp: string;
  } | null>(null);
  
  // Fallback Manual Code Input
  const [manualCode, setManualCode] = useState<string>('');
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = 'qr-camera-scanner-view';

  // Request push notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // 1. Fetch available courses
  useEffect(() => {
    const coursesRef = collection(db, 'courses');
    const unsubCourses = onSnapshot(coursesRef, (snapshot) => {
      const loaded: Course[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as Course);
      });
      setCourses(loaded);
      if (loaded.length > 0 && !selectedCourse) {
        setSelectedCourse(loaded[0]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courses');
    });

    return () => unsubCourses();
  }, []);

  // 2. Fetch active session and student's attendance records for selected course
  useEffect(() => {
    if (!selectedCourse || !user) return;
    const courseId = selectedCourse.id;

    // Listen to sessions to check if there is an active session
    const sessionsRef = collection(db, 'courses', courseId, 'sessions');
    const unsubSessions = onSnapshot(sessionsRef, (snapshot) => {
      let active: ClassSession | null = null;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ClassSession;
        if (data.isActive) active = { id: docSnap.id, ...data };
      });
      setActiveSession(active);
    });

    // Listen to student's attendance records
    const attendanceRef = collection(db, 'courses', courseId, 'attendance');
    const unsubAttendance = onSnapshot(attendanceRef, (snapshot) => {
      const records: AttendanceRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as AttendanceRecord;
        if (
          data.studentId === user.studentId || 
          data.studentEmail === user.email || 
          data.studentUid === user.uid
        ) {
          records.push({ id: docSnap.id, ...data });
        }
      });
      records.sort((a, b) => b.sessionNumber - a.sessionNumber);
      setAttendanceHistory(records);
    });

    return () => {
      unsubSessions();
      unsubAttendance();
    };
  }, [selectedCourse?.id, user]);

  // Clean up scanner on unmount or when stopping
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error clearing QR scanner', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleScanCodeSuccess = async (decodedText: string) => {
    if (!selectedCourse || !activeSession || !user) return;

    setScanError(null);

    // Validate 20s rolling dynamic QR token
    const validation = validateDynamicQrCode(decodedText, selectedCourse.id, activeSession.id);
    if (!validation.isValid) {
      setScanError(validation.error || 'รหัส QR ไม่ถูกต้องหรือหมดอายุแล้ว');
      return;
    }

    // Stop scanning once verified
    await stopScanner();

    // Check in the student to Firestore
    try {
      const studentId = user.studentId || user.email.split('@')[0];
      const docId = `${activeSession.id}_${studentId}`;
      const path = `courses/${selectedCourse.id}/attendance/${docId}`;
      const nowTime = new Date().toISOString();

      await setDoc(doc(db, 'courses', selectedCourse.id, 'attendance', docId), {
        courseId: selectedCourse.id,
        sessionId: activeSession.id,
        sessionNumber: activeSession.sessionNumber,
        studentId,
        studentName: user.displayName,
        studentEmail: user.email,
        studentUid: user.uid,
        status: 'present',
        method: 'qr_scan',
        timestamp: nowTime,
        note: 'สแกนผ่าน Dynamic QR สำเร็จ'
      });

      // Sound, Confetti, and Push Notification
      playSuccessChime();
      triggerSuccessConfetti();
      sendAttendancePushNotification(
        'เช็คชื่อเข้าเรียนสำเร็จ! 🎉',
        `วิชา ${selectedCourse.courseCode} ครั้งที่ ${activeSession.sessionNumber} (${user.displayName})`
      );

      setScanSuccess({
        sessionNumber: activeSession.sessionNumber,
        courseCode: selectedCourse.courseCode,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    } catch (err: any) {
      setScanError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลเข้าสู่ฐานข้อมูล');
    }
  };

  const startCameraScanner = async () => {
    setScanError(null);
    setScanSuccess(null);
    setIsScanning(true);

    // Wait a tick for DOM element to render
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(scannerRegionId);
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleScanCodeSuccess(decodedText);
          },
          () => {
            // scan frame failure (ignore)
          }
        );
      } catch (err: any) {
        setIsScanning(false);
        setScanError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้องบนอุปกรณ์ หรือใช้โหมดกรอกรหัสฉุกเฉิน');
      }
    }, 100);
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || !selectedCourse || !activeSession) return;
    setIsSubmittingManual(true);
    await handleScanCodeSuccess(manualCode.trim());
    setIsSubmittingManual(false);
    setManualCode('');
  };

  // Calculate student proportional score for selected course
  const actualAttendanceCount = attendanceHistory.filter((r) => r.status === 'present').length;
  const plannedSessions = selectedCourse?.plannedSessions || 14;
  const maxPoints = selectedCourse?.maxPoints || 10;
  const { score, percentage } = calculateProportionalScore(
    actualAttendanceCount,
    plannedSessions,
    maxPoints
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Student Profile Card */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-xs">
            {user?.displayName?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                {user?.displayName}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200">
                นักศึกษา
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              รหัส: <b className="text-slate-800">{user?.studentId || '1640700012'}</b> • {user?.email}
            </div>
          </div>
        </div>

        {/* Course Dropdown Selector */}
        {courses.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">รายวิชา:</span>
            <select
              value={selectedCourse?.id || ''}
              onChange={(e) => {
                const found = courses.find((c) => c.id === e.target.value);
                if (found) {
                  setSelectedCourse(found);
                  setScanSuccess(null);
                  setScanError(null);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} - {c.courseName} (Sec {c.section})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Selected Course Overview Banner */}
      {selectedCourse && (
        <div className="grid sm:grid-cols-3 gap-4">
          
          {/* Proportional Score Card */}
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-indigo-800 mb-1 font-semibold">
              <span>คะแนนสะสมการเข้าเรียน</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-indigo-900 mt-1">
              {score.toFixed(2)} <span className="text-xs font-normal text-indigo-700">/ {maxPoints} คะแนน</span>
            </div>
            <p className="text-[11px] text-indigo-700/80 mt-1 font-mono">
              สูตร: ({actualAttendanceCount}/{plannedSessions}) × {maxPoints}
            </p>
          </div>

          {/* Actual Attendance Count */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>เข้าเรียนจริงแล้ว</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {actualAttendanceCount} <span className="text-xs font-normal text-slate-500">/ {plannedSessions} ครั้ง</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, (actualAttendanceCount / plannedSessions) * 100)}%` }}
              />
            </div>
          </div>

          {/* Attendance Percentage */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>ร้อยละการเข้าชั้นเรียน</span>
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {percentage}%
            </div>
            <p className={`text-[11px] mt-1 font-medium ${percentage >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {percentage >= 80 ? '✓ ผ่านเกณฑ์มาตรฐาน 80%' : '⚠ ต่ำกว่าเกณฑ์มาตรฐาน'}
            </p>
          </div>

        </div>
      )}

      {/* Main Check-In Action Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Success Alert Banner */}
        {scanSuccess && (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-3.5 shadow-xs animate-fadeIn">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-bold text-emerald-900">
                เช็คชื่อสำเร็จแล้ว! (Attendance Recorded)
              </h3>
              <p className="text-xs text-emerald-700 mt-1">
                รายวิชา <b>{scanSuccess.courseCode}</b> คาบเรียนที่ <b>{scanSuccess.sessionNumber}</b> บันทึกเวลาเมื่อ {scanSuccess.timestamp}
              </p>
              <div className="mt-2 text-[11px] font-medium text-emerald-800">
                คะแนนสะสม Proportional Score ได้รับการปรับปรุงอัตโนมัติแล้ว
              </div>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {scanError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">ไม่สามารถเช็คชื่อได้:</span>
              <span>{scanError}</span>
            </div>
            <button
              onClick={() => setScanError(null)}
              className="text-rose-700 underline hover:text-rose-900 font-medium"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Active Session Status */}
        {activeSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="flex items-center space-x-3">
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping"></span>
                <div>
                  <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                    กำลังเปิดรับการเช็คชื่อ
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    ครั้งที่ {activeSession.sessionNumber}: {activeSession.title}
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500">
                เริ่ม {activeSession.startTime} น.
              </span>
            </div>

            {/* Camera View Area or Action Button */}
            {isScanning ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-indigo-600 shadow-lg">
                  <div id={scannerRegionId} className="w-full min-h-[300px]" />
                  
                  {/* Overlay scan guide */}
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={stopScanner}
                      className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium border border-slate-700 flex items-center space-x-1"
                    >
                      <CameraOff className="h-4 w-4 text-rose-400" />
                      <span>ปิดกล้อง</span>
                    </button>
                  </div>
                </div>

                <p className="text-center text-xs text-slate-500 animate-pulse">
                  หันกล้องไปที่ Dynamic QR Code บนหน้าจอโปรเจกเตอร์ของอาจารย์
                </p>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <button
                  onClick={startCameraScanner}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 py-3.5 px-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-100 transition-all cursor-pointer"
                >
                  <Camera className="h-5 w-5" />
                  <span>เปิดกล้องสแกน Dynamic QR Code</span>
                </button>

                <p className="text-xs text-slate-500">
                  * รหัส QR จะเปลี่ยนทุก 20 วินาทีเพื่อความปลอดภัยและป้องกันการส่งต่อภาพ
                </p>
              </div>
            )}

            {/* Fallback Manual Code Input Accordion */}
            <div className="pt-4 border-t border-slate-200">
              <details className="group">
                <summary className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer flex items-center justify-between font-medium">
                  <span>มีปัญหาเรื่องกล้อง? คลิกที่นี่เพื่อกรอกรหัสฉุกเฉินด้วยตนเอง</span>
                  <ChevronRight className="h-3.5 w-3.5 transform group-open:rotate-90 transition-transform text-slate-400" />
                </summary>

                <form onSubmit={handleManualCodeSubmit} className="mt-3 flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="วาง JSON หรือรหัส Token ที่ได้รับจากอาจารย์..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingManual}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSubmittingManual ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัส'}
                  </button>
                </form>
              </details>
            </div>

          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              ยังไม่มีการเปิดห้องเช็คชื่อในขณะนี้
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              เมื่ออาจารย์ผู้สอนเปิดฉาย Dynamic QR Code บนหน้าจอห้องเรียน ปุ่มเปิดกล้องสแกนจะปรากฏที่นี่โดยอัตโนมัติ
            </p>
          </div>
        )}

      </div>

      {/* Attendance History Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <span>ประวัติการบันทึกเวลาเรียน ({attendanceHistory.length} รายการ)</span>
        </h3>

        {attendanceHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
            ยังไม่มีประวัติการเช็คชื่อในรายวิชานี้
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
            {attendanceHistory.map((rec) => (
              <div key={rec.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                    {rec.sessionNumber}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      คาบเรียนครั้งที่ {rec.sessionNumber}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(rec.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })} • {new Date(rec.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border ${
                    rec.status === 'present'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : rec.status === 'late'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {rec.status === 'present' ? 'มาเรียน' : rec.status === 'late' ? 'มาสาย' : 'ลา'}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {rec.method === 'qr_scan' ? 'Dynamic QR' : 'อาจารย์ปรับปรุง'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
