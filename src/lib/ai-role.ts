import { id } from './utils';
import type { RolePlaybook, PlaybookTask, PlaybookKPI, PlaybookSOP } from '../data/playbook-data';

const t = (item: string): PlaybookTask => ({ id: id(), item, status: 'open', notes: '' });
const k = (kpi: string, target: string): PlaybookKPI => ({ id: id(), kpi, target, actual: '', status: 'not_started' });
const s = (item: string): PlaybookSOP => ({ id: id(), item });

/**
 * Generate a playbook for a new role using AI (GPT-4o-mini).
 * Falls back to a sensible template if AI fails.
 */
export async function generatePlaybookForRole(roleName: string): Promise<RolePlaybook> {
  const prompt = `You are creating a role playbook for the Cambridge ETA Club (a student society for Entrepreneurship Through Acquisition at Cambridge Judge Business School).

Role: "${roleName}"

Generate a JSON object with these fields:
- reportsTo: who this role reports to (e.g. "Co-Presidents", "VP Operations")
- deputy: who deputises (e.g. "Secretary", another role name)
- primaryWeeklyTarget: one-line weekly target
- primaryTermKPI: one-line term KPI
- dailyCadence: array of 3-5 daily task strings
- weeklyCadence: array of 3-5 weekly task strings
- monthlyCadence: array of 2-4 monthly task strings
- recommendedHabits: array of 2-3 habit strings
- weeklyTargets: array of 3-5 measurable weekly target strings
- kpis: array of objects with {kpi: string, target: string} (3-5 KPIs)
- sops: array of 1-3 standard operating procedure strings

Return ONLY valid JSON, no markdown fences.`;

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: id(),
        role: roleName,
        holder: 'Vacant',
        reportsTo: parsed.reportsTo || 'Co-Presidents',
        deputy: parsed.deputy || 'TBD',
        primaryWeeklyTarget: parsed.primaryWeeklyTarget || '',
        primaryTermKPI: parsed.primaryTermKPI || '',
        overallStatus: 'not_started',
        dailyCadence: (parsed.dailyCadence || []).map((i: string) => t(i)),
        weeklyCadence: (parsed.weeklyCadence || []).map((i: string) => t(i)),
        monthlyCadence: (parsed.monthlyCadence || []).map((i: string) => t(i)),
        recommendedHabits: (parsed.recommendedHabits || []).map((i: string) => t(i)),
        weeklyTargets: (parsed.weeklyTargets || []).map((i: string) => t(i)),
        kpis: (parsed.kpis || []).map((k2: any) => k(k2.kpi, k2.target)),
        sops: (parsed.sops || []).map((s2: string) => s(s2)),
        notes: '',
        assignedTo: [],
      };
    }
  } catch (e) {
    console.error('AI playbook generation failed:', e);
  }

  // Fallback template
  return {
    id: id(),
    role: roleName,
    holder: 'Vacant',
    reportsTo: 'Co-Presidents',
    deputy: 'TBD',
    primaryWeeklyTarget: `Complete key ${roleName.toLowerCase()} deliverables`,
    primaryTermKPI: `Achieve ${roleName.toLowerCase()} objectives for the term`,
    overallStatus: 'not_started',
    dailyCadence: [t('Check messages and respond'), t('Review task list'), t('Update progress in CETAC')],
    weeklyCadence: [t('Team sync meeting'), t('Weekly progress report'), t('Plan next week priorities')],
    monthlyCadence: [t('Monthly review with Co-Presidents'), t('Update KPIs')],
    recommendedHabits: [t('Document decisions'), t('Share updates in group chat')],
    weeklyTargets: [t('Complete assigned tasks'), t('Respond to all messages within 24h')],
    kpis: [k('Tasks completed on time', '90%'), k('Meeting attendance', '100%'), k('Deliverables shipped', '4/term')],
    sops: [s('Follow CETAC communication guidelines'), s('Update CRM after every interaction')],
    notes: '',
    assignedTo: [],
  };
}
