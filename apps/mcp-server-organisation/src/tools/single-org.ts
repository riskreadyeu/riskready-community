import { prisma } from '#src/prisma.js';

export async function getSingleOrganisation<T>(select?: T) {
  const organisations = await prisma.organisationProfile.findMany({
    ...(select ? { select } : {}),
    orderBy: { createdAt: 'asc' },
    take: 2,
  });

  if (organisations.length === 0) {
    return null;
  }

  if (organisations.length > 1) {
    throw new Error(
      'Single-organisation mode supports exactly one organisation profile. Multiple organisations were found.',
    );
  }

  return organisations[0] as any;
}
