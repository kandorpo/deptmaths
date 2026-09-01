import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { DOC_REF, DOC_REFS, CMS_COL_REF, onSnapshot, setDoc, OperationType, handleFirestoreError } from '../firebase';
import { hashPassword, verifyPassword } from '../utils/hashHelper';
import liveDataRaw from '../data/liveData.json';

const liveData = liveDataRaw as unknown as Partial<DepartmentCMSData>;

import {
  FacultyMember,
  Course,
  ResearchArea,
  Publication,
  ResearchProject,
  EventItem,
  NoticeItem,
  AchievementItem,
  GalleryItem,
  DepartmentStat,
  DepartmentStudent,
  BlogPost,
  StudentProfile,
  StudentResource,
  RoutineSlot,
  StudentGrievance,
  HeroFoundations,
  CourseType,
  RoutineCourseEntry,
  AdminAccount,
  AdminRegistrationRequest,
  FooterLink
} from '../types';
import {
  DEPARTMENT_INFO,
  DEPARTMENT_STATS,
  FACULTY_DATA,
  COURSES_DATA,
  RESEARCH_AREAS,
  RESEARCH_PROJECTS,
  RESEARCH_PUBLICATIONS,
  EVENTS_DATA,
  NOTICES_DATA,
  ACHIEVEMENTS_DATA,
  GALLERY_DATA,
  DEFAULT_DEPARTMENT_STUDENTS,
  DEFAULT_BLOG_POSTS,
  DEFAULT_STUDENT_PROFILES,
  STUDENT_RESOURCES,
  DEFAULT_ROUTINE_SLOTS,
  DEFAULT_GRIEVANCES
} from '../data/departmentData';

export interface DepartmentInfoType {
  name: string;
  college: string;
  affiliation: string;
  accreditation: string;
  establishedYear: number;
  address: string;
  email: string;
  phone: string;
  officeHours: string;
  hodName: string;
  hodTitle: string;
  hodMessageHeading?: string;
  hodMessage: string;
  vision: string;
  mission: string[];
  coreValues: { title: string; desc: string }[];
  facilities: { name: string; desc: string }[];
  logoUrl: string;
  imageUrls: string[];
  aboutOverview: string;
  aboutLegacy: string;
  aboutImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  cardHeaderBadgeText: string;
  cardHeaderLocation: string;
  cardHeaderTitle: string;
  welcomeBadgeText: string;
  welcomeTitle: string;
  welcomeDescription: string;
  heroFoundations: HeroFoundations;
  footerTagline?: string;
  footerBadges?: string[];
  footerDeskTitle?: string;
  footerAddress?: string;
  footerPhone?: string;
  footerEmail?: string;
  footerCopyright?: string;
  footerQuickLinks?: FooterLink[];
  footerAcademicLinks?: FooterLink[];
}

export interface DepartmentCMSData {
  departmentInfo: DepartmentInfoType;
  stats: DepartmentStat[];
  faculty: FacultyMember[];
  courses: Course[];
  notices: NoticeItem[];
  events: EventItem[];
  researchAreas: ResearchArea[];
  researchProjects: ResearchProject[];
  publications: Publication[];
  achievements: AchievementItem[];
  gallery: GalleryItem[];
  departmentStudents?: DepartmentStudent[];
  blogs: BlogPost[];
  registeredStudentProfiles?: StudentProfile[];
  portalResources?: StudentResource[];
  routineSlots?: RoutineSlot[];
  studentGrievances?: StudentGrievance[];
  admins?: AdminAccount[];
  adminRegistrationRequests?: AdminRegistrationRequest[];
  updatedAt?: number;
}

const STORAGE_KEY = 'dudhnoi_math_cms_master_data_v2';
const AUTH_KEY = 'dudhnoi_math_admin_auth_status';
const AUTH_USER_KEY = 'dudhnoi_math_admin_auth_user_id';
const PORTAL_PROFILES_KEY = 'dudhnoi_math_registered_students_list';

export interface VerificationResult {
  isEligible: boolean;
  matchedStudent?: DepartmentStudent;
  reason?: string;
}

interface DataContextType {
  // State
  departmentInfo: DepartmentInfoType;
  stats: DepartmentStat[];
  faculty: FacultyMember[];
  courses: Course[];
  notices: NoticeItem[];
  events: EventItem[];
  researchAreas: ResearchArea[];
  researchProjects: ResearchProject[];
  publications: Publication[];
  achievements: AchievementItem[];
  gallery: GalleryItem[];
  departmentStudents: DepartmentStudent[];
  blogs: BlogPost[];
  registeredStudentProfiles: StudentProfile[];
  portalResources: StudentResource[];
  routineSlots: RoutineSlot[];
  studentGrievances: StudentGrievance[];
  admins: AdminAccount[];
  currentAdmin: AdminAccount | null;
  adminRegistrationRequests: AdminRegistrationRequest[];
  isDatabaseQuotaExceeded: boolean;

  // Admin Modal & Auth
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAdminLoggedIn: boolean;
  loginAdmin: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  changePassword: (adminId: string, newPassword: string) => Promise<void>;
  resetAdminPassword: (token: string, newPassword: string) => Promise<boolean>;
  generatePasswordResetToken: (usernameOrEmail: string) => string | null;
  addAdminAccount: (account: AdminAccount) => void;
  updateAdminAccount: (account: AdminAccount) => void;
  deleteAdminAccount: (id: string) => void;
  submitAdminRegistrationRequest: (req: Omit<AdminRegistrationRequest, 'id' | 'status' | 'requestDate'>) => void;
  approveAdminRegistrationRequest: (id: string) => void;
  rejectAdminRegistrationRequest: (id: string) => void;

  // Mutators
  updateDepartmentInfo: (info: Partial<DepartmentInfoType>) => void;
  updateStats: (stats: DepartmentStat[]) => void;
  
  // Faculty
  addFaculty: (faculty: FacultyMember) => void;
  updateFaculty: (faculty: FacultyMember) => void;
  deleteFaculty: (id: string) => void;

  // Department Students Directory
  addDepartmentStudent: (student: DepartmentStudent) => void;
  updateDepartmentStudent: (student: DepartmentStudent) => void;
  deleteDepartmentStudent: (id: string) => void;
  deleteMultipleDepartmentStudents: (ids: string[]) => void;
  bulkImportDepartmentStudents: (students: DepartmentStudent[]) => void;
  verifyStudentEligibility: (fullName: string, rollNo: string, courseProgram: string) => VerificationResult;

  // Portal Registered Student Profiles (Admin & Student full management)
  addRegisteredStudentProfile: (profile: StudentProfile) => void;
  updateRegisteredStudentProfile: (profile: StudentProfile) => void;
  deleteRegisteredStudentProfile: (id: string) => void;
  bulkImportRegisteredStudentProfiles: (profiles: StudentProfile[]) => void;

  // Portal Study Resources & Question Banks
  addPortalResource: (resource: StudentResource) => void;
  updatePortalResource: (resource: StudentResource) => void;
  deletePortalResource: (id: string) => void;

  // Portal Class & Lab Routines
  addRoutineSlot: (slot: RoutineSlot) => void;
  updateRoutineSlot: (slot: RoutineSlot) => void;
  deleteRoutineSlot: (id: string) => void;

  // Mentorship & Grievance Requests
  addStudentGrievance: (grievance: StudentGrievance) => void;
  updateStudentGrievance: (grievance: StudentGrievance) => void;
  deleteStudentGrievance: (id: string) => void;

  // Notices
  addNotice: (notice: NoticeItem) => void;
  updateNotice: (notice: NoticeItem) => void;
  deleteNotice: (id: string) => void;

  // Events
  addEvent: (event: EventItem) => void;
  updateEvent: (event: EventItem) => void;
  deleteEvent: (id: string) => void;

