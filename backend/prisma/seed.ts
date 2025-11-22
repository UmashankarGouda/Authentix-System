import { PrismaClient } from '@prisma/client';
import * as forge from 'node-forge';

const prisma = new PrismaClient();

// Generate RSA keypair for custodians (in production, store private keys securely!)
function generateCustodianKeypair() {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
  return { publicKeyPem, privateKeyPem };
}

async function main() {
  console.log('🌱 Seeding database...');

  // Generate 3 custodians with RSA keypairs
  const custodian1Keys = generateCustodianKeypair();
  const custodian2Keys = generateCustodianKeypair();
  const custodian3Keys = generateCustodianKeypair();

  // Create custodians with fixed UUIDs for consistency
  const custodian1 = await prisma.custodian.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Custodian Alpha',
      publicKey: custodian1Keys.publicKeyPem,
      endpoint: 'https://custodian-alpha.example.com',
    },
  });

  const custodian2 = await prisma.custodian.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Custodian Beta',
      publicKey: custodian2Keys.publicKeyPem,
      endpoint: 'https://custodian-beta.example.com',
    },
  });

  const custodian3 = await prisma.custodian.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Custodian Gamma',
      publicKey: custodian3Keys.publicKeyPem,
      endpoint: 'https://custodian-gamma.example.com',
    },
  });

  console.log('✅ Created 3 custodians');
  
  // Store private keys in a separate file (for demo/testing only!)
  console.log('\n⚠️  CUSTODIAN PRIVATE KEYS (STORE SECURELY!):\n');
  console.log('Custodian 1 Private Key:\n', custodian1Keys.privateKeyPem);
  console.log('\nCustodian 2 Private Key:\n', custodian2Keys.privateKeyPem);
  console.log('\nCustodian 3 Private Key:\n', custodian3Keys.privateKeyPem);
  console.log('\n⚠️  Save these keys in a secure location!\n');

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
