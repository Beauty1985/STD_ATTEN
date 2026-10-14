import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Calendar, 
  Mail, 
  ExternalLink,
  ShieldCheck,
  Code2
} from 'lucide-react';

interface GasGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasGuideModal: React.FC<GasGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sampleGasCode = `/**
 * =========================================================================
 * Bangkok University Attendance Integration (Google Apps Script)
 * ฟรี 100% ภายใต้โควตา Google Workspace โดยไม่ต้องใช้ Google Cloud Run
 * =========================================================================
 */

// 1. นำเข้าข้อมูลการเช็คชื่อลง Google Sheets อัตโนมัติ
function syncAttendanceToSheet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // รับข้อมูล JSON payload จาก Webhook หรือการบันทึก
  var data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    new Date(),
    data.courseCode,
    data.section,
    data.sessionNumber,
    data.studentId,
    data.studentName,
    data.studentEmail,
    data.status,
    data.proportionalScore
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 2. ส่งอีเมลแจ้งเตือนนักศึกษาที่ขาดเรียนเกินเกณฑ์ (Gmail Service)
function sendAttendanceWarningEmail(studentEmail, studentName, courseName, absenceCount, currentScore) {
  var subject = "แจ้งเตือนสถิติการเข้าเรียนรายวิชา " + courseName + " (มหาวิทยาลัยกรุงเทพ)";
  var htmlBody = "<h3>เรียน " + studentName + "</h3>" +
    "<p>ระบบได้บันทึกการขาดเรียนของคุณในรายวิชา <b>" + courseName + "</b> สะสมจำนวน <b>" + absenceCount + " ครั้ง</b></p>" +
    "<p>คะแนนการเข้าเรียนปัจจุบันของคุณ (Proportional Score): <b>" + currentScore + " คะแนน</b></p>" +
    "<p>กรุณาติดต่ออาจารย์ผู้สอนหากมีข้อสงสัย</p>";
    
  GmailApp.sendEmail(studentEmail, subject, "", { htmlBody: htmlBody });
}

// 3. สร้างตารางนัดหมายการเรียนลง Google Calendar อัตโนมัติ
function createClassSessionCalendarEvent(courseName, section, sessionNumber, startTime, endTime) {
  var calendar = CalendarApp.getDefaultCalendar();
  var title = "[" + courseName + " Sec " + section + "] เช็คชื่อคาบเรียนที่ " + sessionNumber;
  calendar.createEvent(title, new Date(startTime), new Date(endTime), {
    description: "เช็คชื่อผ่านระบบ BU Dynamic QR Code"
  });
}
`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 sm:p-8 text-slate-900 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>แนวทางเชื่อมต่อ Google Apps Script (GAS)</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  ฟรี 100% No Cloud Run
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                ประหยัดค่าใช้จ่ายด้วย Firebase Spark Plan + Google Apps Script สำหรับ Gmail & Calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs sm:text-sm">
          
          {/* Concept Banner */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>ทำไมต้องใช้ Google Apps Script แทน Google Cloud Run?</span>
            </div>
            <p className="text-emerald-900/90 text-xs leading-relaxed">
              ตามสถาปัตยกรรม <b>Firebase Spark Plan</b> และบัญชีสถาบัน Google Workspace ของมหาวิทยาลัยกรุงเทพ 
              ท่านสามารถใช้ <b>Google Apps Script (GAS)</b> ในการเชื่อมต่อกับ <b>Google Sheets, Google Calendar, และ Gmail</b> 
              ได้ฟรี 100% โดยไม่ต้องเสียค่าบริการเซิร์ฟเวอร์ Cloud Run เพิ่มเติม
            </p>
          </div>

          {/* Features Supported via GAS */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2 text-emerald-700 font-medium mb-1">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Google Sheets</span>
              </div>
              <p className="text-[11px] text-slate-500">
                นำเข้า-ส่งออกคะแนนเข้าสู่สเปรดชีตของอาจารย์แบบอัตโนมัติ
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2 text-rose-700 font-medium mb-1">
                <Mail className="h-4 w-4" />
                <span>Gmail Notice</span>
              </div>
              <p className="text-[11px] text-slate-500">
                ส่งอีเมลแจ้งเตือนนักศึกษาที่ขาดเรียนหรือมีคะแนนสุ่มเสี่ยง
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2 text-indigo-700 font-medium mb-1">
                <Calendar className="h-4 w-4" />
                <span>Google Calendar</span>
              </div>
              <p className="text-[11px] text-slate-500">
                บันทึกตารางคาบเรียนและเวลาเช็คชื่อลงปฏิทินของอาจารย์
              </p>
            </div>
          </div>

          {/* Code Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-700 font-semibold text-xs">
                <Code2 className="h-4 w-4 text-indigo-600" />
                <span>โค้ดตัวอย่าง Google Apps Script (คัดลอกไปวางที่ script.google.com)</span>
              </div>
              <button
                onClick={() => copyToClipboard(sampleGasCode, 'gas_code')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 font-medium transition-colors cursor-pointer"
              >
                {copiedSection === 'gas_code' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600">คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>คัดลอกสคริปต์</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed max-h-56">
              <code>{sampleGasCode}</code>
            </pre>
          </div>

          {/* Quick Steps */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">วิธีติดตั้งสคริปต์ใน 3 ขั้นตอน:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>เปิด Google Sheets ใหม่ แล้วไปที่เมนู <b>ส่วนขยาย (Extensions) &gt; Apps Script</b></li>
              <li>วางโค้ดด้านบนลงในไฟล์ <code className="text-indigo-600 font-semibold">Code.gs</code> แล้วกดบันทึก</li>
              <li>กด <b>ปรับใช้ (Deploy) &gt; การปรับใช้รายการใหม่ (New deployment) &gt; เว็บแอป (Web app)</b> เพื่อรับ Webhook URL</li>
            </ol>
          </div>

        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
