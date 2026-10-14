import Papa from 'papaparse';
import { CourseStudent, ClassSession, StudentScoreSummary } from '../types';

export interface CsvImportResult {
  students: CourseStudent[];
  errors: string[];
  totalParsed: number;
}

/**
 * Parses a CSV file containing Thai student records
 * Expected columns:
 * 1. ลำดับ/เลขที่ (studentNo)
 * 2. รหัสนักศึกษา (studentId)
 * 3. ชื่อ-นามสกุล (name)
 * 4. อีเมล (email)
 */
export function parseStudentCsv(file: File): Promise<CsvImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      encoding: 'UTF-8',
      complete: (results) => {
        const students: CourseStudent[] = [];
        const errors: string[] = [];
        let rowNum = 1;

        for (const row of results.data as Record<string, string>[]) {
          rowNum++;
          // Find fields by fuzzy key matching for Thai and English headers
          const keys = Object.keys(row);
          const getVal = (possibleHeaders: string[]): string => {
            for (const key of keys) {
              const cleanKey = key.trim().toLowerCase();
              for (const header of possibleHeaders) {
                if (cleanKey.includes(header.toLowerCase())) {
                  return (row[key] || '').trim();
                }
              }
            }
            return '';
          };

          const rawNo = getVal(['ลำดับ', 'เลขที่', 'no', 'number', 'index', 'id_seq']);
          const rawId = getVal(['รหัสนักศึกษา', 'รหัสประจำตัว', 'student_id', 'studentid', 'id']);
          const rawName = getVal(['ชื่อ-นามสกุล', 'ชื่อ นามสกุล', 'ชื่อ', 'name', 'fullname', 'student_name']);
          const rawEmail = getVal(['อีเมล', 'email', 'mail', 'e-mail']);

          const studentNo = parseInt(rawNo, 10) || students.length + 1;
          const studentId = rawId.replace(/[^0-9A-Za-z-]/g, '');
          const name = rawName;
          
          let email = rawEmail.toLowerCase();
          // If no email provided or incomplete, auto-generate standard BU student email
          if (!email && studentId) {
            email = `${studentId.toLowerCase()}@bumail.net`;
          }

          if (!studentId && !name) {
            continue; // Skip empty row
          }

          if (!studentId) {
            errors.push(`แถวที่ ${rowNum}: ไม่พบรหัสนักศึกษา`);
            continue;
          }

          if (!name) {
            errors.push(`แถวที่ ${rowNum}: ไม่พบชื่อนักศึกษา (รหัส ${studentId})`);
            continue;
          }

          students.push({
            studentNo,
            studentId,
            name,
            email: email || `${studentId}@bumail.net`,
            enrolledAt: new Date().toISOString()
          });
        }

        resolve({
          students,
          errors,
          totalParsed: students.length
        });
      },
      error: (error) => {
        resolve({
          students: [],
          errors: [`เกิดข้อผิดพลาดในการอ่านไฟล์: ${error.message}`],
          totalParsed: 0
        });
      }
    });
  });
}

/**
 * Generates sample CSV template for teachers to download
 */
export function downloadSampleStudentCsv() {
  const sampleData = [
    { 'ลำดับ': 1, 'รหัสนักศึกษา': '1640700012', 'ชื่อ-นามสกุล': 'สมชาย ใจดี', 'อีเมล': 'somchai.jai@bumail.net' },
    { 'ลำดับ': 2, 'รหัสนักศึกษา': '1640700020', 'ชื่อ-นามสกุล': 'วิภาดา รักเรียน', 'อีเมล': 'vipada.rak@bumail.net' },
    { 'ลำดับ': 3, 'รหัสนักศึกษา': '1640700038', 'ชื่อ-นามสกุล': 'ณัฐพงษ์ สว่างวงศ์', 'อีเมล': 'nattapong.saw@bumail.net' },
    { 'ลำดับ': 4, 'รหัสนักศึกษา': '1640700046', 'ชื่อ-นามสกุล': 'กานดา แก้วมณี', 'อีเมล': 'kanda.kae@bumail.net' },
    { 'ลำดับ': 5, 'รหัสนักศึกษา': '1640700053', 'ชื่อ-นามสกุล': 'ธนากร มั่นคง', 'อีเมล': 'thanakorn.man@bumail.net' }
  ];

  const csv = Papa.unparse(sampleData);
  // Add UTF-8 BOM so Excel displays Thai characters without garbling
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'BU_Student_List_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports complete attendance matrix and Proportional Scoring to CSV
 */
export function exportAttendanceReportCsv(
  courseCode: string,
  courseName: string,
  section: string,
  plannedSessions: number,
  maxPoints: number,
  sessions: ClassSession[],
  summaries: StudentScoreSummary[]
) {
  const sortedSessions = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);

  const rows = summaries.map((s) => {
    const row: Record<string, any> = {
      'ลำดับ': s.studentNo,
      'รหัสนักศึกษา': s.studentId,
      'ชื่อ-นามสกุล': s.name,
      'อีเมล': s.email
    };

    // Add session columns
    sortedSessions.forEach((sess) => {
      const status = s.sessionStatusMap[sess.id] || 'absent';
      let statusLabel = 'ขาด (Absent)';
      if (status === 'present') statusLabel = 'มาเรียน (Present)';
      else if (status === 'late') statusLabel = 'มาสาย (Late)';
      else if (status === 'excused') statusLabel = 'ลา (Excused)';

      row[`ครั้งที่ ${sess.sessionNumber} (${sess.date})`] = statusLabel;
    });

    row['เข้าเรียนจริง (ครั้ง)'] = s.actualAttendance;
    row['แผนการสอน (ครั้ง)'] = plannedSessions;
    row['ร้อยละการเข้าเรียน (%)'] = `${s.attendanceRate}%`;
    row[`คะแนนสะสม (เต็ม ${maxPoints})`] = s.proportionalScore;

    return row;
  });

  const csv = Papa.unparse(rows);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `รายงานการเข้าเรียน_${courseCode}_Sec${section}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
