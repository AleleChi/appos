# Changelog

All notable changes made to the AppOS codebase are recorded here.

## [1.2.0] - 2026-07-14

### Added
* Implemented same-origin authentication architecture using Vercel reverse-proxy configuration (`vercel.json`) to forward `/api/*` browser requests seamlessly to Render backend.
* Hardened production session cookies to use `SameSite=Lax`, `Secure`, `HttpOnly`, and host-only domain configuration to eliminate Safari Intelligent Tracking Prevention (ITP) and cross-site Chrome issues.
* Created same-origin state-machine-driven `AuthCallbackView` in `src/components/AuthStateViews.tsx` featuring an 8-second safety timeout, single-retry handler for connection/5xx failures, and clean transitions.
* Refined standard email and Google buttons with explicit `aria-busy="true"` tags, layout preservation classes (`min-h-[44px]`), and descriptive loading states (e.g., "Opening Google…", "Creating account…") with restrained single-spinner visuals.
* Integrated sandbox preview pane check to prevent third-party cookie failures within iframe boundaries and display manual fallback sign-in options.
* Created a robust client-side `mapResponseError` utility to dynamically map common API failure response codes into human-friendly, secure resolutions.
* Added `docs/deployment/vercel-reverse-proxy.md` to document routing patterns and edge-network reverse-proxy details.

### Removed
* Deleted obsolete cross-domain serverless handoff-code functions (`/api/auth/complete.ts`, `/api/auth/logout.ts`, `/api/auth/me.ts`).
* Removed physical Render API URLs from all browser-facing code, replacing them with absolute path rewrites.

## [1.1.0] - 2026-07-13

### Added
* Created the dedicated full-scale **`SecurityPage` component** (`/src/components/SecurityPage.tsx`) containing interactive process phases, real-time security score dashboard, isolated build infrastructure card layouts, secure data protection cards, and customizable compliance matrices for Apple App Store and Google Play (using mobile accordion drawers).
* Standardized design tokens using `/src/components/MarketingCore.tsx` shared atoms (`Section`, `Container`, `MainHeading`, `SectionHeading`, `CardHeading`, `BodyProse`, `LabelText`, `Button`, `Card`, `Badge`).

### Changed
* Refactored `/src/App.tsx` routing state to support `"home" | "pricing" | "security"` page transitions.
* Refactored `/src/components/Navbar.tsx` and `/src/components/Footer.tsx` props, types, and navigation handlers to support seamless multi-page transitions to the dedicated Security Page.
* Verified perfect build and compilation of the production applets with 0 lint warnings.

## [1.0.0] - 2026-07-13

### Added
* Created the **`Navbar` component** (`/src/components/Navbar.tsx`) with dual desktop/mobile responsive nav layouts, smooth-scroll links, active states, and mobile navigation drawer.
* Created the **`HeroSection` component** (`/src/components/HeroSection.tsx`) with adaptive headlines matching desktop and mobile layouts respectively, and integrated a vector-animated pipeline flow representing the AppOS Web-to-Native compiler.
* Created the **`ProcessSection` component** (`/src/components/ProcessSection.tsx`) with three custom illustrated steps connected via vector paths and supporting varying desktop vs mobile text strings.
* Created the **`FeatureSection` component** (`/src/components/FeatureSection.tsx`) implementing an asymmetric grid layout (tall left, wide right) for native features and a vertical list for mobile.
* Created the **`ScoreCard` component** (`/src/components/ScoreCard.tsx`) containing an interactive circular progress gauge, counting-up metrics, and automated scanning logs triggered by URL submission.
* Created the **`SecuritySection` component** (`/src/components/SecuritySection.tsx`) utilizing high-contrast dark backdrops, custom shield SVGs, and responsive certified badges.
* Created the **`CTASection` component** (`/src/components/CTASection.tsx`) wrapping the final centered converter banner.
* Created the **`Footer` component** (`/src/components/Footer.tsx`) with responsive horizontal and vertical map grids.
* Created detailed documentation directories:
  - `/docs/design/DESIGN_SYSTEM.md`
  - `/docs/design/STITCH_SCREEN_REFERENCE.md`
  - `/docs/implementation/CURRENT_STATUS.md`
  - `/docs/implementation/CHANGELOG.md`

### Changed
* Configured `/src/index.css` to import Plus Jakarta Sans, Inter, and JetBrains Mono from Google Fonts, and defined the complete brand color variables (`#635BFF`, `#0A1020`, `#F7F9FC`) in Tailwind CSS v4 `@theme`.
* Updated `/src/App.tsx` to stitch all modular components together into a single, cohesive, interactive landing page flow.
* Configured `/metadata.json` properties to list the correct product name "AppOS" and marketing descriptions.
