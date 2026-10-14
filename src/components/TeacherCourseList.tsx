import React, { useState } from 'react';
import { 
  Plus, 
  BookOpen, 
  Calendar, 
  Award, 
  Trash2, 
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { Course } from '../types';

interface TeacherCourseListProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onCreateCourse: (courseData: Omit<Course, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
}

export const TeacherCourseList: React.FC<TeacherCourseListProps> = ({
  courses,
  onSelectCourse,
  onCreateCourse,
  onDeleteCourse,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    courseCode: '',
    courseName: '',
    section: '101',
    semester: '1',
    academicYear: '2567',
    plannedSessions: 14,
    maxPoints: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseCode.trim() || !form.courseName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateCourse({
        courseCode: form.courseCode.trim().toUpperCase(),
        courseName: form.courseName.trim(),
        section: form.section.trim(),
        semester: form.semester.trim(),
        academicYear: form.academicYear.trim(),
        plannedSessions: Number(form.plannedSessions) || 14,
        maxPoints: Number(form.maxPoints) || 10,
        teacherId: '',
        teacherEmail: '',
        studentCount: 0
      });
      setIsModalOpen(false);
      setForm({
        courseCode: '',
        courseName: '',
        section: '101',
        semester: '1',
        academicYear: '2567',
        plannedSessions: 14,
        maxPoints: 10,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <span>รายวิชาที่รับผิดชอบสอน</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            เลือกรายวิชาเพื่อเปิดห้องเช็คชื่อ Dynamic QR, จัดการรายชื่อนักศึกษา หรือดูรายงานคะแนน
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-100 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>เพิ่มรายวิชาใหม่</span>
        </button>
      </div>

      {/* Course Cards Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Layers className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">ยังไม่มีรายวิชาในระบบ</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            เริ่มต้นด้วยการสร้างรายวิชาและกลุ่มเรียน (Section) เพื่อกำหนดเกณฑ์คะแนนและเริ่มเช็คชื่อ
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>สร้างรายวิชาแรก</span>
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-xs"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                    {course.courseCode} • Sec {course.section}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    เทอม {course.semester}/{course.academicYear}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-4">
                  {course.courseName}
                </h3>

                {/* Meta stats */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4 text-xs">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Calendar className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">แผนเช็คชื่อ</span>
                      <span className="font-semibold text-slate-800">{course.plannedSessions} ครั้ง</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <Award className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">คะแนนเต็ม</span>
                      <span className="font-semibold text-slate-800">{course.maxPoints} คะแนน</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`คุณต้องการลบรายวิชา ${course.courseCode} ใช่หรือไม่?`)) {
                      onDeleteCourse(course.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="ลบรายวิชา"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onSelectCourse(course)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>เข้าสู่ห้องเรียน</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Course */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              <span>สร้างรายวิชาและกลุ่มเรียนใหม่</span>
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              ระบุรหัสวิชา กลุ่มเรียน แผนจำนวนครั้งที่จะเช็คชื่อ และสัดส่วนคะแนนสะสม
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รหัสวิชา (Course Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น CS311, ITE422"
                    value={form.courseCode}
                    onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    กลุ่มเรียน (Section) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 101, 231"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อรายวิชา (Course Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Web Application Development"
                  value={form.courseName}
                  onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ภาคการศึกษา (Semester)
                  </label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                    <option value="3">ภาคฤดูร้อน (Summer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ปีการศึกษา (Academic Year)
                  </label>
                  <input
                    type="text"
                    placeholder="2567"
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Scoring Criteria Formula */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="text-xs font-semibold text-indigo-900 flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>เกณฑ์การคำนวณคะแนนตามสัดส่วน (Proportional Scoring)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      จำนวนครั้งตามแผน (Planned Sessions)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      required
                      value={form.plannedSessions}
                      onChange={(e) => setForm({ ...form, plannedSessions: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      คะแนนเต็ม (Max Points)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.5"
                      required
                      value={form.maxPoints}
                      onChange={(e) => setForm({ ...form, maxPoints: parseFloat(e.target.value) || 1 })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-normal">
                  * สูตรคะแนน: <code className="text-indigo-700 font-semibold">score = (actualAttendance / {form.plannedSessions}) * {form.maxPoints}</code>
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'สร้างรายวิชา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
