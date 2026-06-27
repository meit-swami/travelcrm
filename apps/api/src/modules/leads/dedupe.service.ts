import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { computeDedupeHash, normalizeEmail, normalizePhone } from '../../core/common/lead.util';

export interface DuplicateCandidate {
  leadId: string;
  matchType: 'phone' | 'email' | 'fuzzy';
  confidence: number;
}

/** Detects duplicate leads by normalized phone/email (and hash fast-path). */
@Injectable()
export class DedupeService {
  constructor(private readonly prisma: PrismaService) {}

  async findDuplicates(phone?: string | null, email?: string | null): Promise<DuplicateCandidate[]> {
    const p = normalizePhone(phone);
    const e = normalizeEmail(email);
    if (!p && !e) return [];

    const hash = computeDedupeHash(phone, email);
    const matches = await this.prisma.db.lead.findMany({
      where: {
        deletedAt: null,
        OR: [
          ...(hash ? [{ dedupeHash: hash }] : []),
          ...(p ? [{ phone: { contains: p } }] : []),
          ...(e ? [{ email: e }] : []),
        ],
      },
      select: { id: true, phone: true, email: true, dedupeHash: true },
      take: 10,
    });

    return matches.map((m) => {
      if (hash && m.dedupeHash === hash) return { leadId: m.id, matchType: 'phone' as const, confidence: 1 };
      if (e && m.email === e) return { leadId: m.id, matchType: 'email' as const, confidence: 0.95 };
      return { leadId: m.id, matchType: 'phone' as const, confidence: 0.9 };
    });
  }
}