  // Courses
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;

  // Research
  addResearchArea: (area: ResearchArea) => void;
  updateResearchArea: (area: ResearchArea) => void;
  deleteResearchArea: (id: string) => void;

  // Research Projects
  addResearchProject: (project: ResearchProject) => void;
  updateResearchProject: (project: ResearchProject) => void;
  deleteResearchProject: (id: string) => void;

  // Publications
  addPublication: (publication: Publication) => void;
  updatePublication: (publication: Publication) => void;
  deletePublication: (id: string) => void;

  // Achievements
  addAchievement: (achievement: AchievementItem) => void;
  updateAchievement: (achievement: AchievementItem) => void;
  deleteAchievement: (id: string) => void;

  // Gallery
  addGalleryItem: (item: GalleryItem) => void;
  updateGalleryItem: (item: GalleryItem) => void;
  deleteGalleryItem: (id: string) => void;

  // Blogs
  addBlog: (blog: BlogPost) => void;
  updateBlog: (blog: BlogPost) => void;
  deleteBlog: (id: string) => void;
  likeBlog: (id: string) => void;

  // Global utilities
  resetAllToDefaults: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'admin-kandorpo',
    username: 'kandorpo',
    email: 'kandorpobarman@gmail.com',
    fullName: 'Kandorpo Barman',
    role: 'Super Admin',
    passwordHash: 'fffb66db81f4495f2d7f94dd1a74601fcaf0e18c79c05afba28b16dfc452cf39',
    status: 'Active'
  }
];

// Helper to normalize routine slot structure
const normalizeRoutineSlot = (slot: any): RoutineSlot => {
  const parseEntry = (val: any, defaultType: CourseType = 'Major'): RoutineCourseEntry => {
    if (!val) return { course: '', type: defaultType, time: '' };
    if (typeof val === 'object' && val.course !== undefined) {
      return { course: val.course || '', type: val.type || defaultType, time: val.time || '' };
    }
    return { course: String(val), type: defaultType, time: '' };
  };

  return {
    id: slot.id || `slot-${Date.now()}`,
    timeSlot: slot.timeSlot || '09:15 - 10:15 AM',
    day: slot.day || 'Monday - Saturday',
    sem1: parseEntry(slot.sem1 || slot.sem1Major, 'Major'),
    sem2: parseEntry(slot.sem2, 'Minor'),
    sem3: parseEntry(slot.sem3 || slot.sem3Major, 'Major'),
    sem4: parseEntry(slot.sem4, 'Major/Minor'),
    sem5: parseEntry(slot.sem5 || slot.sem5Major, 'Major'),
    sem6: parseEntry(slot.sem6 || slot.mscSlot, 'Major'),
    sem7: parseEntry(slot.sem7, 'Major'),
    sem8: parseEntry(slot.sem8, 'Major'),
    msc1: parseEntry(slot.msc1, 'Major'),
    msc2: parseEntry(slot.msc2, 'Major'),
    msc3: parseEntry(slot.msc3, 'Major'),
    msc4: parseEntry(slot.msc4, 'Major'),
  };
};

// Helper to get initial stored data immediately for synchronous first render
const getInitialStoredData = (): Partial<DepartmentCMSData> | null => {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not parse stored CMS data:', e);
  }
  return null;
};

const PRE_REGISTERED_STUDENT_IDS = new Set([
  'dept-stu-01', 'dept-stu-02', 'dept-stu-03', 'dept-stu-04', 'dept-stu-05',
  'dept-stu-06', 'dept-stu-07', 'dept-stu-08', 'dept-stu-09', 'dept-stu-10', 'dept-stu-11'
]);

const cleanDepartmentStudents = (students: DepartmentStudent[]): DepartmentStudent[] => {
  if (!Array.isArray(students)) return [];
  return students.filter((s) => s && s.id && !PRE_REGISTERED_STUDENT_IDS.has(s.id));
};

const PRE_REGISTERED_PROFILE_IDS = new Set([
  'stu-101', 'stu-102'
]);

const cleanRegisteredStudentProfiles = (profiles: StudentProfile[]): StudentProfile[] => {
  if (!Array.isArray(profiles)) return [];
  return profiles.filter((p) => p && p.id && !PRE_REGISTERED_PROFILE_IDS.has(p.id));
};

const PRE_GRIEVANCE_IDS = new Set([
  'grievance-1', 'grievance-2'
]);

const cleanStudentGrievances = (grievances: StudentGrievance[]): StudentGrievance[] => {
  if (!Array.isArray(grievances)) return [];
  return grievances.filter((g) => g && g.id && !PRE_GRIEVANCE_IDS.has(g.id));
};

const PRE_REGISTERED_ADMIN_IDS = new Set([
  'admin-hod', 'admin-dept', 'admin-faculty1'
]);

const cleanAdmins = (adminList: AdminAccount[]): AdminAccount[] => {
  if (!Array.isArray(adminList) || adminList.length === 0) return DEFAULT_ADMIN_ACCOUNTS;
  const filtered = adminList.filter((a) => a && a.id && !PRE_REGISTERED_ADMIN_IDS.has(a.id));
  return filtered.length > 0 ? filtered : DEFAULT_ADMIN_ACCOUNTS;
};

const removeUndefined = (obj: any): any => {
  if (obj === undefined) return null;
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = removeUndefined(obj[key]);
    }
  }
  return newObj;
};

