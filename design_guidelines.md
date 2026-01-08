# Design Guidelines: Can I Retire Yet? Assessment Application

## Design Approach

**Design System Foundation**: Carbon Design System principles adapted for financial services, combined with Stripe's professional restraint and Linear's typography clarity. This approach prioritizes trust, clarity, and data presentation over visual flair—essential for a fiduciary-toned financial assessment tool.

**Core Principles**:
- Professional credibility over visual creativity
- Information hierarchy drives layout decisions
- Calm, confident interface that reduces financial anxiety
- Data transparency and clear explanations

---

## Typography

**Font Stack**: 
- Primary: Inter (Google Fonts) - for all UI elements, forms, body text
- Accent: DM Sans (Google Fonts) - for headings and emphasis

**Hierarchy**:
- Page titles: text-4xl font-semibold tracking-tight
- Section headings: text-2xl font-semibold
- Subsection headings: text-lg font-medium
- Body text: text-base leading-relaxed
- Helper text: text-sm text-gray-600
- Legal/disclaimers: text-xs leading-relaxed

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **4, 6, 8, 12, 16** for consistent rhythm (p-4, m-8, gap-6, etc.)

**Container Strategy**:
- Application max-width: max-w-4xl mx-auto (narrow focus for forms)
- Results page max-width: max-w-6xl mx-auto (wider for data display)
- Form sections: Vertical stack with gap-8 between major sections, gap-4 within sections
- Card padding: p-8 on desktop, p-6 on mobile

---

## Component Library

### Navigation & Structure
**Header** (all pages):
- Fixed top bar with logo left, progress indicator center (intake only), subtle border-bottom
- Height: h-16, padding: px-6
- No distracting elements; clean separation from content

**Progress Indicator** (intake wizard):
- Horizontal step tracker showing 7-9 steps
- Current step highlighted, completed steps marked with checkmark
- Step labels visible on desktop, numbers only on mobile

### Forms & Input Elements

**Multi-Step Wizard Layout**:
- Single column form with generous vertical spacing
- Question groups in subtle cards with rounded-xl borders
- Clear visual separation between question types
- Autosave indicator (subtle, top-right of form)

**Input Components**:
- Text inputs: Full-width with border, rounded-lg, focus ring
- Number inputs: Smaller max-width (max-w-xs) with clear labels
- Radio buttons: Vertical stack with comfortable tap targets (min-h-12)
- Sliders (0-10 scales): Custom styled with value display, labeled endpoints
- Checkboxes: Prominent for legal acknowledgment with clear label text
- Textarea: min-h-32 for free-text responses

**Helper Text Pattern**:
- Position below label, above input
- Explain context clearly (e.g., "Do not include mortgage payments if you have one")
- Use conversational but professional tone

### Buttons & Actions

**Primary CTA**: 
- Prominent, full-width on mobile, max-w-xs on desktop
- Solid fill with rounded-lg
- Clear hierarchy (Next/Submit most prominent)

**Secondary Actions**:
- Ghost style or subtle outline
- "Back" and "Save & Exit" less prominent than forward navigation

**Button Placement**:
- Form navigation: Fixed bottom bar on mobile, inline on desktop
- Spacing between buttons: gap-4

### Results Page Components

**Verdict Display** (top section):
- Large, prominent card with clear verdict: "On Track" | "Borderline" | "At Risk"
- Supportive one-sentence summary
- Visual indicator (not color-only) for verdict strength

**Risk & Lever Cards**:
- Grid layout: grid-cols-1 md:grid-cols-2 gap-6
- Each item in its own card with clear numbering
- Plain English explanations with specific numbers where relevant

**Assumptions Section**:
- Collapsible accordion or tabbed interface
- Detailed breakdown of inputs and calculation methodology
- Technical depth available but not overwhelming

**CFP Consultation Callout**:
- Subtle card near bottom of results (not prominent)
- Clear, compliant language
- Ghost button style (not aggressive CTA)

### Checkout Page

**Layout**: Centered single column, max-w-md
- Product description card at top
- Stripe payment element below
- Trust indicators: secure payment badge, data privacy note
- Total price clearly displayed

---

## Data Visualization

**Monte Carlo Results**:
- Horizontal probability bar chart showing success percentage
- Distribution bands visualization (Strong/Moderate/Weak zones)
- Tooltip explanations on hover
- Accessible text alternatives for screen readers

**Timeline Displays**:
- Age-based timeline for mortgage, healthcare, retirement phases
- Visual markers for key transition points
- Clean, minimal style avoiding chart clutter

---

## Disclaimers & Legal

**Positioning**: 
- Checkout: Before payment submission
- Intake start: Clear acknowledgment checkbox
- Results page: Footer section with full disclaimers expanded

**Styling**: Neutral, readable typography without visual de-emphasis that makes text unreadable. Use subtle background panels to separate from main content.

---

## Mobile Responsiveness

- Forms stack to single column with full-width inputs
- Navigation buttons become full-width sticky footer
- Results cards stack vertically
- Progress indicator adapts to show current step prominently
- Touch targets minimum 44px height

---

## Tone & Messaging

**Voice**: Professional financial advisor—calm, confident, transparent
**Messaging patterns**:
- "Let's understand your retirement picture" not "Calculate your retirement!"
- "Here's what matters most" not "3 shocking risks!"
- Acknowledge uncertainty openly ("based on assumptions that may change")

---

No hero images needed—this is an application interface, not marketing content. The focus remains on clear form presentation and data visualization throughout.