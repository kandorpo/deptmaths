const fs = require('fs');

let fileContent = fs.readFileSync('src/data/departmentData.ts', 'utf8');

fileContent = fileContent.replace('export const DEPARTMENT_INFO: DepartmentInfo = {', 'export const DEPARTMENT_INFO = {');
fileContent = fileContent.replace('export const STUDENT_RESOURCES: PortalResource[] = [', 'export const STUDENT_RESOURCES = [');

fs.writeFileSync('src/data/departmentData.ts', fileContent);
