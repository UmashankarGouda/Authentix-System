const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHashes() {
  const cred = await prisma.credential.findFirst();
  if (cred) {
    console.log('✅ Found credential:');
    console.log('  ID:', cred.id);
    console.log('  Credential No:', cred.credentialNo);
    console.log('  File Hash:', cred.fileHash);
    console.log('  JSON Hash:', cred.jsonHash);
    console.log('  Blockchain TX:', cred.blockchainTx);
  } else {
    console.log('❌ No credentials found');
  }
  await prisma.$disconnect();
}

checkHashes();
