# sleep chart logic

## overview

the sleep chart displays sleep sessions as vertical bars, with each bar representing one night's sleep attributed to the wake-up day.

## core concepts

### date attribution

- each sleep session is attributed to the **wake-up day**, not the bedtime day
- example: sleep from dec 23 11pm → dec 24 9am appears on dec 24

### time normalization

- hours are represented as decimal values (e.g., 23.5 = 11:30 PM)
- overnight times use 24+ notation (e.g., 1 AM = 25.0, 2 AM = 26.0)
- threshold: times before 3 PM (15.0) are considered "next day" and get +24
- formula: `value < 15.0 ? value + 24.0 : value`

### y-axis inversion

- data is inverted so bedtime appears at top, wake-up at bottom
- uses midpoint mirroring: `invertedValue = 2 * midpoint - originalValue`
- axis labels are inverted back to show actual times

### domain calculation

1. collect all sleep times (bedtimes + wake times)
2. include target bedtime and wake time if available
3. find min/max values
4. add 1-hour padding on each side
5. return `(floor(min - 1), ceil(max + 1))`

## data preparation

### chart data points

for each day in the selected range:

1. find the session where wake-up time matches this day
2. if found: normalize bedtime and wake time to decimal hours
3. if not found: create empty placeholder point

### filtering sessions

- filter sessions where `endTime >= chartStart`
- sort by start time (descending)

## view modes

### week view (7 days)

- fixed width, all bars visible
- bar width: 20pt
- corner radius: 5pt
- shows weekday labels (M, T, W, etc.)

### month view (30 days)

- horizontally scrollable
- bar width: 12pt
- corner radius: 2pt
- shows day numbers (1, 2, 3, etc.)
- auto-scrolls to right (most recent) on load

## target lines

- displayed as dashed green horizontal lines
- labeled on the right side
- inverted along with data for consistent positioning

## implementation notes

### ios (swift)

- uses swift charts framework
- function overloading for `normalizeTime(Date)` and `normalizeTime(String)`
- `@ChartContentBuilder` for composable chart elements

### web (typescript)

- uses recharts library
- separate functions for date and string normalization
- custom tick formatter for y-axis labels
