# USURP — Deployment Guide

> For the builder. Review carefully before any mainnet launch.

---

## Testnet checklist (current state)

- [x] Contract deployed on Arc Testnet: `0x5B16a6fd5a2f14D0c4D671bB5A14f9044fdE89e5`
- [x] Contract verified on Arc Testnet explorer
- [x] Frontend deployed and wired to contract address
- [ ] Seed pot with test USDC before first real test round
- [ ] Confirm faucet link is live and correct in How it works page

---

## Mainnet checklist (before launch)

**Legal / compliance:**
- [ ] Have a qualified lawyer review the Disclaimer, Terms, and Privacy pages for your jurisdiction
- [ ] Confirm the game's legal classification (game of chance, sweepstakes, etc.) in each target market
- [ ] Geofence / region-block any countries identified as requiring it (see Region restriction below)
- [ ] Complete any required licensing or registration
- [ ] Replace all `[Placeholder]` fields in Disclaimer with real values
- [ ] Replace Terms and Privacy placeholders with lawyer-reviewed content

**Contract:**
- [ ] Independent security audit of Usurp.sol by a qualified firm
- [ ] Deploy with a multisig as the owner (e.g. Gnosis Safe)
- [ ] Set `FEE_ADDRESS` to a separate, secured address
- [ ] Set `USDC_ADDRESS` to the Arc Mainnet USDC contract address
- [ ] Confirm USDC decimals on Arc Mainnet match the 6-decimal assumption
- [ ] Seed the pot before opening to the public
- [ ] Review all parameters (start price, drip rate, reset timers, min seed)
- [ ] Verify the contract on the Arc Mainnet explorer

**Frontend:**
- [ ] Set `VITE_IS_MAINNET=true`
- [ ] Set `VITE_CONTRACT_ADDRESS` to the mainnet contract address
- [ ] Update `VITE_CHAIN_ID` to the Arc Mainnet chain ID
- [ ] Update `VITE_RPC_URL` to the Arc Mainnet RPC
- [ ] Update `VITE_EXPLORER_BASE` to the Arc Mainnet explorer URL
- [ ] Replace the testnet faucet link with a mainnet on-ramp link
- [ ] Update the "Arc Testnet" pill to "Arc" (auto from env)
- [ ] Configure CSP headers (see Security headers below)
- [ ] Set up monitoring and alerting for pot solvency
- [ ] Test the full steal → drip → claim → reset cycle on mainnet with a small amount

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

| Variable | Testnet | Mainnet | Description |
|---|---|---|---|
| `VITE_CONTRACT_ADDRESS` | `0x5B16a6fd5a2f14D0c4D671bB5A14f9044fdE89e5` | TBD | Deployed contract address |
| `VITE_CHAIN_ID` | `5042002` | TBD | Chain ID |
| `VITE_RPC_URL` | `https://rpc.testnet.arc.io` | TBD | RPC endpoint |
| `VITE_EXPLORER_BASE` | `https://explorer.testnet.arc.io` | TBD | Block explorer base URL |
| `VITE_IS_MAINNET` | `false` | `true` | Enables mainnet warning banners |
| `VITE_MOCK_MODE` | `false` | `false` | Enables mock mode (no chain) |
| `VITE_BLOCKED_REGIONS` | `` | See above | Comma-separated ISO country codes |
| `VITE_WALLETCONNECT_PROJECT_ID` | Your project ID | Same | WalletConnect Cloud project ID |
| `VITE_ANALYTICS_ID` | `` | Optional | Privacy-friendly analytics ID |

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
