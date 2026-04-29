/**
 * Master (Guru) dynamic lesson page.
 *
 * The Guru curriculum (guru-01 … guru-10) renders here.
 */

import JourneyLessonClient from '../../../../components/JourneyLessonClient';

const GURU_LESSON_IDS = [
  'guru-01-raga-id-advanced',
  'guru-02-bandish',
  'guru-03-bhairavi',
  'guru-04-modulation',
  'guru-05-taan',
  'guru-06-kedar-hameer',
  'guru-07-sohini-marwa',
  'guru-08-raga-rendering',
  'guru-09-teaching',
  'guru-10-open-mastery',
];

export function generateStaticParams() {
  return GURU_LESSON_IDS.map((id) => ({ id }));
}

export default async function GuruLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JourneyLessonClient lessonId={id} exitPath="/journeys/master" />;
}
