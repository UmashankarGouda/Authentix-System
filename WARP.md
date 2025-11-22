# WARP.md
This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview
This is a monorepo for the **Resilient Certificate System**, which issues and verifies academic credentials using:
- A React + Vite frontend in `frontend/`
- An Express + Prisma + PostgreSQL backend in `backend/`
- Ethereum smart contracts managed by Hardhat in `contracts/`

Certificates are encrypted client-side, stored on IPFS via Filebase, and registered on-chain in a `CredentialRegistry` contract so verification does not depend on the backend alone.

## Core commands
Commands assume you start from the repo root unless noted.

### Install dependencies
- Install everything (root + all packages):
  - `npm run install:all`

### Run the full stack in development
- Backend + frontend together (two processes via `concurrently`):
  - `npm run dev`
    - Runs `npm run backend` → `cd backend && npm run dev`
    - Runs `npm run frontend` → `cd frontend && npm run dev`
- Optional: start a local Hardhat node (for local Ethereum testing):
  - `npm run contracts` (equivalent to `cd contracts && npx hardhat node`)

### Backend (`backend/`)
- Start API in watch mode (TypeScript via `tsx`, default port 5000):
  - `cd backend`
  - `npm run dev`
- Build and run compiled JavaScript:
  - `npm run build`
  - `npm start`

**Prisma / database** (PostgreSQL via `DATABASE_URL` in `backend/.env`):
- Generate Prisma client from schema:
  - `npm run prisma:generate`
- Apply migrations and run in dev mode:
  - `npm run prisma:migrate`
- Seed database (uses `prisma/seed.ts`):
  - `npm run prisma:seed`

**Tests & utilities**:
- Jest test runner is wired but there are currently no Jest test files in the repo:
  - `npm test`
- Database/debug helper scripts (Node):
  - `node check-db.js` – inspect universities, test student creation
  - `node check-hashes.js` – show stored credential hashes
  - `node test-hash-format.js` – check hash formatting vs `bytes32`
  - `node test-blockchain-query.js` – query the on-chain registry for a hard-coded hash

### Frontend (`frontend/`)
Vite + React + TypeScript + Tailwind.

- Start dev server (default: `http://localhost:5173`):
  - `cd frontend`
  - `npm run dev`
- Type-check + build for production:
  - `npm run build`
- Preview built app locally:
  - `npm run preview`
- Lint with ESLint:
  - `npm run lint`

The frontend talks to the backend via `VITE_API_URL` (defaults to `http://localhost:5000` in `src/lib/api.ts`).

### Smart contracts (`contracts/`)
Hardhat project that owns the `CredentialRegistry` Solidity contract.

- Compile contracts:
  - `cd contracts`
  - `npm run compile` (→ `hardhat compile`)
- Run Hardhat tests (none are currently present, but the command is wired):
  - `npm test` (→ `hardhat test`)
  - To run a single test file when tests exist:
    - `npx hardhat test path/to/test-file.ts`
- Deploy contract:
  - To Sepolia: `npm run deploy:sepolia`
  - To a local node: `npm run deploy:local` (expect a Hardhat node running, e.g. `npm run contracts` from the root)

`hardhat.config.ts` loads environment from `../backend/.env`, so the RPC URL and private key used by both backend and contracts are centralized there.

## High-level architecture

### Frontend
Located in `frontend/src/`.

- **Entry & routing**
  - `main.tsx` bootstraps React and imports a small `polyfills` module.
  - `App.tsx` sets up:
    - `BrowserRouter` routes for:
      - `/` → `Home` (public landing + verification section)
      - `/login`, `/signup` for auth flows
      - `/verify` for a dedicated verifier page
      - `/university/*` and `/student/*` wrapped in a `ProtectedRoute` that checks JWT-backed auth state
    - `AuthProvider` and `ThemeProvider` contexts

- **Authentication flow**
  - `contexts/AuthContext.tsx`:
    - Stores `user` and `token` in React state and `localStorage`.
    - Exposes `login`, `signupUniversity`, `signupStudent`, `logout`.
  - `lib/api.ts`:
    - Creates a configured Axios instance with a `baseURL` from `VITE_API_URL`.
    - Adds the JWT from `localStorage` as `Authorization: Bearer <token>` on every request.
    - Defines typed API clients: `authAPI`, `certificateAPI`, `custodianAPI`.
  - `Navbar.tsx`:
    - Shows auth actions and a user menu; uses `useAuth` for current user and `logout`.

