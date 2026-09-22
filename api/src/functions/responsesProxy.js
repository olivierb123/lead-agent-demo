import { app } from '@azure/functions'
import { ManagedIdentityCredential } from '@azure/identity'

app.setup({ enableHttpStream: true })

const credential = new ManagedIdentityCredential()
const TOKEN_SCOPE = 'https://ai.azure.com/.default'
let cachedToken = null

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ])
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresOnTimestamp - Date.now() > 60_000) {
    return cachedToken.token
  }
  cachedToken = await withTimeout(credential.getToken(TOKEN_SCOPE), 15_000, 'credential.getToken')
  return cachedToken.token
}

app.http('responsesProxy', {
  route: 'responses',
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const upstreamUrl = process.env.FOUNDRY_AGENT_URL
    if (!upstreamUrl) {
      return { status: 500, jsonBody: { error: 'FOUNDRY_AGENT_URL is not configured' } }
    }

    if (request.query.get('debug') === 'identity') {
      const endpoint = process.env.IDENTITY_ENDPOINT
      const header = process.env.IDENTITY_HEADER
      const info = {
        hasIdentityEndpoint: Boolean(endpoint),
        hasIdentityHeader: Boolean(header),
        hasMsiEndpoint: Boolean(process.env.MSI_ENDPOINT),
        hasMsiSecret: Boolean(process.env.MSI_SECRET),
        identityEndpoint: endpoint ?? null,
      }
      if (endpoint && header) {
        try {
          const probeUrl = `${endpoint}?resource=${encodeURIComponent('https://ai.azure.com')}&api-version=2019-08-01`
          const res = await withTimeout(
            fetch(probeUrl, { headers: { 'X-IDENTITY-HEADER': header } }),
            10_000,
            'identity probe',
          )
          const text = await res.text()
          info.probeStatus = res.status
          info.probeBodySnippet = text.slice(0, 300)
        } catch (probeErr) {
          info.probeError = String(probeErr && probeErr.message ? probeErr.message : probeErr)
        }
      }
      return { status: 200, jsonBody: info }
    }

    try {
      const token = await getAccessToken()

      const upstream = await withTimeout(
        fetch(upstreamUrl, {
          method: request.method,
          headers: {
            'Content-Type': request.headers.get('content-type') ?? 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: request.method === 'POST' ? await request.text() : undefined,
        }),
        20_000,
        'upstream fetch',
      )

      return {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
        body: upstream.body,
      }
    } catch (err) {
      context.error('responsesProxy failed', err)
      return { status: 502, jsonBody: { error: String(err && err.message ? err.message : err) } }
    }
  },
})
