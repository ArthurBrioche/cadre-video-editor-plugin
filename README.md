# Cadre Video Editor for Claude

[Cadre](https://cadre.cam/) is a local screen recorder and non-destructive video editor for Apple Silicon Macs. This repository is the public, standalone reference source for Cadre's token-free Claude plugin: one editing skill and a small stdio bridge to Cadre's loopback-only Model Context Protocol (MCP) server.

The app and this standalone plugin have independent release histories. Standalone v1.0.1 is the artifact pinned in Cadre 1.0.0-rc.18's 54-tool evidence; v1.0.2 updates the editing skill for Cadre 1.0.0-rc.20's asynchronous 57-tool Agent API. Use Cadre's live [version record](https://cadre.cam/CADRE.version) and [release notes](https://cadre.cam/release-notes.html) for the app currently published, the repository's [Releases](https://github.com/ArthurBrioche/cadre-video-editor-plugin/releases) for published standalone archives, and `.claude-plugin/plugin.json` inside an app-prepared archive for its bundled plugin version. Even when version numbers match, do not assume the app-bundled and standalone archives are byte-for-byte identical.

Cadre edits and renders footage supplied or recorded by the user. It does not use a generative-media model to synthesize video, images, speech, music, or voices.

## What Claude can do

With Cadre open, a compatible local Claude session can:

- visibly start, pause, resume, stop, and inspect a screen recording;
- inspect the timeline, transcript, privacy-safe interaction context, and selected frames;
- apply non-destructive cuts, speed changes, zooms, captions, callouts, masks, and styling;
- verify the composed result, save the project, and export an MP4.

Recording, editing, and preview are free. An active Cadre Pro subscription is required only when exporting.

Read the [Agent API overview](https://cadre.cam/docs/agent-api/overview.html), [complete tool reference](https://cadre.cam/docs/agent-api/tools.html), and [project-format reference](https://cadre.cam/docs/agent-api/project-format.html).

For the documented rc.20 compatibility baseline, Cadre publishes a [version-pinned rc.20 and standalone plugin v1.0.2 handshake and 57-tool discovery record](https://cadre.cam/agent-api-rc20-plugin-v1-0-2-evidence.html). It records initialization, ordered tool discovery, and one benign app-state read; the page explicitly excludes other tool execution, editing, caption generation, export, and model-quality claims.

Cadre also publishes a [reproducible, version-pinned Agent API handshake and 54-tool discovery record](https://cadre.cam/agent-api-evidence.html), including the exact signed app and plugin artifacts, sanitized raw data, the dated collector, and explicit limitations.

## Requirements

- An Apple Silicon Mac running macOS 13 or later.
- The current [signed and notarized Cadre app](https://cadre.cam/#download), open locally.
- Claude Desktop, a local Cowork session, or Claude Code with permission to run a local MCP server.
- A local Node.js runtime. The standalone launcher requires a maintained Node.js 22, 24 or 26 release. Its check covers Homebrew, Volta, local, asdf, NVM, fnm, mise and `PATH` installations without storing a private local path in the plugin. App-bundled requirements belong to that Cadre release and are documented inside its prepared archive.

Remote or cloud-only sessions cannot reach Cadre's `127.0.0.1` service. Organization administrators may also disable local MCP servers or personal plugins.

## Install

### App-bundled setup

The supported customer path is built into Cadre. These steps prepare the
plugin bundled with the installed Cadre release; they do not download this
repository's standalone release:

1. Open Cadre and choose **Preferences → AI Editing**.
2. In the **Claude Cowork** card, click **Prepare plugin**.
3. Cadre reveals `Cadre-Claude-Plugin.zip` in Downloads and opens Claude.
4. In Claude, choose **Customize → Plugins**, upload the archive, and approve the local MCP server.
5. Keep Cadre open while using the plugin.

The Cadre-prepared archive contains no bearer token. The bridge reads Cadre's current private connection file only when a tool is called, so port and token rotation continue to work after app restarts.

Cadre 1.0.0-rc.18 did not check Node.js before it reported its historical bundled v1.0.0 archive ready. Cadre 1.0.0-rc.19 and rc.20 run their bundled v1.0.1 launcher's Node.js preflight first. If an older archive's legacy lookup fails, use the latest standalone release from this repository; its launcher finds common macOS installations and reports an actionable runtime error.

### Public standalone source

For Claude Desktop or local Cowork, download the latest published `Cadre-Claude-Plugin-v*.zip` from this repository's [Releases](https://github.com/ArthurBrioche/cadre-video-editor-plugin/releases/latest) and upload it from **Customize → Plugins**. To review or run the current repository source with Claude Code:

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

See Cadre's [privacy policy](https://cadre.cam/privacy.html) and [security model](https://cadre.cam/docs/agent-api/overview.html#4-security-posture) before connecting any assistant to sensitive footage.

## Support and responsible disclosure

For setup help, see [Cadre support](https://cadre.cam/support.html) or email [jack@cadre.cam](mailto:jack@cadre.cam). Please report security issues privately using the process in [SECURITY.md](SECURITY.md), not in a public issue.

## License

The plugin source is released under the [MIT License](LICENSE). Cadre itself is proprietary software and is governed by its own [terms](https://cadre.cam/terms.html).
