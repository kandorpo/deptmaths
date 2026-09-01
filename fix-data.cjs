const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('./temp-dump.json', 'utf8'));

let output = `import {
  DepartmentInfo,
  DepartmentStat,
  FacultyMember,
  Course,
  NoticeItem,
  EventItem,
  ResearchArea,
  ResearchProject,
  Publication,
  AchievementItem,
  GalleryItem,
  DepartmentStudent,
  BlogPost,
  StudentProfile,
  PortalResource,
  RoutineSlot,
  StudentGrievance,
  AdminAccount,
  AdminRegistrationRequest
} from '../types';

export const FAMOUS_QUOTES = [
  { text: "Mathematics is the queen of the sciences.", author: "Carl Friedrich Gauss" },
  { text: "Pure mathematics is, in its way, the poetry of logical ideas.", author: "Albert Einstein" },
  { text: "The essence of mathematics lies in its freedom.", author: "Georg Cantor" },
  { text: "Mathematics knows no races or geographic boundaries; for mathematics, the cultural world is one country.", author: "David Hilbert" }
];\n\n`;

for (const key of Object.keys(rawData)) {
  if (key === 'updatedAt') continue;

  const exportName = key === 'departmentInfo' ? 'DEPARTMENT_INFO'
                   : key === 'stats' ? 'DEPARTMENT_STATS'
                   : key === 'faculty' ? 'FACULTY_DATA'
                   : key === 'courses' ? 'COURSES_DATA'
                   : key === 'notices' ? 'NOTICES_DATA'
                   : key === 'events' ? 'EVENTS_DATA'
                   : key === 'researchAreas' ? 'RESEARCH_AREAS'
                   : key === 'researchProjects' ? 'RESEARCH_PROJECTS'
                   : key === 'publications' ? 'RESEARCH_PUBLICATIONS'
                   : key === 'achievements' ? 'ACHIEVEMENTS_DATA'
                   : key === 'gallery' ? 'GALLERY_DATA'
                   : key === 'departmentStudents' ? 'DEFAULT_DEPARTMENT_STUDENTS'
                   : key === 'blogs' ? 'DEFAULT_BLOG_POSTS'
                   : key === 'registeredStudentProfiles' ? 'DEFAULT_STUDENT_PROFILES'
                   : key === 'portalResources' ? 'STUDENT_RESOURCES'
                   : key === 'routineSlots' ? 'DEFAULT_ROUTINE_SLOTS'
                   : key === 'studentGrievances' ? 'DEFAULT_GRIEVANCES'
                   : key === 'admins' ? 'DEFAULT_ADMIN_ACCOUNTS'
                   : key === 'adminRegistrationRequests' ? 'DEFAULT_ADMIN_REQUESTS'
                   : key.toUpperCase();

  let typeAnnotation = '';
  if (key === 'departmentInfo') typeAnnotation = ': DepartmentInfo';
  else if (key === 'stats') typeAnnotation = ': DepartmentStat[]';
  else if (key === 'faculty') typeAnnotation = ': FacultyMember[]';
  else if (key === 'courses') typeAnnotation = ': Course[]';
  else if (key === 'notices') typeAnnotation = ': NoticeItem[]';
  else if (key === 'events') typeAnnotation = ': EventItem[]';
  else if (key === 'researchAreas') typeAnnotation = ': ResearchArea[]';
  else if (key === 'researchProjects') typeAnnotation = ': ResearchProject[]';
  else if (key === 'publications') typeAnnotation = ': Publication[]';
  else if (key === 'achievements') typeAnnotation = ': AchievementItem[]';
  else if (key === 'gallery') typeAnnotation = ': GalleryItem[]';
  else if (key === 'departmentStudents') typeAnnotation = ': DepartmentStudent[]';
  else if (key === 'blogs') typeAnnotation = ': BlogPost[]';
  else if (key === 'registeredStudentProfiles') typeAnnotation = ': StudentProfile[]';
  else if (key === 'portalResources') typeAnnotation = ': PortalResource[]';
  else if (key === 'routineSlots') typeAnnotation = ': RoutineSlot[]';
  else if (key === 'studentGrievances') typeAnnotation = ': StudentGrievance[]';
  else if (key === 'admins') typeAnnotation = ': AdminAccount[]';
  else if (key === 'adminRegistrationRequests') typeAnnotation = ': AdminRegistrationRequest[]';

  output += `export const ${exportName}${typeAnnotation} = ${JSON.stringify(rawData[key], null, 2)} as any;\n\n`;
}

fs.writeFileSync('src/data/departmentData.ts', output);
console.log('Successfully regenerated typed src/data/departmentData.ts with Type Assertions');
