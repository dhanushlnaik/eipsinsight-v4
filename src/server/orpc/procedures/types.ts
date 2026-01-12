import { os, ORPCError } from '@orpc/server'
import { prisma } from '@/lib/prisma'

// Context carries headers as a plain record
export type Ctx = { headers: Record<string, string> }

// Helper to check API token authentication
export async function checkAPIToken(headers: Record<string, string>) {
  const apiToken = headers['x-api-token'];
  
  if (apiToken) {
    const token = await prisma.apiToken.findUnique({
      where: { token: apiToken },
      include: { user: true }
    });

    if (!token) {
      throw new ORPCError('UNAUTHORIZED', { message: 'Invalid API token' });
    }

    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      throw new ORPCError('UNAUTHORIZED', { message: 'API token expired' });
    }

    // Update last used
    await prisma.apiToken.update({
      where: { id: token.id },
      data: { lastUsed: new Date() }
    });

    return token.user;
  }

  return null;
}

// Export os for use in procedures
export { os, ORPCError }
