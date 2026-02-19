import { os, ORPCError } from '@orpc/server'
import { prisma } from '@/lib/prisma'

// Context carries headers as a plain record
export type Ctx = {
  headers: Record<string, string>
  user?: {
    id: string
    role: string
  }
  apiToken?: {
    id: string
    scopes: string[]
  }
}


// Helper to check API token authentication
export async function checkAPIToken(headers: Record<string, string>) {
  const apiTokenValue = headers['x-api-token']

  if (!apiTokenValue) return null

  const token = await prisma.apiToken.findUnique({
    where: { token: apiTokenValue },
    include: { user: true },
  })

  if (!token) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Invalid API token' })
  }

  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    throw new ORPCError('UNAUTHORIZED', { message: 'API token expired' })
  }

  await prisma.apiToken.update({
    where: { id: token.id },
    data: { lastUsed: new Date() },
  })

  return {
    user: {
      id: token.user.id,
      role: token.user.role,
    },
    apiToken: {
      id: token.id,
      scopes: token.scopes ?? [],
    },
  }
}

export function requireScope(ctx: Ctx, requiredScope: string) {
  if (!ctx.apiToken) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'API token required',
    })
  }

  if (!ctx.apiToken.scopes.includes(requiredScope)) {
    throw new ORPCError('FORBIDDEN', {
      message: `Missing required scope: ${requiredScope}`,
    })
  }
}

export function requireAuth(ctx: Ctx) {
  if (!ctx.user && !ctx.apiToken) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Authentication required',
    })
  }
}


export const publicProcedure = os.$context<Ctx>()

export const protectedProcedure = os
  .$context<Ctx>()
  .use(async ({ context, next }) => {
    const auth = await checkAPIToken(context.headers)

    if (auth) {
      context.user = auth.user
      context.apiToken = auth.apiToken
    }

    requireAuth(context)

    return next({ context })
  })



// Export os for use in procedures
export { os, ORPCError }
