# Findings

These are the tests behind `RULES.md`. They were run live in the Claude desktop app (Code tab) on 21 November 2026, in auto permission mode (desktop app 6.28899, Claude Code 2.1.330), while I set this up for my own sessions.

## The setup

- **Sidebar sections**, one per area. The session tools can create sections, file sessions into them, rename sessions and archive them.
- **A senior manager session** that takes requests, routes them, tracks replies, and archives a session once it confirms DONE. In its first hour it archived 18 finished sessions out of 24, after asking each one whether its job was done.
- **A section manager.** I promoted the session that already ran one area's posting queue rather than starting a new one.

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
| 11 | `$.session.compact()` from a mod, in a `prompt.submit` hook | Refused: it would compact under the turn the hook is holding. |
| 12 | The same from `turn.complete`, in a headless (SDK) session | Refused: not available in headless sessions yet. |
| 13 | `$.command.run({ command: "compact" })` from `turn.complete`, answered by a `session.compact` hook with the last messages | Works. 8.6k tokens became 71 in 7 ms, with no model call and no prompt. It doesn't loop, and the kept messages were remembered. The next message re-caches the instructions and skills (20k tokens with my settings). |
| 14 | A `prompt.submit` hook sends the prompt to a desktop session with `$.session.send` and drops it | Works in 2 s with no main-model call. It arrives as another session's message, so it carries no approval. |
| 15 | Replay of 27 routed messages against the session list alone | 9 right with Haiku, 12 with Sonnet: most were short replies. Adding the last message seen and the last 3 routes made it 17 and 18. Each run still sent 2 to 5 confidently to the wrong session, so nothing is forwarded without a manager turn. |

## Lessons

1. **Only a turn you type can start a session.** A deep tree of managers spawning workers doesn't work in auto mode. A section manager that will spawn workers has to be a session you started or promoted. Routed work gets done with subagents inside the turn.
2. **Approvals don't travel, and that's right.** If a relayed yes worked, any session could approve anything by messaging another one. A manager's job is to tell you exactly what to type, and in which session.
3. **Promote the owner, don't stack a manager on it.** Most areas had one live session. A new manager on top of it would only add a hop and cost tokens.
4. **Managers go stale.** My first section manager raised two items that had already been settled elsewhere. State has to live in the charter's `Open` heading, not in a session's memory.
5. **Nothing wakes a manager on a date.** Dated items go to a scheduled loop or queue.
6. **Scratch folders die with the session.** Both of my first managers started in app scratch folders. A manager belongs in its area's repo or notes folder.
7. **An independent review paid off.** A fresh-context reviewer found that the section-manager skill never loaded its tools, along with six other issues. All were fixed before rollout.
8. **The manager grew because it did the work.** Over 5 days, 49 of 82 messages I typed were handled in the manager instead of routed, and its context averaged 197k tokens. Compacting with a summary after each message would cost more than it saves. Trimming to the last few messages needs no model call but re-caches 20k tokens, so it pays only once enough has piled up (about 40k tokens in my setup, with about 6 calls a turn and 10k tokens added per turn).
