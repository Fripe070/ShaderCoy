# ShaderCoy AI Coding Instructions

## Overview

ShaderCoy is a web-based GLSL shader editor and real-time 3D previewer built with SvelteKit. Users can write vertex and fragment shaders, upload textures, and preview results on 3D models using WebGL2. The app features a split-pane interface with live compilation and error reporting.

## Architecture

- **Framework**: SvelteKit with static adapter for SPA deployment
- **Rendering**: WebGL2 canvas for 3D shader preview
- **State Management**: Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **Build Tool**: Vite with Svelte plugin, TailwindCSS, and custom Lezer GLSL grammar
- **TypeScript**: Strict mode with NodeNext modules

## Key Components

- **PreviewPanel**: Contains WebGL renderer, camera controls, playback, and model/texture selectors
- **EditingPanel**: Tabbed interface for shader editing (Fragment/Vertex) and texture management
- **Renderer**: WebGL2 setup, shader compilation, uniform binding (time, mouse, resolution, textures), mesh rendering
- **ShaderEditor**: CodeMirror with custom GLSL syntax highlighting and Lezer parser
- **DragPanes**: Resizable split-pane layout component

## State Management

State managed via Svelte 5 runes in `src/lib/state.svelte.ts`, with interfaces for SaveData (project data), PersistentData (user preferences), and EphemeralData (runtime state).

## Development Workflow

- **Build**: `npm run build` (Vite build + Svelte package)
- **Type check**: `npm run check` (svelte-check)
- **Lint**: `npm run lint` (ESLint)
- **Format**: `npm run format` (Prettier)
- **Test**: `npm run test` (Vitest)
- **GLSL grammar**: `npm run grammar:build` (Regenerate Lezer parser from `src/lib/editor/glsl/glsl.grammar`)

## Code Patterns

- **Reactivity**: Use `$state` for mutable state, `$derived` for computed values, `$effect` for side effects
- **Error Handling**: Throw `CoyReportedError` for shader compilation failures; errors displayed in `ErrorReporter`
- **Shaders**: GLSL 300 es; uniforms prefixed with `u_` (e.g., `u_time`, `u_resolution`); textures as `u_textures[8]` array
- **Models**: Loaded via Assimp.js, converted to WebGL buffers with vertex schema (position, normal, texCoord)
- **Textures**: Managed as instances with GL texture objects; reactive updates via `$effect`
- **Components**: Prefer Svelte 5 snippets for slots; bind props with `$bindable`
- **Styling**: TailwindCSS with custom theme variables (background-primary, accent, etc.)

## File Organization

- `src/lib/components/`: UI components
- `src/lib/resources/`: Data loading (models, shaders, textures)
- `src/lib/shaders/`: Default GLSL sources
- `src/lib/editor/`: CodeMirror setup and GLSL grammar
- `src/routes/`: SvelteKit pages

## Common Tasks

- **Add new shader uniform**: Update `src/lib/resources/shader/datatypes.ts` and `Renderer.svelte` paint function
- **New texture format**: Extend `src/lib/resources/texture/load.ts` and datatypes
- **UI component**: Place in `src/lib/components/`, export from index if reusable
- **Model loader**: Add to `src/lib/resources/model/load.ts` using Assimp.js

## Dependencies

- **WebGL**: gl-matrix for math, custom shader compilation
- **3D Models**: Assimp.js (assimpts) for loading various formats
- **Editor**: CodeMirror with Lezer for GLSL parsing
- **UI**: TailwindCSS, Iconify for icons

## Deployment
Static site via SvelteKit adapter-static; served from `build/` directory.
