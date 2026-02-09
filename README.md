# Resilient Credential Verification System

A decentralized, tamper-proof academic credential issuance and verification platform, leveraging blockchain technology, distributed storage, and cryptographic key management to eliminate fraud, ensure data permanence, and empower students with sovereign control over their qualifications.

---

## The Problem with Traditional Systems

Conventional academic credential management suffers from several critical vulnerabilities:

| Issue | Description |
| :--- | :--- |
| **Centralized Trust** | Reliance on a single institution as the sole source of truth creates a bottleneck for verification and a single point of failure. |
| **Fraud Susceptibility** | Paper-based and even basic digital certificates can be forged or tampered with, undermining trust in legitimate qualifications. |
| **Data Impermanence** | Institutional databases can be corrupted, lost to disasters, or simply decommissioned, erasing years of academic records. |
| **Slow Verification** | The process often involves manual requests, emails, and significant wait times, hindering timely employment and enrollment decisions. |
| **Lack of Portability** | Credentials are tightly bound to the issuing institution's systems, offering students no independent control. |

---

## Our Solution

This platform addresses these challenges through a robust, multi-layered architecture:

1.  **Blockchain Anchoring**: A cryptographic hash of each credential is permanently recorded on an immutable, distributed ledger (Ethereum-compatible). This provides a public, verifiable, and tamper-evident proof of issuance that exists independently of any single entity.

2.  **Decentralized Storage (IPFS)**: The full credential document is stored on the InterPlanetary File System, ensuring content-addressable, censorship-resistant availability. The on-chain record links directly to this distributed data.

3.  **Cryptographic Key Recovery**: To prevent catastrophic loss of access, the system implements Shamir's Secret Sharing, distributing encryption key fragments across multiple independent custodians. This allows for key recovery without any single party ever holding the complete key.

---

## Key Features

-   **Instant Verification**: Any third party can verify a credential's authenticity against the blockchain in seconds.
-   **Tamper-Proof Records**: On-chain hashes make any modification to the original document immediately detectable.
-   **Disaster Resilience**: Distributed storage and key management ensure no single point of failure can destroy records.
-   **Student-Centric Ownership**: Students receive their credential data and can present it for verification without institutional intermediary.
-   **Full Audit Trail**: All issuance and verification events are logged, providing a transparent history.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Blockchain** | Solidity, Hardhat (Sepolia Testnet), Ethers.js |
| **Distributed Storage** | IPFS (via **Filebase** S3-compatible API) |
| **Cryptography** | AES-256-GCM (Content), RSA-OAEP (Keys), Shamir's Secret Sharing (Recovery) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React/Vite)                         │
│         [ University Portal ]   [ Student Portal ]   [ Verifier ]       │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ HTTPS (REST API)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Backend (Node.js / Express)                       │
│   [ Auth ]   [ Issuance Logic ]   [ Key Management ]   [ Audit Logs ]   │
└───────┬────────────────────┬────────────────────────────────┬───────────┘
        │                    │                                │
        ▼                    ▼                                ▼
┌───────────────┐   ┌───────────────────┐            ┌────────────────────┐
│  PostgreSQL   │   │   IPFS Gateway    │            │ Blockchain (EVM)   │
│   (Prisma)    │   │ (Document Store)  │            │ (Smart Contract)   │
└───────────────┘   └───────────────────┘            └────────────────────┘
```

---

## Getting Started

### Prerequisites

-   **Node.js** (v18 or later)
-   **npm** or **yarn**
-   **PostgreSQL** instance (local or cloud-hosted)
-   Access to the **Sepolia testnet** (via Alchemy, Infura, or another RPC provider).
-   A wallet with Sepolia ETH for gas fees (obtainable from public faucets).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd miniproject
    ```

2.  **Install all dependencies:**
    ```bash
    npm run install:all
    ```

3.  **Configure Environment Variables:**
    Create `.env` files in the `backend` and `frontend` directories.

    **Backend (`backend/.env`):**
    ```env
    # Database
    DATABASE_URL="postgresql://user:password@localhost:5432/miniproject"

    # Server
    PORT=5000
    NODE_ENV=development
    JWT_SECRET="your-secret-key"
    JWT_EXPIRES_IN="7d"

    # Filebase (IPFS)
    FILEBASE_ACCESS_KEY="your-access-key"
    FILEBASE_SECRET_KEY="your-secret-key"
    FILEBASE_BUCKET="your-bucket-name"
    FILEBASE_REGION="us-east-1"
    FILEBASE_ENDPOINT="https://s3.filebase.com"

    # Blockchain (Sepolia)
    SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/..."
    PRIVATE_KEY="your-wallet-private-key"
    CONTRACT_ADDRESS="0x..." # Deployed contract address
    
    # CORS
    CORS_ORIGIN="http://localhost:5173"
    ```

    **Frontend (`frontend/.env`):**
    ```env
    VITE_API_URL="http://localhost:5000"
    VITE_CONTRACT_ADDRESS="0x..." # Same as backend CONTRACT_ADDRESS
    VITE_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/..."
    ```

4.  **Set up the Database:**
    ```bash
    cd backend
    npm run prisma:migrate
    npm run prisma:generate
    ```

5.  **Deploy Smart Contracts (to Sepolia):**
    ```bash
    cd ../contracts
    npx hardhat run scripts/deploy.ts --network sepolia
    ```
    Copy the deployed contract address and add it to `backend/.env` as `CONTRACT_ADDRESS`.

---

## Running the Application

From the project root, a single command starts both the frontend and backend development servers concurrently:

```bash
npm run dev
```

-   **Frontend**: `http://localhost:5173` (default Vite port)
-   **Backend**: `http://localhost:5000` (as configured)

---

## Project Structure

```
miniproject/
├── backend/             # Express.js API server
│   ├── prisma/          # Database schema and migrations
│   └── src/             # Controllers, Routes, Services, Middleware
├── contracts/           # Solidity smart contracts and Hardhat config
│   └── contracts/       # Source files for on-chain logic
├── frontend/            # React single-page application
│   └── src/             # Components, Pages, Hooks, Utils
├── package.json         # Monorepo scripts
└── README.md
```

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request. Ensure all code adheres to the existing style and includes appropriate tests.
