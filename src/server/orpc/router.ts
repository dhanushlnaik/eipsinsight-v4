import { authProcedures } from './procedures/auth'
import { analyticsProcedures } from './procedures/analytics'
import { governanceProcedures } from './procedures/governance'
import { governanceTimelineProcedures } from './procedures/governanceTimeline'
import { historicalProcedures } from './procedures/historical'
import { accountProcedures } from './procedures/account'

export const router = {
  auth: authProcedures,
  analytics: analyticsProcedures,
  governance: governanceProcedures,
  governanceTimeline: governanceTimelineProcedures,
  historical: historicalProcedures,
  account: accountProcedures,
}
