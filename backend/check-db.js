const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING DATABASE ===\n');
  
  // Get all universities
  const universities = await prisma.university.findMany({
    select: { id: true, name: true, email: true }
  });
  
  console.log('Universities in DB:');
  console.log(JSON.stringify(universities, null, 2));
  
  if (universities.length > 0) {
    console.log(`\n✅ Found ${universities.length} university/universities`);
    console.log(`\nUse this ID for student signup: ${universities[0].id}`);
    
    // Test what happens when we try to create a student
    console.log('\n=== TESTING STUDENT CREATION ===');
    try {
      const testStudent = await prisma.student.create({
        data: {
          name: 'Test Student',
          regNo: 'TEST' + Date.now(),
          email: 'test' + Date.now() + '@test.com',
          passwordHash: 'dummyhash',
          universityId: universities[0].id
        }
      });
      console.log('✅ Student created successfully!');
      console.log(JSON.stringify(testStudent, null, 2));
      
      // Clean up
      await prisma.student.delete({ where: { id: testStudent.id } });
      console.log('✅ Test student deleted (cleanup done)');
    } catch (error) {
      console.error('❌ Error creating student:');
      console.error(error.message);
      console.error('\nFull error:', error);
    }
  } else {
    console.log('❌ No universities found in database!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Script error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
