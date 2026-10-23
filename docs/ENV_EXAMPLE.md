# .env Reference

Copy the block below into a `.env` file at the project root and fill in your values. Never commit `.env`.

```bash
# ── Deployer wallet (for forge script --private-key) ──────────────────────────
PRIVATE_KEY=0x_YOUR_PRIVATE_KEY

# ── Contract parameters ───────────────────────────────────────────────────────
# Wallet that receives 50% of every steal payment (your builder wallet).
FEE_ADDRESS=0x_YOUR_FEE_WALLET

# Arc Testnet USDC (ERC-20, 6 decimals). Do not change for testnet.
USDC_ADDRESS=0x3600000000000000000000000000000000000000

# ── Frontend ──────────────────────────────────────────────────────────────────
# The deployed Usurp contract address (fill in after deploy).
VITE_CONTRACT_ADDRESS=0x

# Chain ID (Arc Testnet = 5042002).
VITE_CHAIN_ID=5042002

# Set to true to run the UI against mock data (no chain needed).
VITE_MOCK_MODE=false
```