- **Crypto & verification logic (client-side security model)**
  - `lib/crypto.ts` centralizes cryptography used across the app:
    - **AES-256-GCM** helpers: key/IV generation, encrypt/decrypt, raw key export/import.
    - **SHA-256 hashing** helpers, including `sha256Bytes32` that returns `0x`-prefixed `bytes32`-compatible hex strings.
    - **Shamir’s Secret Sharing** via `shamirs-secret-sharing` to split an AES key into shares.
    - **RSA-OAEP** helpers for importing PEM public keys, encrypting shares, and handling key pairs.
    - Utility helpers for buffer/hex/base64 conversions and canonical JSON hashing (`canonicalJSON` + `hashCanonicalJSON`).

- **Issuance UI & flow (university side)**
  - `pages/UniversityDashboard.tsx`:
    - Layout with sidebar navigation between:
      - `IssueCertificate` (root `/university` route)
      - `ListCertificates` (`/university/list`)
  - `IssueCertificate` component orchestrates the full issuance flow on the client:
    - Loads available custodians from `custodianAPI.getAll()` (each with an RSA public key).
    - Reads the uploaded PDF into an `ArrayBuffer` (`readFileAsArrayBuffer`).
    - Computes `fileHash` as a `bytes32` string using `sha256Bytes32` on the raw file.
    - Builds a canonical JSON metadata object `{ credentialNo, degreeName, graduationYear, studentEmail }` and computes `jsonHash` with `hashCanonicalJSON`.
    - Generates an AES key and IV, encrypts the file with AES-GCM, and extracts `ciphertext` + `authTag`.
    - Exports the AES key, converts it to hex, and splits it into Shamir shares (3 shares, threshold 2).
    - For each selected custodian:
      - Imports their RSA public key and encrypts a share with RSA-OAEP.
    - Posts a `FormData` payload to `certificateAPI.issue`, including:
      - Encrypted file as a `file` field.
      - `fileHash`, `jsonHash`, `iv`, `authTag`.
      - JSON-encoded `encryptedShares` and `metadata`.
    - Tracks step state (`prepare` → `ipfs` → `blockchain` → `db`) in the UI, but the actual IPFS, blockchain, and DB work happens on the backend.

- **Verification UI & flow**
  - `components/VerifySection.tsx` backs both the home page and `/verify` page:
    - Supports 2 verification modes:
      1. **File-based**: uploads a PDF, re-computes the `sha256Bytes32` hash client-side, calls `certificateAPI.verifyByFile(fileHash)`.
      2. **Metadata-based**: gathers credential metadata, computes the canonical `jsonHash`, calls `certificateAPI.verifyByMetadata(jsonHash)`.
    - Displays a rich result card summarizing whether the credential is on-chain and, if found, key details (student, university, degree, status, blockchain TX link).

- **Dashboards**
  - `StudentDashboard.tsx`:
    - Calls `certificateAPI.list()` to load all credentials for the logged-in student.
    - Shows credential metadata, hashes, IPFS CID, and Etherscan link, and provides copy-to-clipboard helpers.
  - `ListCertificates` (inside `UniversityDashboard.tsx`): similar listing for the issuing university, focused on credentials issued by that university.

### Backend
Located in `backend/src/`.

- **HTTP server setup** (`index.ts`)
  - Creates an Express app, applies CORS (`CORS_ORIGIN` env with fallback to `http://localhost:5173`), JSON and URL-encoded body parsers (with large size limits for PDFs), and the global error handler.
  - Routes:
    - `GET /health` – simple health check.
    - `app.use('/api/auth', authRoutes)`
    - `app.use('/api/custodians', custodianRoutes)`
    - `app.use('/api/certificates', certificateRoutes)`

- **Prisma & data model**
  - Prisma client is instantiated once in `utils/prisma.ts`.
  - `prisma/schema.prisma` defines the main tables:
    - `University`, `Student` – auth principals with relations (a university has many students and credentials).
    - `Credential` – core issued credential, with `credentialNo`, `fileHash`, `jsonHash`, `ipfsCID`, AES params (`iv`, `authTag`), status, and optional `blockchainTx`.
    - `Custodian` – key custodians holding encrypted secret shares.
    - `CredentialCustodianMapping` – join table mapping credentials to custodians and storing each custodian’s encrypted share.
    - `AuditLog` – records events like issuance, verification, recovery, etc.

- **Auth & users** (`controllers/auth.controller.ts`, `routes/auth.routes.ts`, `middleware/auth.middleware.ts`, `types/index.ts`)
  - Sign-up endpoints for universities and students hash passwords with `bcryptjs` and create records via Prisma.
  - JWTs (`jsonwebtoken`) embed `id`, `email`, and `role` (`university` or `student`) and use `JWT_SECRET` and `JWT_EXPIRES_IN` env values.
  - `authenticate` middleware:
    - Parses `Authorization` header, verifies the JWT, and attaches `user` (with typed role) to the request (`AuthRequest`).
  - Role guards `isUniversity` / `isStudent` gate access to certain routes (e.g., issuing credentials is university-only).

