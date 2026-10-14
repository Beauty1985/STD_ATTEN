import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  QrCode, 
  Users, 
  Table, 
  BarChart3, 
  ChevronRight, 
  ArrowLeft,
  GraduationCap,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Course, ClassSession, CourseStudent, AttendanceRecord, AttendanceStatus } from '../types';
import { TeacherCourseList } from './TeacherCourseList';
import { TeacherDynamicQr } from './TeacherDynamicQr';
import { TeacherRoster } from './TeacherRoster';
import { TeacherAttendanceMatrix } from './TeacherAttendanceMatrix';
import { TeacherAnalytics } from './TeacherAnalytics';

interface TeacherDashboardProps {
  onOpenGasModal: () => void;
}

type TabType = 'qr' | 'roster' | 'matrix' | 'analytics';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onOpenGasModal }) => {
  const { user } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('qr');

  // Sub-resources for selected course
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // 1. Fetch Teacher's Courses
  useEffect(() => {
    if (!user) return;

    const coursesRef = collection(db, 'courses');
    // Listen to courses where teacherId or teacherEmail matches
    const unsubscribe = onSnapshot(coursesRef, (snapshot) => {
      const loaded: Course[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.teacherId === user.uid || data.teacherEmail === user.email || user.email === 'walailuk.p@bu.ac.th') {
          loaded.push({ id: docSnap.id, ...data } as Course);
        }
      });
      setCourses(loaded);

      // If selected course was modified, keep state synced
      if (selectedCourse) {
        const updated = loaded.find((c) => c.id === selectedCourse.id);
        if (updated) setSelectedCourse(updated);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courses');
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Fetch Sessions, Students, and Attendance for selected course
  useEffect(() => {
    if (!selectedCourse) {
      setSessions([]);
      setActiveSession(null);
      setStudents([]);
      setAttendanceRecords([]);
      return;
    }

    const courseId = selectedCourse.id;

    // Listen to sessions
    const sessionsRef = collection(db, 'courses', courseId, 'sessions');
    const unsubSessions = onSnapshot(sessionsRef, (snapshot) => {
      const loadedSessions: ClassSession[] = [];
      snapshot.forEach((docSnap) => {
        loadedSessions.push({ id: docSnap.id, ...docSnap.data() } as ClassSession);
      });
      setSessions(loadedSessions);
      const active = loadedSessions.find((s) => s.isActive) || null;
      setActiveSession(active);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `courses/${courseId}/sessions`);
    });

    // Listen to students
    const studentsRef = collection(db, 'courses', courseId, 'students');
    const unsubStudents = onSnapshot(studentsRef, (snapshot) => {
      const loadedStudents: CourseStudent[] = [];
      snapshot.forEach((docSnap) => {
        loadedStudents.push({ id: docSnap.id, ...docSnap.data() } as CourseStudent);
      });
      // Sort by studentNo
      loadedStudents.sort((a, b) => a.studentNo - b.studentNo);
      setStudents(loadedStudents);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `courses/${courseId}/students`);
    });

    // Listen to attendance
    const attendanceRef = collection(db, 'courses', courseId, 'attendance');
    const unsubAttendance = onSnapshot(attendanceRef, (snapshot) => {
      const loadedAttendance: AttendanceRecord[] = [];
      snapshot.forEach((docSnap) => {
        loadedAttendance.push({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord);
      });
      setAttendanceRecords(loadedAttendance);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `courses/${courseId}/attendance`);
    });

    return () => {
      unsubSessions();
      unsubStudents();
      unsubAttendance();
    };
  }, [selectedCourse?.id]);

  // Course Handlers
  const handleCreateCourse = async (courseData: Omit<Course, 'id' | 'createdAt'>) => {
    if (!user) return;
    const path = 'courses';
    try {
      const newDocRef = doc(collection(db, path));
      const fullCourse: Course = {
        ...courseData,
        id: newDocRef.id,
        teacherId: user.uid,
        teacherEmail: user.email,
        createdAt: new Date().toISOString()
      };
      await setDoc(newDocRef, fullCourse);
      setSelectedCourse(fullCourse);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const path = `courses/${courseId}`;
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Session Handlers
  const handleStartSession = async (sessionNumber: number, title: string) => {
    if (!selectedCourse || !user) return;
    const courseId = selectedCourse.id;
    const path = `courses/${courseId}/sessions`;

    try {
      // First, close any previously active sessions
      for (const s of sessions.filter((sess) => sess.isActive)) {
        await updateDoc(doc(db, 'courses', courseId, 'sessions', s.id), {
          isActive: false,
          endTime: new Date().toISOString()
        });
      }

      const sessionDocRef = doc(collection(db, 'courses', courseId, 'sessions'));
      const newSession: ClassSession = {
        id: sessionDocRef.id,
        courseId,
        sessionNumber,
        title,
        date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
        startTime: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        isActive: true,
        totalPresent: 0,
        createdAt: new Date().toISOString()
      };

      await setDoc(sessionDocRef, newSession);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    if (!selectedCourse) return;
    const path = `courses/${selectedCourse.id}/sessions/${sessionId}`;
    try {
      await updateDoc(doc(db, 'courses', selectedCourse.id, 'sessions', sessionId), {
        isActive: false,
        endTime: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Student Roster Handlers
  const handleImportStudents = async (newStudents: CourseStudent[]) => {
    if (!selectedCourse) return;
    const courseId = selectedCourse.id;

    for (const st of newStudents) {
      const studentDocRef = doc(collection(db, 'courses', courseId, 'students'));
      await setDoc(studentDocRef, {
        studentNo: st.studentNo,
        studentId: st.studentId,
        name: st.name,
        email: st.email,
        enrolledAt: new Date().toISOString()
      });
    }
  };

  const handleAddStudent = async (student: CourseStudent) => {
    if (!selectedCourse) return;
    const studentDocRef = doc(collection(db, 'courses', selectedCourse.id, 'students'));
    await setDoc(studentDocRef, {
      ...student,
      enrolledAt: new Date().toISOString()
    });
  };

  const handleDeleteStudent = async (studentDocId: string) => {
    if (!selectedCourse) return;
    await deleteDoc(doc(db, 'courses', selectedCourse.id, 'students', studentDocId));
  };

  // Manual Override Handler
  const handleManualOverride = async (
    sessionId: string,
    sessionNumber: number,
    student: CourseStudent,
    status: AttendanceStatus,
    note?: string
  ) => {
    if (!selectedCourse) return;
    const courseId = selectedCourse.id;

    // Use deterministic composite doc ID or find existing
    const existingRec = attendanceRecords.find(
      (r) => r.sessionId === sessionId && (r.studentId === student.studentId || r.studentEmail === student.email)
    );

    const docId = existingRec ? existingRec.id : `${sessionId}_${student.studentId}`;
    const path = `courses/${courseId}/attendance/${docId}`;

    try {
      await setDoc(doc(db, 'courses', courseId, 'attendance', docId), {
        courseId,
        sessionId,
        sessionNumber,
        studentId: student.studentId,
        studentName: student.name,
        studentEmail: student.email,
        status,
        method: 'manual_override',
        timestamp: new Date().toISOString(),
        note: note || 'ปรับปรุงโดยอาจารย์'
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // If no course is selected, show the course list overview
  if (!selectedCourse) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherCourseList
          courses={courses}
          onSelectCourse={setSelectedCourse}
          onCreateCourse={handleCreateCourse}
          onDeleteCourse={handleDeleteCourse}
        />
      </div>
    );
  }

  // Active session attendance records
  const activeSessionAttendance = activeSession
    ? attendanceRecords.filter((r) => r.sessionId === activeSession.id)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Breadcrumb & Course Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSelectedCourse(null)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="กลับหน้ารายวิชาทั้งหมด"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>รายวิชา</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-indigo-600 font-bold">{selectedCourse.courseCode}</span>
              <span>• Sec {selectedCourse.section}</span>
              <span className="hidden sm:inline">• เทอม {selectedCourse.semester}/{selectedCourse.academicYear}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {selectedCourse.courseName}
            </h1>
          </div>
        </div>

        {/* Course stats pill */}
        <div className="flex items-center space-x-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200 self-start sm:self-auto">
          <div className="px-2">
            <span className="text-slate-500 block text-[10px]">นักศึกษา</span>
            <span className="font-bold text-slate-900">{students.length} คน</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="px-2">
            <span className="text-slate-500 block text-[10px]">แผนเช็คชื่อ</span>
            <span className="font-bold text-indigo-600">{selectedCourse.plannedSessions} คาบ</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="px-2">
            <span className="text-slate-500 block text-[10px]">คะแนนเต็ม</span>
            <span className="font-bold text-emerald-600">{selectedCourse.maxPoints} คะแนน</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'qr'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>Dynamic QR เช็คชื่อสด</span>
          {activeSession?.isActive && (
            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>รายชื่อนักศึกษา & CSV ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Table className="h-4 w-4" />
          <span>ตารางเช็คชื่อ & ปรับคะแนน</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>รายงาน & สถิติวิเคราะห์</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <div>
        {activeTab === 'qr' && (
          <TeacherDynamicQr
            course={selectedCourse}
            activeSession={activeSession}
            attendanceList={activeSessionAttendance}
            students={students}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            existingSessionsCount={sessions.length}
          />
        )}

        {activeTab === 'roster' && (
          <TeacherRoster
            courseId={selectedCourse.id}
            students={students}
            onImportStudents={handleImportStudents}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'matrix' && (
          <TeacherAttendanceMatrix
            course={selectedCourse}
            sessions={sessions}
            students={students}
            attendanceRecords={attendanceRecords}
            onManualOverride={handleManualOverride}
          />
        )}

        {activeTab === 'analytics' && (
          <TeacherAnalytics
            course={selectedCourse}
            sessions={sessions}
            students={students}
            attendanceRecords={attendanceRecords}
            onOpenGasModal={onOpenGasModal}
          />
        )}
      </div>

    </div>
  );
};
