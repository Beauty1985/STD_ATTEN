# BU Attendance Management System (ระบบบริหารจัดการการเข้าเรียน มหาวิทยาลัยกรุงเทพ)

ระบบบริหารจัดการการเข้าเรียนด้วย **Dynamic QR Code (ป้องกันการส่งต่อภาพ)** พร้อมสูตรคำนวณคะแนนตามสัดส่วนจริง (**Proportional Scoring Formula**) และรองรับสถาปัตยกรรม **Serverless ฟรี 100%** ผ่าน **Firebase Spark Plan** + **Google Apps Script** สำหรับอาจารย์และนักศึกษา มหาวิทยาลัยกรุงเทพ

---

## 🌟 ฟังก์ชันหลักของระบบ (Key Features)

1. **Dynamic QR Code เช็คชื่อแบบเรียลไทม์ (20-Second Rotation)**:
   - ป้องกันการแคปภาพหน้าจอส่งต่อด้วย Time-Bucket Hashing หมุนเวียนรหัสอัตโนมัติทุก 20 วินาที
   - ไม่ต้องใช้ Geolocation/GPS ทำให้นักศึกษาเช็คชื่อได้สะดวก รวดเร็ว และเป็นส่วนตัว
   - แสดงรายชื่อและจำนวนนักศึกษาที่เช็คชื่อแบบ Real-time เข้าสู่ระบบทันที

2. **ระบบคิดคะแนนตามสัดส่วน (Proportional Scoring System)**:
   - คำนวณคะแนนสะสมอัตโนมัติตามสูตร:
     $$\text{score} = \left(\frac{\text{actualAttendance}}{\text{plannedSessions}}\right) \times \text{maxPoints}$$
   - อาจารย์สามารถแก้ไขสถานะย้อนหลังได้ (Present, Late, Excused, Absent) พร้อมระบุหมายเหตุ

3. **การจัดการรายชื่อและส่งออกรายงาน (CSV & Reports)**:
   - นำเข้ารายชื่อนักศึกษาผ่านไฟล์ CSV รองรับภาษาไทย (UTF-8)
   - ส่งออกรายงานสรุปคะแนนและสถิติการเข้าเรียนเป็นไฟล์ CSV นำไปเปิดใน Microsoft Excel หรือ Google Sheets ได้ทันที

4. **การแบ่งสิทธิ์ตามโดเมนอีเมลสถาบัน (Domain-based RBAC)**:
   - อาจารย์: `@bu.ac.th` (สามารถสร้างรายวิชา, เปิด Dynamic QR, นำเข้ารายชื่อ, และดูสถิติ)
   - นักศึกษา: `@bumail.net` (สามารถสแกน QR Code เพื่อเช็คชื่อและดูคะแนนสะสมของตนเอง)

5. **สถาปัตยกรรมประหยัดค่าใช้จ่าย (100% Free Tier - No Google Cloud Run)**:
   - ใช้งาน **Firebase Spark Plan** (Firebase Auth + Cloud Firestore) ภายใต้โควตาฟรี
   - ใช้ **Google Apps Script (GAS)** ร่วมกับ Google Sheets, Google Calendar และ Gmail เพื่อส่งอีเมลแจ้งเตือนหรือนัดหมายปฏิทินฟรี

---

## 🚀 การ Deploy บน Netlify และ Sync กับ GitHub

### 1. การเชื่อมต่อกับ GitHub
```bash
git init
git add .
git commit -m "feat: BU attendance management system"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

### 2. การ Deploy บน Netlify
1. เข้าสู่ระบบที่ [Netlify.com](https://www.netlify.com)
2. เลือก **"Add new site" > "Import an existing project"**
3. เชื่อมต่อกับ GitHub Repository ที่สร้างไว้
4. ตั้งค่า Build Settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. เพิ่ม Environment Variables ที่เมนู **Site configuration > Environment variables**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. กด **Deploy Site**

---

## 📜 การเชื่อมต่อ Google Apps Script (GAS)

สำหรับอาจารย์ที่ต้องการระบบส่งอีเมลแจ้งเตือนนักศึกษาที่ขาดเรียน หรือบันทึกคะแนนลง Google Sheets:
1. เปิด Google Sheets แล้วไปที่เมนู **ส่วนขยาย (Extensions) > Apps Script**
2. คัดลอกโค้ดจากปุ่ม **"Google Apps Script Sync"** ในระบบไปวางใน `Code.gs`
3. กด **Deploy > New deployment > Web app** เพื่อรับ Webhook URL ใช้งานฟรี 100%
