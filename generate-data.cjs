const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./db_dump.json', 'utf8'));

let output = `export const FAMOUS_QUOTES = [
  { text: "Mathematics is the queen of the sciences.", author: "Carl Friedrich Gauss" },
  { text: "Pure mathematics is, in its way, the poetry of logical ideas.", author: "Albert Einstein" },
  { text: "The essence of mathematics lies in its freedom.", author: "Georg Cantor" },
  { text: "Mathematics knows no races or geographic boundaries; for mathematics, the cultural world is one country.", author: "David Hilbert" }
];\n\n`;

for (const key of Object.keys(data)) {
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

  output += `export const ${exportName} = ${JSON.stringify(data[key], null, 2)};\n\n`;
}

fs.writeFileSync('src/data/departmentData.ts', output);
console.log('Successfully generated src/data/departmentData.ts');
