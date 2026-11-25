import { expect, mock, test } from 'claude-code/testing'

const DIR = '/home/u/Library/Application Support/Claude/claude-code-sessions/acc/org'
const FILES: Record<string, object> = {
  'local_me.json': { sessionId: 'local_me', cliSessionId: 'cli-me', title: 'Senior manager' },
  'local_blog.json': {
    sessionId: 'local_blog', title: 'Blog', cwd: '/blog', lastActivityAt: 0,
    turnWrapUp: { description: 'Draft is ready.', needsUser: 'Publish it?' },
  },
  'local_old.json': { sessionId: 'local_old', title: 'Old', isArchived: true },
}

function machine(on: any, id: string, cli = 'cli-me') {
  mock.env(on, { HOME: '/home/u', CLAUDE_CODE_ACCOUNT_UUID: 'acc', CLAUDE_CODE_ORGANIZATION_UUID: 'org', CLAUDE_CODE_HOST_SESSION_ID: id })
  on('fs.read', (_: unknown, e: any) => ({ value: JSON.stringify(FILES[e.path.slice(DIR.length + 1)]) }))
  on('fs.list', () => ({ value: Object.keys(FILES).map((name) => ({ name, kind: 'file', size: 1, mtimeMs: 0 })) }))
  on('session.id', () => ({ value: cli }))
  on('clock.now', () => ({ value: 3_600_000 }))
  on('prompt.submit', (_: unknown, e: any) => ({ text: e.text, context: e.context }))
}

test('the manager gets the open sessions with each prompt', async ($: any, on: any) => {
  machine(on, 'local_me')
  const { context } = await $.prompt.submit({ text: 'yes', origin: { kind: 'composer' }, wait: false })
  expect(context[0]).toMatch(/Blog \| local_blog \| \/blog \| active 1h ago \| Draft is ready\./)
  expect(context[0]).toMatch(/WAITING ON USER: Publish it\?/)
  expect(context[0]).not.toMatch(/local_old/)
  expect(context[0]).not.toMatch(/local_me/)
})

test('another session is left alone', async ($: any, on: any) => {
  machine(on, 'local_blog')
  const { context } = await $.prompt.submit({ text: 'yes', origin: { kind: 'composer' }, wait: false })
  expect(context).toBe(undefined)
})

test('a claude -p started from the manager is left alone', async ($: any, on: any) => {
  machine(on, 'local_me', 'cli-child')
  const { context } = await $.prompt.submit({ text: 'yes', origin: { kind: 'sdk' }, wait: false })
  expect(context).toBe(undefined)
})

test('a compaction the person asked for goes to the engine', async ($: any, on: any) => {
  machine(on, 'local_me')
  on('session.compact', () => ({ skip: 'engine' }))
  expect((await $.session.compact({ trigger: 'manual', messages: [] })).skip).toBe('engine')
})

test('a finished turn is trimmed to what was said', async ($: any, on: any) => {
  machine(on, 'local_me')
  const say = (role: string, text: string, more = {}) => ({ role, text, toolUses: [], ...more })
  const long = [
    say('user', 'route this'), say('assistant', 'looking'), say('user', '', { toolResults: [{}] }),
    say('assistant', 'sent to Blog'), say('user', '<command-name>/compact</command-name>'),
  ]
  let kept: any
  on('turn.complete', () => ({ text: 'sent to Blog' }))
  on('command.run', async () => {
    kept = (await $.session.compact({ trigger: 'manual', messages: long })).messages
    return {}
  })
  await $.turn.complete({ turnId: 't', reason: 'answer', answer: 'sent to Blog' })
  for (let i = 0; i < 20 && !kept; i++) await Promise.resolve()
  expect(kept.map((m: any) => m.text)).toEqual(['route this', 'sent to Blog'])
})
