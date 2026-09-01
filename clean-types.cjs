const fs = require('fs');

let fileContent = fs.readFileSync('src/data/departmentData.ts', 'utf8');

fileContent = fileContent.replace('DepartmentInfo,', '');
fileContent = fileContent.replace('PortalResource,', '');

fs.writeFileSync('src/data/departmentData.ts', fileContent);
