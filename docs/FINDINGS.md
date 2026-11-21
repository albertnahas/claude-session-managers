# Findings

These are the tests behind `RULES.md`. They were run live in the Claude desktop app (Code tab) on 21 November 2026, in auto permission mode, while I set this up for my own sessions.

## The setup

- **Sidebar sections**, one per area. The session tools can create sections, file sessions into them, rename sessions and archive them.
- **A senior manager session** that takes requests, routes them, tracks replies, and archives a session once it confirms DONE. In its first hour it archived 18 finished sessions out of 24, after asking each one whether its job was done.
- **A section manager.** I promoted the session that already ran my X posting queue rather than starting a new one.

## Tests

| # | Test | Result |
|---|---|---|
| 1 | A session started by another session calls `start_session` in its first turn | Denied by the auto-mode classifier. No grandchild was created. |
| 2 | The same session, in a turn started by a message, offers a session card (`own_initiative`) | Allowed. The card was then withdrawn with `dismiss_task`. |
| 3 | The same session spawns a subagent (`Agent`, haiku) | Works. It replied OK in 3 s. |
| 4 | A nested session moves itself to another section | Refused: "nested sessions move with their parent". |
| 5 | The parent detaches the nested session, then files it | Works. Detaching can't be undone, and the parent stops getting its turn-end notes. |
| 6 | `send_message` to an archived session | Not delivered: "unarchive it first". |
| 7 | A session renames itself | Works with no approval prompt. |
| 8 | A public post and a timer approved through another session's message | Blocked by auto mode, twice. My own yes, typed in that session, unblocked both. |
| 9 | `archive_session` in auto mode | Fails once because a hook adds a `session` label. Reissuing it with the exact input the error quotes works. |
| 10 | Messages to a busy session | Queued and run when its turn ends. Replies arrive late and out of order. |

## Lessons

1. **Only a turn you type can start a session.** A deep tree of managers spawning workers doesn't work in auto mode. A section manager that will spawn workers has to be a session you started or promoted. Routed work gets done with subagents inside the turn.
2. **Approvals don't travel, and that's right.** If a relayed yes worked, any session could approve anything by messaging another one. A manager's job is to tell you exactly what to type, and in which session.
3. **Promote the owner, don't stack a manager on it.** Most areas had one live session. A new manager on top of it would only add a hop and cost tokens.
4. **Managers go stale.** My X manager raised two items that had already been settled elsewhere. State has to live in the charter's `Open` heading, not in a session's memory.
5. **Nothing wakes a manager on a date.** Dated items go to a scheduled loop or queue.
6. **Scratch folders die with the session.** Both of my first managers started in app scratch folders. A manager belongs in its area's repo or notes folder.
7. **An independent review paid off.** A fresh-context reviewer found that the section-manager skill never loaded its tools, along with six other issues. All were fixed before rollout.
