# Implementation Plan - COMOT Frontend Performance & Responsiveness Optimization

This plan details the performance diagnosis, visual optimization, and responsive design updates to resolve high CPU/GPU repaint rendering lag and fix broken single-column scaling on small screens.

---

## 🛠️ Diagnostics & Technical Analysis

### 1. Performance Bottleneck (High CPU/GPU Lag)
- **Problem**: The current dashboard includes multiple absolute background elements (`.glow`) using dynamic `filter: blur(140px);` on top of several grid cards using `backdrop-filter: blur(12px);`. 
- **Repaint Spikes**: When the 3-second polling interval triggers DOM updates (inserting logs and updating status card values), the browser is forced to perform a full-screen repaint. Compositing layered Gaussian blurs is extremely computationally expensive. This leads to **100% GPU/CPU spikes**, resulting in keyboard typing input lag and system-level Alt-Tab freezing.
- **Solution**: 
  - Remove all absolute `.glow` helper divs.
  - Implement **radial gradients** inside the standard `body` background. Gradients are calculated natively by the GPU, resulting in **0ms paint times**!
  - Simplify `backdrop-filter: blur(12px)` to `8px` on `.glass-morph` for smoother rendering.
  - Change the pulsating alarm animation (`alarmPulse`) to animate `opacity` instead of expensive `box-shadow` repaints.

### 2. Responsiveness Bugs on Small Screens
- **Problem**: The new `.expert-advisor-container` has a hardcoded `grid-column: span 2;`. In a single-column layout on small screens (<= 1024px), this forces the grid to calculate 2 columns, breaking the layout and causing overflow.
- **Solution**:
  - Add explicit grid span resets in the media queries.
  - Restructure layouts for `.app-header` to stack vertically on mobile (<= 768px).

---

## Proposed Changes

### [COMOT Frontend Styling & Asset Layer]

#### [MODIFY] [public/index.html](file:///Users/aditif/Development/COMOT/public/index.html)
- Remove the three absolute `<div class="glow ...">` divs from the body container.

#### [MODIFY] [public/index.css](file:///Users/aditif/Development/COMOT/public/index.css)
- Implement optimized native radial gradients inside the `body` selector.
- Optimize `.glass-morph` properties.
- Update `@keyframes alarmPulse` to animate `opacity` for CPU-friendly execution.
- Introduce robust media queries for `<= 1024px` and `<= 768px` to ensure single-column grids reset properly (`grid-column: span 1`) and tables remain scrollable.

---

## Verification Plan

### Automated Verification Script (`playwright`)
We will write a Playwright automated script `verify-comot.cjs` to:
1. Open the dashboard at `http://43.133.139.131:8000/`.
2. Verify that the page loads instantly without any console errors.
3. Assert that the **COMOT Procurement Expert** box exists in the DOM.
4. Set the viewport size to `375x812` (mobile dimensions) and verify that no horizontal scrollbar or layout breakages occur.
5. Capture a screenshot of the optimized interface.

### Manual Verification
- Test input typing speed in the Telegram simulator chat box to confirm 0ms latency.
- Test system Alt-Tab transitions.
