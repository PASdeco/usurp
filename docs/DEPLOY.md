# USURP — Deployment Guide

> For the builder. Review carefully before any mainnet launch.

---

## Testnet checklist

- [x] Contract deployed on Arc Testnet: `0x5B16a6fd5a2f14D0c4D671bB5A14f9044fdE89e5`
- [x] Contract verified on Arc Testnet explorer
- [x] Frontend deployed and wired to contract address
- [x] Faucet link removed from How it works page (mainnet launch)

---

## Mainnet checklist — LIVE at usurp-arena.vercel.app

**Legal / compliance:**
- [x] Disclaimer, Terms, and Privacy pages fully written without placeholders
- [x] Region restriction implemented (`VITE_BLOCKED_REGIONS`)
- [ ] Have a qualified lawyer review legal pages for your jurisdiction
- [ ] Confirm the game's legal classification in each target market
- [ ] Complete any required licensing or registration

**Contract:**
- [x] Usurp.sol deployed on Arc Mainnet: `0xC47cc87cb5fe4EDAe581064045A79074264bC415`
- [x] Owner: `0xE3fd801A2939c636f2EA5c281A726Ea131799F12`
- [x] Fee address: `0xBd87d93B45c017EFC656a1F78BA190c49e5e8673`
- [x] USDC: `0x3600000000000000000000000000000000000000` (6 decimals confirmed)
- [x] Two security audit rounds completed; Slither static analysis run; 66/66 tests pass
- [ ] Independent audit by a qualified external firm (recommended before significant TVL)
- [ ] Contract source verification on Arc Mainnet explorer (pending explorer Cloudflare fix)
- [ ] Seed the pot before opening to the public (do via `/#/admin`)

**Frontend:**
- [x] `VITE_NETWORK=mainnet` set in Vercel production env
- [x] `VITE_MAINNET_CONTRACT_ADDRESS=0xC47cc87cb5fe4EDAe581064045A79074264bC415`
- [x] Network pill shows "Arc · USDC" on mainnet
- [x] All testnet references removed from UI copy
- [x] Standalone build (no Arc Studio sandbox dependencies)
- [ ] Configure CSP headers at Vercel project level (see Security headers below)
- [ ] Set up monitoring and alerting for pot solvency

---

## Region restriction

### How it works (two layers required for compliance)

**Layer 1 — Client-side soft block (implemented):**
`src/components/RegionNotice.tsx` checks the browser's locale (`navigator.languages`) against the `VITE_BLOCKED_REGIONS` env variable and shows a blocking notice if the user appears to be in a restricted region.

Set the env variable as a comma-separated list of ISO 3166-1 alpha-2 country codes:
```
VITE_BLOCKED_REGIONS=US,KP,IR,CU,SY
```
Leave empty or unset to allow all regions.

**This is a best-effort hint only — browser locale can be spoofed. It is NOT a legal compliance measure on its own.**

**Layer 2 — Server-side / edge hard block (required for compliance):**
For any jurisdiction where playing is prohibited, implement a hard block at the CDN or edge level using one of these approaches:

- **Vercel Edge Middleware** (`middleware.ts` at the project root):
  ```ts
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'

  const BLOCKED = (process.env.BLOCKED_REGIONS ?? '').split(',').map(s => s.trim())

  export function middleware(req: NextRequest) {
    const country = req.geo?.country ?? ''
    if (BLOCKED.includes(country)) {
      return new NextResponse('Not available in your region.', { status: 451 })
    }
    return NextResponse.next()
  }
  ```
  Set `BLOCKED_REGIONS` as a server-side env variable in Vercel (not `VITE_` prefixed — this stays on the server).

- **Cloudflare Workers / Pages:** use `request.cf.country` in a Workers script to return a 451 response for blocked countries.

- **Netlify Edge Functions:** use `context.geo.country`.

### Countries to consider blocking (consult a lawyer)
The following jurisdictions have restrictions on games of chance, crypto games, or USDC usage that may require blocking. **This is not legal advice** — have a lawyer review for your specific situation:

- United States (varies by state; federal uncertainty around crypto games)
- China, North Korea, Iran, Cuba, Syria (OFAC-listed)
- Countries with strict gambling regulations (check local law)

**Document your legal review and the list of blocked regions before mainnet launch.**

---

## Environment variables

| Variable | Value (mainnet) | Description |
|---|---|---|
| `VITE_NETWORK` | `mainnet` | Switches contract address, RPC, explorer to mainnet |
| `VITE_MAINNET_CONTRACT_ADDRESS` | `0xC47cc87cb5fe4EDAe581064045A79074264bC415` | Mainnet contract address |
| `VITE_CONTRACT_ADDRESS` | `0x5B16a6fd5a2f14D0c4D671bB5A14f9044fdE89e5` | Testnet fallback contract address |
| `VITE_MOCK_MODE` | `false` | Enables mock mode (no chain, for local dev) |
| `VITE_BLOCKED_REGIONS` | See above | Comma-separated ISO country codes to block |
| `VITE_WALLETCONNECT_PROJECT_ID` | Your project ID | WalletConnect Cloud project ID |

---

## Security headers

Configure these headers at the hosting layer (Vercel, Netlify, Cloudflare):

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://rpc.testnet.arc.io wss://relay.walletconnect.com https://*.walletconnect.com https://*.walletconnect.org; img-src 'self' data: https:; frame-ancestors 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

Update the CSP `connect-src` directive with the Arc Mainnet RPC URL and any additional wallet provider endpoints before mainnet launch.

---

## Monitoring

Before mainnet launch, set up monitoring for:
- Pot balance dropping below minimum seed (alert: trigger pot reseed)
- Contract paused unexpectedly (alert: investigate)
- Unusual steal frequency (alert: potential bot activity)
- Contract balance vs. pot + feeAccrued + Σpending solvency invariant

---

## Usurp Arena (Phase 2)

The `awardCrown(address winner)` function exists in the deployed contract but is **disabled by default** (`authorizedCaller = address(0)`). Enabling it requires:
1. An independent security audit of the `awardCrown` and `setAuthorizedCaller` flows
2. A 2-day timelock to set the authorized caller
3. Legal review of the AI-judged duel mechanic

Do not enable before these steps are complete.
