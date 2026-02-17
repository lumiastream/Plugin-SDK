# System Monitor Plugin

Monitors CPU, RAM, and GPU usage (when available) and exposes variables and alerts.

## Variables
- `cpu_usage`, `cpu_bucket`
- `ram_usage`, `ram_bucket`, `ram_used_mb`, `ram_total_mb`
- `gpu_available`, `gpu_usage`, `gpu_bucket`

## Alerts
- `cpu_alert` (warning/critical variations)
- `ram_alert` (warning/critical variations)
- `gpu_alert` (warning/critical variations)

Alerts only fire when entering a new bucket (normal -> warning -> critical).

## Notes
- GPU usage depends on OS and driver support. If not available, `gpu_available` is false and no GPU alert fires.
