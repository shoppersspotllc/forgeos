/**
 * SkillSpring — flagship landing.
 * Cinematic editorial hero · course catalog · categories · how it works ·
 * detail split · FAQ. Sample courses clearly labeled as demo content.
 */
import Link from 'next/link';
import {
  GraduationCap, ArrowRight, Check, Clock, Infinity as InfinityIcon, PlayCircle,
  ChevronDown, ShieldCheck, Sparkles, Briefcase, Megaphone, Cpu, Layers,
} from 'lucide-react';
import NavBar from './components/NavBar';
import HeroScene from './components/HeroScene';
import Reveal from './components/Reveal';
import Tilt from './components/Tilt';
import { COURSES, CATS } from './courses';

export const metadata = {
  title: 'SkillSpring — Learn Something Real',
  description:
    'Premium learning, courses, and specialist coaching. Sample courses for demonstration. Test mode — no real enrollments.',
};

const CAT_ICONS: Record<string, typeof Briefcase> = {
  Business: Briefcase,
  Marketing: Megaphone,
  Engineering: Cpu,
};

const FAQS = [
  {
    q: 'Are these real courses?',
    a: 'No. SkillSpring is a demonstration learning platform — the courses, descriptions, instructors (none are named), and lesson previews are sample content for showcasing the enrollment experience. No real course access is granted and no outcomes are promised.',
  },
  {
    q: 'How does enrollment work?',
    a: 'Choose a course, review the details, and check out securely. In test mode, checkout uses Stripe test cards only — no real payment can occur and no course content is unlocked.',
  },
  {
    q: 'Are prices one-time or recurring?',
    a: 'All three sample courses are one-time purchases — pay once, keep lifetime access. Prices are always confirmed server-side at checkout; nothing here is a subscription.',
  },
  {
    q: 'Who teaches the courses?',
    a: 'Nobody real — these are sample courses, so no instructors, qualifications, or student results are claimed. A live SkillSpring would list verified practitioner bios here.',
  },
];

