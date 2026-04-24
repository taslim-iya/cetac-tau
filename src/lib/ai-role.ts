import { id } from './utils';
import type { RolePlaybook, PlaybookTask, PlaybookKPI, PlaybookSOP } from '../data/playbook-data';

const t = (item: string): PlaybookTask => ({ id: id(), item, status: 'open', notes: '' });
const k = (kpi: string, target: string): PlaybookKPI => ({ id: id(), kpi, target, actual: '', status: 'not_started' });
const s = (item: string): PlaybookSOP => ({ id: id(), item });

/**
 * Use AI to find the most similar existing playbook for a new role.
 * Returns the best match playbook or null if none are similar enough.
 */
export async function findSimilarPlaybook(
  newRole: string,
  existingPlaybooks: RolePlaybook[]
): Promise<RolePlaybook | null> {
  if (existingPlaybooks.length === 0) return null;

  const roleList = existingPlaybooks.map(p => p.role);

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `You are matching roles for a student society (Cambridge ETA Club — Entrepreneurship Through Acquisition).

New role: "${newRole}"

Existing roles:
${roleList.map((r, i) => `${i}: ${r}`).join('\n')}

Which existing role is most similar to "${newRole}"? Consider:
- Similar responsibilities (e.g. "VP Partnerships" ~ "Head of Partnerships")
- Similar domains (e.g. "Content Lead" ~ "VP Communications")
- Overlapping scope (e.g. "Events Coordinator" ~ "VP Events & Administration")

Respond with ONLY a JSON object:
{"index": <number or -1 if none are similar>, "confidence": <0-100>, "reason": "<brief reason>"}

Use -1 if the new role is genuinely unique with no close match (confidence < 40).` }],
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 200,
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.index >= 0 && parsed.index < existingPlaybooks.length && parsed.confidence >= 40) {
        return existingPlaybooks[parsed.index];
      }
    }
  } catch (e) {
    console.error('AI similarity match failed:', e);
  }
  return null;
}

/**
 * Use AI to match team members to a playbook based on role similarity.
 * Returns names of team members whose roles are similar to the playbook role.
 */
export async function matchTeamToPlaybook(
  playbookRole: string,
  teamMembers: { name: string; role: string }[]
): Promise<string[]> {
  if (teamMembers.length === 0) return [];

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `You are matching team members to role playbooks for a student society (Cambridge ETA Club).

Playbook role: "${playbookRole}"

Team members:
${teamMembers.map(m => `- ${m.name}: ${m.role}`).join('\n')}

Which team members have roles similar enough to "${playbookRole}" that they should see this playbook?
Consider partial matches (e.g. "VP Partnerships - External" should match "Partnerships" playbook).
A member with role "Member" or no specific role should NOT match unless the playbook is very general.

Respond with ONLY a JSON array of matching member names: ["Name1", "Name2"]
Return [] if no good matches.` }],
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 300,
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      const names = JSON.parse(arrMatch[0]);
      // Validate against actual team member names
      return names.filter((n: string) => teamMembers.some(m => m.name.toLowerCase() === n.toLowerCase()));
    }
  } catch (e) {
    console.error('AI team matching failed:', e);
  }
  return [];
}

/**
 * Generate a playbook for a new role using AI (GPT-4o-mini).
 * If a similar playbook exists, uses it as a template/reference.
 * Falls back to a sensible template if AI fails.
 */
export async function generatePlaybookForRole(
  roleName: string,
  existingPlaybooks?: RolePlaybook[]
): Promise<RolePlaybook> {
  // Find similar existing playbook to use as reference
  let similarPb: RolePlaybook | null = null;
  if (existingPlaybooks && existingPlaybooks.length > 0) {
    similarPb = await findSimilarPlaybook(roleName, existingPlaybooks);
  }

  const referenceContext = similarPb
    ? `\n\nA similar role "${similarPb.role}" already exists with this structure:
- Reports to: ${similarPb.reportsTo}
- Deputy: ${similarPb.deputy}
- Weekly target: ${similarPb.primaryWeeklyTarget}
- Term KPI: ${similarPb.primaryTermKPI}
- Daily tasks: ${similarPb.dailyCadence.map(t => t.item).join('; ')}
- Weekly tasks: ${similarPb.weeklyCadence.map(t => t.item).join('; ')}
- KPIs: ${similarPb.kpis.map(k => `${k.kpi} (${k.target})`).join('; ')}

Use this as a reference but ADAPT it for "${roleName}". Keep relevant items, modify scope-specific ones, and add anything unique to the new role.`
    : '';

  const prompt = `You are creating a role playbook for the Cambridge ETA Club (a student society for Entrepreneurship Through Acquisition at Cambridge Judge Business School).

Role: "${roleName}"${referenceContext}

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
        notes: similarPb ? `Adapted from "${similarPb.role}" playbook` : '',
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
