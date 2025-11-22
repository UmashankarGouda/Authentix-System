import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function issueCredential(bytes32 fileHash, bytes32 jsonHash, string memory cid) external returns (uint256)",
  "function getCredentialByFileHash(bytes32 fileHash) external view returns (uint256, address, bytes32, bytes32, string memory, uint256)",
  "function getCredentialByJsonHash(bytes32 jsonHash) external view returns (uint256, address, bytes32, bytes32, string memory, uint256)",
  "event CredentialIssued(uint256 indexed credId, address indexed issuer, bytes32 fileHash, bytes32 jsonHash, string cid)"
];

let provider: ethers.JsonRpcProvider;
let contract: ethers.Contract;
let signer: ethers.Wallet;

export const initBlockchain = () => {
  try {
    provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS!,
      CONTRACT_ABI,
      signer
    );
    console.log('✅ Blockchain service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize blockchain:', error);
  }
};

export const issueCredentialOnChain = async (
  fileHash: string,
  jsonHash: string,
  cid: string
): Promise<string> => {
  try {
    if (!contract) {
      throw new Error('Blockchain not initialized');
    }

    const tx = await contract.issueCredential(fileHash, jsonHash, cid);
    const receipt = await tx.wait();
    
    console.log(`✅ Credential issued on blockchain: ${receipt.hash}`);
    return receipt.hash;
  } catch (error) {
    console.error('❌ Error issuing credential on chain:', error);
    throw new Error('Failed to issue credential on blockchain');
  }
};

export const verifyCredentialOnChain = async (
  fileHash?: string,
  jsonHash?: string
): Promise<any> => {
  try {
    if (!contract) {
      throw new Error('Blockchain not initialized');
    }

    let result;
    if (fileHash) {
      result = await contract.getCredentialByFileHash(fileHash);
    } else if (jsonHash) {
      result = await contract.getCredentialByJsonHash(jsonHash);
    } else {
      throw new Error('Either fileHash or jsonHash required');
    }

    return {
      credId: result[0].toString(),
      issuer: result[1],
      fileHash: result[2],
      jsonHash: result[3],
      cid: result[4],
      timestamp: result[5].toString()
    };
  } catch (error) {
    console.error('❌ Error verifying credential on chain:', error);
    return null;
  }
};

// Initialize on import
if (process.env.CONTRACT_ADDRESS && process.env.SEPOLIA_RPC_URL && process.env.PRIVATE_KEY) {
  initBlockchain();
}