export default function SkillSpringHome() {
  return (
    <>
      <NavBar />

      {/* ============ CINEMATIC HERO ============ */}
      <header className="ss-hero">
        <div
          className="ss-hero__bg"
          style={{ backgroundImage: "url('/apps/skillspring/hero.jpg')" }}
          role="img"
          aria-label="Elegant study desk with open book and warm lamplight"
        />
        <div className="ss-hero__scrim" />
        <HeroScene />
        <div className="ss-hero__content">
          <div>
            <Reveal immediate>
              <span className="ss-eyebrow" style={{ color: '#c4b5fd' }}>
                Premium learning, reimagined
              </span>
            </Reveal>
            <Reveal immediate delay={120}>
              <h1 className="ss-display">
                Master the craft.
                <br />
                <span className="ss-accent">On your schedule.</span>
              </h1>
            </Reveal>
            <Reveal immediate delay={240}>
              <p className="ss-hero__sub">
                SkillSpring is a premium learning platform — focused courses,
                clear learning objectives, and specialist coaching. Browse the
                sample catalog and see how enrollment works.
              </p>
            </Reveal>
            <Reveal immediate delay={360}>
              <div className="ss-hero__ctas">
                <Link href="/apps/skillspring/enroll" className="ss-btn">
                  Browse courses <ArrowRight size={18} />
                </Link>
                <a href="#courses" className="ss-btn ss-btn--ghost">
                  <PlayCircle size={18} /> Preview a lesson
                </a>
              </div>
            </Reveal>
            <Reveal immediate delay={480}>
              <div className="ss-hero__proof">
                <span className="ss-chip"><Layers size={15} /> Structured curricula</span>
                <span className="ss-chip"><Clock size={15} /> Self-paced</span>
                <span className="ss-chip"><InfinityIcon size={15} /> Lifetime access</span>
              </div>
            </Reveal>
          </div>

          <Reveal immediate delay={300}>
            <Tilt max={6}>
              <div className="ss-glass ss-feature">
                <div className="ss-feature__head">
                  <span className="ss-eyebrow" style={{ fontSize: 11 }}>Featured course</span>
                  <span className="ss-demo">Sample</span>
                </div>
                <h3>Master Negotiation</h3>
                <div className="ss-feature__meta">
                  <span className="ss-meta">Intermediate</span>
                  <span className="ss-meta">12 modules</span>
                  <span className="ss-meta">~8 hours</span>
                </div>
                <div className="ss-feature__lessons">
                  <div className="ss-feature__lesson"><PlayCircle size={16} /> The preparation checklist — sample lesson</div>
                  <div className="ss-feature__lesson"><PlayCircle size={16} /> Interests vs. positions — sample lesson</div>
                  <div className="ss-feature__lesson"><PlayCircle size={16} /> Handling the hard &ldquo;no&rdquo; — sample lesson</div>
                </div>
                <div className="ss-feature__foot">
                  <span className="ss-price">$99<small>one-time</small></span>
                  <Link href="/apps/skillspring/courses/negotiation" className="ss-btn ss-btn--dark ss-btn--sm">
                    View course <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </Tilt>
          </Reveal>
        </div>
        <div className="ss-scrollcue" aria-hidden="true">
          <span>Scroll</span>
          <span className="ss-scrollcue__line" />
        </div>
      </header>

      {/* ============ CATEGORIES ============ */}
      <section className="ss-section">
        <div className="ss-wrap">
          <Reveal>
            <div className="ss-section__head">
              <span className="ss-eyebrow">Categories</span>
              <h2 className="ss-display">Three fields, <em>deep</em> catalogs.</h2>
              <p>
                Every category is built around practitioner-level skills — not
                surface-level overviews. <span className="ss-demo">Sample catalog</span>
              </p>
            </div>
          </Reveal>
          <div className="ss-cats">
            {CATS.map((c, i) => {
              const Icon = CAT_ICONS[c];
              const course = COURSES.find((x) => x.cat === c)!;
              return (
                <Reveal key={c} delay={i * 100}>
                  <Tilt max={5}>
                    <Link href={`/apps/skillspring/courses/${course.id}`} className="ss-glass ss-cat" aria-label={`${c} courses — featured: ${course.name}`}>
                      <span className="ss-cat__icon"><Icon size={24} strokeWidth={2.2} /></span>
                      <h3>{c}</h3>
                      <p>{course.desc}</p>
                      <span className="ss-cat__link">Explore {c} <ArrowRight size={15} /></span>
                    </Link>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ COURSES ============ */}
      <section id="courses" className="ss-section" style={{ paddingTop: 0 }}>
        <div className="ss-wrap">
          <Reveal>
            <div className="ss-section__head">
              <span className="ss-eyebrow">The catalog</span>
              <h2 className="ss-display">Courses worth your <em>evenings.</em></h2>
              <p>
                Honest descriptions, clear levels, real durations — no fluff.
                <span className="ss-demo">Sample courses</span> for demonstration;
                no instructors are named and no outcomes are promised.
              </p>
            </div>
          </Reveal>
          <div className="ss-courses">
            {COURSES.map((c, i) => (
              <Reveal key={c.id} delay={(i % 3) * 100}>
                <Tilt max={5}>
                  <article className="ss-glass ss-course" aria-label={`${c.name}, $${c.price} one-time`}>
                    <div className="ss-course__cat">{c.cat}</div>
                    <h3>{c.name}</h3>
                    <p>{c.desc}</p>
                    <div className="ss-course__facts">
                      <span><Layers size={14} /> {c.level}</span>
                      <span><Clock size={14} /> {c.duration}</span>
                      <span><PlayCircle size={14} /> {c.modules} modules</span>
                    </div>
                    <div className="ss-course__foot">
                      <span className="ss-price">${c.price}<small>one-time</small></span>
                      <Link
                        href={`/apps/skillspring/courses/${c.id}`}
                        className="ss-btn ss-btn--sm"
                        aria-label={`View ${c.name}`}
                      >
                        View course <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                </Tilt>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <p style={{ marginTop: 24, fontSize: 13.5, color: 'var(--ss-muted)', lineHeight: 1.7 }}>
              <Sparkles size={14} style={{ verticalAlign: -2, color: 'var(--ss-purple-deep)' }} />{' '}
              Sample catalog — courses, descriptions, and prices are illustrative.
              Final pricing is always confirmed server-side at checkout.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="ss-band ss-section">
        <div className="ss-wrap" style={{ position: 'relative' }}>
          <Reveal>
            <div className="ss-section__head">
              <span className="ss-eyebrow" style={{ color: '#c4b5fd' }}>How it works</span>
              <h2 className="ss-display" style={{ color: '#fff' }}>From curious to <em>capable.</em></h2>
              <p style={{ color: 'rgba(245,240,255,.7)' }}>
                A learning loop designed around retention — not just completion
                percentages.
              </p>
            </div>
          </Reveal>
          <div className="ss-steps">
            {[
              { t: 'Pick your course', d: 'Clear levels and durations help you choose honestly — no bait, no upsells.' },
              { t: 'Learn in modules', d: 'Short, focused lessons with practice checkpoints built into every module.' },
              { t: 'Apply the craft', d: 'Worksheets and scenarios turn concepts into working skill, not trivia.' },
              { t: 'Get coached', d: 'Specialist coaching sessions go deeper on the topics that matter to you.' },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 100}>
                <div className="ss-glass ss-glass--dark ss-step">
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DETAIL SPLIT ============ */}
      <section className="ss-section">
        <div className="ss-wrap">
          <div className="ss-split">
            <Reveal>
              <div className="ss-split__img">
                <img
                  src="/apps/skillspring/detail.jpg"
                  alt="Hands writing in a notebook with a fountain pen in soft light"
                  loading="lazy"
                />
              </div>
            </Reveal>
            <div>
              <Reveal delay={100}>
                <span className="ss-eyebrow">Why SkillSpring</span>
                <h2 className="ss-display" style={{ fontSize: 'clamp(30px, 3.8vw, 48px)', margin: '18px 0 14px' }}>
                  Learning, treated as a <em>craft.</em>
                </h2>
                <p className="ss-lede" style={{ margin: 0 }}>
                  Built for people who take their skills seriously — clear
                  objectives, honest scope, and material you will actually finish.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <ul className="ss-checklist">
                  <li><ShieldCheck size={19} /> <span><strong>Honest catalog.</strong> Levels, durations, and formats are stated upfront — what you read is what you get.</span></li>
                  <li><Check size={19} /> <span><strong>Objectives first.</strong> Every course lists exactly what you will be able to do when you finish.</span></li>
                  <li><GraduationCap size={19} /> <span><strong>Specialist coaching.</strong> Go beyond the videos with focused 1:1 sessions on your toughest topics.</span></li>
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="ss-section" style={{ paddingTop: 0 }}>
        <div className="ss-wrap">
          <Reveal>
            <div className="ss-section__head" style={{ textAlign: 'center', marginInline: 'auto' }}>
              <span className="ss-eyebrow" style={{ justifyContent: 'center' }}>Questions</span>
              <h2 className="ss-display">Good to know.</h2>
            </div>
          </Reveal>
          <div className="ss-faq">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <details>
                  <summary>
                    {f.q}
                    <ChevronDown size={19} />
                  </summary>
                  <p className="ss-a">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="ss-section" style={{ paddingTop: 0 }}>
        <div className="ss-wrap">
          <Reveal>
            <div className="ss-cta">
              <h2 className="ss-display">Your next skill is <em>waiting.</em></h2>
              <p>
                Browse the sample catalog, preview a lesson outline, and see how
                enrollment works. Test mode — no real enrollments, no real charges.
              </p>
              <Link href="/apps/skillspring/enroll" className="ss-btn" style={{ fontSize: 17, padding: '18px 40px' }}>
                Start learning <ArrowRight size={19} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="ss-footer">
        <div className="ss-footer__inner">
          <Link href="/apps/skillspring" className="ss-brand" style={{ color: '#fff', fontSize: 17 }}>
            <span className="ss-brand__mark"><GraduationCap size={17} strokeWidth={2.4} /></span>
            SkillSpring
          </Link>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <Link href="/apps/skillspring/enroll">Enroll</Link>
            <a href="#courses">Courses</a>
            <a href="#faq">FAQ</a>
          </div>
          <span className="ss-testmode">Test mode · No live payments</span>
        </div>
        <div className="ss-footer__inner" style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.08)', fontSize: 12.5 }}>
          <span>© 2026 SkillSpring. Demonstration learning platform.</span>
          <span>Sample courses — no instructors named, no outcomes promised.</span>
        </div>
      </footer>
    </>
  );
}
