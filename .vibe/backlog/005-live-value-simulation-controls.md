---
status: todo
depends_on: [004]
---
# Live Value Simulation Controls

## Description
Add sliders (and/or numeric inputs) to simulate life, power, combo count, and similar runtime values, so the preview renderer (item 004) can be exercised without a real match running. Moving a slider updates the corresponding element's rendered state live (e.g. the life bar's fill fraction, the combo counter's displayed number).

## Acceptance Criteria
- [ ] A slider exists for each simulatable value the loaded lifebar exposes (at minimum: life, power, combo count)
- [ ] Moving a slider updates the preview renderer's corresponding element immediately, with no page reload
- [ ] Slider ranges/steps respect the value's real constraints (e.g. life percentage clamped to 0–100)
- [ ] Simulating an out-of-range or invalid value (e.g. via keyboard input on a numeric field) clamps to the valid range instead of rendering a broken/undefined state

## Notes
None.
