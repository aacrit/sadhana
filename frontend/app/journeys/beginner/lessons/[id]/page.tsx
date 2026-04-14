/**
 * Dynamic lesson page (server component).
 *
 * Exports generateStaticParams for static export, then renders
 * the client-side LessonClient with the lesson ID.
 */

import LessonClient from './LessonClient';

const BEGINNER_LESSON_IDS = [
  'beginner-01-bhoopali',
  'beginner-02-sa-pa-drone',
  'beginner-03-yaman',
  'beginner-04-bhairav',
  'beginner-05-bhimpalasi',
  'beginner-06-bageshri',
  'beginner-07-consolidation',
  'beginner-08-challenge',
];

export function generateStaticParams() {
  return BEGINNER_LESSON_IDS.map((id) => ({ id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LessonClient lessonId={id} />;
}
