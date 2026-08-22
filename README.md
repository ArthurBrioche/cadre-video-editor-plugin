# Cadre Video Editor for Claude

[Cadre](https://cadre.cam/) is a local screen recorder and non-destructive video editor for Apple Silicon Macs. This repository is the complete, auditable source of its token-free Claude plugin: one editing skill and a small stdio bridge to Cadre's loopback-only Model Context Protocol (MCP) server.

Cadre edits and renders footage supplied or recorded by the user. It does not use a generative-media model to synthesize video, images, speech, music, or voices.

## What Claude can do

With Cadre open, a compatible local Claude session can:

- visibly start, pause, resume, stop, and inspect a screen recording;
- inspect the timeline, transcript, privacy-safe interaction context, and selected frames;
- apply non-destructive cuts, speed changes, zooms, captions, callouts, masks, and styling;
- verify the composed result, save the project, and export an MP4.

Recording, editing, and preview are free. An active Cadre Pro subscription is required only when exporting.

Read the [Agent API overview](https://cadre.cam/docs/agent-api/overview.html), [complete tool reference](https://cadre.cam/docs/agent-api/tools.html), and [project-format reference](https://cadre.cam/docs/agent-api/project-format.html).

## Requirements

- An Apple Silicon Mac running macOS 13 or later.
- The current [signed and notarized Cadre app](https://cadre.cam/#download), open locally.
- Claude Desktop, a local Cowork session, or Claude Code with permission to run a local MCP server.
- Node.js 18 or later available as `node` on the local `PATH` so the bridge can run.

Remote or cloud-only sessions cannot reach Cadre's `127.0.0.1` service. Organization administrators may also disable local MCP servers or personal plugins.

## Install

The supported customer path is built into Cadre:

1. Open Cadre and choose **Preferences → AI Editing**.
2. In the **Claude Cowork** card, click **Prepare plugin**.
3. Cadre reveals `Cadre-Claude-Plugin.zip` in Downloads and opens Claude.
4. In Claude, choose **Customize → Plugins**, upload the archive, and approve the local MCP server.
5. Keep Cadre open while using the plugin.

The archive contains no bearer token. The bridge reads Cadre's current private connection file only when a tool is called, so port and token rotation continue to work after app restarts.

For source review or local Claude Code development:

```sh
git clone https://github.com/ArthurBrioche/cadre-video-editor-plugin.git
cd cadre-video-editor-plugin
claude plugin validate . --strict
claude --plugin-dir .
```

## Example requests

- “Record a 30-second demo of the main display, then trim the lead-in and add a restrained zoom to the important click.”
- “Inspect the open project, remove only measured dead air, and show me the resulting timeline before saving.”
- “Add local captions and a simple title, check a composed frame for clipped text, then export a 1080p MP4.”

Recording always uses Cadre's normal countdown, display highlight, and on-screen controls. The agent cannot make recording silent. Destructive cancellation is separately annotated so clients can ask before deleting a take.

## Permissions and high-impact actions

- macOS controls Screen Recording and the optional Microphone, Accessibility, Camera, and Input Monitoring permissions. The plugin cannot grant them.
- Tool results can include a selected transcript, privacy-safe interaction context, local OCR, or a selected video frame. A cloud-backed assistant may send that context to its model provider.
- Agent mutations use the same visible timeline, undo history, validation, and autosave as manual edits.
- `cancel_recording` permanently deletes the active take. It is marked destructive and should run only after explicit confirmation.
- Export writes an MP4 to a user-approved path and requires Cadre Pro.

## Privacy and security boundary

- Cadre binds the Agent API to `127.0.0.1` on an ephemeral port, rotates the bearer token on every app launch, and requires the current token on every request.
- The token remains in Cadre's mode-`0600` connection file. It is not committed here or included in the plugin archive.
- Projects, recordings, and local Whisper transcripts remain stored on the Mac unless the user moves them.
- Plain keystrokes are never captured. Cadre records only privacy-safe shortcuts when keyboard tracking is enabled.
- A connected cloud-backed assistant can request selected transcript, interaction, or frame context and may send that context to its model provider. The provider's account settings and data policy apply.
- Export uses the same licence gate as manual editing; the plugin does not bypass it.

See Cadre's [privacy policy](https://cadre.cam/privacy.html) and [security model](https://cadre.cam/docs/agent-api/overview.html#security-posture) before connecting any assistant to sensitive footage.

## Support and responsible disclosure

For setup help, see [Cadre support](https://cadre.cam/support.html) or email [jack@cadre.cam](mailto:jack@cadre.cam). Please report security issues privately using the process in [SECURITY.md](SECURITY.md), not in a public issue.

## License

The plugin source is released under the [MIT License](LICENSE). Cadre itself is proprietary software and is governed by its own [terms](https://cadre.cam/terms.html).
