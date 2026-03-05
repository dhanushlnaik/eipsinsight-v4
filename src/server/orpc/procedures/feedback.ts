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

const feedbackSchema = z.object({
  page_path: z.string().min(1),
  category: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  content: z.string().min(1).max(3000),
  is_anonymous: z.boolean().optional().default(false),
  github_name: z.string().optional().nullable(),
})

const feedbackStatusEnum = z.enum(['new', 'in-review', 'resolved'])

export const feedbackProcedures = {
  // ─── Create feedback (public, auth optional) ───
  createFeedback: optionalAuthProcedure
    .input(feedbackSchema)
    .handler(async ({ input, context }) => {
      const session = context.user
      const userId = session?.id ?? null

      const feedback = await prisma.feedback.create({
        data: {
          page_path: input.page_path,
          category: input.category,
          severity: input.severity,
          content: input.content,
          is_anonymous: input.is_anonymous,
          github_name: input.github_name || null,
          user_id: userId,
          status: 'new',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      return {
        id: feedback.id,
        page_path: feedback.page_path,
        category: feedback.category,
        severity: feedback.severity,
        content: feedback.content,
        status: feedback.status,
        is_anonymous: feedback.is_anonymous,
        github_name: feedback.github_name,
        created_at: feedback.created_at,
      }
    }),

  // ─── List feedback for a page (public) ───
  listFeedbackByPage: os
    .$context<Ctx>()
    .input(
      z.object({
        page_path: z.string().min(1),
        limit: z.number().min(1).max(50).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .handler(async ({ input }) => {
      const feedbacks = await prisma.feedback.findMany({
        where: {
          page_path: input.page_path,
          deleted_at: null,
        },
        orderBy: { created_at: 'desc' },
        take: input.limit,
        skip: input.offset,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      })

      const total = await prisma.feedback.count({
        where: {
          page_path: input.page_path,
          deleted_at: null,
        },
      })

      return {
        feedbacks: feedbacks.map((f) => ({
          id: f.id,
          page_path: f.page_path,
          category: f.category,
          severity: f.severity,
          content: f.content,
          status: f.status,
          is_anonymous: f.is_anonymous,
          user_name: f.is_anonymous ? null : f.user?.name ?? 'Anonymous',
          github_name: f.github_name,
          created_at: f.created_at,
        })),
        total,
      }
    }),

  // ─── List all feedback (admin only) ───
  listFeedbackAdmin: os
    .$context<Ctx>()
    .input(
      z.object({
        page_path: z.string().optional(),
        status: feedbackStatusEnum.optional(),
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .handler(async ({ input, context }) => {
      await requireAdmin(context)

      const where: Record<string, unknown> = {}
      if (input.page_path) {
        where.page_path = input.page_path
      }
      if (input.status) {
        where.status = input.status
      }

      const items = await prisma.feedback.findMany({
        where: where as any,
        orderBy: { created_at: 'desc' },
        take: input.limit,
        skip: input.offset,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      const total = await prisma.feedback.count({ where: where as any })

      return {
        items: items.map((f) => ({
          id: f.id,
          page_path: f.page_path,
          category: f.category,
          severity: f.severity,
          content: f.content,
          status: f.status,
          is_anonymous: f.is_anonymous,
          user_name: f.is_anonymous ? null : f.user?.name ?? null,
          user_email: f.is_anonymous ? null : f.user?.email ?? null,
          github_name: f.github_name,
          created_at: f.created_at,
        })),
        total,
      }
    }),

  // ─── Update feedback status (admin only) ───
  updateFeedbackStatus: os
    .$context<Ctx>()
    .input(
      z.object({
        id: z.string(),
        status: feedbackStatusEnum,
      }),
    )
    .handler(async ({ input, context }) => {
      await requireAdmin(context)

      const existing = await prisma.feedback.findUnique({
        where: { id: input.id },
      })

      if (!existing) {
        throw new ORPCError('NOT_FOUND', { message: 'Feedback not found' })
      }

      const updated = await prisma.feedback.update({
        where: { id: input.id },
        data: { status: input.status },
      })

      return {
        id: updated.id,
        status: updated.status,
      }
    }),

  // ─── Delete feedback (admin only) ───
  deleteFeedback: os
    .$context<Ctx>()
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      await requireAdmin(context)

      const existing = await prisma.feedback.findUnique({
        where: { id: input.id },
      })

      if (!existing) {
        throw new ORPCError('NOT_FOUND', { message: 'Feedback not found' })
      }

      await prisma.feedback.delete({ where: { id: input.id } })

      return { ok: true }
    }),
}
