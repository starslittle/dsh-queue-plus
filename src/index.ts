/** Queue Plus host half: guarded live-queue reordering. */
import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session'
import { QUEUE_PLUS_PATH, type QueuePlusErrorBody } from './shared'
import { decodeQueuePlusRequest, QueuePlusError, QueuePlusService } from './service'

export * from './shared'
export { decodeQueuePlusRequest, QueuePlusError, QueuePlusService } from './service'

interface HttpRequestLike {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  on(event: 'data', listener: (chunk: Uint8Array | string) => void): this
  on(event: 'end', listener: () => void): this
  on(event: 'error', listener: (error: unknown) => void): this
}

interface HttpResponseLike {
  writeHead(status: number, headers?: Record<string, string>): unknown
  end(body?: string): void
}

interface HttpServerLike {
  register(route: {
    kind: 'exact'
    path: string
    handler: (request: HttpRequestLike, response: HttpResponseLike) => void | Promise<void>
  }): () => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    webServer: HttpServerLike
  }
}

/** Stable Cordis plugin name. */
export const name = 'queue-plus'

/** Host capabilities required by the route. */
export const inject = ['agents', 'webServer']

const MAX_BODY_BYTES = 16 * 1024

function contentType(request: HttpRequestLike): string {
  const raw = request.headers?.['content-type']
  return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
}

function requestJson(request: HttpRequestLike): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const decoder = new TextDecoder()
    let text = ''
    let bytes = 0
    let failed = false
    request.on('data', (chunk) => {
      if (failed) return
      const data = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk
      bytes += data.byteLength
      if (bytes > MAX_BODY_BYTES) {
        failed = true
        reject(new QueuePlusError(413, 'BODY_TOO_LARGE', 'request body is too large'))
        return
      }
      text += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true })
    })
    request.on('end', () => {
      if (failed) return
      try {
        text += decoder.decode()
        resolve(JSON.parse(text) as unknown)
      } catch {
        reject(new QueuePlusError(400, 'BAD_JSON', 'request body is not valid JSON'))
      }
    })
    request.on('error', reject)
  })
}

function respondJson(response: HttpResponseLike, status: number, value: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  response.end(JSON.stringify(value))
}

async function handleRoute(
  service: QueuePlusService,
  request: HttpRequestLike,
  response: HttpResponseLike,
): Promise<void> {
  if (request.method !== 'POST') {
    response.writeHead(405, { allow: 'POST' })
    response.end()
    return
  }
  if (!contentType(request).toLowerCase().startsWith('application/json')) {
    respondJson(response, 415, {
      ok: false,
      error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'application/json is required' },
    } satisfies QueuePlusErrorBody)
    return
  }
  try {
    const operation = decodeQueuePlusRequest(await requestJson(request))
    respondJson(response, 200, await service.execute(operation))
  } catch (error: unknown) {
    if (error instanceof QueuePlusError) {
      respondJson(response, error.status, {
        ok: false,
        error: { code: error.code, message: error.message },
      } satisfies QueuePlusErrorBody)
      return
    }
    respondJson(response, 500, {
      ok: false,
      error: { code: 'INTERNAL', message: 'queue operation failed' },
    } satisfies QueuePlusErrorBody)
  }
}

/** Register the same-origin reorder route contribution. */
export function apply(ctx: Context): void {
  const service = new QueuePlusService({
    resolveAgent: sessionId => ctx.agents.get(sessionId as SessionId),
  })
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: QUEUE_PLUS_PATH,
    handler: (request, response) => handleRoute(service, request, response),
  }), 'queue-plus: HTTP route')
}
