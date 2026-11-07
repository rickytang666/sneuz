# Sleep chart logic

## Date attribution

- Sessions attributed to **wake-up day**, not bedtime day
- Example: sleep from Dec 23 11pm → Dec 24 9am appears on Dec 24

## Time normalization

- Hours as decimal values (23.5 = 11:30 PM)
- Overnight times use 24+ notation (1 AM = 25.0, 2 AM = 26.0)
- Threshold: times before 3 PM get +24
- Formula: `value < 15.0 ? value + 24.0 : value`

## Y-axis inversion

- Bedtime at top, wake-up at bottom
- Midpoint mirroring: `2 * midpoint - value`
- Labels inverted back to show actual times

## Domain calculation

1. Collect all sleep times + targets
2. Find min/max
3. Add 1-hour padding
4. Return `(floor(min - 1), ceil(max + 1))`

## Data preparation

For each day:

1. Find session where wake-up matches this day
2. Normalize bedtime and wake time to decimal hours
3. Create empty placeholder if no session
