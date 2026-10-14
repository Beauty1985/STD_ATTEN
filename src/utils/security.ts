import { DynamicQrPayload } from '../types';

const TOKEN_SALT = 'BU_ATTENDANCE_DYNAMIC_SALT_2026';
const ROTATION_SECONDS = 20;

/**
 * Calculates current 20-second time bucket index
 */
export function getCurrentTimeBucket(): number {
  return Math.floor(Date.now() / (ROTATION_SECONDS * 1000));
}

/**
 * Calculates seconds remaining in the current 20s rotation cycle
 */
export function getSecondsRemainingInRotation(): number {
  const msInBucket = Date.now() % (ROTATION_SECONDS * 1000);
  const msRemaining = (ROTATION_SECONDS * 1000) - msInBucket;
  return Math.ceil(msRemaining / 1000);
}

/**
 * Generates a simple checksum hash for the dynamic token
 */
function generateTokenHash(courseId: string, sessionId: string, timeBucket: number): string {
  const raw = `${courseId}:${sessionId}:${timeBucket}:${TOKEN_SALT}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(6, '0');
}

/**
 * Generates the full dynamic QR payload for teacher display
 */
export function generateDynamicQrPayload(
  courseId: string,
  sessionId: string,
  sessionNumber: number
): { payloadString: string; payload: DynamicQrPayload } {
  const timeBucket = getCurrentTimeBucket();
  const token = generateTokenHash(courseId, sessionId, timeBucket);
  const issuedAt = timeBucket * (ROTATION_SECONDS * 1000);
  const expiresAt = (timeBucket + 1) * (ROTATION_SECONDS * 1000);

  const payload: DynamicQrPayload = {
    courseId,
    sessionId,
    sessionNumber,
    timeBucket,
    token,
    issuedAt,
    expiresAt
  };

  const payloadString = JSON.stringify({
    app: 'BU_ATTENDANCE',
    cid: courseId,
    sid: sessionId,
    sn: sessionNumber,
    tb: timeBucket,
    tk: token,
    exp: expiresAt
  });

  return { payloadString, payload };
}

/**
 * Validates a scanned QR payload or code string against active session rules
 * Allows current bucket and immediately preceding bucket (tolerance window: 40 seconds)
 */
export function validateDynamicQrCode(
  rawScannedData: string,
  expectedCourseId: string,
  expectedSessionId: string
): { isValid: boolean; error?: string; sessionNumber?: number } {
  try {
    let parsed: any;
    try {
      parsed = JSON.parse(rawScannedData);
    } catch {
      return { isValid: false, error: 'รูปแบบ QR Code ไม่ถูกต้อง' };
    }

    if (parsed.app !== 'BU_ATTENDANCE' && !parsed.cid) {
      return { isValid: false, error: 'QR Code นี้ไม่ใช่ของระบบเช็คชื่อ มหาวิทยาลัยกรุงเทพ' };
    }

    const courseId = parsed.cid || parsed.courseId;
    const sessionId = parsed.sid || parsed.sessionId;
    const sessionNumber = parsed.sn || parsed.sessionNumber;
    const timeBucket = parsed.tb || parsed.timeBucket;
    const token = parsed.tk || parsed.token;

    if (courseId !== expectedCourseId) {
      return { isValid: false, error: 'QR Code ไม่ตรงกับรายวิชาที่เลือก' };
    }

    if (sessionId !== expectedSessionId) {
      return { isValid: false, error: 'QR Code ไม่ตรงกับคาบเรียนที่กำลังเปิดเช็คชื่อ' };
    }

    const currentBucket = getCurrentTimeBucket();
    // Allow current bucket (0) or previous bucket (-1) for network latency
    const bucketDiff = currentBucket - timeBucket;

    if (bucketDiff < 0) {
      return { isValid: false, error: 'เวลาของอุปกรณ์ไม่ตรงกับระบบ กรุณาตั้งเวลาอัตโนมัติ' };
    }

    if (bucketDiff > 1) {
      return { isValid: false, error: 'QR Code นี้หมดอายุแล้ว (เปลี่ยนรหัสทุก 20 วินาที) กรุณาสแกนรหัสใหม่บนหน้าจออาจารย์' };
    }

    // Verify token cryptographic hash
    const expectedToken = generateTokenHash(courseId, sessionId, timeBucket);
    if (token !== expectedToken) {
      return { isValid: false, error: 'รหัสความปลอดภัยไม่ถูกต้องหรือถูกดัดแปลง' };
    }

    return { isValid: true, sessionNumber };
  } catch (err) {
    return { isValid: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบรหัส' };
  }
}

/**
 * Proportional Scoring calculation mandated in specification:
 * score = (actualAttendance / plannedSessions) * maxPoints
 */
export function calculateProportionalScore(
  actualAttendance: number,
  plannedSessions: number,
  maxPoints: number
): { score: number; percentage: number } {
  if (!plannedSessions || plannedSessions <= 0) {
    return { score: 0, percentage: 0 };
  }

  const attendanceRatio = actualAttendance / plannedSessions;
  const rawScore = attendanceRatio * maxPoints;
  const percentage = Math.min(100, Math.round(attendanceRatio * 1000) / 10);
  const score = Math.round(rawScore * 100) / 100; // 2 decimal precision

  return { score, percentage };
}