const sanitizeForFirestore = (data: any): any => {
  const cleaned = removeUndefined(data);
  return cleaned;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Helper to sync faculty count in stats
  const syncFacultyCount = (facList: FacultyMember[], statsList: DepartmentStat[]): DepartmentStat[] => {
    return statsList.map((st) => {
      if (st.label.toLowerCase().includes('faculty') || st.icon === 'Users') {
        return { ...st, value: facList.length };
      }
      return st;
    });
  };

  const initialCached = getInitialStoredData();

  // Master state initialized lazily from localStorage cache. If a key is present in cache (even if empty array []), use it.
  const [departmentInfo, setDepartmentInfo] = useState<DepartmentInfoType>(() => {
    const cached: Partial<DepartmentInfoType> = initialCached?.departmentInfo || {};
    const live: Partial<DepartmentInfoType> = liveData.departmentInfo || {};
    return {
      ...DEPARTMENT_INFO,
      ...live,
      ...cached,
      imageUrls: (cached.imageUrls && cached.imageUrls.length > 0) ? cached.imageUrls : (live.imageUrls || DEPARTMENT_INFO.imageUrls),
      logoUrl: cached.logoUrl ? cached.logoUrl : (live.logoUrl || DEPARTMENT_INFO.logoUrl)
    };
  });
  const [faculty, setFaculty] = useState<FacultyMember[]>(() =>
    Array.isArray(initialCached?.faculty) ? initialCached.faculty : (liveData.faculty || FACULTY_DATA)
  );
  const [stats, setStats] = useState<DepartmentStat[]>(() => {
    const initialFac = Array.isArray(initialCached?.faculty) ? initialCached.faculty : (liveData.faculty || FACULTY_DATA);
    const initialSt = Array.isArray(initialCached?.stats) ? initialCached.stats : (liveData.stats || DEPARTMENT_STATS);
    return syncFacultyCount(initialFac, initialSt);
  });
  const [courses, setCourses] = useState<Course[]>(() =>
    Array.isArray(initialCached?.courses) ? initialCached.courses : (liveData.courses || COURSES_DATA)
  );
  const [notices, setNotices] = useState<NoticeItem[]>(() =>
    Array.isArray(initialCached?.notices) ? initialCached.notices : (liveData.notices || NOTICES_DATA)
  );
  const [events, setEvents] = useState<EventItem[]>(() =>
    Array.isArray(initialCached?.events) ? initialCached.events : (liveData.events || EVENTS_DATA)
  );
  const [researchAreas, setResearchAreas] = useState<ResearchArea[]>(() =>
    Array.isArray(initialCached?.researchAreas) ? initialCached.researchAreas : (liveData.researchAreas || RESEARCH_AREAS)
  );
  const [researchProjects, setResearchProjects] = useState<ResearchProject[]>(() =>
    Array.isArray(initialCached?.researchProjects) ? initialCached.researchProjects : (liveData.researchProjects || RESEARCH_PROJECTS)
  );
  const [publications, setPublications] = useState<Publication[]>(() =>
    Array.isArray(initialCached?.publications) ? initialCached.publications : (liveData.publications || RESEARCH_PUBLICATIONS)
  );
  const [achievements, setAchievements] = useState<AchievementItem[]>(() =>
    Array.isArray(initialCached?.achievements) ? initialCached.achievements : (liveData.achievements || ACHIEVEMENTS_DATA)
  );
  const [gallery, setGallery] = useState<GalleryItem[]>(() =>
    Array.isArray(initialCached?.gallery) ? initialCached.gallery : (liveData.gallery || GALLERY_DATA)
  );
  const [departmentStudents, setDepartmentStudents] = useState<DepartmentStudent[]>(() =>
    Array.isArray(initialCached?.departmentStudents) ? cleanDepartmentStudents(initialCached.departmentStudents) : (liveData.departmentStudents ? cleanDepartmentStudents(liveData.departmentStudents) : [])
  );
  const [blogs, setBlogs] = useState<BlogPost[]>(() =>
    Array.isArray(initialCached?.blogs) ? initialCached.blogs : (liveData.blogs || DEFAULT_BLOG_POSTS)
  );
  const [registeredStudentProfiles, setRegisteredStudentProfiles] = useState<StudentProfile[]>(() =>
    Array.isArray(initialCached?.registeredStudentProfiles) ? cleanRegisteredStudentProfiles(initialCached.registeredStudentProfiles) : (liveData.registeredStudentProfiles ? cleanRegisteredStudentProfiles(liveData.registeredStudentProfiles) : DEFAULT_STUDENT_PROFILES)
  );
  const [portalResources, setPortalResources] = useState<StudentResource[]>(() =>
    Array.isArray(initialCached?.portalResources) ? initialCached.portalResources : (liveData.portalResources || STUDENT_RESOURCES)
  );
  const [routineSlots, setRoutineSlots] = useState<RoutineSlot[]>(() =>
    Array.isArray(initialCached?.routineSlots) ? initialCached.routineSlots.map(normalizeRoutineSlot) : (liveData.routineSlots ? liveData.routineSlots.map(normalizeRoutineSlot) : DEFAULT_ROUTINE_SLOTS.map(normalizeRoutineSlot))
  );
  const [studentGrievances, setStudentGrievances] = useState<StudentGrievance[]>(() =>
    Array.isArray(initialCached?.studentGrievances) ? cleanStudentGrievances(initialCached.studentGrievances) : (liveData.studentGrievances ? cleanStudentGrievances(liveData.studentGrievances) : DEFAULT_GRIEVANCES)
  );

  // Admin UI State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState<AdminAccount[]>(() =>
    Array.isArray(initialCached?.admins) ? cleanAdmins(initialCached.admins) : (liveData.admins ? cleanAdmins(liveData.admins) : DEFAULT_ADMIN_ACCOUNTS)
  );
  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(() => {
    try {
      const auth = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(AUTH_KEY) : null;
      if (auth === 'true') {
        const savedUid = sessionStorage.getItem(AUTH_USER_KEY);
        const adminList = Array.isArray(initialCached?.admins) ? cleanAdmins(initialCached.admins) : (liveData.admins ? cleanAdmins(liveData.admins) : DEFAULT_ADMIN_ACCOUNTS);
        if (savedUid) {
          return adminList.find(a => a.id === savedUid) || adminList[0] || DEFAULT_ADMIN_ACCOUNTS[0];
        }
        return adminList[0] || DEFAULT_ADMIN_ACCOUNTS[0];
      }
    } catch {}
    return null;
  });
  const [adminRegistrationRequests, setAdminRegistrationRequests] = useState<AdminRegistrationRequest[]>(() =>
    Array.isArray(initialCached?.adminRegistrationRequests) ? initialCached.adminRegistrationRequests : []
  );
  const [isDatabaseQuotaExceeded, setIsDatabaseQuotaExceeded] = useState(false);

  // Live state reference to always hold the complete authoritative document
  const stateRef = useRef<DepartmentCMSData>({
    departmentInfo,
    stats,
    faculty,
    courses,
    notices,
    events,
    researchAreas,
    researchProjects,
    publications,
    achievements,
    gallery,
    departmentStudents,
    blogs,
    registeredStudentProfiles,
    portalResources,
    routineSlots,
    studentGrievances,
    admins,
    adminRegistrationRequests,
    updatedAt: initialCached?.updatedAt || 0
  });

  // Keep stateRef in sync whenever any state hook updates
  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      departmentInfo,
      stats,
      faculty,
      courses,
      notices,
      events,
      researchAreas,
      researchProjects,
      publications,
      achievements,
      gallery,
      departmentStudents,
      blogs,
      registeredStudentProfiles,
      portalResources,
      routineSlots,
      studentGrievances,
      admins,
      adminRegistrationRequests
    };
  }, [
    departmentInfo,
    stats,
    faculty,
    courses,
    notices,
    events,
    researchAreas,
    researchProjects,
    publications,
    achievements,
    gallery,
    departmentStudents,
    blogs,
    registeredStudentProfiles,
    portalResources,
    routineSlots,
    studentGrievances,
    admins,
    adminRegistrationRequests
  ]);

  // Load initial from localStorage & subscribe to Firestore live sync
  useEffect(() => {
    // 1. Initial quick load from localStorage for immediate render
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DepartmentCMSData>;
        let currentFaculty = faculty;
        if (parsed.departmentInfo) setDepartmentInfo((prev) => ({ ...prev, ...parsed.departmentInfo }));
        if (Array.isArray(parsed.faculty)) {
          currentFaculty = parsed.faculty;
          setFaculty(parsed.faculty);
        }
        if (Array.isArray(parsed.stats)) {
          setStats(syncFacultyCount(currentFaculty, parsed.stats));
        }
        if (Array.isArray(parsed.courses)) setCourses(parsed.courses);
        if (Array.isArray(parsed.notices)) setNotices(parsed.notices);
        if (Array.isArray(parsed.events)) setEvents(parsed.events);
        if (Array.isArray(parsed.researchAreas)) setResearchAreas(parsed.researchAreas);
        if (Array.isArray(parsed.researchProjects)) setResearchProjects(parsed.researchProjects);
        if (Array.isArray(parsed.publications)) setPublications(parsed.publications);
        if (Array.isArray(parsed.achievements)) setAchievements(parsed.achievements);
        if (Array.isArray(parsed.gallery)) setGallery(parsed.gallery);
        if (Array.isArray(parsed.departmentStudents)) setDepartmentStudents(cleanDepartmentStudents(parsed.departmentStudents));
        if (Array.isArray(parsed.blogs)) setBlogs(parsed.blogs);
        if (Array.isArray(parsed.registeredStudentProfiles)) setRegisteredStudentProfiles(cleanRegisteredStudentProfiles(parsed.registeredStudentProfiles));
        if (Array.isArray(parsed.portalResources)) setPortalResources(parsed.portalResources);
        if (Array.isArray(parsed.admins)) setAdmins(cleanAdmins(parsed.admins));
        if (Array.isArray(parsed.adminRegistrationRequests)) setAdminRegistrationRequests(parsed.adminRegistrationRequests);
        if (Array.isArray(parsed.routineSlots)) setRoutineSlots(parsed.routineSlots.map(normalizeRoutineSlot));
        if (Array.isArray(parsed.studentGrievances)) setStudentGrievances(cleanStudentGrievances(parsed.studentGrievances));

        stateRef.current = {
          ...stateRef.current,
          ...parsed,
          updatedAt: parsed.updatedAt || stateRef.current.updatedAt || 0
        };
      }

      const auth = sessionStorage.getItem(AUTH_KEY);
      if (auth === 'true') {
        setIsAdminLoggedIn(true);
        const savedUid = sessionStorage.getItem(AUTH_USER_KEY);
        if (savedUid) {
          const currentAdmins = stateRef.current.admins || DEFAULT_ADMIN_ACCOUNTS;
          const matched = currentAdmins.find(a => a.id === savedUid);
          if (matched) {
            setCurrentAdmin(matched);
          } else {
            setCurrentAdmin(DEFAULT_ADMIN_ACCOUNTS[0]);
          }
        } else {
          setCurrentAdmin(DEFAULT_ADMIN_ACCOUNTS[0]);
        }
      }
    } catch (e) {
      console.warn('Error loading cached data from localStorage:', e);
    }

    // 2. Real-time Live Synchronization with Google Cloud Firestore
    const connectionTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(
        CMS_COL_REF,
        (snapshot: any) => {
          clearTimeout(connectionTimeout);
          if (!snapshot.empty) {
            let maxRemoteUpdatedAt = 0;
            const collectedData: Partial<DepartmentCMSData> = {};

            snapshot.docs.forEach((docSnap) => {
              const docId = docSnap.id;
              const d = docSnap.data() as any;
              if (d?.updatedAt && d.updatedAt > maxRemoteUpdatedAt) {
                maxRemoteUpdatedAt = d.updatedAt;
              }

              if (docId === 'info') {
                if (d.departmentInfo) {
                  collectedData.departmentInfo = d.departmentInfo;
                  setDepartmentInfo((prev) => ({ ...prev, ...d.departmentInfo }));
                }
                if (Array.isArray(d.stats)) {
                  collectedData.stats = d.stats;
                  setStats(d.stats);
                }
              } else if (docId === 'faculty') {
                if (Array.isArray(d.faculty)) {
                  collectedData.faculty = d.faculty;
                  setFaculty(d.faculty);
                  setStats((prevStats) => syncFacultyCount(d.faculty, prevStats));
                }
              } else if (docId === 'courses') {
                if (Array.isArray(d.courses)) {
                  collectedData.courses = d.courses;
                  setCourses(d.courses);
                }
              } else if (docId === 'notices') {
                if (Array.isArray(d.notices)) {
                  collectedData.notices = d.notices;
                  setNotices(d.notices);
                }
              } else if (docId === 'events') {
                if (Array.isArray(d.events)) {
                  collectedData.events = d.events;
                  setEvents(d.events);
                }
              } else if (docId === 'research') {
                if (Array.isArray(d.researchAreas)) {
                  collectedData.researchAreas = d.researchAreas;
                  setResearchAreas(d.researchAreas);
                }
                if (Array.isArray(d.researchProjects)) {
                  collectedData.researchProjects = d.researchProjects;
                  setResearchProjects(d.researchProjects);
                }
                if (Array.isArray(d.publications)) {
                  collectedData.publications = d.publications;
                  setPublications(d.publications);
                }
              } else if (docId === 'achievements') {
                if (Array.isArray(d.achievements)) {
                  collectedData.achievements = d.achievements;
                  setAchievements(d.achievements);
                }
              } else if (docId === 'gallery') {
                if (Array.isArray(d.gallery)) {
                  collectedData.gallery = d.gallery;
                  setGallery(d.gallery);
                }
              } else if (docId === 'blogs') {
                if (Array.isArray(d.blogs)) {
                  collectedData.blogs = d.blogs;
                  setBlogs(d.blogs);
                }
              } else if (docId === 'students') {
                if (Array.isArray(d.departmentStudents)) {
                  const cleaned = cleanDepartmentStudents(d.departmentStudents);
                  collectedData.departmentStudents = cleaned;
                  setDepartmentStudents(cleaned);
                }
                if (Array.isArray(d.registeredStudentProfiles)) {
                  const cleaned = cleanRegisteredStudentProfiles(d.registeredStudentProfiles);
                  collectedData.registeredStudentProfiles = cleaned;
                  setRegisteredStudentProfiles(cleaned);
                }
                if (Array.isArray(d.routineSlots)) {
                  const normalized = d.routineSlots.map(normalizeRoutineSlot);
                  collectedData.routineSlots = normalized;
                  setRoutineSlots(normalized);
                }
                if (Array.isArray(d.studentGrievances)) {
                  const cleaned = cleanStudentGrievances(d.studentGrievances);
                  collectedData.studentGrievances = cleaned;
                  setStudentGrievances(cleaned);
                }
                if (Array.isArray(d.portalResources)) {
                  collectedData.portalResources = d.portalResources;
                  setPortalResources(d.portalResources);
                }
              } else if (docId === 'admins') {
                if (Array.isArray(d.adminRegistrationRequests)) {
                  collectedData.adminRegistrationRequests = d.adminRegistrationRequests;
                  setAdminRegistrationRequests(d.adminRegistrationRequests);
                }
                if (Array.isArray(d.admins)) {
                  const cleanedAdminsList = cleanAdmins(d.admins);
                  collectedData.admins = cleanedAdminsList;
                  setAdmins(cleanedAdminsList);
                  const savedUid = sessionStorage.getItem(AUTH_USER_KEY);
                  if (savedUid) {
                    const matched = cleanedAdminsList.find((a) => a.id === savedUid);
                    if (matched) setCurrentAdmin(matched);
                  }
                }
              } else if (docId === 'master') {
                // If master doc has data and modular docs were not fully populated
                const m = d as Partial<DepartmentCMSData>;
                if (m.departmentInfo && !collectedData.departmentInfo) {
                  setDepartmentInfo((prev) => ({ ...prev, ...m.departmentInfo }));
                }
                if (Array.isArray(m.faculty) && !collectedData.faculty) {
                  setFaculty(m.faculty);
                  setStats((prevStats) => syncFacultyCount(m.faculty!, prevStats));
                }
                if (Array.isArray(m.stats) && !collectedData.stats) setStats(m.stats);
                if (Array.isArray(m.courses) && !collectedData.courses) setCourses(m.courses);
                if (Array.isArray(m.notices) && !collectedData.notices) setNotices(m.notices);
                if (Array.isArray(m.events) && !collectedData.events) setEvents(m.events);
                if (Array.isArray(m.researchAreas) && !collectedData.researchAreas) setResearchAreas(m.researchAreas);
                if (Array.isArray(m.researchProjects) && !collectedData.researchProjects) setResearchProjects(m.researchProjects);
                if (Array.isArray(m.publications) && !collectedData.publications) setPublications(m.publications);
                if (Array.isArray(m.achievements) && !collectedData.achievements) setAchievements(m.achievements);
                if (Array.isArray(m.gallery) && !collectedData.gallery) setGallery(m.gallery);
                if (Array.isArray(m.departmentStudents) && !collectedData.departmentStudents) setDepartmentStudents(cleanDepartmentStudents(m.departmentStudents));
                if (Array.isArray(m.blogs) && !collectedData.blogs) setBlogs(m.blogs);
                if (Array.isArray(m.registeredStudentProfiles) && !collectedData.registeredStudentProfiles) setRegisteredStudentProfiles(cleanRegisteredStudentProfiles(m.registeredStudentProfiles));
                if (Array.isArray(m.portalResources) && !collectedData.portalResources) setPortalResources(m.portalResources);
                if (Array.isArray(m.routineSlots) && !collectedData.routineSlots) setRoutineSlots(m.routineSlots.map(normalizeRoutineSlot));
                if (Array.isArray(m.studentGrievances) && !collectedData.studentGrievances) setStudentGrievances(cleanStudentGrievances(m.studentGrievances));
              }
            });

            // Update stateRef and local storage with the authoritative Firestore state
            stateRef.current = {
              ...stateRef.current,
              ...collectedData,
              updatedAt: maxRemoteUpdatedAt || Date.now()
            };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
            } catch (err) {}
          }
          setIsLoading(false);
        },
        (error: any) => {
          clearTimeout(connectionTimeout);
          console.warn('Firestore real-time collection subscription status:', error);
          setIsLoading(false);
        }
      );
    } catch (err) {
      clearTimeout(connectionTimeout);
      console.warn('Error establishing Firestore collection subscription:', err);
      setIsLoading(false);
    }

    return () => {
      clearTimeout(connectionTimeout);
      if (unsub) unsub();
    };
  }, []);

  // Save changes to localStorage AND Google Cloud Firestore for real-time multi-device sync
  const persist = (data: Partial<DepartmentCMSData>) => {
    const now = Date.now();
    // 1. Update stateRef immediately so subsequent calls have the latest state
    const updated: DepartmentCMSData = {
      ...stateRef.current,
      ...data,
      updatedAt: now
    };
    stateRef.current = updated;

    // 2. Save full authoritative document to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (data.registeredStudentProfiles) {
        localStorage.setItem(PORTAL_PROFILES_KEY, JSON.stringify(data.registeredStudentProfiles));
      }
    } catch (e: any) {
      console.warn('LocalStorage save warning:', e);
    }

    // 3. Save to Google Cloud Firestore across modular collections so payloads are tiny and never hit limits
    const writePromises: Promise<any>[] = [];

    // Modular section writes
    if (data.departmentInfo !== undefined || data.stats !== undefined) {
      writePromises.push(
        setDoc(DOC_REFS.info, sanitizeForFirestore({
          departmentInfo: updated.departmentInfo,
          stats: updated.stats,
          updatedAt: now
        }))
      );
    }
    if (data.faculty !== undefined) {
      writePromises.push(
        setDoc(DOC_REFS.faculty, sanitizeForFirestore({
          faculty: updated.faculty,
          updatedAt: now
        }))
      );
    }
    if (data.courses !== undefined) {
      writePromises.push(
        setDoc(DOC_REFS.courses, sanitizeForFirestore({
          courses: updated.courses,
          updatedAt: now
        }))
      );
    }
    if (data.notices !== undefined) {
      writePromises.push(
        setDoc(DOC_REFS.notices, sanitizeForFirestore({
          notices: updated.notices,
          updatedAt: now
        }))
      );
    }
    if (data.events !== undefined) {
      writePromises.push(
        setDoc(DOC_REFS.events, sanitizeForFirestore({
          events: updated.events,
          updatedAt: now
        }))
      );
    }
    if (data.researchAreas !== undefined || data.researchProjects !== undefined || data.publications !== undefined) {
      writePromises.push(
        setDoc(DOC_REFS.research, sanitizeForFirestore({
          researchAreas: updated.researchAreas,
          researchProjects: updated.researchProjects,
          publications: updated.publications,
          updatedAt: now
        }))
      );
    }
    if (data.achievements !== undefined) {
      writePromises.push(
        setDoc(DOC_REFS.achievements, sanitizeForFirestore({
          achievements: updated.achievements,
          updatedAt: now
        }))
      );
    }
    if (data.gallery !== undefined) {
      writePromises.push(
        setDoc(DOC_REFS.gallery, sanitizeForFirestore({
          gallery: updated.gallery,
          updatedAt: now
        }))
      );
    }
    if (data.blogs !== undefined) {
      writePromises.push(
        setDoc(DOC_REFS.blogs, sanitizeForFirestore({
          blogs: updated.blogs,
          updatedAt: now
        }))
      );
    }
    if (
      data.departmentStudents !== undefined ||
      data.registeredStudentProfiles !== undefined ||
      data.routineSlots !== undefined ||
      data.studentGrievances !== undefined ||
      data.portalResources !== undefined
    ) {
      writePromises.push(
        setDoc(DOC_REFS.students, sanitizeForFirestore({
          departmentStudents: updated.departmentStudents,
          registeredStudentProfiles: updated.registeredStudentProfiles,
          routineSlots: updated.routineSlots,
          studentGrievances: updated.studentGrievances,
          portalResources: updated.portalResources,
          updatedAt: now
        }))
      );
    }
    if (data.admins !== undefined || data.adminRegistrationRequests !== undefined) {
      writePromises.push(
        setDoc(DOC_REFS.admins, sanitizeForFirestore({
          admins: updated.admins,
          adminRegistrationRequests: updated.adminRegistrationRequests,
          updatedAt: now
        }))
      );
    }

    // Also update master doc in background
    writePromises.push(
      setDoc(DOC_REFS.master, sanitizeForFirestore(updated)).catch((err) => {
        console.warn('Master document background update notice:', err);
      })
    );

    Promise.allSettled(writePromises).then((results) => {
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Some section writes were not acknowledged:', failures);
      } else {
        console.log('All changes successfully committed to Google Cloud Firestore in real time.');
      }
    });
  };

  // Auth handler
  const loginAdmin = async (usernameOrEmail: string | undefined, password: string): Promise<boolean> => {
    if (!usernameOrEmail) return false;
    const cleanUser = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    const matched = admins.find(a => 
      (a.username || '').toLowerCase() === cleanUser || (a.email || '').toLowerCase() === cleanUser
    );

    if (matched && matched.status === 'Active') {
      const isCorrectPassword = await verifyPassword(cleanPass, matched.passwordHash);
      if (isCorrectPassword) {
        setIsAdminLoggedIn(true);
        setCurrentAdmin(matched);
        sessionStorage.setItem(AUTH_KEY, 'true');
        sessionStorage.setItem(AUTH_USER_KEY, matched.id);

        // Update last login
        const updatedAdmins = admins.map(a => 
          a.id === matched.id 
            ? { ...a, lastLogin: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } 
            : a
        );
        setAdmins(updatedAdmins);
        persist({ admins: updatedAdmins });
        return true;
      }
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setCurrentAdmin(null);
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  };

  const changePassword = async (adminId: string, newPassword: string) => {
    const hashedPassword = await hashPassword(newPassword);
    setAdmins((prev) => {
      const updated = prev.map((a) => (a.id === adminId ? { ...a, passwordHash: hashedPassword } : a));
      persist({ admins: updated });
      return updated;
    });
  };

  const generatePasswordResetToken = (usernameOrEmail: string | undefined): string | null => {
    if (!usernameOrEmail) return null;
    const cleanUser = usernameOrEmail.trim().toLowerCase();
    const admin = admins.find(a => 
      (a.username || '').toLowerCase() === cleanUser || 
      (a.email || '').toLowerCase() === cleanUser
    );
    if (!admin) return null;

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store token in admin record
    setAdmins((prev) => {
        const updated = prev.map((a) => (a.id === admin.id ? { ...a, resetToken: token, resetTokenExpiry: Date.now() + 3600000 } : a));
        persist({ admins: updated });
        return updated;
    });

    return token;
  };

  const resetAdminPassword = async (token: string, newPassword: string): Promise<boolean> => {
    const admin = admins.find(a => a.resetToken === token);
    if (!admin || (admin.resetTokenExpiry && admin.resetTokenExpiry < Date.now())) return false;
    
    await changePassword(admin.id, newPassword);
    
    // Clear token
    setAdmins((prev) => {
        const updated = prev.map((a) => (a.id === admin.id ? { ...a, resetToken: undefined, resetTokenExpiry: undefined } : a));
        persist({ admins: updated });
        return updated;
    });
    return true;
  };

  const addAdminAccount = (account: AdminAccount) => {
    setAdmins((prev) => {
      const updated = [...prev, account];
      persist({ admins: updated });
      return updated;
    });
  };

  const updateAdminAccount = (account: AdminAccount) => {
    setAdmins((prev) => {
      const updated = prev.map(a => a.id === account.id ? account : a);
      persist({ admins: updated });
      return updated;
    });
    if (currentAdmin && currentAdmin.id === account.id) {
      setCurrentAdmin(account);
    }
  };

  const deleteAdminAccount = (id: string) => {
    setAdmins((prev) => {
      const updated = prev.filter(a => a.id !== id);
      persist({ admins: updated });
      return updated;
    });
  };

  const submitAdminRegistrationRequest = (req: Omit<AdminRegistrationRequest, "id" | "status" | "requestDate">) => {
    const newRequest: AdminRegistrationRequest = {
      ...req,
      id: "req-" + Date.now(),
      status: "Pending",
      requestDate: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    };
    const updated = [...adminRegistrationRequests, newRequest];
    setAdminRegistrationRequests(updated);
    persist({ adminRegistrationRequests: updated });
  };

  const approveAdminRegistrationRequest = (id: string) => {
    const request = adminRegistrationRequests.find(r => r.id === id);
    if (!request) return;

    const duplicate = admins.some(a => (a.username || '').toLowerCase() === (request.username || '').toLowerCase() || (a.email || '').toLowerCase() === (request.email || '').toLowerCase());
    if (duplicate) {
      alert("Cannot approve: An administrator with this Username or Email already exists.");
      return;
    }

    const newAdmin: AdminAccount = {
      id: "admin-" + Date.now(),
      username: request.username,
      email: request.email,
      fullName: request.fullName,
      role: request.role as any,
      passwordHash: request.passwordHash,
      status: "Active"
    };

    const updatedAdmins = [...admins, newAdmin];
    const updatedRequests = adminRegistrationRequests.map(r => r.id === id ? { ...r, status: "Approved" as const } : r);

    setAdmins(updatedAdmins);
    setAdminRegistrationRequests(updatedRequests);
    persist({ admins: updatedAdmins, adminRegistrationRequests: updatedRequests });
  };

  const rejectAdminRegistrationRequest = (id: string) => {
    const updatedRequests = adminRegistrationRequests.map(r => r.id === id ? { ...r, status: "Rejected" as const } : r);
    setAdminRegistrationRequests(updatedRequests);
    persist({ adminRegistrationRequests: updatedRequests });
  };

  // Mutators
  const updateDepartmentInfo = (info: Partial<DepartmentInfoType>) => {
    setDepartmentInfo((prev) => {
      const updated = { ...prev, ...info };
      persist({ departmentInfo: updated });
      return updated;
    });
  };

  const updateStats = (newStats: DepartmentStat[]) => {
    setStats(newStats);
    persist({ stats: newStats });
  };

  // Faculty
  const addFaculty = (member: FacultyMember) => {
    setFaculty((prev) => {
      const updated = [member, ...prev];
      setStats((prevStats) => {
        const newStats = syncFacultyCount(updated, prevStats);
        persist({ faculty: updated, stats: newStats });
        return newStats;
      });
      return updated;
    });
  };

  const updateFaculty = (member: FacultyMember) => {
    setFaculty((prev) => {
      const updated = prev.map((f) => (f.id === member.id ? member : f));
      setStats((prevStats) => {
        const newStats = syncFacultyCount(updated, prevStats);
        persist({ faculty: updated, stats: newStats });
        return newStats;
      });
      return updated;
    });
  };

  const deleteFaculty = (id: string) => {
    setFaculty((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      setStats((prevStats) => {
        const newStats = syncFacultyCount(updated, prevStats);
        persist({ faculty: updated, stats: newStats });
        return newStats;
      });
      return updated;
    });
  };

  // Department Students Directory
  const addDepartmentStudent = (student: DepartmentStudent) => {
    setDepartmentStudents((prev) => {
      const updated = [student, ...prev];
      persist({ departmentStudents: updated });
      return updated;
    });
  };

  const updateDepartmentStudent = (student: DepartmentStudent) => {
    setDepartmentStudents((prev) => {
      const updated = prev.map((s) => (s.id === student.id ? student : s));
      persist({ departmentStudents: updated });
      return updated;
    });
  };

  const deleteDepartmentStudent = (id: string) => {
    setDepartmentStudents((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      persist({ departmentStudents: updated });
      return updated;
    });
  };

  const deleteMultipleDepartmentStudents = (ids: string[]) => {
    const idSet = new Set(ids);
    setDepartmentStudents((prev) => {
      const updated = prev.filter((s) => !idSet.has(s.id));
      persist({ departmentStudents: updated });
      return updated;
    });
  };

  const bulkImportDepartmentStudents = (newStudents: DepartmentStudent[]) => {
    setDepartmentStudents((prev) => {
      // Merge unique by rollNo or id
      const existingRolls = new Set(prev.map((s) => (s.rollNo || '').toLowerCase()));
      const filteredNew = newStudents.filter((s) => !existingRolls.has((s.rollNo || '').toLowerCase()));
      const updated = [...filteredNew, ...prev];
      persist({ departmentStudents: updated });
      return updated;
    });
  };

  // Student verification for portal registration
  const verifyStudentEligibility = (fullName: string | undefined, rollNo: string | undefined, courseProgram: string | undefined): VerificationResult => {
    const normName = (fullName || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const normRoll = (rollNo || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const normCourse = (courseProgram || '').toLowerCase();

    if (!normName && !normRoll) {
      return {
        isEligible: false,
        reason: 'Full name and Roll Number are required for department enrollment verification.'
      };
    }

    // Search department active student list
    const matched = departmentStudents.find((s) => {
      const sRollClean = (s.rollNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sGuClean = s.guRegNo ? (s.guRegNo || '').toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      const sNameClean = (s.fullName || '').toLowerCase().replace(/\s+/g, ' ');

      // Primary check: Roll match
      if (normRoll && (sRollClean === normRoll || (sGuClean && sGuClean === normRoll))) {
        return true;
      }

      // Secondary check: Name matching
      if (normName && (sNameClean === normName || sNameClean.includes(normName) || normName.includes(sNameClean))) {
        // If name matches, also check if roll is at least partially related or absent
        if (!normRoll || sRollClean.includes(normRoll) || normRoll.includes(sRollClean)) {
          return true;
        }
      }

      return false;
    });

    if (!matched) {
      return {
        isEligible: false,
        reason: `No official record was found in the Department of Mathematics student roster for "${fullName}" (Roll: ${rollNo || 'N/A'}).`
      };
    }

    // Check course compatibility
    const studentProgClean = matched.courseProgram.toLowerCase();
    const studentSelectiveClean = matched.selectiveCourse.toLowerCase();
    const selectedProgClean = normCourse;

    const isMajor = selectedProgClean.includes('major') || selectedProgClean.includes('honours');
    const isMinor = selectedProgClean.includes('minor');
    const isMsc = selectedProgClean.includes('m.sc') || selectedProgClean.includes('msc');
    const isSec = selectedProgClean.includes('sec') || selectedProgClean.includes('value added') || selectedProgClean.includes('computing');

    const studentIsMajor = studentProgClean.includes('major') || studentProgClean.includes('honours');
    const studentIsMinor = studentProgClean.includes('minor');
    const studentIsMsc = studentProgClean.includes('m.sc') || studentProgClean.includes('msc');
    const studentIsSec = studentProgClean.includes('sec') || studentProgClean.includes('value added') || studentSelectiveClean.includes('sec');

    const courseMatched =
      studentProgClean === selectedProgClean ||
      (isMajor && studentIsMajor) ||
      (isMinor && studentIsMinor) ||
      (isMsc && studentIsMsc) ||
      (isSec && studentIsSec) ||
      studentProgClean.includes(selectedProgClean) ||
      selectedProgClean.includes(studentProgClean);

    if (!courseMatched) {
      return {
        isEligible: false,
        matchedStudent: matched,
        reason: `Course mismatch: Official department records show you are enrolled in "${matched.courseProgram}" (${matched.selectiveCourse}), but you selected "${courseProgram || 'unknown'}".`
      };
    }

    return {
      isEligible: true,
      matchedStudent: matched
    };
  };

  // Portal Registered Student Profiles
  const addRegisteredStudentProfile = (profile: StudentProfile) => {
    setRegisteredStudentProfiles((prev) => {
      const updated = [profile, ...prev.filter((p) => p.id !== profile.id && (p.rollNo || '').toLowerCase() !== (profile.rollNo || '').toLowerCase())];
      persist({ registeredStudentProfiles: updated });
      return updated;
    });
  };

  const updateRegisteredStudentProfile = (profile: StudentProfile) => {
    setRegisteredStudentProfiles((prev) => {
      const updated = prev.map((p) => (p.id === profile.id ? profile : p));
      persist({ registeredStudentProfiles: updated });
      return updated;
    });
  };

  const deleteRegisteredStudentProfile = (id: string) => {
    setRegisteredStudentProfiles((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persist({ registeredStudentProfiles: updated });
      return updated;
    });
  };

  const bulkImportRegisteredStudentProfiles = (profiles: StudentProfile[]) => {
    setRegisteredStudentProfiles((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filtered = profiles.filter((p) => !existingIds.has(p.id));
      const updated = [...filtered, ...prev];
      persist({ registeredStudentProfiles: updated });
      return updated;
    });
  };

  // Portal Study Resources
  const addPortalResource = (resource: StudentResource) => {
    setPortalResources((prev) => {
      const updated = [resource, ...prev];
      persist({ portalResources: updated });
      return updated;
    });
  };

  const updatePortalResource = (resource: StudentResource) => {
    setPortalResources((prev) => {
      const updated = prev.map((r) => (r.id === resource.id ? resource : r));
      persist({ portalResources: updated });
      return updated;
    });
  };

  const deletePortalResource = (id: string) => {
    console.log('Deleting resource:', id);
    setPortalResources((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      console.log('Updated resources list:', updated);
      persist({ portalResources: updated });
      return updated;
    });
  };

  // Portal Routine Slots
  const addRoutineSlot = (slot: RoutineSlot) => {
    setRoutineSlots((prev) => {
      const updated = [...prev, slot];
      persist({ routineSlots: updated });
      return updated;
    });
  };

  const updateRoutineSlot = (slot: RoutineSlot) => {
    setRoutineSlots((prev) => {
      const updated = prev.map((s) => (s.id === slot.id ? slot : s));
      persist({ routineSlots: updated });
      return updated;
    });
  };

  const deleteRoutineSlot = (id: string) => {
    setRoutineSlots((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      persist({ routineSlots: updated });
      return updated;
    });
  };

  // Student Grievances / Mentorship Queries
  const addStudentGrievance = (grievance: StudentGrievance) => {
    setStudentGrievances((prev) => {
      const updated = [grievance, ...prev];
      persist({ studentGrievances: updated });
      return updated;
    });
  };

  const updateStudentGrievance = (grievance: StudentGrievance) => {
    setStudentGrievances((prev) => {
      const updated = prev.map((g) => (g.id === grievance.id ? grievance : g));
      persist({ studentGrievances: updated });
      return updated;
    });
  };

  const deleteStudentGrievance = (id: string) => {
    setStudentGrievances((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      persist({ studentGrievances: updated });
      return updated;
    });
  };

  // Notices
  const addNotice = (notice: NoticeItem) => {
    setNotices((prev) => {
      const updated = [notice, ...prev];
      persist({ notices: updated });
      return updated;
    });
  };

  const updateNotice = (notice: NoticeItem) => {
    setNotices((prev) => {
      const updated = prev.map((n) => (n.id === notice.id ? notice : n));
      persist({ notices: updated });
      return updated;
    });
  };

  const deleteNotice = (id: string) => {
    setNotices((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      persist({ notices: updated });
      return updated;
    });
  };

  // Events
  const addEvent = (event: EventItem) => {
    setEvents((prev) => {
      const updated = [event, ...prev];
      persist({ events: updated });
      return updated;
    });
  };

  const updateEvent = (event: EventItem) => {
    setEvents((prev) => {
      const updated = prev.map((e) => (e.id === event.id ? event : e));
      persist({ events: updated });
      return updated;
    });
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      persist({ events: updated });
      return updated;
    });
  };

  // Courses
  const addCourse = (course: Course) => {
    setCourses((prev) => {
      const updated = [course, ...prev];
      persist({ courses: updated });
      return updated;
    });
  };

  const updateCourse = (course: Course) => {
    setCourses((prev) => {
      const updated = prev.map((c) => (c.id === course.id ? course : c));
      persist({ courses: updated });
      return updated;
    });
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      persist({ courses: updated });
      return updated;
    });
  };

  // Research Areas
  const addResearchArea = (area: ResearchArea) => {
    setResearchAreas((prev) => {
      const updated = [...prev, area];
      persist({ researchAreas: updated });
      return updated;
    });
  };

  const updateResearchArea = (area: ResearchArea) => {
    setResearchAreas((prev) => {
      const updated = prev.map((r) => (r.id === area.id ? area : r));
      persist({ researchAreas: updated });
      return updated;
    });
  };

  const deleteResearchArea = (id: string) => {
    setResearchAreas((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      persist({ researchAreas: updated });
      return updated;
    });
  };

  // Research Projects
  const addResearchProject = (project: ResearchProject) => {
    setResearchProjects((prev) => {
      const updated = [project, ...prev];
      persist({ researchProjects: updated });
      return updated;
    });
  };

  const updateResearchProject = (project: ResearchProject) => {
    setResearchProjects((prev) => {
      const updated = prev.map((p) => (p.id === project.id ? project : p));
      persist({ researchProjects: updated });
      return updated;
    });
  };

  const deleteResearchProject = (id: string) => {
    setResearchProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persist({ researchProjects: updated });
      return updated;
    });
  };

  // Publications
  const addPublication = (publication: Publication) => {
    setPublications((prev) => {
      const updated = [publication, ...prev];
      persist({ publications: updated });
      return updated;
    });
  };

  const updatePublication = (publication: Publication) => {
    setPublications((prev) => {
      const updated = prev.map((p) => (p.id === publication.id ? publication : p));
      persist({ publications: updated });
      return updated;
    });
  };

  const deletePublication = (id: string) => {
    setPublications((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persist({ publications: updated });
      return updated;
    });
  };

  // Achievements
  const addAchievement = (achievement: AchievementItem) => {
    setAchievements((prev) => {
      const updated = [achievement, ...prev];
      persist({ achievements: updated });
      return updated;
    });
  };

  const updateAchievement = (achievement: AchievementItem) => {
    setAchievements((prev) => {
      const updated = prev.map((a) => (a.id === achievement.id ? achievement : a));
      persist({ achievements: updated });
      return updated;
    });
  };

  const deleteAchievement = (id: string) => {
    setAchievements((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      persist({ achievements: updated });
      return updated;
    });
  };

  // Gallery
  const addGalleryItem = (item: GalleryItem) => {
    setGallery((prev) => {
      const updated = [item, ...prev];
      persist({ gallery: updated });
      return updated;
    });
  };

  const updateGalleryItem = (item: GalleryItem) => {
    setGallery((prev) => {
      const updated = prev.map((g) => (g.id === item.id ? item : g));
      persist({ gallery: updated });
      return updated;
    });
  };

  const deleteGalleryItem = (id: string) => {
    setGallery((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      persist({ gallery: updated });
      return updated;
    });
  };

  // Blogs
  const addBlog = (blog: BlogPost) => {
    setBlogs((prev) => {
      const updated = [blog, ...prev];
      persist({ blogs: updated });
      return updated;
    });
  };

  const updateBlog = (blog: BlogPost) => {
    setBlogs((prev) => {
      const updated = prev.map((b) => (b.id === blog.id ? blog : b));
      persist({ blogs: updated });
      return updated;
    });
  };

  const deleteBlog = (id: string) => {
    setBlogs((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      persist({ blogs: updated });
      return updated;
    });
  };

  const likeBlog = (id: string) => {
    setBlogs((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, likesCount: (b.likesCount || 0) + 1 } : b));
      persist({ blogs: updated });
      return updated;
    });
  };

  // Global Utilities
  const resetAllToDefaults = () => {
    setDepartmentInfo(DEPARTMENT_INFO);
    setStats(syncFacultyCount(FACULTY_DATA, DEPARTMENT_STATS));
    setFaculty(FACULTY_DATA);
    setCourses(COURSES_DATA);
    setNotices(NOTICES_DATA);
    setEvents(EVENTS_DATA);
    setResearchAreas(RESEARCH_AREAS);
    setResearchProjects(RESEARCH_PROJECTS);
    setPublications(RESEARCH_PUBLICATIONS);
    setAchievements(ACHIEVEMENTS_DATA);
    setGallery(GALLERY_DATA);
    setDepartmentStudents(DEFAULT_DEPARTMENT_STUDENTS);
    setBlogs(DEFAULT_BLOG_POSTS);
    setRegisteredStudentProfiles(DEFAULT_STUDENT_PROFILES);
    setPortalResources(STUDENT_RESOURCES);
    setRoutineSlots(DEFAULT_ROUTINE_SLOTS.map(normalizeRoutineSlot));
    setStudentGrievances(DEFAULT_GRIEVANCES);

    const initialSeed: DepartmentCMSData = {
      departmentInfo: DEPARTMENT_INFO,
      stats: syncFacultyCount(FACULTY_DATA, DEPARTMENT_STATS),
      faculty: FACULTY_DATA,
      courses: COURSES_DATA,
      notices: NOTICES_DATA,
      events: EVENTS_DATA,
      researchAreas: RESEARCH_AREAS,
      researchProjects: RESEARCH_PROJECTS,
      publications: RESEARCH_PUBLICATIONS,
      achievements: ACHIEVEMENTS_DATA,
      gallery: GALLERY_DATA,
      departmentStudents: DEFAULT_DEPARTMENT_STUDENTS,
      blogs: DEFAULT_BLOG_POSTS,
      registeredStudentProfiles: DEFAULT_STUDENT_PROFILES,
      portalResources: STUDENT_RESOURCES,
      routineSlots: DEFAULT_ROUTINE_SLOTS.map(normalizeRoutineSlot),
      studentGrievances: DEFAULT_GRIEVANCES
    };
    persist(initialSeed);

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PORTAL_PROFILES_KEY);
    } catch (e) {}
  };

  const exportDataJson = (): string => {
    const data: DepartmentCMSData = {
      departmentInfo,
      stats,
      faculty,
      courses,
      notices,
      events,
      researchAreas,
      researchProjects,
      publications,
      achievements,
      gallery,
      departmentStudents,
      blogs,
      registeredStudentProfiles,
      portalResources,
      routineSlots,
      studentGrievances
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const parsed: DepartmentCMSData = JSON.parse(jsonStr);
      let facToUse = faculty;
      if (parsed.departmentInfo) setDepartmentInfo(parsed.departmentInfo);
      if (parsed.faculty) {
        facToUse = parsed.faculty;
        setFaculty(facToUse);
      }
      if (parsed.stats) {
        setStats(syncFacultyCount(facToUse, parsed.stats));
      } else {
        setStats(syncFacultyCount(facToUse, DEPARTMENT_STATS));
      }
      if (parsed.courses) setCourses(parsed.courses);
      if (parsed.notices) setNotices(parsed.notices);
      if (parsed.events) setEvents(parsed.events);
      if (parsed.researchAreas) setResearchAreas(parsed.researchAreas);
      if (parsed.researchProjects) setResearchProjects(parsed.researchProjects);
      if (parsed.publications) setPublications(parsed.publications);
      if (parsed.achievements) setAchievements(parsed.achievements);
      if (parsed.gallery) setGallery(parsed.gallery);
      if (parsed.departmentStudents) setDepartmentStudents(parsed.departmentStudents);
      if (parsed.blogs) setBlogs(parsed.blogs);
      if (parsed.registeredStudentProfiles) setRegisteredStudentProfiles(parsed.registeredStudentProfiles);
      if (parsed.portalResources) setPortalResources(parsed.portalResources);
      if (parsed.routineSlots) setRoutineSlots(parsed.routineSlots.map(normalizeRoutineSlot));
      if (parsed.studentGrievances) setStudentGrievances(parsed.studentGrievances);

      persist(parsed);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      if (parsed.registeredStudentProfiles) {
        localStorage.setItem(PORTAL_PROFILES_KEY, JSON.stringify(parsed.registeredStudentProfiles));
      }
      return true;
    } catch (e) {
      console.error('Failed to import JSON data:', e);
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        departmentInfo,
        stats,
        faculty,
        courses,
        notices,
        events,
        researchAreas,
        researchProjects,
        publications,
        achievements,
        gallery,
        departmentStudents,
        blogs,
        registeredStudentProfiles,
        portalResources,
        routineSlots,
        studentGrievances,

        isAdminOpen,
        setIsAdminOpen,
        isAdminLoggedIn,
        loginAdmin,
        logoutAdmin,
        admins,
        currentAdmin,
        adminRegistrationRequests,
        addAdminAccount,
        updateAdminAccount,
        deleteAdminAccount,
        changePassword,
        resetAdminPassword,
        generatePasswordResetToken,
        submitAdminRegistrationRequest,
        approveAdminRegistrationRequest,
        rejectAdminRegistrationRequest,

        updateDepartmentInfo,
        updateStats,

        addFaculty,
        updateFaculty,
        deleteFaculty,

        addDepartmentStudent,
        updateDepartmentStudent,
        deleteDepartmentStudent,
        deleteMultipleDepartmentStudents,
        bulkImportDepartmentStudents,
        verifyStudentEligibility,

        addRegisteredStudentProfile,
        updateRegisteredStudentProfile,
        deleteRegisteredStudentProfile,
        bulkImportRegisteredStudentProfiles,

        addPortalResource,
        updatePortalResource,
        deletePortalResource,

        addRoutineSlot,
        updateRoutineSlot,
        deleteRoutineSlot,

        addStudentGrievance,
        updateStudentGrievance,
        deleteStudentGrievance,

        addNotice,
        updateNotice,
        deleteNotice,

        addEvent,
        updateEvent,
        deleteEvent,

        addCourse,
        updateCourse,
        deleteCourse,

        addResearchArea,
        updateResearchArea,
        deleteResearchArea,

        addResearchProject,
        updateResearchProject,
        deleteResearchProject,

        addPublication,
        updatePublication,
        deletePublication,

        addAchievement,
        updateAchievement,
        deleteAchievement,

        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,

        addBlog,
        updateBlog,
        deleteBlog,
        likeBlog,

        resetAllToDefaults,
        exportDataJson,
        importDataJson,
        isLoading,
        isDatabaseQuotaExceeded
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDepartmentData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDepartmentData must be used within a DataProvider');
  }
  return context;
};
