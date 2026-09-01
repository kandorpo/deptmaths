import React, { useState, useEffect, useRef } from 'react';
import { hashPassword, verifyPassword } from '../utils/hashHelper';
import { compressFile } from '../utils/fileCompressor';
import {
  GraduationCap,
  FileText,
  Download,
  BookOpen,
  Calendar,
  X,
  Sparkles,
  HelpCircle,
  Laptop,
  CheckCircle2,
  ExternalLink,
  UserPlus,
  LogIn,
  LogOut,
  User,
  Camera,
  Upload,
  Edit3,
  Save,
  Mail,
  Phone,
  Hash,
  ShieldCheck,
  ShieldAlert,
  Award,
  IdCard,
  Layers,
  ArrowRight,
  ArrowUp,
  AlertCircle,
  RefreshCw,
  Info,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  ChevronDown,
  Check
} from 'lucide-react';
import { DEFAULT_STUDENT_PROFILES } from '../data/departmentData';
import { StudentProfile, RoutineSlot } from '../types';
import { useDepartmentData } from '../context/DataContext';
import { downloadStudyResourcePDF, downloadClassRoutinePDF } from '../utils/downloadHelper';

interface StudentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_STUDENT = 'dudhnoi_math_student_user';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
];

export const StudentPortalModal: React.FC<StudentPortalModalProps> = ({ isOpen, onClose }) => {
  const getSmsUrl = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent || '');
    return `sms:${cleanPhone}${isIos ? '&' : '?'}body=${encodeURIComponent(text)}`;
  };

  const getWaUrl = (phone: string, text: string) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // OTP Countdown and background delivery states
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [activeNotifications, setActiveNotifications] = useState<{ id: string; sender: string; text: string }[]>([]);

  const triggerNotification = (sender: string, text: string) => {
    const id = Math.random().toString();
    setActiveNotifications(prev => [...prev, { id, sender, text }]);
    // Audio feedback for receiving a real-time OTP message
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // chime frequency
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
    setTimeout(() => {
      setActiveNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  };

  // Visual countdown timer effects
  useEffect(() => {
    if (forgotCountdown > 0) {
      const timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [forgotCountdown]);

  const {
    faculty,
    departmentStudents,
    verifyStudentEligibility,
    routineSlots,
    registeredStudentProfiles,
    addRegisteredStudentProfile,
    updateRegisteredStudentProfile,
    portalResources
  } = useDepartmentData();

  const [activeTab, setActiveTab] = useState<'profile' | 'downloads' | 'routine'>('profile');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Public/Guest portal states
  const [publicSemester, setPublicSemester] = useState('B.Sc. 1st Semester (Major)');
  const [publicResourceCategory, setPublicResourceCategory] = useState<'all' | 'Syllabus' | 'PYQ' | 'Lecture Notes' | 'Handbook'>('all');
  const [publicResourceSearch, setPublicResourceSearch] = useState('');

  // Stored / Logged-in Student state
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const registeredStudents = registeredStudentProfiles || DEFAULT_STUDENT_PROFILES;

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginNotice, setLoginNotice] = useState('');

  // Forgot password flow states
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);
  const [forgotOtpInput, setForgotOtpInput] = useState('');
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState('');
  const [forgotOtpMessage, setForgotOtpMessage] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regRollNo, setRegRollNo] = useState('');
  const [regGuRegNo, setRegGuRegNo] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regProgram, setRegProgram] = useState<'B.Sc. Mathematics (Honours/Major)' | 'B.Sc. Mathematics (Minor)' | 'M.Sc. Mathematics'>('B.Sc. Mathematics (Honours/Major)');
  const [regSemester, setRegSemester] = useState('B.Sc. 1st Semester (Major)');
  const [regBatch, setRegBatch] = useState('2024 - 2028');
  const [regBio, setRegBio] = useState('');
  const [regInterests, setRegInterests] = useState('Calculus, Linear Algebra');
  const [regAvatar, setRegAvatar] = useState(PRESET_AVATARS[0]);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');
  const [avatarError, setAvatarError] = useState('');


  // Rejection Alert Modal state for non-department students
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionAttemptDetails, setRejectionAttemptDetails] = useState<{
    name: string;
    roll: string;
    course: string;
  } | null>(null);

  // Profile Edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const registerFileInputRef = useRef<HTMLInputElement>(null);

  // Reset forms on modal open
  useEffect(() => {
    if (isOpen) {
      if (!currentStudent) {
        setLoginIdentifier('');
        setLoginPassword('');
      }
      setLoginError('');
      setLoginNotice('');
      setForgotError('');
      setForgotSuccess('');
      setForgotOtpSent(false);
      setForgotOtpVerified(false);
      setRegError('');
      setRegSuccess(false);
      setAvatarError('');
    }
  }, [isOpen, currentStudent]);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY_STUDENT);
      if (storedUser) {
        setCurrentStudent(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error loading student profile from localStorage:', err);
    }
  }, []);

  // Update edit form when current student changes
  useEffect(() => {
    if (currentStudent) {
      setEditBio(currentStudent.bio || '');
      setEditPhone(currentStudent.phone || '');
      setEditInterests(currentStudent.interests?.join(', ') || '');
    }
  }, [currentStudent]);

  // Scroll management states & refs
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const studentScrollRef = useRef<HTMLDivElement>(null);

  const handleStudentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = scrollHeight > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100))) : 0;
    setScrollProgress(progress);
    setShowScrollTop(scrollTop > 100);
  };

  const scrollToTop = () => {
    if (studentScrollRef.current) {
      studentScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset scroll on tab or view changes
  useEffect(() => {
    if (studentScrollRef.current) {
      studentScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setScrollProgress(0);
    setShowScrollTop(false);
  }, [activeTab, authMode]);

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginNotice('');

    const query = loginIdentifier.trim().toLowerCase();
    if (!query) {
      setLoginError('Please enter your Class Roll No, GU Roll No, or College Email.');
      return;
    }

    const found = registeredStudents.find(
      (s) =>
        (s.rollNo || '').toLowerCase() === query ||
        (s.email || '').toLowerCase() === query ||
        (s.guRegNo && (s.guRegNo || '').toLowerCase() === query)
    );

    if (found) {
      if (found.password) {
        if (!loginPassword) {
          setLoginError('Password is required to login.');
          return;
        }
        const isCorrect = await verifyPassword(loginPassword, found.password);
        if (!isCorrect) {
          setLoginError('Incorrect password. Please try again.');
          return;
        }
      }
      setCurrentStudent(found);
      localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(found));
      setLoginIdentifier('');
      setLoginPassword('');
    } else {
      setLoginError('No registered student found with these credentials. Please check or register as a new student.');
    }
  };



  // Forgot Password Flow Handlers
  const handleForgotSendOtp = () => {
    setForgotError('');
    setForgotOtpMessage('');
    const query = forgotIdentifier.trim().toLowerCase();
    if (!query) {
      setForgotError('Please enter your registered mobile/WhatsApp number.');
      return;
    }

    const cleanQuery = query.replace(/[^0-9]/g, '');
    const found = registeredStudents.find((s) => {
      if (!s.phone) return false;
      const cleanPhone = (s.phone || '').replace(/[^0-9]/g, '');
      if (cleanQuery.length >= 10 && cleanPhone.endsWith(cleanQuery)) return true;
      return (s.phone || '').toLowerCase().includes(query);
    });

    if (!found) {
      setForgotError('No registered student account was found with this mobile/WhatsApp number.');
      return;
    }

    const phoneNum = found.phone || '';
    if (!phoneNum) {
      setForgotError('No mobile number is registered for this student. Please contact the department.');
      return;
    }

    // Mask phone number for security, e.g. +91 ******1234
    const maskedPhone = phoneNum.length > 4 
      ? `${phoneNum.substring(0, phoneNum.length - 4).replace(/\d/g, '*')}${phoneNum.substring(phoneNum.length - 4)}`
      : phoneNum;

    const dummyOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setForgotGeneratedOtp(dummyOtp);
    setForgotOtpSent(true);
    setForgotCountdown(60);
    setForgotOtpMessage(`Secure OTP sent to your WhatsApp number ${maskedPhone}. Please enter it below to verify.`);

    // Simulate receiving a background WhatsApp notification automatically on the current screen
    setTimeout(() => {
      triggerNotification(
        "WhatsApp (Dudhnoi Math Portal)",
        `Verification Code: ${dummyOtp}. Use this OTP to reset your student portal password.`
      );
    }, 1500);
  };

  const handleForgotVerifyOtp = () => {
    setForgotError('');
    if (forgotOtpInput === forgotGeneratedOtp) {
      setForgotOtpVerified(true);
      setForgotOtpMessage('Mobile number verified successfully! You can now create a new password.');
    } else {
      setForgotError('Invalid OTP. Please try again.');
    }
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotNewPassword) {
      setForgotError('Please enter a new password.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    const query = forgotIdentifier.trim().toLowerCase();
    const cleanQuery = query.replace(/[^0-9]/g, '');
    const matched = registeredStudents.find((s) => {
      const cleanPhone = (s.phone || '').replace(/[^0-9]/g, '');
      return ((s.email || '').toLowerCase() === query) ||
             ((s.roll || '').toLowerCase() === query) ||
             (cleanQuery.length >= 10 && cleanPhone.endsWith(cleanQuery)) ||
             ((s.phone || '').toLowerCase().includes(query));
    });

    if (matched) {
      const hashedPassword = await hashPassword(forgotNewPassword);
      const updated = { ...matched, password: hashedPassword };
      updateRegisteredStudentProfile(updated);
      if (currentStudent && currentStudent.id === matched.id) {
        setCurrentStudent(updated);
        localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(updated));
      }
    }

    // Clear forgot states
    setForgotIdentifier('');
    setForgotOtpSent(false);
    setForgotOtpVerified(false);
    setForgotOtpInput('');
    setForgotGeneratedOtp('');
    setForgotOtpMessage('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');

    // Go back to login with success message
    setAuthMode('login');
    setLoginError('');
    // Use an alert or general trigger for success
    alert('Password updated successfully! You can now log in with your new password.');
  };

  // Handle Registration with Mandatory Department Roster Verification
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim() || !regRollNo.trim() || !regEmail.trim() || !regPassword) {
      setRegError('Please fill in all mandatory fields, including password.');
      return;
    }

    if (regPassword && regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    // MANDATORY GATEKEEPER CHECK:
    // Check if the student exists in the official Department of Mathematics roster with matching Name and Course
    const verification = verifyStudentEligibility(regFullName, regRollNo, regProgram);

    if (!verification.isEligible) {
      // Trigger the explicit "YOU ARE NOT A STUDENT OF OUR DEPARTMENT" popup alert
      setRejectionReason(
        verification.reason ||
          'Your submitted full name and enrolled program do not match any authorized student in the Department of Mathematics roster.'
      );
      setRejectionAttemptDetails({
        name: regFullName.trim(),
        roll: regRollNo.trim(),
        course: regProgram
      });
      setRejectionModalOpen(true);
      setRegError('YOU ARE NOT A STUDENT OF OUR DEPARTMENT');
      return;
    }

    // Check duplicate in registered active portal users
    const exists = registeredStudents.some(
      (s) => (s.rollNo || '').toLowerCase() === regRollNo.trim().toLowerCase() || (s.email || '').toLowerCase() === regEmail.trim().toLowerCase()
    );

    if (exists) {
      setRegError('A student with this Roll Number or Email has already activated their portal account. Please log in.');
      return;
    }

    // Assign mentor (use matched student's assigned mentor or faculty member)
    const matched = verification.matchedStudent;
    const assignedMentor = matched?.mentorName || faculty[0]?.name || 'Dr. Bidyut Kalita (HOD)';

    const hashedPassword = await hashPassword(regPassword);

    const newStudent: StudentProfile = {
      id: `stu-${Date.now()}`,
      fullName: matched ? matched.fullName : regFullName.trim(),
      rollNo: matched ? matched.rollNo : regRollNo.trim(),
      guRegNo: regGuRegNo.trim() || matched?.guRegNo || '',
      email: regEmail.trim(),
      phone: regPhone.trim() || matched?.phone || '',
      program: regProgram,
      semester: matched?.semester || regSemester,
      batch: matched?.batch || regBatch,
      avatar: regAvatar,
      bio: regBio.trim(),
      mentorName: assignedMentor,
      interests: regInterests.split(',').map((i) => i.trim()).filter(Boolean),
      password: hashedPassword,
      registeredDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };

    addRegisteredStudentProfile(newStudent);

    // Reset registration form fields
    setRegFullName('');
    setRegRollNo('');
    setRegGuRegNo('');
    setRegEmail('');
    setRegPhone('');
    setRegBio('');
    setRegPassword('');
    setRegConfirmPassword('');

    // Clear login credentials fields so user enters them explicitly
    setLoginIdentifier('');
    setLoginPassword('');
    setLoginError('');

    // Set success notification and prompt user to login explicitly
    setLoginNotice(`Registration completed successfully for ${newStudent.fullName}! Please enter your password below to log in to your student profile.`);
    setAuthMode('login');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentStudent(null);
    localStorage.removeItem(STORAGE_KEY_STUDENT);
    setIsEditingProfile(false);
    setActiveTab('profile');
  };

  // Profile Picture File Upload Handler (Data URL)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isRegisterForm = false) => { setAvatarError(''); 
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setAvatarUploadLoading(true);
    try {
      const compressedFile = await compressFile(file, 150);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (isRegisterForm) {
          setRegAvatar(dataUrl);
        } else if (currentStudent) {
          const updated = { ...currentStudent, avatar: dataUrl };
          setCurrentStudent(updated);
          localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(updated));

          updateRegisteredStudentProfile(updated);
        }
        setAvatarUploadLoading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Image compression failed:', err);
      setAvatarUploadLoading(false);
    }
  };

  // Save Profile Edits
  const handleSaveProfileEdits = () => {
    if (!currentStudent) return;
    const updated: StudentProfile = {
      ...currentStudent,
      phone: editPhone.trim() || currentStudent.phone,
      bio: editBio.trim() || currentStudent.bio,
      interests: editInterests.split(',').map((i) => i.trim()).filter(Boolean)
    };

    setCurrentStudent(updated);
    localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(updated));

    updateRegisteredStudentProfile(updated);

    setIsEditingProfile(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-portal-title"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[94dvh] sm:h-[92dvh] max-h-[calc(100dvh-16px)] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-start justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-blue-900 text-amber-400 rounded-xl shadow-xs" aria-hidden="true">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Student Academic Hub & Profile
                </span>
                {currentStudent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{currentStudent.fullName}</span>
                  </span>
                )}
              </div>
              <h3 id="student-portal-title" className="text-lg sm:text-xl font-bold text-slate-900 font-heading mt-0.5">
                Department of Mathematics Portal
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close portal dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Scroll Progress Indicator */}
        <div className="w-full h-1 bg-slate-100 shrink-0 relative overflow-hidden" title={`Scroll Progress: ${scrollProgress}%`}>
          <div 
            className="h-full bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500 transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Tab Navigation - Only accessible after a student logs in */}
        {currentStudent && (
          <div className="px-4 sm:px-6 pt-3 pb-2.5 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar scroll-smooth touch-pan-x" role="tablist" aria-label="Student portal navigation">
              <button
                onClick={() => setActiveTab('profile')}
                role="tab"
                aria-selected={activeTab === 'profile'}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('downloads')}
                role="tab"
                aria-selected={activeTab === 'downloads'}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'downloads'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Study Materials & PYQs</span>
              </button>

              <button
                onClick={() => setActiveTab('routine')}
                role="tab"
                aria-selected={activeTab === 'routine'}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'routine'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Class Routine & Timetable</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body Container */}
        <div 
          ref={studentScrollRef}
          onScroll={handleStudentScroll}
          className="flex-1 min-h-0 overflow-y-auto custom-scrollbar scroll-smooth p-4 sm:p-6 space-y-6 touch-pan-y relative overscroll-contain"
        >

        {/* TAB 1: STUDENT PROFILE & AUTHENTICATION */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            
            {/* If Logged In: Display Profile & Profile Picture Changer */}
            {currentStudent ? (
              <div className="space-y-6">
                
                {/* Profile Header Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-lg border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
                    
                    {/* Avatar & Photo Upload Controls */}
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="relative group">
                        <img
                          src={currentStudent.avatar}
                          alt={currentStudent.fullName}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md bg-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          title="Change Profile Picture"
                          className="absolute -bottom-1.5 -right-1.5 p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg border border-amber-300 transition-transform active:scale-95 cursor-pointer flex items-center justify-center"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, false)}
                          className="hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                            {currentStudent.program}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 bg-slate-800/80 border border-slate-700">
                            Batch {currentStudent.batch}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                          {currentStudent.fullName}
                        </h2>
                        <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                          <span>Roll: <strong className="text-amber-300 font-mono">{currentStudent.rollNo}</strong></span>
                          <span>•</span>
                          <span>Enrolment / Reg: <strong className="text-slate-200 font-mono">{currentStudent.guRegNo}</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Actions: Edit Profile, Sign Out */}
                    <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>

                      <button
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isEditingProfile
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-200 text-xs font-semibold rounded-lg border border-red-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>

                  {/* Preset Avatar Selector Quick Picker */}
                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Choose Avatar or Upload Custom Photo:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {PRESET_AVATARS.map((imgUrl, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const updated = { ...currentStudent, avatar: imgUrl };
                            setCurrentStudent(updated);
                            localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(updated));
                            updateRegisteredStudentProfile(updated);
                          }}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                            currentStudent.avatar === imgUrl ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={imgUrl} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Edit Profile Form (Conditional) */}
                {isEditingProfile && (
                  <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-4 animate-in fade-in duration-150 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-blue-800" />
                        <span>Update Personal Details & Mathematical Interests</span>
                      </h4>
                      <span className="text-[11px] text-slate-500">Changes are saved instantly to your device</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Phone / WhatsApp Number</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Areas of Mathematical Interest (comma-separated)</label>
                        <input
                          type="text"
                          value={editInterests}
                          onChange={(e) => setEditInterests(e.target.value)}
                          placeholder="e.g. Number Theory, Differential Equations, SageMath"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Short Bio / Academic Ambition</label>
                      <textarea
                        rows={2}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Tell the department about your academic pursuits, Olympiad prep, or research goals..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 resize-none"
                      ></textarea>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfileEdits}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile Changes</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Profile Details & Academic Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Left Column: Academic Credentials & Contact */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-blue-900" />
                          <span>Academic Enrollment Information</span>
                        </h4>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Active Student
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Enrolled Program</span>
                          <span className="font-bold text-slate-800">{currentStudent.program}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Current Semester</span>
                          <span className="font-bold text-slate-800">{currentStudent.semester}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Official Student Email</span>
                          <span className="font-medium text-blue-900">{currentStudent.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Contact Phone</span>
                          <span className="font-medium text-slate-800">{currentStudent.phone}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[11px]">Registration Date</span>
                          <span className="font-medium text-slate-800">{currentStudent.registeredDate}</span>
                        </div>
                      </div>

                      {currentStudent.bio && (
                        <div className="pt-2 border-t border-slate-200/80">
                          <span className="text-slate-500 block text-[11px] mb-1">Student Bio / Statement:</span>
                          <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                            "{currentStudent.bio}"
                          </p>
                        </div>
                      )}

                      {currentStudent.interests && currentStudent.interests.length > 0 && (
                        <div className="pt-2">
                          <span className="text-slate-500 block text-[11px] mb-1.5">Special Interests & Coding:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {currentStudent.interests.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded border border-blue-200 text-[11px] font-medium">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Digital Student ID Badge */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-b from-blue-900 to-slate-900 text-white shadow-md border border-blue-800 text-xs space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between border-b border-white/20 pb-2">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">Dudhnoi College</span>
                          <h5 className="font-bold text-white leading-tight">Digital Student ID Card</h5>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-serif font-bold flex items-center justify-center text-sm">
                          ∑
                        </div>
                      </div>

                      <div className="flex items-center gap-3 py-1">
                        <img
                          src={currentStudent.avatar}
                          alt={currentStudent.fullName}
                          className="w-14 h-14 rounded-lg object-cover border border-amber-300 shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-amber-300">{currentStudent.fullName}</p>
                          <p className="text-[11px] text-slate-200">{currentStudent.semester}</p>
                          <p className="text-[10px] font-mono text-slate-300">{currentStudent.rollNo}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                        <span>Status: <strong className="text-emerald-400">VERIFIED</strong></span>
                        <span>Dept: <strong className="text-white">Mathematics</strong></span>
                      </div>

                      {/* Barcode representation */}
                      <div className="h-6 w-full bg-white/20 rounded flex items-center justify-center font-mono text-[9px] tracking-widest text-slate-200">
                        ||| | |||| | | |||| ||| ||
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                      <span className="font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Departmental Privileges</span>
                      </span>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Access granted to Computing Lab Workstations (SageMath/Python), Seminar Library borrowing (up to 4 volumes), and departmental seminar registrations.
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              /* If NOT Logged In: Show Login / Register Switcher */
              <div className="space-y-5">
                
                {/* Switcher tabs */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setLoginError('');
                        setRegError('');
                      }}
                      className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        authMode === 'login'
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Existing Student Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('register');
                        setLoginError('');
                        setRegError('');
                        setLoginNotice('');
                      }}
                      className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        authMode === 'register'
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register As New Student</span>
                    </button>
                  </div>
                </div>

                {/* MODE A: LOGIN */}
                {authMode === 'login' && (
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="text-center space-y-1">
                      <h4 className="text-base font-bold text-slate-900">Student Portal Sign In</h4>
                      <p className="text-xs text-slate-500">
                        Enter your Class Roll No, GU Roll Number, or College Email address.
                      </p>
                    </div>

                    {loginNotice && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold text-emerald-950">Registration Complete!</p>
                            <p className="text-[11px] text-emerald-800">{loginNotice}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLoginNotice('')}
                          className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer px-1.5 py-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {loginError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-3.5 text-xs" autoComplete="off">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Roll No / Enrolment No / Reg. No / Email *
                        </label>
                        <div className="relative">
                          <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="Roll No or College Email"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            autoComplete="off"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all text-xs text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-semibold text-slate-700">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('forgot');
                              setForgotError('');
                              setForgotOtpMessage('');
                              setForgotSuccess('');
                            }}
                            className="text-blue-900 hover:underline text-[11px] font-bold"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <input
                          type="password"
                          placeholder="Password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          autoComplete="new-password"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all text-xs text-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Log In to Student Portal</span>
                      </button>
                    </form>


                  </div>
                )}

                {/* MODE C: FORGOT PASSWORD */}
                {authMode === 'forgot' && (
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="text-center space-y-1">
                      <h4 className="text-base font-bold text-slate-900">Reset Portal Password</h4>
                      <p className="text-xs text-slate-500">
                        Verify your account using your registered Mobile/WhatsApp number.
                      </p>
                    </div>

                    {forgotError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{forgotError}</span>
                      </div>
                    )}

                    <form onSubmit={handleForgotResetPassword} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Mobile/WhatsApp number *
                        </label>
                        <div className="relative flex gap-2">
                          <div className="relative flex-1">
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              required
                              disabled={forgotOtpVerified}
                              placeholder="+91 94350 XXXXX"
                              value={forgotIdentifier}
                              onChange={(e) => setForgotIdentifier(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all text-xs text-slate-800 disabled:opacity-70"
                            />
                          </div>
                          {!forgotOtpVerified && (
                            <button
                              type="button"
                              disabled={forgotCountdown > 0}
                              onClick={handleForgotSendOtp}
                              className={`px-4 py-2.5 font-bold rounded-lg text-xs whitespace-nowrap cursor-pointer transition-all ${
                                forgotCountdown > 0 
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                                  : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                              }`}
                            >
                              {forgotOtpSent 
                                ? forgotCountdown > 0 
                                  ? `Resend in ${forgotCountdown}s` 
                                  : "Resend OTP" 
                                : "Send OTP"}
                            </button>
                          )}
                        </div>
                      </div>

                      {forgotOtpMessage && (
                        <div className={`p-2.5 rounded-lg text-[11px] font-medium leading-relaxed ${
                          forgotOtpVerified ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 animate-pulse' : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {forgotOtpMessage}
                        </div>
                      )}

                      {forgotOtpSent && !forgotOtpVerified && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                          {forgotCountdown > 0 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500 font-medium">OTP Code validity timer</span>
                                <span className="font-bold text-blue-900 font-mono">{forgotCountdown}s</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-900 transition-all duration-1000 ease-linear rounded-full"
                                  style={{ width: `${(forgotCountdown / 60) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter 6-digit OTP code"
                              value={forgotOtpInput}
                              onChange={(e) => setForgotOtpInput(e.target.value)}
                              className="flex-1 px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={handleForgotVerifyOtp}
                              className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg text-xs whitespace-nowrap cursor-pointer transition-colors"
                            >
                              Verify OTP
                            </button>
                          </div>
                        </div>
                      )}

                      {forgotOtpVerified && (
                        <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100 animate-in fade-in slide-in-from-top-4">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
                            <input
                              type="password"
                              required
                              placeholder="Create a strong password"
                              value={forgotNewPassword}
                              onChange={(e) => setForgotNewPassword(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                            <input
                              type="password"
                              required
                              placeholder="Re-enter to confirm"
                              value={forgotConfirmPassword}
                              onChange={(e) => setForgotConfirmPassword(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setLoginError('');
                          }}
                          className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs text-center"
                        >
                          Cancel
                        </button>
                        {forgotOtpVerified && (
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
                          >
                            Reset Password
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                {/* MODE B: REGISTRATION */}
                {authMode === 'register' && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <h4 className="text-base font-bold text-slate-900">Department Student Registration</h4>
                      <p className="text-xs text-slate-500">
                        Create your student profile to access digital notes, track mentorship, and customize your avatar.
                      </p>
                    </div>

                    {/* Department Authorization Gatekeeper Notice */}
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-amber-900">Department Roster Verification Active</p>
                        <p className="text-[11px] text-amber-800/90 leading-relaxed">
                          Registration is restricted to enrolled students of the Department of Mathematics. Please enter your name, roll number, and enrolled course as registered in official college records.
                        </p>
                      </div>
                    </div>

                    {regError && (
                      <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-800 text-xs flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                          <div>
                            <p className="font-bold text-red-950 uppercase tracking-wide">{regError}</p>
                            <p className="text-[11px] text-red-700">The entered details do not match the authorized departmental roster.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRejectionModalOpen(true)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-md transition-colors cursor-pointer shrink-0"
                        >
                          View Details
                        </button>
                      </div>
                    )}

                    {regSuccess && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Registration successful! Welcome to the Department of Mathematics.</span>
                      </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4 text-xs">
                      
                      {/* Photo Upload & Avatar Picker Section */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <span className="font-bold text-slate-800 block">
                          Profile Picture / Student Photo *
                        </span>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="relative group shrink-0">
                            <img
                              src={regAvatar}
                              alt="Profile Preview"
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-900 shadow-md bg-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => registerFileInputRef.current?.click()}
                              className="absolute -bottom-1 -right-1 p-1.5 bg-blue-900 text-white rounded-lg hover:bg-blue-950 shadow cursor-pointer"
                              title="Upload custom photo"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                            <input
                              ref={registerFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageFileChange(e, true)}
                              className="hidden"
                            />
                          </div>

                          <div className="space-y-2 text-center sm:text-left">
                            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                              <button
                                type="button"
                                onClick={() => registerFileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-800 text-blue-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Photo From Computer/Phone</span>
                              </button>
                            </div>
                            {avatarError && <p className="text-red-600 text-xs font-semibold">{avatarError}</p>}
                            <p className="text-[11px] text-slate-500">
                              Or pick one of our mathematics scholar avatar presets:
                            </p>
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                              {PRESET_AVATARS.map((url, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setRegAvatar(url)}
                                  className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                                    regAvatar === url ? 'border-blue-900 ring-2 ring-blue-400' : 'border-slate-300 opacity-70 hover:opacity-100'
                                  }`}
                                >
                                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Name & Roll Numbers */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Bhaskar Jyoti Nath"
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Class Roll No / GU Roll *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. US-241-102-0055"
                            value={regRollNo}
                            onChange={(e) => setRegRollNo(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Enrolment No / Reg. No</label>
                          <input
                            type="text"
                            placeholder="Enter Enrolment No / Reg. No"
                            value={regGuRegNo}
                            onChange={(e) => setRegGuRegNo(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Contact & Program */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">College / Personal Email *</label>
                          <input
                            type="email"
                            required
                            placeholder="student@dudhnoicollege.ac.in"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Mobile / WhatsApp Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 94350 XXXXX"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Program *</label>
                          <select
                            value={regProgram}
                            onChange={(e) => setRegProgram(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                          >
                            <option value="B.Sc. Mathematics (Honours/Major)">B.Sc. Mathematics (Major)</option>
                            <option value="B.Sc. Mathematics (Minor)">B.Sc. Mathematics (Minor)</option>
                            <option value="M.Sc. Mathematics">M.Sc. Mathematics</option>
                          </select>
                        </div>
                      </div>

                      {/* Password Creation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100 animate-in fade-in slide-in-from-top-4">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Create Password *</label>
                          <input
                            type="password"
                            required
                            placeholder="Create a strong password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
                          <input
                            type="password"
                            required
                            placeholder="Re-enter password"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900"
                          />
                        </div>
                      </div>

                      {/* Semester & Batch */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Current Semester *</label>
                          <select
                            value={regSemester}
                            onChange={(e) => setRegSemester(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                          >
                            <option>B.Sc. 1st Semester (Major)</option>
                            <option>B.Sc. 2nd Semester (Major)</option>
                            <option>B.Sc. 3rd Semester (Major)</option>
                            <option>B.Sc. 4th Semester (Major)</option>
                            <option>B.Sc. 5th Semester (Major)</option>
                            <option>B.Sc. 6th Semester (Major)</option>
                            <option>M.Sc. 1st / 2nd Year</option>
                            <option>Minor / Multidisciplinary Course</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Academic Batch</label>
                          <input
                            type="text"
                            placeholder="e.g. 2024 - 2028"
                            value={regBatch}
                            onChange={(e) => setRegBatch(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Areas of Interest</label>
                          <input
                            type="text"
                            placeholder="e.g. Calculus, Python, Algebra"
                            value={regInterests}
                            onChange={(e) => setRegInterests(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Short Student Bio (Optional)</label>
                        <textarea
                          rows={2}
                          placeholder="Introduce yourself, your mathematical passion, or extracurricular interests..."
                          value={regBio}
                          onChange={(e) => setRegBio(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white resize-none"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Register As Student & Create Profile</span>
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* TAB 2: DOWNLOADS & STUDY RESOURCES (Accessible to all students and guests) */}
        {activeTab === 'downloads' && (
          <div className="space-y-4">
            {/* Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm">Study Materials, Syllabus & Question Banks</span>
                </div>
                <p className="text-xs text-blue-200">
                  {currentStudent 
                    ? `Curated repository mapped to ${currentStudent.semester} • ${currentStudent.program}`
                    : 'Open academic resource repository for Gauhati University B.Sc. & M.Sc. Mathematics.'}
                </p>
              </div>
              {currentStudent ? (
                <span className="text-[11px] font-mono bg-white/15 px-3 py-1 rounded-lg border border-white/20 font-bold text-amber-300 self-start sm:self-auto">
                  {currentStudent.semester}
                </span>
              ) : (
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
                >
                  Student Login
                </button>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={publicResourceSearch}
                  onChange={(e) => setPublicResourceSearch(e.target.value)}
                  placeholder="Search papers, calculus notes, linear algebra, PYQs..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-900 transition-colors"
                />
                {publicResourceSearch && (
                  <button
                    onClick={() => setPublicResourceSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'Syllabus', 'PYQ', 'Lecture Notes', 'Handbook'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPublicResourceCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      publicResourceCategory === cat
                        ? 'bg-blue-900 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat === 'all' ? 'All Materials' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources Grid */}
            {(() => {
              const filtered = portalResources.filter((item) => {
                const matchesCategory = publicResourceCategory === 'all' || item.category === publicResourceCategory;
                const matchesSearch = !publicResourceSearch || 
                  item.title.toLowerCase().includes(publicResourceSearch.toLowerCase()) ||
                  item.description.toLowerCase().includes(publicResourceSearch.toLowerCase()) ||
                  item.category.toLowerCase().includes(publicResourceSearch.toLowerCase());
                return matchesCategory && matchesSearch;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No matching study materials found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try modifying your search keywords or resetting categories.</p>
                    <button
                      onClick={() => {
                        setPublicResourceSearch('');
                        setPublicResourceCategory('all');
                      }}
                      className="mt-3 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Show All Resources
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-blue-900/40 hover:bg-white transition-all space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{item.fileType}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-xs">
                        <span className="text-[10px] text-slate-400 font-medium">Department Verified</span>
                        <button
                          onClick={() => downloadStudyResourcePDF(item)}
                          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs active:scale-95"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: CLASS ROUTINE & TIMETABLE (Accessible to all students and guests) */}
        {activeTab === 'routine' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-blue-950 text-sm block">
                  Department Class Routine & Lecture Schedule
                </span>
                <p className="text-[11px] text-slate-600">
                  {currentStudent 
                    ? `Registered Profile: ${currentStudent.fullName} • ${currentStudent.semester}`
                    : 'Official Timetable • Autumn Semester 2026 • Science Block'}
                </p>
              </div>
              
              {/* Semester Selector & Download PDF */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-blue-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Semester:</span>
                  <select
                    value={currentStudent?.semester || publicSemester}
                    onChange={(e) => setPublicSemester(e.target.value)}
                    className="text-xs font-bold text-blue-950 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="B.Sc. 1st Semester (Major)">B.Sc. 1st Sem (Major)</option>
                    <option value="B.Sc. 2nd Semester (Major)">B.Sc. 2nd Sem (Major)</option>
                    <option value="B.Sc. 3rd Semester (Major)">B.Sc. 3rd Sem (Major)</option>
                    <option value="B.Sc. 4th Semester (Major)">B.Sc. 4th Sem (Major)</option>
                    <option value="B.Sc. 5th Semester (Major)">B.Sc. 5th Sem (Major)</option>
                    <option value="B.Sc. 6th Semester (Major)">B.Sc. 6th Sem (Major)</option>
                    <option value="B.Sc. 7th Semester (Major)">B.Sc. 7th Sem (Major)</option>
                    <option value="B.Sc. 8th Semester (Major)">B.Sc. 8th Sem (Major)</option>
                    <option value="M.Sc. 1st Semester">M.Sc. 1st Semester</option>
                    <option value="M.Sc. 2nd Semester">M.Sc. 2nd Semester</option>
                    <option value="M.Sc. 3rd Semester">M.Sc. 3rd Semester</option>
                    <option value="M.Sc. 4th Semester">M.Sc. 4th Semester</option>
                  </select>
                </div>

                <button
                  onClick={() => downloadClassRoutinePDF(routineSlots, currentStudent?.semester || publicSemester)}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                  title="Download Routine PDF to Device"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Timetable PDF</span>
                </button>
              </div>
            </div>

            {(() => {
              const targetSem = currentStudent?.semester || publicSemester;
              const semStr = (targetSem || '').toLowerCase();
              let semKey: keyof RoutineSlot = 'sem1';
              
              if (semStr.includes('m.sc') || semStr.includes('msc')) {
                if (semStr.includes('1') || semStr.includes('first')) semKey = 'msc1';
                else if (semStr.includes('2') || semStr.includes('second')) semKey = 'msc2';
                else if (semStr.includes('3') || semStr.includes('third')) semKey = 'msc3';
                else if (semStr.includes('4') || semStr.includes('fourth')) semKey = 'msc4';
                else semKey = 'msc1'; // Default
              } else {
                if (semStr.includes('1') || semStr.includes('first') || semStr.includes('i')) semKey = 'sem1';
                else if (semStr.includes('2') || semStr.includes('second') || semStr.includes('ii')) semKey = 'sem2';
                else if (semStr.includes('3') || semStr.includes('third') || semStr.includes('iii')) semKey = 'sem3';
                else if (semStr.includes('4') || semStr.includes('fourth') || semStr.includes('iv')) semKey = 'sem4';
                else if (semStr.includes('5') || semStr.includes('fifth') || semStr.includes('v')) semKey = 'sem5';
                else if (semStr.includes('6') || semStr.includes('sixth') || semStr.includes('vi')) semKey = 'sem6';
                else if (semStr.includes('7') || semStr.includes('seventh') || semStr.includes('vii')) semKey = 'sem7';
                else if (semStr.includes('8') || semStr.includes('eighth') || semStr.includes('viii')) semKey = 'sem8';
                else semKey = 'sem1';
              }

              return (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between font-bold text-slate-700">
                    <span>Time Slot & Lecture Schedule</span>
                    <span>Class Routine Matrix</span>
                  </div>
                  
                  {/* Table with horizontal scroll support for mobile and tablet */}
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <th className="p-3 w-32">Day</th>
                          <th className="p-3">Course Title & Instructor</th>
                          <th className="p-3 w-32">Time</th>
                          <th className="p-3 w-28">Course Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {(() => {
                          const validSlots = routineSlots.filter(slot => {
                            const entry = (slot[semKey] as any) || { course: '' };
                            return !!entry.course;
                          });

                          return validSlots.map((slot, index) => {
                            const entry = (slot[semKey] as any) || { course: '', type: 'Major' };
                            const prevSlot = index > 0 ? validSlots[index - 1] : null;
                            const showDay = !prevSlot || prevSlot.day !== slot.day;

                            return (
                              <tr key={slot.id} className="hover:bg-slate-50">
                                <td className="p-3 align-top border-r border-slate-50">
                                  {showDay && <span className="font-bold text-slate-700">{slot.day || 'Mon-Sat'}</span>}
                                </td>
                                <td className="p-3 font-medium">
                                  <span className="text-slate-900 font-semibold">{entry.course}</span>
                                </td>
                                <td className="p-3 font-mono">
                                  <span className="font-bold text-blue-900">{entry.time || slot.timeSlot || '—'}</span>
                                </td>
                                <td className="p-3">
                                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                                    entry.type === 'Major' ? 'bg-blue-100 text-blue-900' :
                                    entry.type === 'Minor' ? 'bg-amber-100 text-amber-900' :
                                    entry.type === 'ITEP' ? 'bg-emerald-100 text-emerald-900' : 'bg-purple-100 text-purple-900'
                                  }`}>
                                    {entry.type}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Floating Scroll-to-Top Control */}
        {showScrollTop && (
          <div className="sticky float-right bottom-3 right-3 z-40 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
            <button
              type="button"
              onClick={scrollToTop}
              className="px-3 py-1.5 bg-blue-950/90 hover:bg-blue-900 text-white rounded-full shadow-xl border border-blue-800 backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold cursor-pointer group"
              title="Scroll to Top"
            >
              <ArrowUp className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
              <span className="hidden sm:inline">Top</span>
              <span className="bg-blue-900 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {scrollProgress}%
              </span>
            </button>
          </div>
        )}

        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 sm:px-6 py-3 border-t border-slate-200 shrink-0 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-slate-400 text-center sm:text-left">
            Dudhnoi College Mathematics Department • ERP & Academic Registry
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Close Portal
          </button>
        </div>

      </div>

      {/* REJECTION ALERT POPUP MODAL (Strict Gatekeeper Alert) */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-red-500 overflow-hidden text-slate-800">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-red-700 via-red-800 to-rose-900 text-white p-6 text-center relative">
              <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <ShieldAlert className="w-9 h-9 text-amber-300 animate-pulse" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-red-200 bg-red-950/60 px-3 py-1 rounded-full border border-red-400/40 inline-block mb-1.5">
                Department Gatekeeper Alert
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-wide uppercase text-white leading-tight">
                YOU ARE NOT A STUDENT OF OUR DEPARTMENT
              </h2>
              <p className="text-xs text-red-100/90 mt-1 max-w-md mx-auto">
                Department of Mathematics, Dudhnoi College
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 text-xs">
              
              {/* Reason Explanation */}
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-950 space-y-1">
                <div className="flex items-center gap-2 font-bold text-red-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Verification Failed</span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed pl-6">
                  {rejectionReason || 'The name, roll number, or selective course you entered does not match any student currently enrolled in the Department of Mathematics records.'}
                </p>
              </div>

              {/* Submitted Details Review */}
              {rejectionAttemptDetails && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Details Provided in Registration Attempt:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Submitted Name:</span>
                      <strong className="text-slate-900 font-semibold">{rejectionAttemptDetails.name || '—'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Submitted Roll No:</span>
                      <strong className="text-slate-900 font-mono font-semibold">{rejectionAttemptDetails.roll || '—'}</strong>
                    </div>
                    <div className="sm:col-span-2 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Selected Program / Course:</span>
                      <strong className="text-slate-900 font-semibold">{rejectionAttemptDetails.course || '—'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Helpful Steps */}
              <div className="space-y-1.5 text-slate-600 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 text-[11px]">
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-800" />
                  <span>How to resolve this issue:</span>
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-700 leading-relaxed">
                  <li>Ensure your full name matches the spelling on your college admission slip.</li>
                  <li>Verify that you selected your correct course (B.Sc. Major vs Minor in Mathematics).</li>
                  <li>If you are a newly admitted student not yet listed in the department database, please contact HOD Dr. Bidyut Kalita or your mentor.</li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalOpen(false)}
                  className="w-full py-3 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white font-bold rounded-2xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>I Understand • Review & Correct Details</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REAL-TIME OVER-THE-AIR BACKGROUND MESSAGE DELIVERY NOTIFICATION SYSTEM */}
      {activeNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full animate-in fade-in slide-in-from-top-5 duration-300">
          {activeNotifications.map((n) => (
            <div 
              key={n.id} 
              className="bg-slate-950/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex flex-col gap-1 w-full"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[9px] text-white">
                    💬
                  </div>
                  <span className="font-extrabold text-emerald-400 text-[11px] uppercase tracking-wide">{n.sender}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">now</span>
              </div>
              <p className="text-xs text-slate-100 font-medium leading-relaxed mt-1.5">
                {n.text}
              </p>
              <div className="mt-2.5 p-2 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-[10px] text-emerald-300 font-medium flex items-center gap-1.5">
                <span className="animate-ping rounded-full h-1.5 w-1.5 bg-emerald-400" />
                <span>Simulated secure WhatsApp OTP Delivery Active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
