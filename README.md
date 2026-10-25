# Vivent Storefront

Standalone customer storefront for Vercel. It contains only the public commerce experience: catalog, customer account, address selection, cart, checkout and order history. The tenant/admin frontend remains in `../vivent-front`.

## Local setup

```powershell
fnm use 24.15.0
corepack enable
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

For the local Docker backend use:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
NEXT_PUBLIC_DEFAULT_TENANT=demo
```

The root `compose.yml` already allows `http://localhost:3002` through CORS for this standalone development server.

Open `http://localhost:3000`. The root route redirects to `/es-GT/tienda`.

## Vercel deployment

1. Import this folder (`vivent-storefront`) as the Vercel project root.
2. Configure the following production environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://<your-backend-domain>
NEXT_PUBLIC_DEFAULT_TENANT=demo
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<restricted-browser-key>   # optional
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=<map-id>                    # optional
```

3. Configure your backend CORS allowlist (`VIVENT_CORS_ALLOWED_ORIGINS`) with the Vercel production domain and preview domains as appropriate.
4. Map the production storefront domain to Vercel. For `demo.corpoviva.com`, the tenant is resolved from the subdomain. For a Vercel preview URL or a custom domain outside `corpoviva.com`, `NEXT_PUBLIC_DEFAULT_TENANT` is used.

`NEXT_PUBLIC_*` variables are embedded at build time. Redeploy after changing them.

## Checks

```powershell
pnpm run lint
pnpm exec tsc --noEmit
pnpm run build
```
