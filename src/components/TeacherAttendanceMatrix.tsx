import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Edit3, 
  Sparkles, 
  Search, 
  FileSpreadsheet,
  Download,
  Info
} from 'lucide-react';
import { 
  Course, 
  ClassSession, 
  CourseStudent, 
  AttendanceRecord, 
  AttendanceStatus, 
  StudentScoreSummary 
} from '../types';
import { calculateProportionalScore } from '../utils/security';
import { exportAttendanceReportCsv } from '../utils/csv';

interface TeacherAttendanceMatrixProps {
  course: Course;
  sessions: ClassSession[];
  students: CourseStudent[];
  attendanceRecords: AttendanceRecord[];
  onManualOverride: (
    sessionId: string,
    sessionNumber: number,
    student: CourseStudent,
    status: AttendanceStatus,
    note?: string
  ) => Promise<void>;
}

export const TeacherAttendanceMatrix: React.FC<TeacherAttendanceMatrixProps> = ({
  course,
  sessions,
  students,
  attendanceRecords,
  onManualOverride,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    student: CourseStudent | null;
    session: ClassSession | null;
    currentStatus: AttendanceStatus;
    note: string;
  }>({
    isOpen: false,
    student: null,
    session: null,
    currentStatus: 'present',
    note: '',
  });

  // Calculate score summary for each student
  const sortedSessions = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);

  const summaries: StudentScoreSummary[] = students.map((student) => {
    const sessionStatusMap: Record<string, AttendanceStatus> = {};
    let actualAttendance = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let absentCount = 0;

    sortedSessions.forEach((sess) => {
      // Find matching attendance record
      const rec = attendanceRecords.find(
        (r) => r.sessionId === sess.id && (r.studentId === student.studentId || r.studentEmail === student.email)
      );

      if (rec) {
        sessionStatusMap[sess.id] = rec.status;
        if (rec.status === 'present') actualAttendance++;
        else if (rec.status === 'late') {
          lateCount++;
          actualAttendance += 0.5; // Count half for late or full based on custom policy
        } else if (rec.status === 'excused') excusedCount++;
        else absentCount++;
      } else {
        sessionStatusMap[sess.id] = 'absent';
        absentCount++;
      }
    });

    const { score, percentage } = calculateProportionalScore(
      actualAttendance,
      course.plannedSessions,
      course.maxPoints
    );

    return {
      studentId: student.studentId,
      studentNo: student.studentNo,
      name: student.name,
      email: student.email,
      actualAttendance,
      lateCount,
      excusedCount,
      absentCount,
      attendanceRate: percentage,
      proportionalScore: score,
      sessionStatusMap,
    };
  });

  const filteredSummaries = summaries.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.includes(searchTerm)
  );

  const handleCellClick = (student: CourseStudent, session: ClassSession) => {
    const currentRecord = attendanceRecords.find(
      (r) => r.sessionId === session.id && (r.studentId === student.studentId || r.studentEmail === student.email)
    );

    setOverrideModal({
      isOpen: true,
      student,
      session,
      currentStatus: currentRecord ? currentRecord.status : 'present',
      note: currentRecord?.note || '',
    });
  };

  const handleSaveOverride = async () => {
    if (!overrideModal.student || !overrideModal.session) return;

    await onManualOverride(
      overrideModal.session.id,
      overrideModal.session.sessionNumber,
      overrideModal.student,
      overrideModal.currentStatus,
      overrideModal.note
    );

    setOverrideModal({
      isOpen: false,
      student: null,
      session: null,
      currentStatus: 'present',
      note: '',
    });
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>มา</span>
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
            <Clock className="h-2.5 w-2.5" />
            <span>สาย</span>
          </span>
        );
      case 'excused':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold">
            <Info className="h-2.5 w-2.5" />
            <span>ลา</span>
          </span>
        );
      case 'absent':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-[10px]">
            <XCircle className="h-2.5 w-2.5 text-slate-400" />
            <span>ขาด</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Scoring Banner & Actions */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            <span>ระบบคำนวณคะแนนตามสัดส่วน (Proportional Scoring Formula)</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            ตารางเช็คชื่อและประมวลผลคะแนนสะสมรายบุคคล
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            สูตร: <code className="text-emerald-700 font-mono font-medium">score = (actualAttendance / {course.plannedSessions}) * {course.maxPoints}</code> (คลิกที่ช่องเพื่อแก้ไขสถานะย้อนหลัง)
          </p>
        </div>

        <button
          onClick={() =>
            exportAttendanceReportCsv(
              course.courseCode,
              course.courseName,
              course.section,
              course.plannedSessions,
              course.maxPoints,
              sortedSessions,
              summaries
            )
          }
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>ส่งออกรายงาน CSV (Excel/Sheets)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหานักศึกษา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500">
          เช็คชื่อแล้ว <b>{sortedSessions.length}</b> คาบ (จากแผน <b>{course.plannedSessions}</b> คาบ)
        </div>
      </div>

      {/* Attendance Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs overflow-hidden">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">ที่</th>
                <th className="py-3 px-3 min-w-[100px]">รหัสนักศึกษา</th>
                <th className="py-3 px-3 min-w-[140px]">ชื่อ - นามสกุล</th>
                
                {/* Dynamic Session Columns */}
                {sortedSessions.map((s) => (
                  <th key={s.id} className="py-3 px-3 text-center min-w-[80px]">
                    <div className="text-slate-800">ครั้งที่ {s.sessionNumber}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{s.date}</div>
                  </th>
                ))}

                <th className="py-3 px-3 text-center min-w-[90px] bg-slate-100/70 text-emerald-800 font-semibold">
                  เข้าจริง (ครั้ง)
                </th>
                <th className="py-3 px-3 text-center min-w-[80px] bg-slate-100/70 text-indigo-800 font-semibold">
                  ร้อยละ (%)
                </th>
                <th className="py-3 px-3 text-right min-w-[110px] bg-indigo-50/70 text-indigo-900 font-bold">
                  คะแนนสะสม ({course.maxPoints})
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6 + sortedSessions.length} className="py-12 text-center text-slate-400 text-xs">
                    {students.length === 0 ? 'ยังไม่มีนักศึกษาในระบบ' : 'ไม่พบนักศึกษาที่ตรงกับคำค้นหา'}
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((s, idx) => {
                  const studentObj = students.find((st) => st.studentId === s.studentId);

                  return (
                    <tr key={s.studentId || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {s.studentNo || idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">
                        {s.studentId}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {s.name}
                      </td>

                      {/* Session Status Cells with click to manual override */}
                      {sortedSessions.map((sess) => {
                        const status = s.sessionStatusMap[sess.id] || 'absent';
                        return (
                          <td
                            key={sess.id}
                            onClick={() => studentObj && handleCellClick(studentObj, sess)}
                            className="py-2.5 px-3 text-center cursor-pointer hover:bg-indigo-50/40 transition-colors group relative"
                            title="คลิกเพื่อปรับปรุงสถานะ (Manual Override)"
                          >
                            <div className="flex items-center justify-center">
                              {getStatusBadge(status)}
                              <Edit3 className="h-2.5 w-2.5 ml-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700 bg-slate-50/50 font-mono">
                        {s.actualAttendance}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-indigo-700 bg-slate-50/50 font-mono">
                        {s.attendanceRate}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-indigo-900 bg-indigo-50/30">
                        {s.proportionalScore.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Manual Override Status */}
      {overrideModal.isOpen && overrideModal.student && overrideModal.session && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <Edit3 className="h-5 w-5 text-indigo-600" />
              <span>ปรับปรุงสถานะการเข้าเรียน (Manual Override)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {overrideModal.student.name} ({overrideModal.student.studentId}) • ครั้งที่ {overrideModal.session.sessionNumber}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  เลือกสถานะใหม่:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideModal({ ...overrideModal, currentStatus: 'present' })}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      overrideModal.currentStatus === 'present'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>มาเรียน (Present)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverrideModal({ ...overrideModal, currentStatus: 'late' })}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      overrideModal.currentStatus === 'late'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>มาสาย (Late)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverrideModal({ ...overrideModal, currentStatus: 'excused' })}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      overrideModal.currentStatus === 'excused'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Info className="h-4 w-4 text-indigo-600" />
                    <span>ลาป่วย/กิจ (Excused)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverrideModal({ ...overrideModal, currentStatus: 'absent' })}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      overrideModal.currentStatus === 'absent'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span>ขาดเรียน (Absent)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  หมายเหตุ / เหตุผลการแก้ไข:
                </label>
                <input
                  type="text"
                  placeholder="เช่น มีใบรับรองแพทย์, ติดภารกิจตัวแทนมหาวิทยาลัย"
                  value={overrideModal.note}
                  onChange={(e) => setOverrideModal({ ...overrideModal, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setOverrideModal({ ...overrideModal, isOpen: false })}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveOverride}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
