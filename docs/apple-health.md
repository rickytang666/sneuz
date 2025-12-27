# apple health integration issues & solutions

## deduplication (upsert)

- on export, we check if a sample with the same uuid already exists
- if yes, we delete the old one and save the new one (overwrite)
- this prevents duplication if you export multiple times

## conflict resolution with other apps

- apple health takes the UNION of overlapping sessions
- e.g. if you have watch data + our app data for the same night, it won't double count duration
- we do not delete data from other apps (hostile)
- users can prioritize data sources in apple health settings
