/**
 * SkillSpring course detail — objectives, sample lesson previews,
 * enrollment card. Sample content clearly labeled.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, PlayCircle, Clock, Layers,
  MonitorPlay, Infinity as InfinityIcon, ShieldCheck, Lock,
} from 'lucide-react';
import { COURSES, getCourse } from '../../courses';

export function generateStaticParams() {
  return COURSES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCourse(id);
  return {
    title: `${c.name} — SkillSpring`,
    description: c.desc,
  };
}

export default async function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = COURSES.find((c) => c.id === id);
  if (!course) notFound();

  return (
    <div className="ss-detail">
      <div className="ss-detail__grid">
        <div>
          <Link href="/apps/skillspring" className="ss-backlink">
            <ArrowLeft size={16} /> Back to SkillSpring
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            <span className="ss-eyebrow">{course.cat}</span>
            <span className="ss-demo">Sample course</span>
          </div>
          <h1 className="ss-display">{course.name}</h1>
          <p className="ss-detail__desc">{course.desc}</p>

          <div className="ss-glass ss-obj">
            <h2>What you&apos;ll be able to do</h2>
            <ul>
              {course.objectives.map((o) => (
                <li key={o}><Check size={18} /> <span>{o}</span></li>
              ))}
            </ul>
          </div>

          <div className="ss-glass ss-lessons">
            <h2>Sample lesson previews</h2>
            {course.lessons.map((l, i) => (
              <div key={l.t} className="ss-lesson">
                <span className="ss-lesson__n">{i + 1}</span>
                <span className="ss-lesson__t">{l.t}</span>
                <span className="ss-lesson__d">{l.d}</span>
                <PlayCircle size={18} style={{ color: 'var(--ss-purple-deep)' }} />
              </div>
            ))}
            <p style={{ fontSize: 13, color: 'var(--ss-muted)', margin: '14px 0 0', lineHeight: 1.6 }}>
              Sample previews only — no video content is delivered in this demo.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--ss-muted)' }}>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Layers size={15} /> {course.level}</span>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><MonitorPlay size={15} /> {course.format}</span>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Clock size={15} /> {course.duration}</span>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><InfinityIcon size={15} /> Lifetime access</span>
          </div>
        </div>

        <aside className="ss-glass ss-enrollcard" aria-label="Enroll in this course">
          <h3>Enroll in this course</h3>
          <div className="ss-feature__meta" style={{ margin: '0 0 6px' }}>
            <span className="ss-meta">{course.level}</span>
            <span className="ss-meta">{course.modules} modules</span>
            <span className="ss-meta">{course.duration}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '14px 0 4px' }}>
            <span className="ss-price">${course.price}</span>
            <span style={{ fontSize: 13.5, color: 'var(--ss-muted)' }}>one-time · no subscription</span>
          </div>
          <ul className="ss-includes">
            {course.includes.map((inc) => (
              <li key={inc}><Check size={16} /> {inc}</li>
            ))}
          </ul>
          <Link
            href={`/apps/skillspring/enroll?course=${course.id}`}
            className="ss-btn"
            style={{ width: '100%' }}
          >
            Enroll now <ArrowRight size={17} />
          </Link>
          <div className="ss-secure">
            <ShieldCheck size={15} /> <span>Secure checkout via Stripe · <strong>Test mode</strong> — no real charge</span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ss-muted)', margin: '12px 0 0', lineHeight: 1.6 }}>
            Sample course for demonstration. No instructors are named and no
            outcomes are promised.
          </p>
        </aside>
      </div>
    </div>
  );
}
