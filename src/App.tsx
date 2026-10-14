/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { GasGuideModal } from './components/GasGuideModal';
import { testFirestoreConnection, db } from './lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { Course } from './types';

// Seed sample data on first run if database is empty so teacher and student see active demo content
async function seedInitialDataIfEmpty() {
  try {
    const coursesSnap = await getDocs(collection(db, 'courses'));
    if (coursesSnap.empty) {
      const sampleCourseId = 'cs311-sec101-sample';
      const sampleCourse: Course = {
        id: sampleCourseId,
        courseCode: 'CS311',
        courseName: 'Web Application Development & Architecture',
        section: '101',
        semester: '1',
        academicYear: '2567',
        teacherId: 'teacher-demo-001',
        teacherEmail: 'walailuk.p@bu.ac.th',
        plannedSessions: 14,
        maxPoints: 10,
        studentCount: 5,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'courses', sampleCourseId), sampleCourse);

      // Seed 5 sample students
      const students = [
        { studentNo: 1, studentId: '1640700012', name: 'นายสมชาย ใจดี', email: 'somchai.jai@bumail.net' },
        { studentNo: 2, studentId: '1640700020', name: 'นางสาววิภาดา รักเรียน', email: 'vipada.rak@bumail.net' },
        { studentNo: 3, studentId: '1640700038', name: 'นายณัฐพงษ์ สว่างวงศ์', email: 'nattapong.saw@bumail.net' },
        { studentNo: 4, studentId: '1640700046', name: 'นางสาวกานดา แก้วมณี', email: 'kanda.kae@bumail.net' },
        { studentNo: 5, studentId: '1640700053', name: 'นายธนากร มั่นคง', email: 'thanakorn.man@bumail.net' }
      ];

      for (const st of students) {
        await setDoc(doc(db, 'courses', sampleCourseId, 'students', st.studentId), {
          ...st,
          enrolledAt: new Date().toISOString()
        });
      }

      // Seed Session 1
      const sampleSessionId = 'session-1';
      await setDoc(doc(db, 'courses', sampleCourseId, 'sessions', sampleSessionId), {
        id: sampleSessionId,
        courseId: sampleCourseId,
        sessionNumber: 1,
        title: 'ปฐมนิเทศและการติดตั้งเครื่องมือ Web Development',
        date: '15 ส.ค. 2567',
        startTime: '09:00',
        endTime: '12:00',
        isActive: false,
        totalPresent: 4,
        createdAt: new Date().toISOString()
      });

      // Seed Session 1 attendance records
      const attendances = [
        { studentId: '1640700012', name: 'นายสมชาย ใจดี', email: 'somchai.jai@bumail.net', status: 'present' },
        { studentId: '1640700020', name: 'นางสาววิภาดา รักเรียน', email: 'vipada.rak@bumail.net', status: 'present' },
        { studentId: '1640700038', name: 'นายณัฐพงษ์ สว่างวงศ์', email: 'nattapong.saw@bumail.net', status: 'present' },
        { studentId: '1640700046', name: 'นางสาวกานดา แก้วมณี', email: 'kanda.kae@bumail.net', status: 'late' },
        { studentId: '1640700053', name: 'นายธนากร มั่นคง', email: 'thanakorn.man@bumail.net', status: 'absent' }
      ];

      for (const att of attendances) {
        await setDoc(doc(db, 'courses', sampleCourseId, 'attendance', `${sampleSessionId}_${att.studentId}`), {
          courseId: sampleCourseId,
          sessionId: sampleSessionId,
          sessionNumber: 1,
          studentId: att.studentId,
          studentName: att.name,
          studentEmail: att.email,
          status: att.status,
          method: 'qr_scan',
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.warn('Initial seeding skipped:', err);
  }
}

function MainApp() {
  const { user, isLoading } = useAuth();
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  useEffect(() => {
    testFirestoreConnection();
    seedInitialDataIfEmpty();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
        <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          BU Attendance System
        </p>
        <p className="text-[11px] text-slate-500 mt-1">กำลังเชื่อมต่อฐานข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar onOpenGasModal={() => setIsGasModalOpen(true)} />

      <main className="flex-1">
        {!user ? (
          <LandingPage />
        ) : user.role === 'teacher' ? (
          <TeacherDashboard onOpenGasModal={() => setIsGasModalOpen(true)} />
        ) : (
          <StudentDashboard />
        )}
      </main>

      <GasGuideModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
