# Dashboard Design — Reference

Use this file when you need more detail on density, charts, or responsive behavior. The main skill is in [SKILL.md](SKILL.md).

## Table Density

| Mode      | Use case                         | Row height / padding      |
|-----------|-----------------------------------|---------------------------|
| Default   | General use; balance of scan + rows | Comfortable padding       |
| Compact   | Power users; many rows on screen | Tighter padding, smaller text |
| Comfortable | Accessibility / readability     | Larger touch targets      |

Prefer one density per view; avoid mixing in the same table.

## Charts (when used)

- **One idea per chart**: One metric or comparison per visualization.
- **Labels**: Axis labels, units, and legend; avoid unlabeled axes.
- **Color**: Use semantic colors (e.g. green = good, red = alert) consistently; pair with text for a11y.
- **Fallback**: Provide table or summary for screen readers and when charts fail to load.

## Responsive Behavior

- **Breakpoints**: Define clear breakpoints (e.g. mobile, tablet, desktop).
- **Mobile**: Stack KPIs vertically; consider horizontal scroll for tables or card list; keep primary action visible.
- **Touch**: Adequate tap targets (e.g. 44px min); avoid hover-only critical actions.

## Terminology

Use consistently in dashboard code and copy:

- **Dashboard**: The main screen (list + KPIs).
- **Detail page**: Single-entity view (e.g. tender detail).
- **KPI**: Key metric block (number + label, optional trend).
- **Filter**: Control that narrows the list (e.g. status, date).
- **Field**: A single data attribute shown in UI (maps to spec/contract).
