'use client';

/**
 * LessonClient — thin journey-specific wrapper around JourneyLessonClient.
 *
 * The shared lesson-runner component lives in
 * `frontend/app/components/JourneyLessonClient.tsx`. Each journey passes its
 * own `exitPath` so the back-link goes to the right catalog.
 */

import JourneyLessonClient from '../../../../components/JourneyLessonClient';

export default function LessonClient({ lessonId }: { lessonId: string }) {
  return <JourneyLessonClient lessonId={lessonId} exitPath="/journeys/beginner" />;
}
