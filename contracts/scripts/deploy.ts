import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying CredentialRegistry contract...");

  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const contract = await CredentialRegistry.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log(`✅ CredentialRegistry deployed to: ${address}`);
  console.log(`\n📝 Update backend/.env with:`);
  console.log(`CONTRACT_ADDRESS="${address}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
