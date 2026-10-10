/**
 * SkillSpring shared course catalog.
 * SAMPLE courses for demonstration — no instructors are named or implied,
 * and no outcomes, enrollments, or testimonials are claimed.
 */
export type Course = {
  id: string;
  name: string;
  price: number; // USD, one-time
  cat: string;
  level: string;
  format: string;
  duration: string;
  modules: number;
  desc: string;
  objectives: string[];
  lessons: Array<{ t: string; d: string }>;
  includes: string[];
};

export const COURSES: Course[] = [
  {
    id: 'negotiation',
    name: 'Master Negotiation',
    price: 99,
    cat: 'Business',
    level: 'Intermediate',
    format: 'Self-paced video',
    duration: '~8 hours',
    modules: 12,
    desc: 'Negotiation frameworks, preparation checklists, and practice scenarios — from first offer to final handshake.',
    objectives: [
      'Prepare for a negotiation with a structured research checklist',
      'Apply interest-based frameworks to find tradeable terms',
      'Handle common objections and high-pressure tactics calmly',
      'Design a walk-away point and stick to it',
    ],
    lessons: [
      { t: 'The preparation checklist', d: 'Sample lesson · 12 min' },
      { t: 'Interests vs. positions', d: 'Sample lesson · 18 min' },
      { t: 'Handling the hard "no"', d: 'Sample lesson · 15 min' },
    ],
    includes: ['12 video modules', 'Practice scenario worksheets', 'Lifetime access'],
  },
  {
    id: 'copywriting',
    name: 'Conversion Copywriting',
    price: 79,
    cat: 'Marketing',
    level: 'Beginner-friendly',
    format: 'Self-paced video',
    duration: '~5 hours',
    modules: 8,
    desc: 'Headlines, hooks, and landing-page copy with reusable templates you can apply to your very next project.',
    objectives: [
      'Write headlines that earn the next sentence',
      'Structure a landing page that guides readers to act',
      'Edit your own drafts with a conversion checklist',
      'Adapt proven templates without sounding generic',
    ],
    lessons: [
      { t: 'The anatomy of a headline', d: 'Sample lesson · 10 min' },
      { t: 'Landing pages that convert', d: 'Sample lesson · 22 min' },
      { t: 'The editing pass', d: 'Sample lesson · 14 min' },
    ],
    includes: ['8 video modules', 'Copy template library', 'Lifetime access'],
  },
  {
    id: 'sysdesign',
    name: 'System Design Mastery',
    price: 149,
    cat: 'Engineering',
    level: 'Advanced',
    format: 'Self-paced video',
    duration: '~14 hours',
    modules: 15,
    desc: 'Distributed systems concepts for senior engineers — scaling, consistency, and the trade-offs in between.',
    objectives: [
      'Decompose a real-world system into scalable components',
      'Reason about consistency, availability, and partition trade-offs',
      'Estimate capacity and choose storage for a workload',
      'Communicate design decisions clearly under time pressure',
    ],
    lessons: [
      { t: 'Scaling patterns, visualized', d: 'Sample lesson · 16 min' },
      { t: 'Consistency models explained', d: 'Sample lesson · 24 min' },
      { t: 'Design review walkthrough', d: 'Sample lesson · 20 min' },
    ],
    includes: ['15 video modules', 'Architecture diagram pack', 'Lifetime access'],
  },
];

export const CATS = ['Business', 'Marketing', 'Engineering'];

export function getCourse(id: string | null): Course {
  return COURSES.find((c) => c.id === id) ?? COURSES[0];
}
