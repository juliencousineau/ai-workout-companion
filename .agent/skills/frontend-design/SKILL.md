---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

---

specific instructions for this project:

# Summary

Create a high-end wellness e-commerce site ('Aura') that balances minimal aesthetics with clinical transparency. The design uses a 'Stone' and 'Sage' color palette, elegant typography (Gambetta and Satoshi), and a structured layout that guides the user through curated product regimens rather than individual items. It prioritizes white space, soft shadows, and smooth transitions to establish a sense of tranquility and professionalism.

# Style

The style is 'Modern Editorial Wellness'. It uses a light stone background (#FBF9F6) to reduce visual fatigue and a muted sage green (#8DA399) for subtle action cues. Typography is a sophisticated pairing of the serif 'Gambetta' for headlines and 'Satoshi' for functional text. Animations are limited to gentle scale shifts (105%), smooth transitions (300ms), and backdrop blurs.

## Spec

Color Palette: Background Stone 50 (#FBF9F6), Borders Stone 200 (#EBE5DE), Text Stone 900 (#1C1917), Accent Sage 500 (#8DA399). Typography: Headlines in Gambetta (Serif), Weights 400-700; Body/Nav in Satoshi (Sans-serif), Weights 300-700. Layout Spacing: 1440px max width, 6-12 unit padding on sections. Shadows: Very soft shadow-lg (rgba(141, 163, 153, 0.2)) on hover states. Borders: 1px solid with 50% opacity for a 'barely-there' feel. Animations: 'ease-in-out' 300ms for color changes, 2000ms slow scale zoom on lifestyle images. Micro-interactions: Cards should translate +4px on X-axis or Y-axis on hover to indicate clickability.

# Layout & Structure

A multi-layered vertical scroll that transitions from high-level lifestyle messaging to granular product details and ending with deep trust signals.

## Reassurance Strip & Header

Top-bar reassurance strip: Height 40px, Stone 100 background, 10px uppercase tracking-widest text. Sticky Header: Height 96px, 90% opacity Stone 50 with backdrop-blur-md. Logo left (Serif 3xl), Nav center (Sans-serif 14px uppercase tracking-wider), Actions right (Cart icon with notification dot).

## Hero Section

12-column grid. Left 5 columns: H1 Serif text-7xl with an italicized accent word; P light text-xl leading-relaxed; Button group (Primary: Stone 900, Secondary: Ghost button with arrow icon). Right 7 columns: Aspect-ratio 4:5 image container with 8px border-radius and a soft sage-glow decorative blur behind the bottom-left corner.

## Regimen Selector

Goal-oriented bento grid. Five cards across. Each card: 24px padding, 8px radius. One card should be 'Active/Featured' using Stone 800 background and white text for contrast. Others: White background with Stone 100 borders. Include Lucide icons and small 'AM/PM' tags in the top right corner of each card.

## Product Protocol Deep Dive

Alternating layouts for product groups. Protocol Header: Small italicized serif label (e.g., '01. The Focus Protocol') followed by H2. Product Grid: 3-column layout of product bottles. Below the grid, include a 'Supplement Facts' card (Sage 50 background) using a monospaced font for a clinical feel, paired with a multi-column text area explaining benefits like 'Neurogenesis' or 'Cortisol Management'.

## Usage Timeline

Horizontal 3-stage timeline (Morning/Mid-Day/Evening). Each stage: Centered icon in a colored circle (Sage, Orange, Indigo 50), H3 Serif, and a bulleted list of actions. A faint 1px horizontal line connects the stages in desktop view.

## Quality & Trust Section

Full-bleed section with 2-column grid. Left: Deep Stone 900 background, white serif H2 'Trust is a molecule.', icon-led list using Sage 400 icons. Right: High-quality laboratory or botanical lifestyle image with luminosity blending to match the dark theme.

## Safety & FAQ

Section split: 5 columns for 'Safety' (box with border-l-4 Sage accent) and 7 columns for 'FAQ' using accordion-style details/summary elements. Maintain generous spacing (80px-120px) between this and other sections.

# Special Components

## Protocol CTA Button

A high-conversion button that displays both action and price.

Background: Stone 900; Text: Stone 50; Padding: 16px 32px; Radius: 6px. Content: 'Add [Name] Regimen to Cart | $XX.00'. The price should be separated by a low-opacity vertical pipe (|) and have a lighter weight than the action text.

## Ingredient Fact Table

Clinical but aesthetic data display.

Container: bg-sage-50, p-16. Use a 1px solid border-b for rows. Font: Satoshi Mono or similar system-mono. Columns: Ingredient Name (Left, 400 weight), Dosage (Right, 700 weight). Bottom section includes 'Intentionally Excluded' list in uppercase tracking-widest text.