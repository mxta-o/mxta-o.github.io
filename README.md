# Portfolio

Jaelan Cruz's personal portfolio built with Astro, Svelte, Three.js, and Tailwind CSS.

## Tech Stack

- **Astro** - Static site generator with Islands Architecture
- **Svelte** - Reactive UI components
- **Three.js** - 3D graphics and animations
- **Threlte** - Svelte bindings for Three.js
- **Tailwind CSS** - Utility-first CSS framework

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
/
├── public/                     # Static assets: images, favicons, robots.txt
├── src/
│   ├── components/   # Reusable components
│   │   ├── 3D/      # Three.js/Threlte components
│   │   └── ...
│   ├── layouts/     # Page layouts
│   ├── pages/       # Route pages
│   └── ...
├── astro.config.mjs # Astro configuration
└── package.json
```

## Project Structure

```
/
├── public/
├── src/
│   ├── experience/
│   │   ├── scene/
│   │   ├── systems/
│   │   └── ui/
│   ├── layouts/
│   ├── lib/
│   └── pages/
├── .github/
├── dist/
├── node_modules/
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
├── tsconfig.json
└── README.md
```

```
/                         # Repo root
├── public/                # Static assets (images, favicons, robots)
├── src/                   # Source code
│   ├── experience/        # 3D experience entrypoints (scene, systems, UI)
│   │   ├── scene/         # Scene setup, renderer, cameras
│   │   ├── systems/       # Interaction and update systems
│   │   └── ui/            # Svelte UI components used by the experience
│   ├── layouts/           # Page layout components
│   ├── lib/               # Utilities, helpers, API clients
│   └── pages/             # Route pages (index, project pages)
├── .github/               # CI / workflow configs
├── dist/                  # Build output (production assets)
├── node_modules/          # Installed dependencies
├── astro.config.mjs       # Astro config
├── package.json           # Dependencies & scripts
├── tailwind.config.mjs    # Tailwind config
├── tsconfig.json          # TypeScript config
└── README.md              # This file
```
