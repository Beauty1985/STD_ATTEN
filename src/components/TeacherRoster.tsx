import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Search, 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { CourseStudent } from '../types';
import { parseStudentCsv, downloadSampleStudentCsv } from '../utils/csv';

interface TeacherRosterProps {
  courseId: string;
  students: CourseStudent[];
  onImportStudents: (newStudents: CourseStudent[]) => Promise<void>;
  onAddStudent: (student: CourseStudent) => Promise<void>;
  onDeleteStudent: (studentDocId: string) => Promise<void>;
}

export const TeacherRoster: React.FC<TeacherRosterProps> = ({
  courseId,
  students,
  onImportStudents,
  onAddStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ success: number; errors: string[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single student form
  const [newStudent, setNewStudent] = useState({
    studentNo: students.length + 1,
    studentId: '',
    name: '',
    email: '',
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadFeedback(null);

    try {
      const result = await parseStudentCsv(file);
      if (result.students.length > 0) {
        await onImportStudents(result.students);
      }
      setUploadFeedback({
        success: result.students.length,
        errors: result.errors,
      });
    } catch (err: any) {
      setUploadFeedback({
        success: 0,
        errors: [err.message || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์'],
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.studentId || !newStudent.name) return;

    let email = newStudent.email.trim();
    if (!email) {
      email = `${newStudent.studentId}@bumail.net`;
    }

    await onAddStudent({
      studentNo: Number(newStudent.studentNo) || students.length + 1,
      studentId: newStudent.studentId.trim(),
      name: newStudent.name.trim(),
      email: email.toLowerCase(),
      enrolledAt: new Date().toISOString()
    });

    setIsAddModalOpen(false);
    setNewStudent({
      studentNo: students.length + 2,
      studentId: '',
      name: '',
      email: '',
    });
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Upload and Action Banner */}
      <div className="grid md:grid-cols-12 gap-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        
        {/* Left: CSV Import Drag-and-Drop Area */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Upload className="h-5 w-5 text-indigo-600" />
              <span>นำเข้ารายชื่อนักศึกษาผ่านไฟล์ CSV (รองรับภาษาไทย UTF-8)</span>
            </h3>
            <button
              onClick={downloadSampleStudentCsv}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center space-x-1 underline"
            >
              <Download className="h-3.5 w-3.5" />
              <span>ดาวน์โหลดไฟล์ตัวอย่าง CSV</span>
            </button>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/20 p-6 rounded-xl text-center cursor-pointer transition-all duration-200"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-2">
              {isUploading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
            </div>
            <p className="text-sm font-semibold text-slate-800">
              คลิกเพื่อเลือกไฟล์ CSV หรือลากไฟล์มาวางที่นี่
            </p>
            <p className="text-xs text-slate-500 mt-1">
              หัวตารางที่รองรับ: ลำดับ/เลขที่, รหัสนักศึกษา, ชื่อ-นามสกุล, อีเมลสถาบัน (@bumail.net)
            </p>
          </div>

          {/* Feedback status */}
          {uploadFeedback && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              {uploadFeedback.success > 0 && (
                <div className="flex items-center space-x-2 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>นำเข้ารายชื่อสำเร็จ {uploadFeedback.success} คน</span>
                </div>
              )}
              {uploadFeedback.errors.length > 0 && (
                <div className="space-y-1 text-rose-600">
                  <div className="flex items-center space-x-1.5 font-semibold">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>พบข้อผิดพลาดบางรายการ ({uploadFeedback.errors.length} จุด):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-2">
                    {uploadFeedback.errors.slice(0, 4).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {uploadFeedback.errors.length > 4 && <li>และอีก {uploadFeedback.errors.length - 4} รายการ...</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Summary and Single Add button */}
        <div className="md:col-span-4 bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">จำนวนนักศึกษาในกลุ่มเรียน</div>
            <div className="text-3xl font-black text-slate-900 mt-1 mb-3 flex items-baseline space-x-2">
              <span className="text-indigo-600">{students.length}</span>
              <span className="text-sm font-normal text-slate-500">คน</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              นักศึกษาที่มีรายชื่อในกลุ่มเรียนนี้จะสามารถสแกน Dynamic QR Code เพื่อเช็คชื่อและสะสมคะแนนได้
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full mt-4 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            <span>เพิ่มนักศึกษารายคน</span>
          </button>
        </div>

      </div>

      {/* Roster Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสนักศึกษา, ชื่อ, หรืออีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="text-xs text-slate-500">
            แสดง <b>{filteredStudents.length}</b> จากทั้งหมด {students.length} คน
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">ลำดับ</th>
                <th className="py-3 px-4">รหัสนักศึกษา</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">อีเมลสถาบัน (@bumail.net)</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    {students.length === 0
                      ? 'ยังไม่มีรายชื่อนักศึกษา กรุณานำเข้าไฟล์ CSV หรือเพิ่มรายคน'
                      : 'ไม่พบข้อมูลนักศึกษาที่ตรงกับคำค้นหา'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, index) => (
                  <tr key={s.id || index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {s.studentNo || index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                      {s.studentId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {s.email}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`ต้องการลบ ${s.name} (${s.studentId}) ออกจากรายวิชาหรือไม่?`)) {
                            if (s.id) onDeleteStudent(s.id);
                          }
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบนักศึกษา"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal: Add Single Student */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              <span>เพิ่มนักศึกษาเข้ากลุ่มเรียน</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              กรอกข้อมูลเพื่อลงทะเบียนรายชื่อเข้าสู่ระบบเช็คชื่อ
            </p>

            <form onSubmit={handleManualAdd} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-700 mb-1 font-medium">ลำดับที่</label>
                  <input
                    type="number"
                    value={newStudent.studentNo}
                    onChange={(e) => setNewStudent({ ...newStudent, studentNo: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-slate-700 mb-1 font-medium">รหัสนักศึกษา *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 1640700012"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 mb-1 font-medium">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 mb-1 font-medium">
                  อีเมลสถาบัน (เว้นว่างเพื่อใช้อัตโนมัติ @bumail.net)
                </label>
                <input
                  type="email"
                  placeholder="เช่น somchai.jai@bumail.net"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
