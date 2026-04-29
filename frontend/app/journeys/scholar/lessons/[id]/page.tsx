/**
 * Scholar (Varistha) dynamic lesson page.
 *
 * The Varistha curriculum (varistha-01 … varistha-11) renders here.
 */

import JourneyLessonClient from '../../../../components/JourneyLessonClient';

const VARISTHA_LESSON_IDS = [
  'varistha-01-marwa',
  'varistha-02-raga-comparison',
  'varistha-03-darbari',
  'varistha-04-composition',
  'varistha-05-puriya-dhanashri',
  'varistha-06-ornament-mastery',
  'varistha-07-malkauns',
  'varistha-08-shruti',
  'varistha-09-todi',
  'varistha-10-tala-integration',
  'varistha-11-challenge',
];

export function generateStaticParams() {
  return VARISTHA_LESSON_IDS.map((id) => ({ id }));
}

export default async function VaristhaLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JourneyLessonClient lessonId={id} exitPath="/journeys/scholar" />;
}
