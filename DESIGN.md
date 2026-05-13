---
version: beta
name: Carnet Rose Cozy Journal
description: A light-mode-only, cozy hand-drawn interface inspired by a Spanish grocery list and meal-planning journal. The product should feel warm, playful, tactile, and calm: soft peach paper, white notebook cards, thin black ink borders, sage and pink pill labels, orange washi tape, sparkle bullets, and a single handwritten marker-style font throughout.

colors:
  canvas: "#F7E7DC"
  surface-card: "#FFFFFF"
  primary: "#F4C2C2"
  primary-soft: "#F8D7DA"
  secondary: "#C7DDD0"
  secondary-strong: "#AFCBBE"
  tertiary: "#E89B4C"
  tertiary-soft: "#F5A65B"
  ink: "#1A1A1A"
  muted: "#7B6F68"
  placeholder: "#A89B92"
  border: "#1A1A1A"
  success: "#7AAA8B"
  danger: "#B45D5D"
  warning: "#D58A3B"
  scrim: "rgba(26,26,26,0.48)"

typography:
  display:
    fontFamily: "Patrick Hand, Caveat, Gloria Hallelujah, rounded handwritten fallback"
    fontSize: 34px
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: 0
  title:
    fontFamily: "Patrick Hand, Caveat, Gloria Hallelujah, rounded handwritten fallback"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.22
    letterSpacing: 0
  body:
    fontFamily: "Patrick Hand, Caveat, Gloria Hallelujah, rounded handwritten fallback"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.32
    letterSpacing: 0
  caption:
    fontFamily: "Patrick Hand, Caveat, Gloria Hallelujah, rounded handwritten fallback"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: 0
  badge:
    fontFamily: "Patrick Hand, Caveat, Gloria Hallelujah, rounded handwritten fallback"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0
    textTransform: uppercase
  button:
    fontFamily: "Patrick Hand, Caveat, Gloria Hallelujah, rounded handwritten fallback"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0

rounded:
  sm: 8px
  md: 16px
  lg: 20px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px

components:
  screen:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    padding: 16px
  card:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.border}"
    borderWidth: 1.5px
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 16px
  washi-tape:
    backgroundColor: "{colors.tertiary}"
    rounded: 3px
    opacity: 84%
    rotation: "-4deg to 4deg"
  pill-label-day:
    backgroundColor: "{colors.primary}"
    borderColor: "{colors.border}"
    borderWidth: 1.5px
    rounded: "{rounded.full}"
    typography: "{typography.badge}"
  pill-label-section:
    backgroundColor: "{colors.secondary}"
    borderColor: "{colors.border}"
    borderWidth: 1.5px
    rounded: "{rounded.full}"
    typography: "{typography.badge}"
  segmented-control:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.border}"
    borderWidth: 1.5px
    rounded: "{rounded.full}"
    activeFill: "{colors.primary}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    borderWidth: 1.5px
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: 48px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    borderWidth: 1.5px
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
  text-input:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.border}"
    borderWidth: 1.5px
    textColor: "{colors.ink}"
    placeholderColor: "{colors.placeholder}"
    rounded: "{rounded.md}"
    padding: 14px 16px
  modal-sheet:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    scrim: "{colors.scrim}"
---

## Overview

Carnet Rose uses a **cozy hand-drawn journal** system inspired by Spanish grocery list and meal-planning apps. The interface should feel like a tidy bullet journal: warm peach paper, white cards, black marker outlines, pastel pink day labels, sage section labels, orange washi tape, and small sparkle bullets.

This is **light mode only**. The palette relies on black text and black borders for WCAG AA readability while pastels provide warmth and hierarchy.

The app still supports repeated operational use. Decoration should add delight without blocking content, reducing density too far, or competing with important classroom data.

## Visual Principles

- **Paper-first canvas:** use soft peach/cream as the global background.
- **White notebook cards:** keep content on white cards with 1.5px black borders and 16-20px radii.
- **Pastel hierarchy:** pink is for active state and primary CTAs, sage is for section labels and secondary actions, orange is for tape, sparkles, and info accents.
- **One handwritten voice:** every visible label, button, title, input, chart label, and tab label uses the same handwritten font.
- **Ink over elevation:** separation comes from thin black outlines and whitespace. Avoid shadows except nearly invisible platform defaults.
- **Journal details are sparse:** washi tape and the cat mascot appear at most once per screen or one major card.

## Colors

### Core Palette

- **Canvas Peach** (`#F7E7DC`): app background.
- **Card White** (`#FFFFFF`): primary readable surface.
- **Soft Pink** (`#F4C2C2`): active tabs, primary CTAs, day-style pills.
- **Pale Pink** (`#F8D7DA`): soft supporting fills.
- **Sage** (`#C7DDD0`): section labels, meal-type tags, secondary buttons.
- **Warm Orange** (`#E89B4C`): washi tape, sparkle bullets, info icons.

