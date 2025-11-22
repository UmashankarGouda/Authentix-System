const { PrismaClient } = require('@prisma/client');
const { ethers } = require('ethers');
const prisma = new PrismaClient();

async function testHashFormat() {
  const cred = await prisma.credential.findFirst();
  if (!cred) {
    console.log('❌ No credentials found');
    return;
  }
  
  console.log('📊 Hash Analysis:\n');
  console.log('From Database:');
  console.log('  fileHash:', cred.fileHash);
  console.log('  jsonHash:', cred.jsonHash);
  console.log('  Length:', cred.fileHash.length, 'characters');
  
  // Check if it's valid bytes32
  try {
    const bytes32 = ethers.zeroPadValue(cred.fileHash, 32);
    console.log('\n✅ Valid bytes32 format');
    console.log('  Padded:', bytes32);
  } catch (e) {
    console.log('\n❌ Invalid bytes32 format:', e.message);
  }
  
  await prisma.$disconnect();
}

testHashFormat();
