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
├── astro.config.mjs
├── package.json
├── README.md
├── tailwind.config.mjs
├── tsconfig.json
├── public/                 # Static assets (images, favicons, robots.txt, audio)
│   ├── robots.txt
│   └── audio/              # audio files and related README
└── src/                    # Source: Astro pages, Svelte components, and app logic
	├── env.d.ts
	├── experience/        # 3D scene code and experience page components
	├── systems/           # Reusable systems (scroll controller, checkpoints)
	├── ui/                # Svelte UI components (About, Projects, Contact, etc.)
	├── layouts/           # Page/layout components (BaseLayout.astro)
	├── lib/               # Utility modules (audio helpers, libs)
	└── pages/             # Astro route pages (index.astro)
```

## Features

- Y2K-inspired minimalistic design
- Immersive (or i intend it to) experience
- Interactive 3D shapes and animations
- Smooth scroll animations
- Responsive design
- Optimized performance with Astro's Islands Architecture

## License

MIT
portfolio web
