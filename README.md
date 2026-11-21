# session-managers

![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757) ![License: MIT](https://img.shields.io/badge/license-MIT-blue)

**A manager for your Claude Code desktop sessions.**

Run enough sessions in the Claude desktop app and the sidebar turns into a pile. Some sessions are finished but never archived. Some are waiting on you and you've forgotten. Two are working on the same area and don't know about each other.

This plugin makes one session your **senior manager**. You tell it what you want. It sends the work to the session that owns that area, keeps every session filed in a sidebar section, waits for the reply, and archives a session once it confirms it's done. Areas with steady work get their own **section manager**, which owns that area's state and reports up in a line or two.

## Install

```
/plugin marketplace add albertnahas/claude-session-managers
/plugin install session-managers@session-managers
```

This needs the Claude desktop app (Code tab). The skills drive its session and sidebar tools, which the CLI doesn't have.

## Use

In a session you'll keep around:

```
/session-managers:senior-manager
```

It files itself under a `manager` section, surveys your sessions and gives you a short table of what's open. From then on, ask it for things ("have the blog session draft the launch post") and it routes them. To make a session the manager of an area:

```
/session-managers:section-manager blog
```

Your setup lives in `~/.claude/session-managers/roster.md`: which sections exist, who manages each one, where each charter is, and where dated items go. The senior manager creates it on first run. See [examples/roster.md](examples/roster.md).

## What it can't do

These limits come from the app, not the plugin. I measured them before writing any rules ([docs/FINDINGS.md](docs/FINDINGS.md)):

- **Only a turn you type can start a new session.** A session started by another session can't start one of its own, so managers do routed work with subagents instead of spawning a tree of sessions.
- **A yes you give one session doesn't carry to another.** If a session needs approval to post, pay or delete something, the manager tells you which session to type it in. That's deliberate: otherwise any session could approve anything by messaging another one.
- **Nothing wakes a manager on a date.** Dated items go to whatever queue or loop you name in the roster.

The full rules are in [RULES.md](RULES.md). Both skills follow that one file.

## License

MIT
