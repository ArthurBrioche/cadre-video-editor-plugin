# Security policy

## Supported version

Security fixes are made against the latest public standalone Cadre Claude plugin and the current public Cadre release. These are versioned independently. Before reporting an issue, update Cadre from [cadre.cam](https://cadre.cam/#download), note both versions, and reproduce it with the matching public plugin source.

## Report a vulnerability privately

Use GitHub's **Security → Report a vulnerability** form for this repository, or email [jack@cadre.cam](mailto:jack@cadre.cam), with:

- the affected Cadre and plugin versions;
- the minimum steps needed to reproduce the issue;
- the security impact you observed; and
- logs or screenshots only after removing project names, transcripts, tokens, local paths, and other private material.

Do not open a public issue for an unpatched vulnerability. We will acknowledge a useful report and coordinate disclosure after a fix is available.

## Expected security boundary

The bridge in this repository talks only to Cadre's authenticated loopback service. It reads Cadre's rotating connection file at runtime and must never embed, print, persist, or transmit the bearer token elsewhere. A connected assistant may still receive tool results and send selected transcript, interaction, or frame context to its own model provider; that provider's account settings and data policy remain outside Cadre's control. Cadre publishes a [desktop MCP threat model and reusable checklist](https://cadre.cam/guides/local-mcp-security.html) alongside the [Agent API security posture](https://cadre.cam/docs/agent-api/overview.html#4-security-posture); neither is presented as an independent security certification.
