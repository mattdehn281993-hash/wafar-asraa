# UI components and feedback

The existing Vite project uses React 18 and TypeScript. Tailwind CSS v4 is configured with `@tailwindcss/vite`; `components.json` configures shadcn-compatible paths. No project regeneration is necessary.

- Reusable UI: `src/components/ui/` (`@/components/ui`). The requested `/components/ui` path resolves here because this application keeps source code under `src/`.
- Shared app components: `src/components/`.
- Styles: `src/styles.css`.
- Utility: `src/lib/utils.ts` (`cn`, using `clsx` and `tailwind-merge`).

Keeping the UI folder and aliases consistent lets shadcn registry additions resolve imports reliably and keeps reusable primitives separate from screens. TypeScript and Vite both resolve `@/` to `src/`.

For additional shadcn components, from this directory run `npx shadcn@latest add <component>`. Review generated CSS before accepting changes: this app intentionally imports Tailwind theme/utilities without Preflight to preserve its existing design.

## Ding notifications

`src/components/ui/ding-toast.tsx` contains the requested standalone showcase, including success, failure, action and promise examples. `demo.tsx` imports that showcase. Do not mount the showcase alongside the app host: it includes its own Toaster.

The application mounts one named `AppToaster` inside `AppProvider`. It follows the saved light/dark setting, uses top-center positioning, disables sound, and portals into an open native dialog so feedback stays visible above bottom sheets. Ding requires no assets, extra context provider, icons or stylesheet imports.

Use shared feedback in an action handler after it succeeds:

```tsx
import { toast } from '@/lib/feedback';

toast.success('Saved');
toast.error('Upload failed', { description: 'Check your connection and try again.' });
```

For real asynchronous operations, `toast.promise(actualPromise, { loading, success, error })` tracks that operation; never add artificial upload delays to the app. The supplied demonstration delay stays in the standalone showcase only.

App messages use the existing English/Egyptian Arabic translation helper. Forms also keep inline errors so essential feedback remains available after a toast disappears. The toast width is constrained on mobile; the package supports RTL and keyboard dismissal. No Unsplash images are needed for this component.

Dependencies added: `@yusufceng1z/ding-react` for notifications; Tailwind and its Vite plugin for utility styling; `clsx`/`tailwind-merge` for shadcn's `cn` helper; `@types/node` for typed Vite path configuration.

References: [Ding](https://github.com/YusufCeng1z/ding), [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite), [shadcn configuration](https://ui.shadcn.com/docs/components-json).

## Home promotions and composer

`src/components/ui/carousel-squeeze.tsx` contains the supplied squeeze carousel, adapted to use the app font, translated arrow labels and RTL keyboard/overlay direction. It needs only React and the existing `cn` utility; no additional packages are required. `HomePromos` supplies three newly generated, fictional discount banners from `src/assets/promos/`. All text, including the demo label, is inside the artwork. `showDetails={false}` hides captions and actions underneath; the wrapper has no border, background or padding. Selecting the open ad navigates to its campaign-filtered demo deals; selecting a narrow panel expands it. Arabic mode selects the generated Arabic sibling artwork. It reuses no catalogue product images. Prompts and provenance are in `src/assets/promos/README.md`.

The home carousel advances every seven seconds, with pause/play and previous/next controls. It pauses on hover/focus and respects reduced-motion preferences. Compact container-relative geometry fits phone widths.

`HomeComposer` accepts an optional `intro: { id, message }`. The home screen passes the first unread update, or the caught-up message. The text types at 28 ms per character, holds for 2.4 seconds, fades for 0.4 seconds, then restores the standby placeholder. Focus, input or photo selection immediately interrupts it. Animation never modifies or submits the user's input. Without `intro` (the chat screen), it always uses the normal placeholder. Reduced motion shows the complete message without typing or fading. All timers are cleared on interruption or unmount.

Manual checks: let the home update finish; focus/type during it; select an ad and confirm demo deals opens; cycle forward/back and pause/play; view Arabic/dark mode at narrow width.

## Verification commands

Run `npm test` (Node 22.18+ or current Node LTS with native TypeScript stripping) and `npm run build`. Manual checks: add a product, clear/undo a basket, save profile/budget, trigger invalid budget feedback inside its sheet, and switch light/dark and Arabic. Rust checks apply when backend Rust source is changed; this integration changes only the React prototype.

## Current service limitations

Purchases, profiles, memory, budgets, chat text and simulated family membership are browser-local. Sample shopping never orders or charges. Photo selection works, but OCR, AI chat, speech transcription, account authentication, database sync and WhatsApp still require backend integration and real service configuration. The local assistant labels its capabilities explicitly. Mobile packaging remains deferred by the user.
