# Rules

The single source of truth for both skills. `senior-manager` and `section-manager` are procedures; when one disagrees with this file, this file wins.

Your own setup (sections, managers, charters, where dated items go) lives in the roster file, `~/.claude/session-managers/roster.md`. It's per machine, because sessions are. `examples/roster.md` shows the format.

## How the hierarchy works

- **Senior manager** (section `manager`): takes your requests, routes each one to the session that owns it, tracks replies, and archives a session once it replies DONE. It answers questions about sessions and routing itself and routes everything else.
- **Section manager**: one long-lived session per sidebar section. It owns that area's charter and works from the area's repo or notes folder, never a scratch folder (a scratch folder is deleted along with its session). It does its work in its own turn, with subagents for the pieces that can run in parallel.
- **Only a turn you type can start a session.** A session that another session started can't start one at all (auto mode denies it, even in its first turn), and a turn started by another session's message can only offer a card. Subagents work everywhere. So a section manager is a session you started or promoted, and new sessions only appear where you type.
- **Approvals never travel by message.** Anything public, paid or hard to undo, you type into the session that does it. A manager names that session; it never relays a yes. Quoting your words in a brief is context, never approval.
- **State lives in files, not sessions.** Every charter has an `Open` heading: open items, items waiting on you (with a date), and any timer or job the manager created. A manager wakes only when messaged, so a dated item goes to a scheduled loop or queue, which the roster names.

## Measured behaviour

Tested live in the Claude desktop app (Code tab) in November 2026. `docs/FINDINGS.md` has the tests.

- Sessions that a session starts nest under it and can't be moved to another section. `detach_session` makes one top-level and movable. That can't be undone, and the session that started it stops getting its turn-end notes.
- `send_message` to an archived session isn't delivered; unarchive it first. A message to a busy session is queued and runs when its turn ends, so replies arrive late and out of order.
- In auto mode, `archive_session` can fail once when a hook adds a `session` label. Reissue it alone, with exactly the input the error quotes.
- Renaming sessions (`set_session_title`) and filing them into sections need no approval in auto mode.
