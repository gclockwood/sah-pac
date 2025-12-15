# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro v5 website built with Tailwind CSS v4, featuring content collections for structured content management. The project is named "alfred" and serves as a template for building marketing/documentation websites with blog, changelog, help center, team profiles, customer stories, and integration pages.

**Site URL:** https://sw.halftide.io

## Development Commands

```bash
# Start development server (runs on localhost:4321)
npm run dev
# or
npm run start

# Build for production (outputs to ./dist/)
npm run build

# Preview production build locally
npm run preview

# Run Astro CLI commands
npm run astro [command]
# Examples:
# npm run astro add <integration>
# npm run astro check
```

## Architecture

### Tailwind CSS v4 Configuration

**IMPORTANT:** This project uses Tailwind CSS v4, which has a fundamentally different configuration approach:
- **No `tailwind.config.mjs` file exists** - all configuration is in CSS
- All Tailwind configuration lives in `src/styles/global.css` using `@theme` directive
- Custom colors, fonts, and design tokens are defined in the CSS file using CSS custom properties
- Import Tailwind plugins using `@plugin` directive in the CSS file

When making style changes:
- Add custom colors/fonts to the `@theme` block in `src/styles/global.css`
- Do not attempt to create or modify a tailwind.config file
- Use the existing color palette (yellow, purple, green, teal, rose, blue, base) defined with oklch colors

### Content Collections

Content is managed via Astro's content collections system. All collections are defined in `src/content/config.ts` with Zod schemas:

- **posts** - Blog posts (title, pubDate, description, team, image, tags)
- **changelog** - Product changelog entries (page, description, pubDate, image)
- **team** - Team member profiles (name, role, bio, image, socials)
- **customers** - Customer case studies (customer, testimonial, partnership, challenges/solutions, results, details)
- **integrations** - Third-party integrations (integration, description, permissions, details, logo, tags)
- **helpcenter** - Help documentation (title, intro)
- **infopages** - General info pages (page, pubDate)

Content files are stored in `src/content/[collection-name]/` as MDX files.

### Routing

File-based routing follows Astro conventions:
- Static pages: `src/pages/[name].astro` → `/[name]`
- Dynamic content: `src/pages/[collection]/[...slug].astro` → `/[collection]/[slug]`
- Collection home pages: `src/pages/[collection]/home.astro` → `/[collection]/home`

Dynamic routes use `getStaticPaths()` with `getCollection()`:
```astro
export async function getStaticPaths() {
  const entries = await getCollection('posts');
  return entries.map(entry => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}
```

### Layout System

Layouts are in `src/layouts/`:
- **BaseLayout.astro** - Root layout with Navigation, Footer, and main slot
- **BlogLayout.astro** - For blog posts
- **ChangelogLayout.astro** - For changelog entries
- **CustomersLayout.astro** - For customer case studies
- **TeamLayout.astro** - For team profiles
- **IntegrationsLayout.astro** - For integration pages
- **HelpcenterLayout.astro** - For help documentation
- **InfoPagesLayout.astro** - For info pages

All layouts typically extend BaseLayout or include the BaseHead component.

### Component Structure

Components are organized in `src/components/`:

#### Foundation Components (`src/components/fundations/`)

Core reusable components that form the design system:

**Elements:**
- **Text.astro** - Typography component with variants (display6XL → displayXS, textXL → textXS)
  - Props: `tag` (p, h1-h6, a, span, etc.), `variant`, `class`, `href`, `title`, `ariaLabel`
  - Supports left-icon and right-icon slots

- **Button.astro** - Button component with variants and sizes
  - Variants: `default` (gray), `accent` (teal), `muted` (white), `none`
  - Sizes: `xs`, `sm`, `base`, `md`, `lg`, `xl`
  - Gap sizes: `xs`, `sm`, `base`, `md`, `lg`
  - Supports left-icon and right-icon slots

- **Link.astro** - Link component with consistent styling

- **ShareButtons.astro** - Social sharing buttons

**Containers:**
- **Wrapper.astro** - Layout wrapper with responsive max-widths
  - Variants: `standard` (1440px), `narrow` (2xl), `prose` (with typography styles)

**Head Components:**
- **BaseHead.astro** - Aggregates all head elements (SEO, meta, fonts, favicons, scripts)
- **Seo.astro** - SEO configuration using @astrolib/seo
- **Meta.astro** - Meta tags
- **Fonts.astro** - Font loading
- **Favicons.astro** - Favicon links

**Scripts:**
- **FuseJS.astro** - Search functionality with Fuse.js
- **KeenSlider.astro** - Carousel/slider functionality

**Icons:**
- Icon components in `src/components/fundations/icons/` (SVG-based)

#### Feature Components

Organized by purpose:
- `src/components/ctas/` - Call-to-action components
- `src/components/customers/` - Customer-specific components
- `src/components/features/` - Feature showcase components
- `src/components/featureWidgets/` - Interactive feature widgets
- `src/components/changelog/` - Changelog-specific components

#### Global Components

- **Navigation.astro** (`src/components/global/`) - Site navigation
- **Footer.astro** (`src/components/global/`) - Site footer

### Path Aliases

The project uses `@/` as an alias for `src/`:
```astro
import Text from "@/components/fundations/elements/Text.astro";
import "@/styles/global.css";
```

### Integrations

- **@astrojs/mdx** - MDX support for content
- **@astrojs/sitemap** - Automatic sitemap generation
- **@astrolib/seo** - SEO meta tags and Open Graph support

### Optional: PagesCMS

A `.pages.yml` config file is included for optional PagesCMS integration (git-based CMS). It can be safely ignored or deleted if not needed.

## Key Patterns

### Adding New Content

1. Add MDX file to appropriate `src/content/[collection]/` directory
2. Ensure frontmatter matches the Zod schema in `src/content/config.ts`
3. Images should be imported and referenced using Astro's image() helper in frontmatter
4. Content will automatically appear in collection queries

### Creating New Pages

1. Add `.astro` file to `src/pages/` or appropriate subdirectory
2. Import and use BaseLayout or a specific layout
3. Use Wrapper component for consistent page width
4. Use Text and Button components for typography and CTAs

### Styling Guidelines

- Use Tailwind utility classes (v4 syntax)
- Leverage the custom color palette (yellow, purple, green, teal, rose, blue, base)
- Use Text component variants for typography instead of direct text classes
- Use Button component variants instead of custom button styles
- Define new design tokens in `src/styles/global.css` @theme block if needed

### Component Development

- Foundation components should be generic and reusable
- Feature components can be specific to use cases
- Use TypeScript interfaces for props
- Leverage Astro's slot system for flexible content
- Use `class:list` for conditional classes in Astro components
- Support additional classes via a `class` prop for customization