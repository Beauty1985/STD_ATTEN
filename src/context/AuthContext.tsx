import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  isLoading: boolean;
  isDemoMode: boolean;
  error: string | null;
  loginWithGoogle: (intendedRole: UserRole) => Promise<boolean>;
  loginAsDemo: (role: UserRole, email?: string, name?: string, studentId?: string) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_TEACHER: UserProfile = {
  uid: 'teacher-demo-001',
  email: 'walailuk.p@bu.ac.th',
  displayName: 'ผศ.ดร. วไลลักษณ์ ภิญโญชีพ',
  role: 'teacher',
  photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
};

const DEMO_STUDENT: UserProfile = {
  uid: 'student-demo-1640700012',
  email: 'somchai.jai@bumail.net',
  displayName: 'นายสมชาย ใจดี',
  role: 'student',
  studentId: '1640700012',
  photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check saved demo user in session storage
    const savedDemo = sessionStorage.getItem('bu_demo_user');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser(parsed);
        setIsDemoMode(true);
        setIsLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem('bu_demo_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        const email = fbUser.email.toLowerCase();
        try {
          // Check role from Firestore profile or determine from domain
          const userDocRef = doc(db, 'users', fbUser.uid);
          let userProfile: UserProfile | null = null;

          try {
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              userProfile = userSnap.data() as UserProfile;
            }
          } catch (err) {
            console.warn('Could not read user profile doc, falling back to email domain detection');
          }

          if (!userProfile) {
            // Determine role by domain rule:
            // @bu.ac.th -> Teacher
            // @bumail.net or other -> Student
            const isTeacher = email.endsWith('@bu.ac.th');
            const studentIdMatch = email.match(/^([0-9a-zA-Z-]+)@/);
            const studentId = !isTeacher && studentIdMatch ? studentIdMatch[1] : '';

            userProfile = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || (isTeacher ? 'อาจารย์ มหาวิทยาลัยกรุงเทพ' : 'นักศึกษา มหาวิทยาลัยกรุงเทพ'),
              role: isTeacher ? 'teacher' : 'student',
              studentId: isTeacher ? undefined : studentId,
              photoURL: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString()
            };

            // Save to Firestore
            try {
              await setDoc(userDocRef, userProfile, { merge: true });
            } catch (err) {
              console.warn('Non-blocking: could not persist user profile to Firestore:', err);
            }
          }

          setUser(userProfile);
          setIsDemoMode(false);
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setError('ไม่สามารถโหลดข้อมูลผู้ใช้งานได้');
        }
      } else if (!savedDemo) {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (intendedRole: UserRole): Promise<boolean> => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = (result.user.email || '').toLowerCase();

      // Strict Domain Validation
      if (intendedRole === 'teacher' && !email.endsWith('@bu.ac.th')) {
        await fbSignOut(auth);
        setUser(null);
        setError('เข้าสู่ระบบไม่สำเร็จ: บัญชีอาจารย์ต้องใช้อีเมลโดเมนสถาบัน (@bu.ac.th) เท่านั้น');
        return false;
      }

      if (intendedRole === 'student' && !email.endsWith('@bumail.net')) {
        // Show informative warning if domain is different (or strictly enforce @bumail.net)
        if (!email.endsWith('@bumail.net') && !email.endsWith('@bu.ac.th') && !email.endsWith('@gmail.com')) {
          await fbSignOut(auth);
          setUser(null);
          setError('เข้าสู่ระบบไม่สำเร็จ: บัญชีนักศึกษาต้องใช้อีเมลโดเมนสถาบัน (@bumail.net) เท่านั้น');
          return false;
        }
      }

      return true;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('ยกเลิกการเข้าสู่ระบบผ่าน Google');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('โดเมนของแอพยังไม่ได้รับอนุญาตใน Firebase Console กรุณาใช้โหมดทดสอบจำลอง (Demo Mode)');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Google');
      }
      return false;
    }
  };

  const loginAsDemo = (role: UserRole, customEmail?: string, customName?: string, customStudentId?: string) => {
    setError(null);
    let demoUser: UserProfile;
    if (role === 'teacher') {
      demoUser = {
        ...DEMO_TEACHER,
        email: customEmail || DEMO_TEACHER.email,
        displayName: customName || DEMO_TEACHER.displayName
      };
    } else {
      demoUser = {
        ...DEMO_STUDENT,
        email: customEmail || DEMO_STUDENT.email,
        displayName: customName || DEMO_STUDENT.displayName,
        studentId: customStudentId || DEMO_STUDENT.studentId
      };
    }

    sessionStorage.setItem('bu_demo_user', JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemoMode(true);
  };

  const logout = async () => {
    sessionStorage.removeItem('bu_demo_user');
    setIsDemoMode(false);
    setUser(null);
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      isLoading,
      isDemoMode,
      error,
      loginWithGoogle,
      loginAsDemo,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
