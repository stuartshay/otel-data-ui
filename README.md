# otel-data-ui

React frontend consuming the [otel-data-gateway](https://github.com/stuartshay/otel-data-gateway)
GraphQL BFF for location and activity data visualization.

## Stack

| Component | Version |
|-----------|---------|
| React | 19.x |
| Vite | 7.x |
| TypeScript | 5.9 |
| Apollo Client | 4.x |
| Tailwind CSS | 4.x |
| shadcn/ui | Manual components |
| Leaflet | 1.9 |
| Recharts | 3.x |

## Pages

- **Dashboard** — Overview stats, device list, sport breakdown
- **Locations** — OwnTracks GPS points table with pagination and device filter
- **Location Detail** — Single location with all fields
- **Garmin Activities** — Activity table with sport filter
- **Garmin Detail** — Activity stats, elevation, speed, track points
- **Unified Map** — Leaflet map with OwnTracks + Garmin points
- **Daily Summary** — Combined daily activity table
- **Reference Locations** — Saved location cards
- **Spatial Tools** — Nearby point search and distance calculator

## Quick Start

```bash
npm install
npm run dev
```

Open <http://localhost:5173>

## Environment Variables

Create `.env.local`:

```bash
VITE_GRAPHQL_URL=https://gateway.lab.informationcart.com
VITE_COGNITO_DOMAIN=homelab-auth.auth.us-east-1.amazoncognito.com
VITE_COGNITO_CLIENT_ID=5j475mtdcm4qevh7q115qf1sfj
VITE_COGNITO_REDIRECT_URI=https://data-ui.lab.informationcart.com/callback
VITE_COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ZL7M5Qa7K
```

## Commands

```bash
npm run dev           # Development server
npm run build         # Production build
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run type-check    # TypeScript check
npm run lint:all      # All linters
```

## Docker

```bash
docker build -t otel-data-ui .
docker run -p 8080:80 -e VITE_GRAPHQL_URL=https://gateway.lab.informationcart.com otel-data-ui
```

## Infrastructure

| Property | Value |
|----------|-------|
| URL | <https://data-ui.lab.informationcart.com> |
| Gateway | <https://gateway.lab.informationcart.com> |
| K8s Namespace | otel-data-ui |
| Auth | AWS Cognito (PKCE) |

## Related Repositories

- [otel-data-gateway](https://github.com/stuartshay/otel-data-gateway) — GraphQL BFF
- [otel-data-api](https://github.com/stuartshay/otel-data-api) — REST API
- [otel-ui](https://github.com/stuartshay/otel-ui) — Original React frontend
- [k8s-gitops](https://github.com/stuartshay/k8s-gitops) — K8s deployment
