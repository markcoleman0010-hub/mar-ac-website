# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static single-page website for **MBR Air Conditioning & Refrigeration FL Corp**, a family-owned HVAC company serving Southwest Florida. Phone: (239) 440-9425. Email: info@mbracfl.com.

## Architecture

- **Single-file site**: Everything lives in `index.html` — HTML structure, inline `<style>` CSS, inline `<script>` JS
- **Logo**: `Logo2.png` in the root directory
- **Form handling**: Quote form submits to FormSubmit.co (`https://formsubmit.co/info@mbracfl.com`) via fetch POST with JSON fallback
- **Fonts**: Google Fonts — Syne (display/headings) and Plus Jakarta Sans (body)
- **No build step**: Open `index.html` directly in a browser to preview

## Development

No build tools, package managers, or test suites. To preview:

```
python -m http.server 8000
```

## Deployment

Hosted via GitHub Pages from the `main` branch at `markcoleman0010-hub/mar-ac-website`.

## Design System

**Theme**: Dark & premium. Deep charcoal backgrounds with blue accents and red CTAs — matching the red-to-blue brand logo.

CSS custom properties defined in `:root`:
- Backgrounds: `--bg-deep` (#07090F), `--bg-primary`, `--bg-card`
- Accents: `--blue` (#3B6FF5), `--red` (#D41920)
- Text: `--text-primary`, `--text-secondary`, `--text-muted`

**Typography**: Syne (display font, headings) + Plus Jakarta Sans (body). Never use generic fonts like Inter/Arial/Roboto.

## JS Features

- **IntersectionObserver** scroll-reveal animations (`.reveal` class)
- **FAQ accordion** with aria-expanded/aria-hidden toggling
- **Mobile menu** hamburger toggle with animated bars
- **Nav scroll effect** adds `.scrolled` class on scroll
- All animations respect `prefers-reduced-motion`

## Site Sections

Nav → Hero → Services (6 cards) → Why Choose Us (stats + features) → Service Areas → Testimonials → Emergency Banner → FAQ → Quote Form → Footer

Testimonials use placeholder content. Service area cities are placeholder and should be updated with real coverage data.
