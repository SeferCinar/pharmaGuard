# PharmaGuard

PharmaGuard is a decentralized proof-of-concept (PoC) deployed on the Monad testnet, engineered to secure the pharmaceutical supply chain. The system is designed to detect and prevent counterfeiting, unauthorized cloning, and double-spend scenarios in real-time.

By integrating smart contract-based provenance tracking, backend data processing, real-time graph visualization, and AI-driven anomaly detection, PharmaGuard ensures end-to-end visibility and security for sensitive medical supply chains.

## Project Overview

PharmaGuard simulates a comprehensive supply chain lifecycle with built-in fraud prevention:

1. **Asset Genesis:** A verified manufacturer mints a new pharmaceutical product on-chain.
2. **Chain of Custody:** The asset is transferred across the supply chain (e.g., Manufacturer -> Distributor -> Pharmacy).
3. **Telemetry & Tracking:** Transfer history and location metadata are continuously logged and evaluated.
4. **Anomaly Detection:** The system actively monitors for fraudulent patterns (e.g., a "stale owner" attempting to re-transfer an asset they no longer possess).
5. **Automated Mitigation:** Upon detecting a high-risk scenario, the system automatically freezes the asset to prevent further unauthorized movement.
6. **Live Telemetry:** The operational dashboard provides a real-time visualization of the supply chain graph, transaction history, and asset risk status.

## Key Features

- **Decentralized Provenance:** ERC1155-based smart contracts for immutable product tracking.
- **High-Performance Backend:** Built with FastAPI, featuring WebSocket integration for low-latency, bi-directional client communication.
- **Operational Dashboard:** A responsive, Next.js/React-based frontend for real-time monitoring and chain management.
- **Graph Visualization:** Dynamic mapping of node-to-node transfers to visualize the supply chain hierarchy and highlight illicit branches.
- **Fraud & Clone Detection:** Algorithmic risk evaluation targeting double-spend and counterfeit scenarios.
- **Monad Testnet Optimized:** Engineered specifically for the high-throughput environment of the Monad network.

## Architecture Overview

The system architecture is decoupled into three primary layers:

- **Frontend (Presentation):** Next.js, React, TypeScript
- **Backend (Logic & Processing):** Python, FastAPI, Web3.py, NetworkX
- **Smart Contracts (On-Chain Execution):** Solidity, Foundry

**Data Flow Sequence:**

1. The Frontend initiates operational requests via the Backend REST API.
2. The Backend processes and broadcasts transactions to the Smart Contract.
3. On-chain events are evaluated by the local Detector and Graph Store mechanisms.
4. Risk assessments and state changes are streamed back to the Frontend via WebSockets for live UI updates.

## Repository Structure

```text
pharmaGuard/
├── backend/          # FastAPI application, graph logic, and WebSockets
├── contracts/        # Solidity smart contracts and Foundry deployment scripts
├── frontend/         # Next.js UI, React components, and state management
├── scripts/          # Utility and automation scripts
└── .env.example      # Environment variable template

```

## Prerequisites

Ensure your development environment meets the following requirements before proceeding:

- **Python:** 3.11 or higher
- **Node.js:** 20.0 or higher
- **Package Manager:** npm or pnpm
- **Smart Contract Toolchain:** [Foundry](https://getfoundry.sh/) (forge, cast)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone [https://github.com/SeferCinar/pharmaGuard.git](https://github.com/SeferCinar/pharmaGuard.git)
cd pharmaGuard

```

### 2. Environment Configuration

Copy the example environment file and configure your local variables:

```bash
cp .env.example .env

```

Open the `.env` file and populate the following critical variables:

- `MONAD_RPC_URL`
- `CONTRACT_ADDRESS` (Update this after deploying the smart contracts)
- `ADMIN_PK`, `ORACLE_PK`, `MANUFACTURER_PK`, `DISTRIBUTOR_PK`, `PHARMACY_A_PK`, `PHARMACY_B_PK`

> **Security Warning:** The provided keys should be strictly used for testnet development. Never expose or commit private keys associated with real funds or production environments.

### 3. Backend Setup

Initialize a Python virtual environment and install dependencies:

```bash
cd backend
python -m venv .venv

# Activate the virtual environment
source .venv/bin/activate      # Linux/macOS
# .venv\Scripts\activate       # Windows PowerShell

# Install requirements in development mode
pip install -e ".[dev]"

```

### 4. Frontend Setup

Install the required Node dependencies:

```bash
cd ../frontend
npm install

```

### 5. Smart Contract Setup

Install Foundry dependencies:

```bash
cd ../contracts
forge install

```

## Local Development

To run the application locally, you will need to start both the backend and frontend servers.

**Start the Backend Server:**

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

```

**Start the Frontend Server:**

```bash
cd frontend
npm run dev

```

**Access Points:**

- Operational Dashboard: `http://localhost:3000`
- Backend API Base: `http://localhost:8000`
- Swagger API Documentation: `http://localhost:8000/docs`

## Smart Contract Deployment

Deploy the smart contracts to the Monad testnet using Foundry:

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy --rpc-url "$MONAD_RPC_URL" --broadcast

```

_Note: After a successful deployment, copy the deployed contract address and update the `CONTRACT_ADDRESS` variable in your root `.env` file._

To seed the initial role registry (Admin, Oracle, etc.):

```bash
forge script script/SeedRoles.s.sol:SeedRoles --rpc-url "$MONAD_RPC_URL" --broadcast

```

## Simulation Walkthrough

To fully test the system's capabilities, follow this sequence in the frontend dashboard:

1. **Minting:** Act as the Manufacturer and mint a new pharmaceutical batch.
2. **Valid Transfer 1:** Transfer the batch from `Manufacturer` -> `Distributor`.
3. **Valid Transfer 2:** Transfer the batch from `Distributor` -> `Pharmacy A`.
4. **Fraud Trigger:** Attempt to transfer the _same_ batch from `Manufacturer` -> `Pharmacy B` (simulating a clone or stale-owner double-spend).
5. **Detection:** Observe the system automatically flag the risk, update the graph visualization, and freeze the asset on-chain.

## Testing

Run the automated backend test suite using `pytest`:

```bash
cd backend
pytest

```

## Development Notes

- **Production Readiness:** This repository serves as a PoC. Deploying to a mainnet environment will require comprehensive security audits, robust authentication (e.g., OAuth/JWT), and hardened operational controls.
- **Heuristic Engine:** The current risk detection logic utilizes a straightforward, deterministic approach optimized for demonstrative purposes.
- **Future AI Expansion:** The architecture is designed with a seam for Graph Neural Network (GNN) integration, allowing for more complex, predictive fraud detection algorithms in future iterations.
