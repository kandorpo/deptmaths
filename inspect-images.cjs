const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./db_dump.json', 'utf8'));

console.log("departmentInfo.logoUrl length:", data.departmentInfo?.logoUrl?.length);
console.log("departmentInfo.aboutImageUrl length:", data.departmentInfo?.aboutImageUrl?.length);
data.faculty?.forEach(f => {
  if (f.image && f.image.startsWith('data:')) {
    console.log(`Faculty ${f.name} image length:`, f.image.length);
  }
});
data.gallery?.forEach(g => {
  if (g.image && g.image.startsWith('data:')) {
    console.log(`Gallery ${g.title} image length:`, g.image.length);
  }
});
