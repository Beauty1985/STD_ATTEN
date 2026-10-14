import React from 'react';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Award, 
  Calendar, 
  CheckCircle2, 
  FileSpreadsheet,
  Mail,
  BarChart3
} from 'lucide-react';
import { Course, ClassSession, CourseStudent, AttendanceRecord } from '../types';
import { calculateProportionalScore } from '../utils/security';

interface TeacherAnalyticsProps {
  course: Course;
  sessions: ClassSession[];
  students: CourseStudent[];
  attendanceRecords: AttendanceRecord[];
  onOpenGasModal: () => void;
}

export const TeacherAnalytics: React.FC<TeacherAnalyticsProps> = ({
  course,
  sessions,
  students,
  attendanceRecords,
  onOpenGasModal,
}) => {
  const sortedSessions = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);

  // Per student analytics
  const studentMetrics = students.map((s) => {
    const records = attendanceRecords.filter(
      (r) => (r.studentId === s.studentId || r.studentEmail === s.email) && r.status === 'present'
    );
    const actualAttendance = records.length;
    const { score, percentage } = calculateProportionalScore(
      actualAttendance,
      course.plannedSessions,
      course.maxPoints
    );

    return {
      student: s,
      actualAttendance,
      score,
      percentage,
      isAtRisk: percentage < 80,
    };
  });

  const totalStudents = students.length;
  const atRiskStudents = studentMetrics.filter((m) => m.isAtRisk);
  
  const avgAttendancePercentage = totalStudents > 0
    ? Math.round(studentMetrics.reduce((acc, m) => acc + m.percentage, 0) / totalStudents)
    : 0;

  const avgScore = totalStudents > 0
    ? (studentMetrics.reduce((acc, m) => acc + m.score, 0) / totalStudents).toFixed(2)
    : '0.00';

  // Session-by-session attendance rate
  const sessionStats = sortedSessions.map((sess) => {
    const presentCount = attendanceRecords.filter(
      (r) => r.sessionId === sess.id && r.status === 'present'
    ).length;
    const rate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    return {
      session: sess,
      presentCount,
      rate,
    };
  });

  // Score brackets
  const scoreBrackets = {
    excellent: studentMetrics.filter((m) => m.percentage >= 90).length,
    good: studentMetrics.filter((m) => m.percentage >= 80 && m.percentage < 90).length,
    moderate: studentMetrics.filter((m) => m.percentage >= 60 && m.percentage < 80).length,
    critical: studentMetrics.filter((m) => m.percentage < 60).length,
  };

  return (
    <div className="space-y-6">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">นักศึกษาทั้งหมด</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalStudents} <span className="text-xs font-normal text-slate-500">คน</span></div>
          <div className="text-[11px] text-slate-400 mt-1">กลุ่มเรียน {course.section}</div>
        </div>

        {/* Avg Attendance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">อัตราเข้าเรียนเฉลี่ย</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">{avgAttendancePercentage}%</div>
          <div className="text-[11px] text-slate-400 mt-1">จากแผน {course.plannedSessions} คาบ</div>
        </div>

        {/* Avg Proportional Score */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">คะแนนเฉลี่ย (เต็ม {course.maxPoints})</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">{avgScore}</div>
          <div className="text-[11px] text-slate-400 mt-1">สูตรคำนวณสัดส่วนจริง</div>
        </div>

        {/* At-risk students */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">นักศึกษากลุ่มเสี่ยง (&lt;80%)</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600">{atRiskStudents.length} <span className="text-xs font-normal text-slate-500">คน</span></div>
          <div className="text-[11px] text-slate-400 mt-1">ขาดเรียนเกินเกณฑ์ 20%</div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Session Attendance Trend */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <span>แนวโน้มการเข้าเรียนรายคาบ (Session Trend)</span>
            </h3>
            <span className="text-xs text-slate-500">{sortedSessions.length} คาบที่ผ่านมา</span>
          </div>

          {sessionStats.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ยังไม่มีข้อมูลคาบเรียนที่เช็คชื่อ
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {sessionStats.map((st) => (
                <div key={st.session.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 font-medium truncate max-w-[200px]">
                      ครั้งที่ {st.session.sessionNumber}: {st.session.title}
                    </span>
                    <span className="font-mono text-slate-600">
                      {st.presentCount}/{totalStudents} คน ({st.rate}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        st.rate >= 80 ? 'bg-emerald-500' : st.rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${st.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score Brackets Distribution */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-4">
              การกระจายตัวของระดับคะแนน
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-700 font-medium">ดีเยี่ยม (≥ 90% ของคะแนน)</span>
                </div>
                <span className="font-bold text-slate-900">{scoreBrackets.excellent} คน</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full bg-indigo-500"></span>
                  <span className="text-slate-700 font-medium">ดี (80% - 89%)</span>
                </div>
                <span className="font-bold text-slate-900">{scoreBrackets.good} คน</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                  <span className="text-slate-700 font-medium">ปานกลาง (60% - 79%)</span>
                </div>
                <span className="font-bold text-slate-900">{scoreBrackets.moderate} คน</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                  <span className="text-slate-700 font-medium">วิกฤต (&lt; 60%)</span>
                </div>
                <span className="font-bold text-rose-600">{scoreBrackets.critical} คน</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center space-x-1.5">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Google Apps Script Sync</span>
              </span>
              <button
                onClick={onOpenGasModal}
                className="text-[11px] underline text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
              >
                ดูคู่มือติดตั้ง
              </button>
            </div>
            <p className="text-[11px] text-emerald-700/90 leading-relaxed">
              ส่งออกและแจ้งเตือนผ่าน Gmail / Sheets ฟรี 100% ภายใต้ Firebase Spark Plan
            </p>
          </div>
        </div>

      </div>

      {/* At-Risk Students Alert Table */}
      {atRiskStudents.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-rose-800 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span>รายชื่อนักศึกษาที่เข้าเรียนต่ำกว่าเกณฑ์ 80% ({atRiskStudents.length} คน)</span>
            </h3>
            <span className="text-xs text-slate-500">ควรติดตามและส่งอีเมลแจ้งเตือน</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">รหัสนักศึกษา</th>
                  <th className="py-2.5 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-2.5 px-4">อีเมลสถาบัน</th>
                  <th className="py-2.5 px-4 text-center">เข้าเรียนจริง</th>
                  <th className="py-2.5 px-4 text-center">ร้อยละ (%)</th>
                  <th className="py-2.5 px-4 text-right">คะแนนสะสม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
                {atRiskStudents.map((m) => (
                  <tr key={m.student.studentId} className="hover:bg-rose-50/40">
                    <td className="py-2.5 px-4 font-mono font-medium text-indigo-700">{m.student.studentId}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{m.student.name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{m.student.email}</td>
                    <td className="py-2.5 px-4 text-center font-semibold text-slate-700">{m.actualAttendance} คาบ</td>
                    <td className="py-2.5 px-4 text-center font-bold text-rose-600">{m.percentage}%</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">{m.score.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
