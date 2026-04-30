This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Create `frontend/.env.local` with the contract address and network used by your
wallet. `NEXT_PUBLIC_RPC_URL` is optional, but recommended because the frontend
uses it for read-only contract calls and transaction confirmation polling. That
keeps repeated dashboard reads from overloading the wallet's injected RPC
endpoint.

```bash
NEXT_PUBLIC_CROWDFUNDING_ADDRESS=0x...
NEXT_PUBLIC_DEPLOYED_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
```

`NEXT_PUBLIC_CROWDFUNDING_ADDRESS` must be a Crowdfunding contract deployed on
the same chain as `NEXT_PUBLIC_DEPLOYED_CHAIN_ID` and `NEXT_PUBLIC_RPC_URL`.
For Sepolia, deploy from the backend with:

```bash
cp backend/.env.example backend/.env
# Fill SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY in backend/.env
npm --prefix backend run deploy:sepolia
```

The deploy script updates `frontend/.env.local` with the new contract address
and preserves the frontend RPC URL.

## Safe Move To Sepolia

If you want campaigns to survive local Hardhat restarts, move to Sepolia. To
avoid breaking a working local setup, keep your current `frontend/.env.local`
values until the Sepolia deploy succeeds, then update them in one pass.

1. Keep a copy of your current local values from `frontend/.env.local`.
2. Create `backend/.env` if needed and fill in:
   - `SEPOLIA_RPC_URL`
   - `SEPOLIA_PRIVATE_KEY`
3. Deploy with:

```bash
npm run backend:deploy:sepolia
```

4. Replace the frontend values with the Sepolia deployment output:

```bash
NEXT_PUBLIC_DEPLOYED_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
NEXT_PUBLIC_CROWDFUNDING_ADDRESS=0xYOUR_SEPOLIA_CONTRACT
```

5. Restart the frontend and switch MetaMask to Sepolia.

That keeps your current local wallet flow untouched until the Sepolia contract
is ready.

## Remote Development With Hardhat

If you run this app in github.dev or Codespaces, `http://127.0.0.1:8545` does
not mean "the Codespace container" from the browser's point of view. It means
"the browser's own machine", so browser requests to a Hardhat node inside the
container fail with `Failed to fetch`.

Start Hardhat so it listens outside the container:

```bash
cd backend
npx hardhat node --hostname 0.0.0.0
```

Or from the repo root:

```bash
npm run backend:node
```

Then forward port `8545` in Codespaces. Use the forwarded URL as your frontend
RPC URL, not `127.0.0.1`. It will look similar to:

```bash
NEXT_PUBLIC_RPC_URL=https://YOUR-CODESPACE-NAME-8545.app.github.dev
NEXT_PUBLIC_DEPLOYED_CHAIN_ID=31337
NEXT_PUBLIC_CROWDFUNDING_ADDRESS=0xYOUR_LOCAL_HARDHAT_DEPLOYED_CONTRACT
```

For local development on your own machine, true localhost is still fine:

```bash
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_DEPLOYED_CHAIN_ID=31337
NEXT_PUBLIC_CROWDFUNDING_ADDRESS=0xYOUR_LOCAL_HARDHAT_DEPLOYED_CONTRACT
```

### MetaMask Note For Local Hardhat

If MetaMask shows a stuck `Review alert` button when sending local transactions,
that is usually a MetaMask security-alert issue with `localhost` / custom local
chains rather than a contract bug.

For local-only development, the most reliable setup is:

1. Use a separate browser profile just for local Hardhat testing.
2. Use a separate MetaMask wallet/account only for local testing.
3. Temporarily disable MetaMask `Security Alerts` in that local-dev profile.
4. Keep the Hardhat node running while testing, because restarting it clears
   local chain state and can confuse the wallet.

MetaMask must use the same network as the frontend. In Codespaces, add a custom
MetaMask network with the forwarded `8545` URL and chain ID `31337`. If you are
using Sepolia instead, use the Sepolia Alchemy URL and chain ID `11155111`.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
