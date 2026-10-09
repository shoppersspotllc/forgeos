/**
 * ForgeOS Workforce Objectives — measurable outcomes per Dot
 *
 * Each Dot has a clear objective, measurable key results, and a task
 * template for execution. Constraints (holds, research-only) are
 * enforced here and surfaced in the dashboard.
 *
 * Priority: Young Money revenue opportunities + PinDrop preparation.
 * - PinDrop outreach: HELD (research/prep only, no contact)
 * - Quant: RESEARCH-ONLY (no trading, no signals, $0 exposure)
 */

export interface WorkforceObjective {
  dotName: string;
  emoji: string;
  role: string;
  objective: string;
  keyResults: string[];
  taskTemplate: string;
  constraints: string[];
  priority: 'high' | 'medium';
  category: 'Young Money' | "God's Eye" | 'Quant' | 'Platform';
}

export const WORKFORCE_OBJECTIVES: WorkforceObjective[] = [
  {
    dotName: 'Hunter',
    emoji: '🎯',
    role: 'Outreach Specialist',
    objective: 'Build qualified PinDrop lead list for Young Money partnerships',
    keyResults: [
      '10+ targets identified with URLs',
      'Relevance note per target (why this partner)',
      'Zero outreach — research only until authorized',
    ],
    taskTemplate:
      'PinDrop lead research (RESEARCH ONLY — do NOT contact anyone): Use your web-search tool to find {count} emerging AI agent platforms or AI startups that could be Young Money partnership targets. For each: name, URL, and one-line relevance note.',
    constraints: ['OUTREACH HELD — no contact, no emails, no calls', 'Research and list-building only'],
    priority: 'high',
    category: 'Young Money',
  },
  {
    dotName: 'Closer',
    emoji: '💰',
    role: 'Deal Closer',
    objective: 'Monitor AI startup funding landscape for deal intelligence',
    keyResults: [
      '2-3 recent funding deals per brief',
      'Deal amounts and sources where available',
      'No fabricated numbers — cite sources',
    ],
    taskTemplate:
      'Deal intelligence brief: Use your web-search tool to find the most recent AI startup funding rounds. Report 2-3 deals with company names, amounts (if disclosed), and sources.',
    constraints: ['Never invent deal sizes or valuations', 'Cite sources for every figure'],
    priority: 'high',
    category: 'Young Money',
  },
  {
    dotName: 'Craftsman',
    emoji: '🔨',
    role: 'Build Engineer',
    objective: 'Research implementation docs for Young Money platform features',
    keyResults: [
      'Actionable technical findings per brief',
      'Source URLs for all documentation',
      'No speculative APIs — verify existence',
    ],
    taskTemplate:
      'Technical research: Use your web-search and github-research tools to find {topic} documentation and implementation references. Report key findings with source URLs.',
    constraints: ['Verify APIs exist before recommending', 'No speculative integrations'],
    priority: 'high',
    category: 'Young Money',
  },
  {
    dotName: 'Shepherd',
    emoji: '🐑',
    role: 'Relationship Manager',
    objective: 'Track AI industry partnership and collaboration news',
    keyResults: [
      '2-3 relevant partnership items per brief',
      'Source URLs for each item',
    ],
    taskTemplate:
      'Partnership intelligence: Use your web-search tool to find recent AI industry partnerships, collaborations, or integrations. Report 2-3 items with sources.',
    constraints: ['Research only — no outreach'],
    priority: 'medium',
    category: 'Young Money',
  },
  {
    dotName: 'Scout',
    emoji: '🔍',
    role: 'Research Specialist',
    objective: "Deliver maritime intelligence briefs for God's Eye",
    keyResults: [
      '3+ sourced facts per brief',
      'Distinguish confirmed facts from unconfirmed reports',
    ],
    taskTemplate:
      "God's Eye investigation: Use your web-search and rss tools to research current maritime activity in {topic}. Report key facts with sources, distinguishing confirmed facts from unconfirmed reports.",
    constraints: ['Distinguish facts from hypotheses', 'Cite sources'],
    priority: 'medium',
    category: "God's Eye",
  },
  {
    dotName: 'Analyst',
    emoji: '📊',
    role: 'Data Analyst',
    objective: 'Maintain Quant market intelligence (research-only)',
    keyResults: [
      'Price data with 2+ sources per brief',
      'No trading signals or recommendations',
      '$0 financial exposure maintained',
    ],
    taskTemplate:
      'Quant market brief (RESEARCH ONLY — no trading signals, no recommendations): Use your web-search tool to find the current {asset} price and recent market news. Report facts with sources only.',
    constraints: [
      'RESEARCH ONLY — never give trading signals',
      'Never recommend buys, sells, or positions',
      'Quant stays in RESEARCH_HOLD — $0 at risk',
    ],
    priority: 'medium',
    category: 'Quant',
  },
];

export function getObjective(dotName: string): WorkforceObjective | undefined {
  return WORKFORCE_OBJECTIVES.find((o) => o.dotName === dotName);
}
