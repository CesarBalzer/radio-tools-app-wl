\
    #!/usr/bin/env bash
    #
    # configs-sync.sh — Pull, edit, validate, and push JSON config files over SSH.
    #
    # Features:
    # - Pull all configs from remote to a local folder
    # - Open a file for editing using $EDITOR (falls back to nano/vim)
    # - Validate JSON with jq before uploading
    # - Safe push: upload to /tmp then atomically move into place on the server
    # - Automatic timestamped backups on the server before overwriting
    # - Preserve permissions/ownership (default root:root 0644, configurable)
    # - Dry run mode
    #
    # Quick start:
    #   1) chmod +x ./configs-sync.sh
    #   2) ./configs-sync.sh set host your.server.com user root port 22 \
    #        remote /home/forge/kdsistemasweb/public/configs local ./server-configs
    #   3) ./configs-sync.sh pull
    #   4) ./configs-sync.sh edit cliente-aurora.json
    #   5) ./configs-sync.sh push cliente-aurora.json
    #
    # You can also export env vars instead of 'set': HOST, USER, PORT, REMOTE_DIR, LOCAL_DIR, OWNER, GROUP, PERMS
    # Example:
    #   export HOST=your.server.com USER=root PORT=22
    #   export REMOTE_DIR=/home/forge/kdsistemasweb/public/configs
    #   export LOCAL_DIR=./server-configs
    #   ./configs-sync.sh pull
    #
    set -euo pipefail

    # ─────────────────────────── defaults (override via env or `set` subcommand) ───────────────────────────
    HOST="${HOST:-}"
    USER="${USER:-root}"
    PORT="${PORT:-22}"
    REMOTE_DIR="${REMOTE_DIR:-/home/forge/kdsistemasweb/public/configs}"
    LOCAL_DIR="${LOCAL_DIR:-./server-configs}"
    OWNER="${OWNER:-root}"
    GROUP="${GROUP:-root}"
    PERMS="${PERMS:-0644}"
    DRY_RUN="${DRY_RUN:-0}"   # 1 to dry-run rsync/push actions

    # ─────────────────────────── helpers ───────────────────────────
    msg()  { printf "\033[1;36m[configs-sync]\033[0m %s\n" "$*"; }
    err()  { printf "\033[1;31m[error]\033[0m %s\n" "$*" >&2; }
    die()  { err "$*"; exit 1; }

    need() {
      command -v "$1" >/dev/null 2>&1 || die "Missing dependency: $1"
    }

    require_host() {
      [[ -n "$HOST" ]] || die "HOST is not set. Use './configs-sync.sh set host <HOST>' or export HOST env var."
    }

    sshc() {
      # ssh wrapper
      ssh -p "$PORT" -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" "$@"
    }

    scpc() {
      # scp wrapper
      scp -P "$PORT" "$@"
    }

    rsyncc() {
      # rsync wrapper
      if [[ "$DRY_RUN" == "1" ]]; then
        rsync -avzn --delete -e "ssh -p $PORT" "$@"
      else
        rsync -avz --delete -e "ssh -p $PORT" "$@"
      fi
    }

    ensure_local_dir() {
      mkdir -p "$LOCAL_DIR"
    }

    ensure_deps() {
      need ssh
      need scp
      need rsync
      need jq
    }

    usage() {
      cat <<USAGE
    Usage: $(basename "$0") <command> [args]

      set host <HOST> [user <USER>] [port <PORT>] [remote <REMOTE_DIR>] [local <LOCAL_DIR>] [owner <OWNER>] [group <GROUP>] [perms <PERMS>]
          Save settings into a local .configs-sync.env file for convenience.

      show-config
          Print the current effective configuration.

      pull
          Download all files from the remote configs directory to LOCAL_DIR (mirrors with --delete).

      list
          List files on the remote configs directory.

      edit <filename.json>
          Open the local file in \$EDITOR (falls back to nano or vim). Creates if missing.

      validate [<filename.json> | all]
          Validate one file or all local JSON files using jq.

      push <filename.json | all>
          Validate and upload the specified file (or all) to the server safely:
            - Uploads to /tmp first
            - Backs up existing remote file to REMOTE_DIR/backups/<file>.<timestamp>
            - Moves into place with requested perms/ownership

      dry-run [on|off]
          Toggle DRY_RUN mode (affects rsync and push copy steps).

    Env vars (optional):
      HOST, USER, PORT, REMOTE_DIR, LOCAL_DIR, OWNER, GROUP, PERMS, DRY_RUN

    Examples:
      $(basename "$0") set host example.com user root port 22 remote /home/forge/kdsistemasweb/public/configs local ./server-configs
      $(basename "$0") pull
      $(basename "$0") edit cliente-aurora.json
      $(basename "$0") push cliente-aurora.json
      $(basename "$0") push all
    USAGE
    }

    # Load .configs-sync.env if present
    if [[ -f .configs-sync.env ]]; then
      # shellcheck disable=SC1091
      source .configs-sync.env
    fi

    save_env_file() {
      cat > .configs-sync.env <<ENV
    HOST=${HOST}
    USER=${USER}
    PORT=${PORT}
    REMOTE_DIR=${REMOTE_DIR}
    LOCAL_DIR=${LOCAL_DIR}
    OWNER=${OWNER}
    GROUP=${GROUP}
    PERMS=${PERMS}
    DRY_RUN=${DRY_RUN}
    ENV
      msg "Saved settings to .configs-sync.env"
    }

    cmd_set() {
      # Parse pairs like: host <host> user <user> port <port> remote <dir> local <dir> owner <owner> group <group> perms <perms>
      while [[ $# -gt 0 ]]; do
        case "$1" in
          host)   HOST="${2:-}"; shift 2;;
          user)   USER="${2:-}"; shift 2;;
          port)   PORT="${2:-}"; shift 2;;
          remote) REMOTE_DIR="${2:-}"; shift 2;;
          local)  LOCAL_DIR="${2:-}"; shift 2;;
          owner)  OWNER="${2:-}"; shift 2;;
          group)  GROUP="${2:-}"; shift 2;;
          perms)  PERMS="${2:-}"; shift 2;;
          *) err "Unknown set option: $1"; usage; exit 1;;
        esac
      done
      save_env_file
    }

    cmd_show_config() {
      cat <<CONF
    HOST=$HOST
    USER=$USER
    PORT=$PORT
    REMOTE_DIR=$REMOTE_DIR
    LOCAL_DIR=$LOCAL_DIR
    OWNER=$OWNER
    GROUP=$GROUP
    PERMS=$PERMS
    DRY_RUN=$DRY_RUN
    CONF
    }

    cmd_pull() {
      require_host
      ensure_deps
      ensure_local_dir
      msg "Pulling from ${USER}@${HOST}:${REMOTE_DIR} -> ${LOCAL_DIR} (delete enabled)"
      rsyncc "${USER}@${HOST}:${REMOTE_DIR}/" "${LOCAL_DIR}/"
      msg "Done."
    }

    cmd_list() {
      require_host
      ensure_deps
      msg "Listing remote files: ${USER}@${HOST}:${REMOTE_DIR}"
      sshc "ls -lah --time-style=long-iso ${REMOTE_DIR}"
    }

    pick_editor() {
      if [[ -n "${EDITOR:-}" ]]; then echo "$EDITOR"; return; fi
      if command -v nano >/dev/null 2>&1; then echo "nano"; return; fi
      if command -v vim  >/dev/null 2>&1; then echo "vim";  return; fi
      if command -v vi   >/dev/null 2>&1; then echo "vi";   return; fi
      echo "ed"
    }

    cmd_edit() {
      ensure_local_dir
      local file="$1"
      [[ -n "$file" ]] || die "Specify a filename: edit <filename.json>"
      local path="${LOCAL_DIR}/${file}"
      if [[ ! -f "$path" ]]; then
        msg "Creating new file: $path"
        echo "{}" > "$path"
      fi
      local ed
      ed="$(pick_editor)"
      msg "Opening ${path} with ${ed}"
      "$ed" "$path"
    }

    validate_one() {
      local path="$1"
      jq -e . "$path" >/dev/null
    }

    cmd_validate() {
      ensure_deps
      ensure_local_dir
      local target="${1:-all}"
      if [[ "$target" == "all" ]]; then
        shopt -s nullglob
        local failed=0
        for f in "${LOCAL_DIR}"/*.json; do
          if validate_one "$f"; then
            msg "VALID: $(basename "$f")"
          else
            err "INVALID: $(basename "$f")"
            failed=1
          fi
        done
        exit $failed
      else
        local path="${LOCAL_DIR}/${target}"
        [[ -f "$path" ]] || die "File not found: $path"
        if validate_one "$path"; then
          msg "VALID: ${target}"
        else
          die "INVALID JSON: ${target}"
        fi
      fi
    }

    remote_backup_and_move() {
      # $1: remote temp file path
      # $2: final remote path (REMOTE_DIR/<file>)
      local tmp_path="$1"
      local final_path="$2"
      local dir_backup="${REMOTE_DIR}/backups"
      local ts; ts="$(date -u +%Y%m%dT%H%M%SZ)"
      local base; base="$(basename "$final_path")"

      # Ensure backup dir
      mkdir -p "$dir_backup"

      # If existing file, back it up (ignore errors if not exists)
      if [[ -f "$final_path" ]]; then
        cp -a "$final_path" "${dir_backup}/${base}.${ts}"
      fi

      # Move in place, set perms and ownership
      mv -f "$tmp_path" "$final_path"
      chown ${OWNER}:${GROUP} "$final_path"
      chmod ${PERMS} "$final_path"
    }

    cmd_push_one() {
      require_host
      ensure_deps
      ensure_local_dir

      local filename="$1"
      local local_path="${LOCAL_DIR}/${filename}"
      [[ -f "$local_path" ]] || die "Local file not found: $local_path"

      # Validate before upload
      msg "Validating JSON: ${filename}"
      validate_one "$local_path" || die "INVALID JSON: ${filename}"

      local tmp_remote="/tmp/${filename}.$(date -u +%s).upload"
      local final_remote="${REMOTE_DIR}/${filename}"

      if [[ "$DRY_RUN" == "1" ]]; then
        msg "(dry-run) Would upload ${local_path} to ${tmp_remote} and move to ${final_remote}"
        return 0
      fi

      msg "Uploading to remote temp: ${tmp_remote}"
      scpc "$local_path" "${USER}@${HOST}:${tmp_remote}"

      msg "Backing up existing and moving into place (ownership=${OWNER}:${GROUP}, perms=${PERMS})"
      # Use a heredoc to run the safe replace as root (USER may be root already)
      sshc "bash -s" <<EOF
    set -euo pipefail
    REMOTE_DIR="${REMOTE_DIR}"
    OWNER="${OWNER}"
    GROUP="${GROUP}"
    PERMS="${PERMS}"
    $(declare -f remote_backup_and_move)
    remote_backup_and_move "${tmp_remote}" "${final_remote}"
    # Print final file info
    ls -lah --time-style=long-iso "${final_remote}"
    EOF

      msg "Push complete: ${filename}"
    }

    cmd_push_all() {
      shopt -s nullglob
      local files=( "${LOCAL_DIR}"/*.json )
      [[ ${#files[@]} -gt 0 ]] || die "No local JSON files found in ${LOCAL_DIR}"
      local failed=0
      for f in "${files[@]}"; do
        local base; base="$(basename "$f")"
        if ! cmd_push_one "$base"; then
          failed=1
        fi
      done
      exit $failed
    }

    cmd_push() {
      local target="${1:-}"
      [[ -n "$target" ]] || die "Specify 'push <filename.json | all>'"
      if [[ "$target" == "all" ]]; then
        cmd_push_all
      else
        cmd_push_one "$target"
      fi
    }

    cmd_dry_run() {
      local mode="${1:-}"
      case "$mode" in
        on)  DRY_RUN=1;;
        off) DRY_RUN=0;;
        *) die "Use: dry-run on|off";;
      esac
      msg "DRY_RUN=${DRY_RUN}"
    }

    # ─────────────────────────── main dispatch ───────────────────────────
    main() {
      local cmd="${1:-}"; shift || true
      case "$cmd" in
        set)            cmd_set "$@";;
        show-config)    cmd_show_config;;
        pull)           cmd_pull;;
        list)           cmd_list;;
        edit)           cmd_edit "$@";;
        validate)       cmd_validate "${1:-all}";;
        push)           cmd_push "$@";;
        dry-run)        cmd_dry_run "$@";;
        ""|help|-h|--help) usage;;
        *) err "Unknown command: $cmd"; usage; exit 1;;
      esac
    }

    main "$@"
