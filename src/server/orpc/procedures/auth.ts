import { os, ORPCError, type Ctx } from './types'
import { auth } from '@/lib/auth'

export const authProcedures = {
  getSession: os
    .$context<Ctx>()
    .handler(async ({ context }) => {
      const result = await auth.api.getSession({ headers: context.headers })
      if (!result?.user) {
        throw new ORPCError('UNAUTHORIZED')
      }
      return result
    }),
}
