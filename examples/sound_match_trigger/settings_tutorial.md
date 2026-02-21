### Quick Start
- Install FFmpeg and make sure `ffmpeg` is available on PATH (or set a full path in **FFmpeg Path**).
- Choose **Reference Audio File** with the exact sound you want to detect.
- Pick **Capture Mode**:
  - **Microphone/Input Device**: live mic/input capture
  - **System Output/Loopback**: desktop/output capture (Windows WASAPI loopback)
- Optional: set **Input Device** if default is wrong.

### Tuning
- **Detection Threshold**:
  - Start around `0.82`
  - Raise threshold to reduce false positives
  - Lower threshold if real matches are missed
- **Cooldown** controls how often alerts can fire.
- **Analyze Interval** controls responsiveness vs CPU usage.
- **Max Reference Length** keeps matching fast; short, distinctive clips work best.

### Platform Notes
- Windows:
  - Microphone mode uses FFmpeg `dshow`
  - System mode uses FFmpeg `wasapi`
- macOS:
  - Uses FFmpeg `avfoundation` (audio index in `Input Device`)
- Linux:
  - Uses FFmpeg `pulse` (source name in `Input Device`)
