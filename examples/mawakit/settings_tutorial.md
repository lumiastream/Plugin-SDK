### Mawakit Setup

1. Choose `Location Mode` and set either `City + Country` or `Latitude + Longitude`.
2. Pick the `Calculation Method ID` and `Juristic Method` that match your region.
3. Adjust prayer offsets if needed.
4. Save settings and enable Mawakit. Alerts fire at each prayer and shuruq.

Notes:
- If `Location Mode` is set to System, Mawakit will use system location only when the runtime provides it.
- If your system timezone differs from the chosen location, set `Timezone Offset (minutes)` to correct scheduling.
- Ramadan alerts use the Hijri date from the prayer time API and will trigger once per day when within the configured window.

Variable functions:
- `{{mawakit_prayer_times=city|country}}` or `{{mawakit_prayer_times=lat,lon}}` (returns comma-separated `key=value` pairs)
- `{{mawakit_prayer_times=}}` uses your current Mawakit location settings
- `{{mawakit_hijri_date=city|country}}` or `{{mawakit_hijri_date=lat,lon}}`

Built-in variables:
- `{{fajr}}`, `{{sunrise}}`, `{{dhuhr}}`, `{{asr}}`, `{{maghrib}}`, `{{isha}}`
- `{{hijri_date}}`, `{{hijri_month}}`, `{{hijri_day}}`
- `{{next_prayer}}`, `{{next_prayer_time}}`
- `{{prayer_times}}`
