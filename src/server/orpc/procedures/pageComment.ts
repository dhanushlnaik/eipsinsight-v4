import { os, ORPCError, optionalAuthProcedure, type Ctx } from './types'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import * as z from 'zod'

async function requireAdmin(context: Ctx) {
  const session = await auth.api.getSession({ headers: context.headers })
  if (!session?.user) {
    throw new ORPCError('UNAUTHORIZED', { message: 'You must be logged in' })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (!user || user.role !== 'admin') {
    throw new ORPCError('FORBIDDEN', { message: 'Admin access required' })
  }
  return session
}

const commentSchema = z.object({
  page_path: z.string().min(1),
  parent_id: z.string().optional().nullable(),
  content: z.string().min(1).max(3000),
  is_anonymous: z.boolean().optional().default(false),
})

export const pageCommentProcedures = {
  // ─── Create comment (auth optional) ───
  createComment: optionalAuthProcedure
    .input(commentSchema)
    .handler(async ({ input, context }) => {
      const session = context.user
      const userId = session?.id ?? null

      // Validate parent comment exists if parent_id provided
      if (input.parent_id) {
        const parent = await prisma.pageComment.findUnique({
          where: { id: input.parent_id },
        })
        if (!parent) {
          throw new ORPCError('NOT_FOUND', { message: 'Parent comment not found' })
        }
        if (parent.deleted_at !== null) {
          throw new ORPCError('BAD_REQUEST', { message: 'Cannot reply to deleted comment' })
        }
      }

      const comment = await prisma.pageComment.create({
        data: {
          page_path: input.page_path,
          parent_id: input.parent_id ?? null,
          content: input.content,
          is_anonymous: input.is_anonymous,
          user_id: userId,
        },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          replies: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      })

      return {
        id: comment.id,
        page_path: comment.page_path,
        parent_id: comment.parent_id,
        content: comment.content,
        is_anonymous: comment.is_anonymous,
        user_name: comment.is_anonymous ? null : comment.user?.name ?? 'Anonymous',
        user_image: comment.is_anonymous ? null : comment.user?.image ?? null,
        created_at: comment.created_at,
        reply_count: comment.replies.length,
      }
    }),

  // ─── List comments by page (public) ───
  listCommentsByPage: os
    .$context<Ctx>()
    .input(
      z.object({
        page_path: z.string().min(1),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .handler(async ({ input }) => {
      const comments = await prisma.pageComment.findMany({
        where: {
          page_path: input.page_path,
          deleted_at: null,
          parent_id: null, // Only root comments
        },
        orderBy: { created_at: 'desc' },
        take: input.limit,
        skip: input.offset,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          replies: {
            where: { deleted_at: null },
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
            orderBy: { created_at: 'asc' },
          },
        },
      })

      const total = await prisma.pageComment.count({
        where: {
          page_path: input.page_path,
          deleted_at: null,
          parent_id: null,
        },
      })

      return {
        comments: comments.map((c) => ({
          id: c.id,
          page_path: c.page_path,
          content: c.content,
          is_anonymous: c.is_anonymous,
          user_name: c.is_anonymous ? null : c.user?.name ?? 'Anonymous',
          user_image: c.is_anonymous ? null : c.user?.image ?? null,
          created_at: c.created_at,
          replies: c.replies.map((r) => ({
            id: r.id,
            parent_id: r.parent_id,
            content: r.content,
            is_anonymous: r.is_anonymous,
            user_name: r.is_anonymous ? null : r.user?.name ?? 'Anonymous',
            user_image: r.is_anonymous ? null : r.user?.image ?? null,
            created_at: r.created_at,
          })),
        })),
        total,
      }
    }),

  // ─── Delete comment (admin OR comment owner) ───
  deleteComment: os
    .$context<Ctx>()
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const session = await auth.api.getSession({ headers: context.headers })
      if (!session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'You must be logged in to delete a comment' })
      }

      const comment = await prisma.pageComment.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { id: true } },
        },
      })

      if (!comment) {
        throw new ORPCError('NOT_FOUND', { message: 'Comment not found' })
      }

      // Check if user is admin or comment owner
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })

      const isAdmin = user?.role === 'admin'
      const isOwner = comment.user_id === session.user.id

      if (!isAdmin && !isOwner) {
        throw new ORPCError('FORBIDDEN', { message: 'You can only delete your own comments' })
      }

      // Soft delete: set deleted_at
      await prisma.pageComment.update({
        where: { id: input.id },
        data: { deleted_at: new Date() },
      })

      return { ok: true }
    }),
}