### Text And Lines

- **Ink** (`#1A1A1A`): primary text and all borders.
- **Muted Warm Grey** (`#7B6F68`): metadata and secondary text.
- **Placeholder Grey** (`#A89B92`): input placeholders.

Use black text on pastel fills. Do not place muted text over colored fills.

### Status Colors

Functional states use softened but distinct tones:

- **Success** (`#7AAA8B`)
- **Danger** (`#B45D5D`)
- **Warning** (`#D58A3B`)

These are for data/status only, not broad page theming.

## Typography

Use Patrick Hand or a similar rounded handwritten marker font everywhere.

- Display: 34px, regular.
- Title: 28px, regular.
- Body: 19px, regular.
- Caption: 16px, regular.
- Labels: 15-16px, uppercase.
- Buttons: 20px, regular.

Do not use bold sans-serif headings. Do not use negative letter spacing. ALL CAPS are reserved for compact section and meal-type labels such as `DESAYUNO`, `ALMUERZO`, `CENA`, `LUNES`, or app equivalents like `TICKS`.

## Shape And Layout

- Use an 8pt spacing scale.
- Screen padding is 16px.
- Cards use 16-20px border radius, 16px padding, and 1.5px black borders.
- Pills use full radius and 1.5px black borders.
- Buttons are rounded rectangles with 8px radius and at least 48px height.
- Inputs are 16px rounded rectangles with 1.5px black borders.
- Keep rows airy but scannable. Do not over-expand repeated lists.

## Elevation

No Material-style elevation. Prefer:

- White card against peach canvas.
- Black 1.5px outline.
- Generous spacing.
- Occasional washi tape overlap for depth.

If a platform shadow is required, keep it extremely subtle and never use multiple shadow tiers.

## Component Guidance

### Cards

Cards are white with black hairline borders. Major cards may have an orange washi tape strip overlapping the top edge. Day-style cards can use a centered pink pill overlapping the top border.

### Pills

Use pink pills for active/day/primary labels and sage pills for section or meal-type labels. Pills always have black borders and black text.

### Segmented Controls

Use one rounded container with a black border. The active segment fills pink; inactive segments remain transparent/white.

### Buttons

Primary CTAs use pink fill. Secondary actions use sage or white fill. All buttons use black text, black borders, handwritten labels, 48px minimum touch targets, and press scale `0.97`.

### Inputs

Inputs are white rounded rectangles with black borders and muted placeholder text. Use the same handwritten font as the rest of the UI.

### Lists

Rows use item text on the left and an outlined three-dot icon button on the right. Sparkle bullets (`✦`) replace standard dots in journal-style lists.

### Icons

Use black outlined icons. Info icons are orange circles with a lowercase `i`. Bottom navigation uses basket, chef/restaurant, and grid icons with handwritten labels underneath and no heavy background bar.

### Mascot

Use one cute white-and-orange cat per screen at most. The cat may peek from a card corner and must never cover content or controls.

## Responsive Behavior

- Mobile-first single column.
- Use two columns for card grids on wider screens.
- Bottom tabs remain icon plus label.
- Modal sheets sit near the bottom on mobile and retain card styling.
- Text must wrap without overlapping buttons or cards.

## Micro-Interactions

- Pressed controls scale to `0.97`.
- Progress and sheets use gentle spring motion.
- Trigger light haptics on important user actions.
- Optional mascot animation may blink or sway, but should be subtle.

## Usage Examples

### Day Card

Use a white card with a pink uppercase day pill overlapping the top border. Meal rows place a fixed-width sage pill on the left and the meal description with emoji on the right.

### Grocery Row

Use a sparkle bullet, item name, and a three-dot outlined icon button. Avoid dense dividers unless the list becomes hard to scan.

### Confirmation Sheet

Use a white card/sheet with washi tape, handwritten title, white input, and pink primary CTA plus white or sage secondary action.

## Do

- Keep all borders thin, black, and consistent.
- Use handwritten typography everywhere.
- Pair pastel fills with black text.
- Use generous whitespace and stable 8pt spacing.
- Use icons for compact actions such as back, add, menu, and tabs.
- Preserve WCAG AA contrast for text and controls.

## Do Not Use

- Dark mode.
- Gradients.
- Glassmorphism.
- Neumorphism.
- Heavy shadows or Material elevation.
- System sans-serif UI surfaces.
- Bright saturated colors.
- Decorative mascot overload.
- Purple/blue gradient SaaS styling.