- **Certificates & custodians**
  - `routes/certificate.routes.ts`:
    - `POST /api/certificates/issue` – protected by `authenticate` + `isUniversity`, uses `multer` (memory storage) to accept the encrypted file and forwards to `issueCertificate`.
    - `GET /api/certificates/verify` – public endpoint that accepts `fileHash` or `jsonHash` as query params.
    - `GET /api/certificates/list` – returns credentials for the current user based on JWT role.
  - `controllers/certificate.controller.ts`:
    - `issueCertificate`:
      - Parses `metadata`, `encryptedShares`, `fileHash`, `jsonHash`, `iv`, `authTag` from the multipart request.
      - Looks up the student by email and associates the new credential with both the student and the issuing university.
      - Uploads the encrypted file buffer to IPFS via the Filebase service (`uploadToFilebase`) and receives a `cid`.
      - Calls `issueCredentialOnChain(fileHash, jsonHash, cid)` to register the credential on-chain and obtain a transaction hash.
      - Persists the credential record in Postgres with Prisma and includes related student/university info.
      - Best-effort writes related `CredentialCustodianMapping` rows for each encrypted share.
      - Best-effort logs an `AuditLog` entry with `eventType: 'issued'`.
      - Handles Prisma `P2002` unique constraint errors on `credentialNo` with a specific `409` response.
    - `verifyCertificate`:
      - Reads `fileHash` or `jsonHash` from the query string.
      - Calls `verifyCredentialOnChain` to query the smart contract.
      - If the credential exists on-chain, it attempts to find the matching `Credential` row (by `fileHash` or `jsonHash`) and returns a combined view.
    - `getCertificates`:
      - For `university` role: lists credentials where `universityId` matches the JWT user, including basic student info.
      - For `student` role: lists credentials where `studentId` matches, including associated university name.
  - `routes/custodian.routes.ts` exposes `GET /api/custodians`, returning custodians with `id`, `name`, `publicKey`, and optional `endpoint` for the frontend to use when encrypting key shares.

- **External integrations**
  - **Blockchain** (`services/blockchain.service.ts`):
    - Initializes an `ethers` provider and contract instance when `CONTRACT_ADDRESS`, `SEPOLIA_RPC_URL`, and `PRIVATE_KEY` are set.
    - `issueCredentialOnChain(fileHash, jsonHash, cid)` calls the contract’s `issueCredential` function and returns the transaction hash.
    - `verifyCredentialOnChain(fileHash?, jsonHash?)` queries the contract via `getCredentialByFileHash` or `getCredentialByJsonHash` and normalizes the result.
  - **Filebase/IPFS** (`services/filebase.service.ts`):
    - Wraps the AWS S3-compatible SDK configured via `FILEBASE_ACCESS_KEY`, `FILEBASE_SECRET_KEY`, `FILEBASE_ENDPOINT`, `FILEBASE_REGION`, `FILEBASE_BUCKET`.
    - `uploadToFilebase` uploads the encrypted file and returns a key used as a logical CID.
    - `getFromFilebase` retrieves the stored object by CID.

- **Error handling**
  - `middleware/error.middleware.ts` defines a centralized error handler that logs errors and, in development, includes stack traces in the JSON response.

### Smart contracts
Located in `contracts/`.

- **CredentialRegistry.sol**
  - Stores a canonical representation of each credential:
    - `id`, `issuer` address, `fileHash`, `jsonHash`, `cid`, `timestamp`, and an `exists` flag.
  - Prevents duplicate issuance by `fileHash`.
  - Indexes by both `fileHash` and `jsonHash` for flexible verification.
  - Emits a `CredentialIssued` event on successful issuance.

- **Hardhat config & deployment**
  - `hardhat.config.ts`:
    - Loads env from `../backend/.env`.
    - Configures the `sepolia` network with `SEPOLIA_RPC_URL` and `PRIVATE_KEY`.
  - `scripts/deploy.ts`:
    - Deploys `CredentialRegistry` and prints the deployed address.
    - Reminds you to set `CONTRACT_ADDRESS` in `backend/.env` so the backend can talk to the correct contract.

## Environment expectations
Key environment variables are read from `backend/.env` and (for contracts) via `hardhat.config.ts`:
- Database: `DATABASE_URL` (PostgreSQL for Prisma).
- API behavior: `PORT`, `CORS_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`.
- Blockchain: `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`.
- Filebase/IPFS: `FILEBASE_ACCESS_KEY`, `FILEBASE_SECRET_KEY`, `FILEBASE_ENDPOINT`, `FILEBASE_REGION`, `FILEBASE_BUCKET`.

The frontend uses `VITE_API_URL` at build/runtime to locate the backend API.
