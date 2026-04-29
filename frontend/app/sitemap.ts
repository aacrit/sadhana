/**
 * Static sitemap for the Sādhanā static export (audit #5).
 *
 * Lists every prerendered route so search engines can discover the
 * journey homes, every lesson, the Scholar reference table, and the
 * legal pages. The lesson list mirrors the catalogs in the journey
 * pages — keep in sync when adding a new lesson YAML.
 */

import type { MetadataRoute } from 'next';

// Required for `output: 'export'` static export
export const dynamic = 'force-static';

const SITE_URL = 'https://aacrit.github.io/sadhana';

const BEGINNER_LESSONS = [
  'beginner-01-bhoopali',
  'beginner-02-sa-pa-drone',
  'beginner-03-yaman',
  'beginner-04-bhairav',
  'beginner-05-bhimpalasi',
  'beginner-06-bageshri',
  'beginner-07-consolidation',
  'beginner-08-challenge',
];

const SADHAKA_LESSONS = [
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

const VARISTHA_LESSONS = [
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

const GURU_LESSONS = [
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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const journeyHomes = [
    { url: `${SITE_URL}/`, priority: 1.0 },
    { url: `${SITE_URL}/journeys/beginner/`, priority: 0.9 },
    { url: `${SITE_URL}/journeys/explorer/`, priority: 0.9 },
    { url: `${SITE_URL}/journeys/scholar/`, priority: 0.9 },
    { url: `${SITE_URL}/journeys/master/`, priority: 0.9 },
    { url: `${SITE_URL}/journeys/freeform/`, priority: 0.8 },
    { url: `${SITE_URL}/journeys/explorer/ear-training/`, priority: 0.7 },
    { url: `${SITE_URL}/journeys/explorer/interval-training/`, priority: 0.7 },
    { url: `${SITE_URL}/journeys/scholar/reference/`, priority: 0.8 },
  ];

  const lessons = [
    ...BEGINNER_LESSONS.map((id) => ({ url: `${SITE_URL}/journeys/beginner/lessons/${id}/`, priority: 0.6 })),
    ...SADHAKA_LESSONS.map((id) => ({ url: `${SITE_URL}/journeys/explorer/lessons/${id}/`, priority: 0.6 })),
    ...VARISTHA_LESSONS.map((id) => ({ url: `${SITE_URL}/journeys/scholar/lessons/${id}/`, priority: 0.6 })),
    ...GURU_LESSONS.map((id) => ({ url: `${SITE_URL}/journeys/master/lessons/${id}/`, priority: 0.6 })),
  ];

  const auxiliary = [
    { url: `${SITE_URL}/legal/privacy/`, priority: 0.3 },
    { url: `${SITE_URL}/legal/terms/`, priority: 0.3 },
    { url: `${SITE_URL}/auth/`, priority: 0.4 },
  ];

  return [...journeyHomes, ...lessons, ...auxiliary].map(({ url, priority }) => ({
    url,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority,
  }));
}
