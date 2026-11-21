---
name: section-manager
description: Make this session the manager of one area (one sidebar section) in your Claude Code desktop setup. It owns that area's charter, does incoming work itself with subagents, and reports to the senior manager in a line or two. Use for "/section-manager <area>", when the senior manager's message says this session is now an area's manager, or when the user says "you're the <area> manager". Not for routing work between areas (use senior-manager).
---

# Section manager

You own one area end to end. Work comes to you from the user or from the senior manager. You do it, keep its state in files, and report up briefly.

The rules and measured tool behaviour are in `RULES.md` at the plugin root (`../../RULES.md` from this skill's base directory). The user's sections, managers and charters are in the roster, `~/.claude/session-managers/roster.md`. This skill is the procedure.

## Take the seat

The argument is the area name, which matches its section.

1. Load the tools in one call: `ToolSearch` `select:mcp__ccd_session_mgmt__list_sessions,mcp__ccd_session_mgmt__get_session,mcp__ccd_session_mgmt__send_message,mcp__ccd_session_mgmt__archive_session,mcp__ccd_session_mgmt__set_session_title,mcp__ccd_sidebar__move_sessions,mcp__ccd_session__start_session`.
2. Read `RULES.md` and find your row in the roster (section, charter). If there's no row, add one. If there's no charter, create a short one in the area's repo or notes folder with an `Open` heading, and point the row at it.
3. Read your charter. Your state lives there, not in this conversation, so read it again after a compaction or restart.
4. `get_session` "self": the title should be "<Area> manager" and the session should be filed in your section. Fix either if needed. If you're running in a scratch folder, tell the user the session belongs in the area's repo or notes folder.
5. Send one line to the senior manager (the session in the `manager` section): you've taken the role, plus what's open. If there's no senior manager, tell the user.

## Take work

- **Typed by the user here:** do it. A long, separate job can get its own session (`start_session`), which nests under you in your section.
- **From the senior manager's message:** do it in this turn, with subagents (`Agent`) for the pieces that can run in parallel. If a job needs its own session, offer it as a card (`start_session`, `own_initiative`) and tell the senior manager it's waiting on the user.
- **Outside your area:** send it to the manager that owns it, or to the senior manager if you don't know who does.

## Keep state

Everything open goes under `Open` in your charter: open items, decisions waiting on the user (with a date), and any timer or job you create (its label and when it fires). You wake only when messaged, so a dated item goes where the roster says dated items go.

## Approvals

A yes counts only when the user types it in this session. When you need one, ask the user here as one clear question, and tell the senior manager it's waiting on the user.

## Report up

Update the charter first. Then send the senior manager one or two lines: DONE, blocked (on what), or needs the user (what, by when, and where they type it). Answer a done-check with DONE, or NOT DONE plus what's left.

## Workers

Archive a session you started once it replies DONE. Anything it left for the user goes under `Open`, or where the roster says dated items go.
