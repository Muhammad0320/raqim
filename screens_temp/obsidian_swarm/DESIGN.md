```markdown
# Design System Specification: The Deterministic Command

## 1. Overview & Creative North Star
This design system is engineered for the high-stakes environment of agentic orchestration. It rejects the "softness" of consumer web design in favor of a **Deterministic Industrial** aesthetic—a fusion of Vercel’s hyper-clean developer experience and Palantir’s authoritative data density.

**Creative North Star: "The Sovereign Interface"**
The UI should feel like a high-performance terminal translated into a visual OS. It is not a website; it is a cockpit. We break the "template" look by utilizing intentional asymmetry, high-contrast typography scales, and a "Logic-First" layout where the data density dictates the form, rather than a pre-defined grid. Every pixel must feel intentional, snappy, and mechanically precise.

---

## 2. Colors & Surface Architecture
The palette is rooted in the "Abyss"—deep charcoals and blacks that provide a void for high-criticality data to occupy.

### The "No-Line" Rule
Traditional UI relies on borders to separate sections. In this design system, **1px solid borders for sectioning are prohibited.** Boundaries are defined through background tonal shifts.
- Use `surface` for the base background.
- Use `surface_container_low` for secondary navigation or sidebar regions.
- Use `surface_container_high` for primary content areas to create a "lift" without a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
- **Root Level:** `surface` (#131313)
- **Primary Workspaces:** `surface_container` (#201f1f)
- **Floating Utilities/Modals:** `surface_container_highest` (#353534)
- **Data Cells:** `surface_container_lowest` (#0e0e0e) for a "sunken" terminal feel.

### The "Glass & Gradient" Rule
To elevate the "Agentic" feel, use **Glassmorphism** for floating overlays (e.g., Command Palettes). 
- **Recipe:** `surface_container_high` at 70% opacity + `backdrop-blur: 24px`.
- **Signature Gradients:** For primary actions, use a subtle vertical gradient from `primary_container` (#0070f3) to `on_primary_fixed_variant` (#004397). This provides a "machined" depth that flat colors lack.

---

## 3. Typography
The system uses a dual-engine typographic approach to distinguish between "System Logic" and "User Content."

- **Display & Headlines (Space Grotesk):** Technical, slightly wide, and authoritative. Use `display-lg` for dashboard summaries to create an editorial, high-impact feel.
- **UI & Navigation (Inter/Geist):** Clean and invisible. Used for `body-md` and `title-sm` to ensure the interface stays out of the way of the data.
- **Data & Logs (Monospace):** All agent logs, terminal outputs, and table data must use a Monospace font. This reinforces the "deterministic" nature of the OS.

**Hierarchy as Identity:**
Use `label-sm` in all-caps with `letter-spacing: 0.05rem` for secondary metadata. This mimics industrial labeling on hardware.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than structural shadows.

- **The Layering Principle:** Stack `surface_container` tiers to create hierarchy. A card with `surface_container_highest` sitting on a `surface_container_low` background creates a natural, sharp lift.
- **Ambient Shadows:** Shadows are rare. When required for modals, use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow should feel like a soft ambient occlusion, not a drop shadow.
- **The Ghost Border:** If a container requires a boundary (e.g., in high-density tables), use a "Ghost Border": the `outline_variant` token at **15% opacity**. This provides a hint of structure without cluttering the visual field.

---

## 5. Components

### Buttons
- **Primary:** High-contrast `primary_container` (#0070f3) background. Sharp corners (`radius-sm`). Text is `on_primary_container`.
- **Secondary:** Ghost variant. No background. `outline` stroke at 20% opacity. On hover, background shifts to `surface_container_highest`.
- **Tertiary:** `on_surface` text with no border. Used for low-priority actions in toolbars.

### Data-Dense Tables (The "Swarm Grid")
- **Header:** `surface_container_high` background, `label-md` uppercase typography.
- **Rows:** No horizontal dividers. Use a subtle background shift to `surface_container_low` on hover.
- **Cells:** Use Monospace fonts for all numeric and ID-based data.

### Status Chips
- **Active/Healthy:** `secondary` (#4edea3) with a 2px "pulse" dot.
- **Warning/Alert:** `tertiary` (#ffb95f).
- **Critical:** `error` (#ffb4ab).
- **Styling:** Smallest radius (`sm`), uppercase `label-sm` text.

### Inputs
- **Text Fields:** `surface_container_lowest` background (sunken effect). Sharp `md` corners. 
- **Focus State:** 1px solid `primary_container` with a 2px outer "Ghost Glow" (primary color at 10% opacity).

---

## 6. Do's and Don'ts

### Do
- **Do** use `space-grotesk` for numbers that represent key performance indicators (KPIs).
- **Do** embrace "Empty Space." Large gutters between data containers make high-density information readable.
- **Do** use `primary_fixed_dim` for icons to keep them from vibrating against the dark background.

### Don't
- **Don't** use rounded corners above `0.5rem (lg)`. This is an industrial OS, not a social app.
- **Don't** use pure black (#000000) for large surfaces. It kills the depth. Use `surface_container_lowest` (#0e0e0e) instead.
- **Don't** use 100% opaque white for body text. Use `on_surface_variant` (#c1c6d7) to reduce eye strain in dark mode. Reserved stark white for headlines only.

---

## 7. Interaction Dynamics
- **Transitions:** Use `cubic-bezier(0.16, 1, 0.3, 1)` for all transitions (The "Vercel" Snap). It should feel immediate but smooth.
- **Micro-interactions:** When an agent task is active, use a subtle 1px "scanning" line gradient moving across the `surface_container_highest` of the card to indicate life without using heavy spinners.```