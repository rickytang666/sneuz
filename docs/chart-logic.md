# sleep chart logic

## date attribution

- sessions attributed to **wake-up day**, not bedtime day
- example: sleep from dec 23 11pm → dec 24 9am appears on dec 24

## time normalization

- hours as decimal values (23.5 = 11:30 PM)
- overnight times use 24+ notation (1 AM = 25.0, 2 AM = 26.0)
- threshold: times before 3 PM get +24
- formula: `value < 15.0 ? value + 24.0 : value`

## y-axis inversion

- bedtime at top, wake-up at bottom
- midpoint mirroring: `2 * midpoint - value`
- labels inverted back to show actual times

## domain calculation

1. collect all sleep times + targets
2. find min/max
3. add 1-hour padding
4. return `(floor(min - 1), ceil(max + 1))`

## data preparation

for each day:

1. find session where wake-up matches this day
2. normalize bedtime and wake time to decimal hours
3. create empty placeholder if no session
