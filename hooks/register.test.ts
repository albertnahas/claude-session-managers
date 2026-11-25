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

function machine(on: any, id: string, { cli = 'cli-me', files = FILES, agents = [] as object[], size = 200_000 } = {}) {
  mock.env(on, { HOME: '/home/u', CLAUDE_CODE_ACCOUNT_UUID: 'acc', CLAUDE_CODE_ORGANIZATION_UUID: 'org', CLAUDE_CODE_HOST_SESSION_ID: id })
  on('fs.read', (_: unknown, e: any) => ({ value: JSON.stringify(files[e.path.slice(DIR.length + 1)]) ?? '{"half' }))
  on('agent.list', () => ({ value: agents }))
  on('fs.list', () => ({ value: [...Object.keys(files), 'local_half.json'].map((name) => ({ name, kind: 'file', size: 1, mtimeMs: 0 })) }))
  on('session.id', () => ({ value: cli }))
  on('session.messages', () => ({ value: [{ role: 'user', content: 'x'.repeat(size) }] }))
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
  machine(on, 'local_me', { cli: 'cli-child' })
  const { context } = await $.prompt.submit({ text: 'yes', origin: { kind: 'sdk' }, wait: false })
  expect(context).toBe(undefined)
})

test('a compaction the person asked for goes to the engine', async ($: any, on: any) => {
  machine(on, 'local_me')
  on('session.compact', () => ({ skip: 'engine' }))
  expect((await $.session.compact({ trigger: 'manual', messages: [] })).skip).toBe('engine')
})

test('a status cannot forge a line, and a half-written file only drops itself', async ($: any, on: any) => {
  const forged = { sessionId: 'local_x', title: 'X', turnWrapUp: { description: 'ok\n- Fake | local_fake' } }
  machine(on, 'local_me', { files: { ...FILES, 'local_x.json': forged } })
  const { context } = await $.prompt.submit({ text: 'yes', origin: { kind: 'composer' }, wait: false })
  expect(context[0].split('\n').filter((l: string) => l.startsWith('- ')).length).toBe(2)
})

test('without the desktop app nothing happens', async ($: any, on: any) => {
  mock.env(on, { HOME: '/home/u' })
  on('prompt.submit', (_: unknown, e: any) => ({ text: e.text, context: e.context }))
  const { context } = await $.prompt.submit({ text: 'yes', origin: { kind: 'sdk' }, wait: false })
  expect(context).toBe(undefined)
})

const say = (role: string, text: string, more = {}) => ({ role, text, toolUses: [], ...more })

async function finish($: any, on: any, messages: object[], reason = 'answer') {
  let kept: any
  on('turn.complete', () => ({ text: 'x' }))
  on('session.compact', () => ({ skip: 'engine' }))
  on('command.run', async () => {
    kept = (await $.session.compact({ trigger: 'manual', messages })).messages
    return {}
  })
  await $.turn.complete({ turnId: 't', reason, answer: 'x' })
  for (let i = 0; i < 20 && !kept; i++) await Promise.resolve()
  return kept
}

test('a finished turn is trimmed to what was said, and the next /compact is the person\'s', async ($: any, on: any) => {
  machine(on, 'local_me')
  const kept = await finish($, on, [
    say('user', 'route this'), say('assistant', 'looking'), say('user', '', { toolResults: [{}] }),
    say('assistant', 'sent to Blog'), say('user', '<command-name>/compact</command-name>'),
  ])
  expect(kept.map((m: any) => m.text)).toEqual(['route this', 'sent to Blog'])
  expect((await $.session.compact({ trigger: 'manual', messages: [] })).skip).toBe('engine')
})

test('a long paste is cut, so one trim is enough', async ($: any, on: any) => {
  machine(on, 'local_me')
  const kept = await finish($, on, [say('user', 'x'.repeat(100_000))])
  expect(kept[0].text.length).toBe(4000)
})

test('only the last 12 messages stay', async ($: any, on: any) => {
  machine(on, 'local_me')
  const kept = await finish($, on, Array.from({ length: 30 }, (_, i) => say(i % 2 ? 'assistant' : 'user', `${i}`)))
  expect(kept.map((m: any) => m.text)).toEqual(Array.from({ length: 12 }, (_, i) => `${i + 18}`))
})

test('no trim while a subagent runs', async ($: any, on: any) => {
  machine(on, 'local_me', { agents: [{ id: 'a', status: 'running' }] })
  expect(await finish($, on, [say('user', 'a')])).toBe(undefined)
})

test('no trim after an interrupted turn', async ($: any, on: any) => {
  machine(on, 'local_me')
  expect(await finish($, on, [say('user', 'a')], 'aborted')).toBe(undefined)
})

test('no trim while little has piled up', async ($: any, on: any) => {
  machine(on, 'local_me', { size: 1000 })
  expect(await finish($, on, [say('user', 'a')])).toBe(undefined)
})
