# RetailPro modern UI update

- Business logic and existing data structures preserved.
- Bundles, Agent and POS Printing navigation removed.
- Electron/installer files removed.
- Tailwind CSS configured alongside existing component styles.
- Shared UI shell modernized for light/dark themes and RTL/LTR.
- Pages are lazy-loaded to reduce initial JavaScript work.
- StrictMode double rendering removed in development.
- User creation validates duplicate usernames and uses a safe ID fallback.

Run: `npm install` then `npm run dev`.
