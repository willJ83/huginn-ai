// Silence ts(2882) "Cannot find module or its corresponding type declarations"
// for CSS side-effect imports (e.g. `import "./globals.css"` in app/layout.tsx).
// Next.js handles CSS bundling at the framework level; this declaration tells
// TypeScript that importing a CSS file as a side-effect is intentional and valid.
declare module "*.css";
