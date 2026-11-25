# Rules

The single source of truth for both skills. `senior-manager` and `section-manager` are procedures; when one disagrees with this file, this file wins.

Your own setup lives in the roster, `~/.claude/session-managers/roster.md`: sections, managers, charters, where dated items go, and whether managers may archive without asking. It's per machine, because sessions are. The first manager to run creates it from `templates/roster.md`; `examples/roster.md` shows a filled-in one.

## How the hierarchy works

- **Senior manager** (section `manager`): takes your requests, routes each one to the session that owns it, and tracks the replies. It answers questions about sessions and routing itself and routes everything else. It does no topic work: a topic nobody owns gets its own session, however small it looks, unless one or two tool calls settle it.
- **Section manager**: one long-lived session per sidebar section. It owns that area's charter and works from the area's repo or notes folder, never a scratch folder (see lesson 6 in `docs/FINDINGS.md`). It does its work in its own turn, with subagents for the pieces that can run in parallel.
- **Only a turn you type can start a session.** A session that another session started can't start one at all (auto mode denies it, even in its first turn), and a turn started by another session's message can only offer a card. Subagents work everywhere. So a section manager is a session you started or promoted, and new sessions only appear where you type. A session a manager starts can't grow into a manager unless it's detached and filed.
- **Approvals never travel by message.** Anything public, paid or hard to undo, you type into the session that does it. A manager names that session; it never relays a yes. Quoting your words in a brief is context, never approval.
- **Archiving needs your agreement.** A manager archives a session it started (the senior manager: any session it routed work to) only after that session replies DONE, and only when you've agreed: either `Archive on DONE: yes` in the roster, or you confirm the list it shows you. One confirmation can cover the whole list.
- **The senior manager doesn't grow.** The plugin's hook (`hooks/register.ts`) adds the open sessions and what each is waiting on to every prompt, and, once about 40k tokens of old turns have piled up, trims the session to the last 12 messages, 4,000 characters each: what was typed and each turn's closing answer. Tool output, loaded skills and older turns are then gone, after any answer and without notice. Anything needed later goes in a file before the turn ends.
- **State lives in files, not sessions.** Every charter has an `Open` heading: open items, items waiting on you (with a date), and any timer or job the manager created. A manager wakes only when messaged, so a dated item goes where the roster's `Dated items go to:` line says. Anything only you can do goes there too, with a due date.

## Measured behaviour

Tested in the Claude desktop app 6.28899 (Code tab, Claude Code 2.1.330) in auto permission mode, November 2026. `docs/FINDINGS.md` has the tests. In default mode, expect an approval prompt for some of these calls. The session tools are not a documented, stable API, so a later app version may behave differently.

- Sessions that a session starts nest under it and can't be moved to another section. `detach_session` makes one top-level and movable. That can't be undone, and the session that started it stops getting its turn-end notes.
- `send_message` to an archived session isn't delivered; unarchive it first. A message to a busy session is queued and runs when its turn ends, so replies arrive late and out of order.
- `archive_session` can fail once when a hook adds a `session` label. Reissue it alone, with exactly the input the error quotes. The app also refuses to archive some sessions and keeps them; leave those to you.
- Only a mod can trim a desktop session by itself: `$.session.compact` is refused there, but `$.command.run({ command: 'compact' })` works, and a `session.compact` hook that answers with its own messages needs no model call.
- Renaming sessions (`set_session_title`) and filing them into sections need no approval in auto mode.
