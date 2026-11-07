# Apple Health integration issues & solutions

## Deduplication (upsert)

- On export, we check if a sample with the same UUID already exists
- If yes, we delete the old one and save the new one (overwrite)
- This prevents duplication if you export multiple times

## Conflict resolution with other apps

- Apple Health takes the UNION of overlapping sessions
- E.g. if you have watch data + our app data for the same night, it won't double count duration
- We do not delete data from other apps (hostile)
- Users can prioritize data sources in Apple Health settings
