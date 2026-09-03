# Changelog

All notable changes to the standalone Cadre Video Editor plugin (this
repository) are documented here. The app and this plugin have independent
release histories — see `README.md` for how the two are versioned.

## [1.0.4] - 2026-09-03

### Documentation

- Tool surface documented at 60 tools (Cadre 1.0.0-rc.35); no bridge changes.

## [1.0.3] - 2026-08-29

### Added

- Documents Cadre's built-in music library (five bundled instrumental
  tracks), the new `set_music` `libraryTrackId` source, and the
  camera-layout recipe in the editing skill.

## [1.0.2] - 2026-08-22

### Changed

- Independently versioned standalone plugin compatible with Cadre
  1.0.0-rc.20's asynchronous 57-tool Agent API.
- Updates the editing skill for the background-job lifecycle used by
  `import_video`, `generate_transcript`, `generate_captions`, and
  `download_caption_model`: preserve `jobId` and `jobToken`, poll status and
  result, and cancel only when requested. The loopback-only, rotating
  bearer-token security boundary is unchanged.
- Cadre rc.20 bundles plugin v1.0.1, not this standalone v1.0.2 release; API
  compatibility does not imply the archives are byte-identical. The
  historical rc.18 handshake evidence used plugin v1.0.1 and a 54-tool
  surface — v1.0.2 was not part of that measurement.

## [1.0.1] - 2026-08-22

### Added

- Standalone plugin compatible with Cadre 1.0.0-rc.18.
- Portable launcher that locates and validates maintained Node.js 22, 24, or
  26 installations.
- Documents private vulnerability reporting (`SECURITY.md`).

### Changed

- Clarifies the independent version boundary from the plugin bundled inside
  Cadre 1.0.0-rc.18.

## [1.0.0] - 2026-08-22

### Added

- Initial public source release of the Cadre Video Editor plugin for Claude
  Desktop, local Cowork sessions, and Claude Code.
- Complete token-free local MCP bridge, the `cadre-editor` editing skill, an
  MIT license, and explicit privacy/security boundaries.
