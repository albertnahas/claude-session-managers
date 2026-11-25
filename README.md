# session-managers

![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757) ![License: MIT](https://img.shields.io/badge/license-MIT-blue)

**A manager for your Claude Code desktop sessions.**

Run enough sessions in the Claude desktop app and the sidebar turns into a pile. Some sessions are finished but never archived. Some are waiting on you and you've forgotten. Two are working on the same area and don't know about each other.

This plugin makes one session your **senior manager**. You tell it what you want. It sends the work to the session that owns that area, keeps every session filed in a sidebar section, waits for the reply, and archives a session once it confirms it's done and you've agreed. Areas with steady work get their own **section manager**, which owns that area's state and reports up in a line or two.

## Requirements

The Claude desktop app, Code tab. The skills drive its session and sidebar tools, which the terminal CLI doesn't have. It was built and tested on desktop app 6.28899 in auto permission mode. In default mode, expect approval prompts when it files or archives sessions; I only tested auto mode.

## Install

```
/plugin marketplace add albertnahas/claude-session-managers
/plugin install session-managers@session-managers
```

## Use

In a session you'll keep around (opened on a real folder, not a scratch one):

```
/session-managers:senior-manager
```

On first run it:

- creates `~/.claude/session-managers/roster.md` and asks you two things: where dated items should go, and whether it may archive finished sessions without asking each time
- renames itself "Senior manager" and files itself in a new `manager` sidebar section
- gives you a short table of your sessions and what each one is waiting on

From then on, ask it for things ("have the blog session draft the launch post") and it routes them. To make a session the manager of one area:

```
/session-managers:section-manager blog
```

The senior manager doesn't grow. A small hook gives it a fresh list of your open sessions with every message, and once about 40k tokens of old turns have piled up, trims its context to the last 12 messages, 4,000 characters each. The trim makes no model call and waits while a subagent is running. It isn't free: the next message re-caches your instructions and skills, which is why it doesn't trim after every answer. It's on in any session titled exactly "Senior manager" and nowhere else, so don't give that title to a session whose history you need. Your other sessions' titles, folders and status lines become part of the manager's prompts, so they go to the model like anything else you send it. It reads the desktop app's own session files on macOS, an undocumented format that an update may change; if it can't read them, the manager works as before and just isn't trimmed.

The roster holds your setup: which sections exist, who manages each one, and where each area's charter is. See [examples/roster.md](examples/roster.md). To remove everything, uninstall the plugin and delete `~/.claude/session-managers/`. Sections and session titles stay as they are.

## What it can't do

These limits come from the app, not the plugin. I measured them before writing any rules ([docs/FINDINGS.md](docs/FINDINGS.md)):

- **Only a turn you type can start a new session.** A session started by another session can't start one of its own, so managers do routed work with subagents instead of spawning a tree of sessions.
- **A yes you give one session doesn't carry to another.** If a session needs approval to post, pay or delete something, the manager tells you which session to type it in. That's deliberate: otherwise any session could approve anything by messaging another one.
- **Nothing wakes a manager on a date.** Dated items go wherever you told the roster.

The full rules are in [RULES.md](RULES.md). Both skills follow that one file.

## License

MIT
