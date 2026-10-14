export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  studentId?: string;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  section: string;
  semester: string;
  academicYear: string;
  teacherId: string;
  teacherEmail: string;
  plannedSessions: number; // Planned attendance sessions (e.g. 14)
  maxPoints: number; // Max score for attendance (e.g. 10.0)
  studentCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CourseStudent {
  id?: string;
  studentNo: number;
  studentId: string;
  name: string;
  email: string;
  enrolledAt?: string;
}

export interface ClassSession {
  id: string;
  courseId: string;
  sessionNumber: number;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  currentQrToken?: string;
  tokenExpiresAt?: number;
  totalPresent?: number;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';
export type AttendanceMethod = 'qr_scan' | 'manual_override';

export interface AttendanceRecord {
  id: string;
  courseId: string;
  sessionId: string;
  sessionNumber: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentUid?: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  timestamp: string;
  note?: string;
}

export interface StudentScoreSummary {
  studentId: string;
  studentNo: number;
  name: string;
  email: string;
  actualAttendance: number; // Number of present sessions
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  attendanceRate: number; // (actual / planned) * 100
  proportionalScore: number; // (actualAttendance / plannedSessions) * maxPoints
  sessionStatusMap: Record<string, AttendanceStatus>; // sessionId -> status
}

export interface DynamicQrPayload {
  courseId: string;
  sessionId: string;
  sessionNumber: number;
  timeBucket: number;
  token: string;
  issuedAt: number;
  expiresAt: number;
}
