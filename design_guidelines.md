# Design Guidelines: Private Credit Scoring & Lending dApp

## Design Approach

**System-Based Approach**: Adapting Material Design principles for a dark-themed, privacy-focused financial dApp. Drawing inspiration from professional crypto platforms (Uniswap, Aave) for familiarity while emphasizing security and confidentiality through visual language.

## Color Palette (User-Provided)

- **Primary**: #BB86FC (purple) - CTAs, active states, key actions
- **Primary Variant**: #3700B3 (dark purple) - hover states, secondary emphasis
- **Secondary**: #03DAC6 (cyan) - success states, encrypted data indicators, highlights
- **Background**: #121212 (near black) - main background
- **Surface**: #1E1E1E (slightly lighter dark) - cards, panels, elevated surfaces
- **Error**: #CF6679 (pink-red) - errors, warnings, critical actions
- **Text Primary**: #FFFFFF (white) - primary text
- **Text Secondary**: rgba(255, 255, 255, 0.7) - secondary text, labels
- **Text Disabled**: rgba(255, 255, 255, 0.5) - disabled states

## Typography

**Font Families**: 
- Primary: Inter (via Google Fonts) - clean, modern, excellent readability for data
- Monospace: JetBrains Mono - for wallet addresses, transaction hashes, encrypted data handles

**Hierarchy**:
- H1: 32px/40px, font-weight: 700 - page titles
- H2: 24px/32px, font-weight: 600 - section headers, card titles  
- H3: 18px/24px, font-weight: 600 - subsection headers
- Body: 16px/24px, font-weight: 400 - primary content
- Small: 14px/20px, font-weight: 400 - labels, captions
- Tiny: 12px/16px, font-weight: 500 - metadata, timestamps

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 24 for consistent rhythm.
- Component padding: p-4 to p-6
- Section spacing: mb-8 to mb-12
- Card gaps: gap-4 to gap-6
- Large section breaks: mt-16 to mt-24

**Container Structure**:
- Max-width: max-w-7xl for main content areas
- Dashboard grids: 12-column system for responsive layouts
- Sidebar: Fixed 280px width on desktop, collapsible on mobile

## Core Dashboard Layouts

**Navigation**:
- Top navbar: Wallet connection, user role indicator, network status
- Left sidebar: Main navigation (Dashboard, Submit Data, Loans, Admin), collapsible
- Breadcrumbs: Secondary navigation for context within multi-step flows

**Dashboard Views**:
- **Borrower Dashboard**: 
  - Hero stats card (credit score - encrypted indicator, available credit)
  - 2-column layout: Form submission (left) + Recent activity (right)
  - Encryption status badges prominently displayed

- **Lender Dashboard**:
  - Portfolio overview cards (3-column grid: Total Loans, Active Loans, Default Rate)
  - Loan requests table with risk tier indicators
  - Filtering and sorting controls

- **Admin Panel**:
  - System metrics (4-column grid: Coprocessor Status, Active Users, Total Computations, Key Rotation Status)
  - Access control management table
  - Audit log viewer with search/filter

## Component Library

**Cards**:
- Background: Surface color (#1E1E1E)
- Border: 1px solid rgba(255, 255, 255, 0.12)
- Border-radius: 12px
- Padding: p-6
- Subtle shadow for depth

**Data Tables**:
- Header: Sticky, bg-surface, font-weight: 600, text-sm
- Rows: Alternating subtle background (rgba(255, 255, 255, 0.02))
- Row height: 56px for comfortable scanning
- Hover: Subtle highlight with rgba(187, 134, 252, 0.08)

**Form Inputs (Critical for Encrypted Data)**:
- Height: 48px for text inputs
- Background: rgba(255, 255, 255, 0.05)
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Focus state: Border changes to primary color, glow effect
- Encryption indicator: Small lock icon + "Encrypted in browser" badge in secondary color
- Label: Above input, text-sm, text-secondary
- Helper text: Below input, text-tiny, text-secondary

**Buttons**:
- Primary: Background primary, text white, h-12, px-6, rounded-lg, font-weight: 600
- Secondary: Border 2px primary, text primary, same dimensions
- Ghost: Text primary, hover bg rgba(187, 134, 252, 0.1)
- Disabled: Opacity 0.5, cursor not-allowed

**Status Badges**:
- Pill-shaped (fully rounded)
- Encrypted: bg-secondary with low opacity, text-secondary
- Risk levels: Low (green tint), Medium (yellow tint), High (error color)
- Height: 24px, px-3, text-xs, font-weight: 600

**Modals/Dialogs**:
- Backdrop: rgba(0, 0, 0, 0.8)
- Container: bg-surface, max-w-lg, rounded-2xl, p-8
- Close button: Top-right, ghost style

**Trust Indicators**:
- Privacy shields: Lock icons with secondary color
- Verification checkmarks: After successful encryption/decryption
- Transaction status: Loading spinners, success/error states with clear messaging

## Specialized Components

**Encrypted Data Display**:
- Show ciphertext handle as monospace text, truncated with copy button
- Visual indicator (shield icon) that data is encrypted
- "Decrypt" button for owner with clear state management

**Credit Score Visualization**:
- Gauge chart for decrypted scores (0-850 range)
- Encrypted state: Show "Encrypted Score" with unlock prompt
- Color coding: Poor (red), Fair (orange), Good (yellow), Excellent (green)

**Loan Application Flow**:
- Multi-step wizard with progress indicator (Step 1 of 4)
- Each step in its own card
- Navigation: Previous/Next buttons, save draft functionality
- Clear encryption confirmations at submission

## Key Screen Layouts

**Landing/Connect Page**:
- Centered card on dark background
- MetaMask connect button prominently featured
- Brief explanation of privacy features
- Network selector (Base Mainnet/Sepolia)

**Submit Financial Data Page**:
- Single column form with clear sections (Income, Debts, Expenses)
- Each field shows encryption indicator
- Summary card on the right showing what will be encrypted
- Large "Submit Encrypted Data" primary button

**View Credit Score Page**:
- Large card showing encrypted score handle
- "Decrypt Score" button (primary)
- Once decrypted: Animated reveal of score with gauge visualization
- Historical scores graph (line chart)

## Animations

Use sparingly:
- Smooth transitions on hover states (150ms)
- Loading spinners for blockchain transactions
- Success confirmation animations (checkmark reveal)
- Drawer/modal slide-in animations (300ms ease-out)

## Images

No hero images needed - this is a functional dApp dashboard. Focus on:
- Icon library: Use Heroicons for consistent iconography
- Illustrations: Simple, abstract representations of privacy/encryption concepts in empty states
- Logos: Wallet provider logos (MetaMask), Base network logo in navbar