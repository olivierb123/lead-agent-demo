import { app } from '@azure/functions'
import { DefaultAzureCredential } from '@azure/identity'

app.setup({ enableHttpStream: true })

const credential = new DefaultAzureCredential()
const TOKEN_SCOPE = 'https://ai.azure.com/.default'
let cachedToken = null

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresOnTimestamp - Date.now() > 60_000) {
    return cachedToken.token
  }
  cachedToken = await credential.getToken(TOKEN_SCOPE)
  return cachedToken.token
}

app.http('responsesProxy', {
  route: 'responses',
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request) => {
    const upstreamUrl = process.env.FOUNDRY_AGENT_URL
    if (!upstreamUrl) {
      return { status: 500, jsonBody: { error: 'FOUNDRY_AGENT_URL is not configured' } }
    }

    const token = await getAccessToken()

    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') ?? 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: request.method === 'POST' ? await request.text() : undefined,
    })

    return {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
      body: upstream.body,
    }
  },
})
