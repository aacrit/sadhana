/**
 * Explorer (Sadhaka) dynamic lesson page.
 *
 * The Sadhaka curriculum (sadhaka-01 … sadhaka-10) renders here. Each YAML
 * declares `journey: explorer` in its frontmatter; the rendering is
 * journey-agnostic — JourneyLessonClient handles loading, the engine, and
 * persistence.
 */

import JourneyLessonClient from '../../../../components/JourneyLessonClient';

const SADHAKA_LESSON_IDS = [
  'sadhaka-01-desh',
  'sadhaka-02-meend',
  'sadhaka-03-andolan',
  'sadhaka-04-kafi',
  'sadhaka-05-teentaal',
  'sadhaka-06-grammar',
  'sadhaka-07-gamak',
  'sadhaka-08-call-response',
  'sadhaka-09-intervals',
  'sadhaka-10-challenge',
];

export function generateStaticParams() {
  return SADHAKA_LESSON_IDS.map((id) => ({ id }));
}

export default async function SadhakaLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JourneyLessonClient lessonId={id} exitPath="/journeys/explorer" />;
}
