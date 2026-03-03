import { os, ORPCError, optionalAuthProcedure, type Ctx } from './types'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import * as z from 'zod'

export const commentVoteProcedures = {
  // ─── Add or update vote (auth optional) ───
  vote: optionalAuthProcedure
    .input(
      z.object({
        comment_id: z.string().min(1),
        vote_type: z.enum(['upvote', 'downvote']),
      }),
    )
    .handler(async ({ input, context }) => {
      const session = context.user
      const userId = session?.id ?? null

      // Check if comment exists
      const comment = await prisma.pageComment.findUnique({
        where: { id: input.comment_id },
      })
      if (!comment) {
        throw new ORPCError('NOT_FOUND', { message: 'Comment not found' })
      }

      if (comment.deleted_at !== null) {
        throw new ORPCError('BAD_REQUEST', { message: 'Cannot vote on deleted comment' })
      }

      // For anonymous users, we'd need IP tracking (simplified here - just allow)
      // In production, you'd capture user IP from headers
      const userIp = null // Could be extracted from context.headers if available

      // Check if user already voted
      const existingVote = await prisma.commentVote.findFirst({
        where: {
          comment_id: input.comment_id,
          user_id: userId,
          user_ip: userIp,
        },
      })

      if (existingVote) {
        // If same vote type, remove it (toggle off)
        if (existingVote.vote_type === input.vote_type) {
          await prisma.commentVote.delete({
            where: { id: existingVote.id },
          })
          return { removed: true }
        } else {
          // Otherwise update to new vote type
          await prisma.commentVote.update({
            where: { id: existingVote.id },
            data: { vote_type: input.vote_type },
          })
          return { removed: false, changed: true }
        }
      }

      // Create new vote
      await prisma.commentVote.create({
        data: {
          comment_id: input.comment_id,
          user_id: userId,
          user_ip: userIp,
          vote_type: input.vote_type,
        },
      })

      return { removed: false, changed: false }
    }),

  // ─── Get vote counts for a comment ───
  getVotes: os
    .$context<Ctx>()
    .input(z.object({ comment_id: z.string().min(1) }))
    .handler(async ({ input }) => {
      const upvotes = await prisma.commentVote.count({
        where: {
          comment_id: input.comment_id,
          vote_type: 'upvote',
        },
      })

      const downvotes = await prisma.commentVote.count({
        where: {
          comment_id: input.comment_id,
          vote_type: 'downvote',
        },
      })

      return { upvotes, downvotes }
    }),

  // ─── Get current user's vote for a comment ───
  getUserVote: optionalAuthProcedure
    .input(z.object({ comment_id: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const session = context.user
      const userId = session?.id ?? null

      const vote = await prisma.commentVote.findFirst({
        where: {
          comment_id: input.comment_id,
          user_id: userId,
        },
      })

      return { vote_type: vote?.vote_type ?? null }
    }),
}
