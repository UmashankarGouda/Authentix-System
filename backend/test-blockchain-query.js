const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT_ABI = [
  "function getCredentialByFileHash(bytes32 fileHash) external view returns (uint256, address, bytes32, bytes32, string memory, uint256)"
];

async function queryBlockchain() {
  const fileHash = "0xd136202463a9bfebb4149e78b57f95fd27c408cc987f469b5953c7c993271282";
  
  console.log('🔗 Querying blockchain...\n');
  console.log('Contract:', process.env.CONTRACT_ADDRESS);
  console.log('RPC:', process.env.SEPOLIA_RPC_URL);
  console.log('Searching for fileHash:', fileHash);
  console.log('');
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );
    
    const result = await contract.getCredentialByFileHash(fileHash);
    
    console.log('✅ Found on blockchain:');
    console.log('  credId:', result[0].toString());
    console.log('  issuer:', result[1]);
    console.log('  fileHash:', result[2]);
    console.log('  jsonHash:', result[3]);
    console.log('  cid:', result[4]);
    console.log('  timestamp:', result[5].toString());
  } catch (error) {
    console.log('❌ Not found on blockchain');
    console.log('Error:', error.message);
    
    // Check if it's a revert
    if (error.message.includes('Credential not found')) {
      console.log('\n💡 The credential was never stored on blockchain!');
      console.log('   This means issuance failed at blockchain step.');
    }
  }
}

queryBlockchain();
