import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type OrganisationRecord = { id: string };

async function loadSingleOrganisation(
  prisma: Pick<PrismaService, 'organisationProfile'>,
): Promise<OrganisationRecord[]> {
  return prisma.organisationProfile.findMany({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
    take: 2,
  });
}

export async function getSingleOrganisationId(
  prisma: Pick<PrismaService, 'organisationProfile'>,
  options?: { allowMissing?: boolean },
): Promise<string | undefined> {
  const organisations = await loadSingleOrganisation(prisma);

  if (organisations.length === 0) {
    if (options?.allowMissing) {
      return undefined;
    }
    throw new BadRequestException('No organisation found. Please create an organisation first.');
  }

  if (organisations.length > 1) {
    throw new InternalServerErrorException(
      'Single-organisation mode supports exactly one organisation profile. Multiple organisations were found.',
    );
  }

  return organisations[0]!.id;
}

export async function resolveSingleOrganisationId(
  prisma: Pick<PrismaService, 'organisationProfile'>,
  requestedOrganisationId?: string,
  options?: { allowMissing?: boolean },
): Promise<string | undefined> {
  const organisationId = await getSingleOrganisationId(prisma, options);

  if (!organisationId) {
    return undefined;
  }

  if (requestedOrganisationId && requestedOrganisationId !== organisationId) {
    throw new BadRequestException(
      'This deployment supports exactly one organisation. Use the configured organisation profile instead of supplying a different organisationId.',
    );
  }

  return organisationId;
}
