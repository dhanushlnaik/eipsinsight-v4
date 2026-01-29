import { redirect } from 'next/navigation';

export default async function PRAnalyticsMonthPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year, month } = await params;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    redirect('/analytics/prs');
  }
  redirect(`/analytics/prs?year=${y}&month=${m}`);
}
