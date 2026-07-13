# Design Brief: Minou Patisserie

## Tone & Aesthetic
Sophisticated, warm, professional — elevated bakery branding for daily business operations. Handmade artisan sensibility with refined execution.

## Color Palette (OKLCH)
| Intent | Light Mode | Dark Mode |
|--------|-----------|----------|
| Primary (Caramel Accent) | L55 C18 H40 | L68 C22 H38 |
| Background | L98.5 C0.02 H70 | L15 C0.02 H30 |
| Card | L98 C0.01 H45 | L18 C0.02 H28 |
| Foreground | L18 C0.02 H35 | L93 C0.02 H40 |
| Accent (Warm Terracotta) | L60 C20 H38 | L68 C22 H38 |
| Success | Chart-1 (65 0.22 40) | Chart-1 (49 0.24 264) |

## Typography
| Tier | Font | Usage |
|------|------|-------|
| Display | Fraunces (serif) | Page titles, dashboard headers, section headings |
| Body | GeneralSans (sans) | Form labels, body text, table content, navigation |
| Mono | System mono | Numbers, prices, timestamps (when needed) |

## Structural Zones
| Zone | Light | Dark | Detail |
|------|-------|------|--------|
| Sidebar Nav | L96 C0.01 H50 bg with L55 C18 H40 accent highlights | L16 C0.02 H28 bg with L68 C22 H38 accent | Vertical French labels (Ventes, Inventaire, Clients, Dépenses, Rapports) |
| Header/Page Title | No distinct container, inherit background | Same | Fraunces font, weight 700, large size |
| Dashboard Cards | L98 C0.01 H45 card, L90 C0.02 H50 subtle border | L18 C0.02 H28 card, L24 C0.02 H32 border | Metric indicators, elevated 12px radius, warm-md shadow |
| Data Tables | Card surface with light striped rows (opacity 0.02) | Card surface with subtle row hover highlight | Warm border on rows, responsive scroll on mobile |
| Forms/Inputs | L94 C0.01 H55 input bg, L90 C0.02 H50 border | L24 C0.02 H32 input bg, L28 C0.02 H35 border | GeneralSans, 12px border radius, focus ring in primary |
| Buttons | Primary: L55 C18 H40 (caramel), Secondary: L88 C0.03 H50 (warm grey) | Primary: L68 C22 H38, Secondary: L22 C0.02 H32 | Generous padding, 12px radius, hover/active state in accent |
| Footer/Actions | L92 C0.02 H55 muted background | L25 C0.02 H35 muted background | Subtle border-top, aligned action groups |

## Spacing & Rhythm
- **Grid Base**: 4px (Tailwind default)
- **Card/Section Padding**: 20px–24px (lg spacing)
- **Gap Between Cards**: 20px (consistent grid)
- **Density**: Comfortable (not cramped), card-based layout minimizes cognitive load for business operations

## Component Patterns
- **Navigation**: Sidebar with icons + French labels, active state highlighted with primary accent
- **Cards**: Elevated, warm-md shadow, 12px radius, subtle border
- **Forms**: Grouped inputs with labels above, focus state in primary color
- **Tables**: Alternating row backgrounds (subtle), striped for clarity, responsive stack on mobile
- **Modals/Overlays**: Popover surface (L97 C0.01 H60), subtle shadow, 12px radius
- **Buttons**: Filled (primary) or outline (secondary), consistent hover elevation

## Motion & Interaction
- **Transitions**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (smooth, not snappy)
- **Hover**: Elevated shadow (warm-md), slight color shift on interactive elements
- **Focus**: Solid ring in primary accent color (12px radius)
- **Animations**: Fade-in, slide-down for modals/overlays (0.3s)

## Signature Detail
Warm caramel primary accent throughout—on buttons, active nav items, form focus rings—creates cohesive, sophisticated bakery identity. Warm shadows (rgba(200, 113, 74, 0.08–0.12)) echo the accent in depth cues rather than generic grey.

## Constraints
- No generic blue defaults; all interactive elements use primary caramel or accent
- Fonts loaded from bundled WOFF2 files with `font-display: swap`
- Dark mode intentionally warm (not inverted); charcoal bg with caramel accents
- Responsive: mobile-first, tablet optimized, desktop comfortable layout
- All UI text in French; currency symbol: G (Gourde)
- Sidebar-based navigation for consistent access to main functions
- Light/dark mode toggle persistent in localStorage
