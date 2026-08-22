#!/bin/sh

# Resolve a maintained Node.js runtime without relying on the minimal PATH a
# macOS GUI app may inherit. The same script powers Cadre's readiness check and
# Claude's real plugin launch, keeping discovery and version policy identical
# without writing a user-specific Home/NVM path into the plugin archive.

SUPPORTED_NODE_MAJORS='22 24 26'
resolved_node=''
resolved_version=''
first_unsupported_version=''

probe_node() {
  candidate=$1
  [ -x "$candidate" ] || return 1

  candidate_version=$("$candidate" --version 2>/dev/null) || return 1
  normalized_version=${candidate_version#v}
  major=${normalized_version%%.*}
  remainder=${normalized_version#*.}
  [ "$remainder" != "$normalized_version" ] || return 1
  minor=${remainder%%.*}
  patch=${remainder#*.}
  [ "$patch" != "$remainder" ] || return 1

  case "$major" in ''|*[!0-9]*) return 1 ;; esac
  case "$minor" in ''|*[!0-9]*) return 1 ;; esac
  case "$patch" in ''|*[!0-9]*) return 1 ;; esac

  case " $SUPPORTED_NODE_MAJORS " in
    *" $major "*)
      resolved_node=$candidate
      resolved_version=$normalized_version
      return 0
      ;;
  esac

  if [ -z "$first_unsupported_version" ]; then
    first_unsupported_version=$normalized_version
  fi
  return 1
}

resolve_node() {
  # An explicit override is authoritative. It is useful for managed Macs and
  # keeps automated verification isolated from unrelated host installations.
  if [ -n "${CADRE_CLAUDE_NODE_BIN:-}" ]; then
    probe_node "$CADRE_CLAUDE_NODE_BIN"
    return $?
  fi

  for candidate in \
    "${HOME:-}/.volta/bin/node" \
    "${HOME:-}/.local/bin/node" \
    "${HOME:-}/.asdf/shims/node" \
    /opt/homebrew/bin/node \
    /usr/local/bin/node \
    /opt/homebrew/opt/node@26/bin/node \
    /opt/homebrew/opt/node@24/bin/node \
    /opt/homebrew/opt/node@22/bin/node \
    /usr/local/opt/node@26/bin/node \
    /usr/local/opt/node@24/bin/node \
    /usr/local/opt/node@22/bin/node
  do
    if probe_node "$candidate"; then return 0; fi
  done

  for candidate in \
    "${HOME:-}"/.nvm/versions/node/v*/bin/node \
    "${HOME:-}"/.local/share/fnm/node-versions/v*/installation/bin/node \
    "${HOME:-}"/.local/share/mise/installs/node/*/bin/node
  do
    if probe_node "$candidate"; then return 0; fi
  done

  path_node=$(command -v node 2>/dev/null || true)
  if [ -n "$path_node" ] && probe_node "$path_node"; then return 0; fi
  return 1
}

if ! resolve_node; then
  if [ -n "$first_unsupported_version" ]; then
    printf '%s\n' "Found Node.js $first_unsupported_version, but Cadre requires a maintained Node.js 22, 24 or 26 release." >&2
  else
    printf '%s\n' 'Cadre requires a maintained Node.js 22, 24 or 26 release.' >&2
  fi
  exit 78
fi

if [ "${1:-}" = '--check' ]; then
  printf 'v%s\n' "$resolved_version"
  exit 0
fi

script_dir=$(CDPATH='' cd -- "$(/usr/bin/dirname -- "$0")" && pwd)
exec "$resolved_node" "$script_dir/cadre-bridge.mjs" "$@"
