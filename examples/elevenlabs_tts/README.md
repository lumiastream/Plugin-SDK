# ElevenLabs TTS Example

This example plugin generates ElevenLabs text-to-speech audio and plays it in Lumia Stream using `playAudio`.

## Setup

1. Create an ElevenLabs API key in your account dashboard.
2. Copy a Voice ID from your Voices list.
3. Paste the API key into settings and provide the Voice ID when you trigger **Speak**.

## Usage

- Trigger the **Speak** action and provide a message.
- Trigger **Stream Music** to generate a music clip from a prompt (or composition plan JSON).
- Optional action fields let you override voice/model/output format and tweak voice settings.

## Notes

- Audio is downloaded from the ElevenLabs streaming endpoints, kept in memory as a blob URL, then played via `playAudio`.
- Playback is always awaited so the blob URL can be revoked immediately after audio finishes.
