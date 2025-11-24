Credential Verification & Recovery System
A decentralized platform for secure credential issuance, verification, and recovery, built using smart contracts, a backend service, and a frontend dApp interface.
This system ensures tamper-proof credential records, simple verification, and a robust account/credential recovery workflow.

📂 Repository Structure
credential-verification-and-recovery-system/
│
├── frontend/   # React-based dApp for users, issuers & verifiers
├── backend/    # API service for off-chain logic and indexing
└── contracts/  # Solidity smart contracts (Hardhat)

🚀 Features
On-chain credential issuance
Credential verification using immutable blockchain records
Revocation support for invalid or expired credentials
Recovery mechanism for users who lose access
Issuer, holder & verifier roles
Secure off-chain data indexing and API services
Web3 wallet integration (MetaMask)
Modular architecture for extensibility

🛠️ Tech Stack

Smart Contracts
- Solidity
- Hardhat
- Ethers.js / Web3.js

Backend
- Node.js
- Express / REST API
- Database support (PostgreSQL/MongoDB depending on your setup)
- Event listeners for on-chain indexing

Frontend
- React + Vite/Next.js (based on repo config)
- Web3 wallet integration
- Axios/API connectors
- Contract interaction via Ethers.js

📌 System Architecture
Issuer/Hodler/Verifier
        │
        ▼
Frontend (React dApp)
        │  calls
        ▼
Backend (API server) ─── listens ───► Blockchain Events
        │                               (Hardhat/Testnet/Mainnet)
        ▼
Database (optional for metadata storage)


On-chain: credential hash, issuer info, revocation status

Off-chain: metadata, search index, recovery workflows

⚙️ Prerequisites

Install the following:

Node.js ≥ 16

npm or yarn

Git

Hardhat

MetaMask (for testing)

(Optional)

PostgreSQL / MongoDB

Docker

🔧 Setup Instructions (Local Development)
1️⃣ Clone the repository
git clone https://github.com/dpokk/credential-verification-and-recovery-system.git
cd credential-verification-and-recovery-system

2️⃣ Smart Contracts (Hardhat)
cd contracts
npm install

Compile contracts
npx hardhat compile

Start local blockchain
npx hardhat node

Deploy contracts
npx hardhat run scripts/deploy.js --network localhost


Save the deployed contract address for the frontend & backend .env.

3️⃣ Backend Setup
cd backend
npm install


Create your .env file:

PORT=4000
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=<your_private_key>
CONTRACT_ADDRESS=<deployed_contract_address>
DATABASE_URL=<optional>
JWT_SECRET=super_secret_key

Start Backend
npm run start   # or npm run dev

4️⃣ Frontend Setup
cd frontend
npm install


Create frontend .env:

VITE_CONTRACT_ADDRESS=<contract_address>
VITE_RPC_URL=http://127.0.0.1:8545

Start Frontend
npm run dev


Open the app at:

http://localhost:3000


Connect MetaMask → choose local network → interact with the dApp.

🧪 Testing
Contracts
cd contracts
npx hardhat test

Backend
npm test

Frontend
npm test

📘 Example Credential Flow

Issuer logs into the dApp

Fills credential information

Clicks Issue Credential → signs transaction

Credential hash stored on-chain

Holder receives credential ID / token

Verifier checks credential by entering ID

Smart contract returns:

Issuer

Valid / Revoked

Timestamp

Holder can trigger recovery options if needed

🔄 Recovery Mechanism
The system supports:
- Social/multi-sig recovery
- Recovery contacts
- Off-chain verification + on-chain update
- Optional identity verification steps via backend

🤝 Contribution Guide
- Fork the repository
- Create a feature branch
- Commit changes with clear messages
- Submit a pull request

Guidelines:
- Follow TypeScript conventions
- Add tests for new features
- Update documentation when necessary


👤 Authors
GitHub: @dpokk
Github: @UmashankarGouda

For any additional docs, API references, or setup assistance — feel free to ask!
