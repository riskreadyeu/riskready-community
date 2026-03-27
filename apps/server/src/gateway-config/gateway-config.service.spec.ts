import { GatewayConfigService } from './gateway-config.service';

describe('GatewayConfigService', () => {
  let prisma: any;
  let service: GatewayConfigService;

  beforeEach(() => {
    prisma = {
      gatewayConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    service = new GatewayConfigService(prisma);
  });

  afterEach(() => {
    delete process.env['GATEWAY_URL'];
  });

  it('uses GATEWAY_URL as the fallback when no gateway config exists', async () => {
    prisma.gatewayConfig.findUnique.mockResolvedValue(null);
    process.env['GATEWAY_URL'] = 'http://gateway:3100';

    const result = await service.getConfig('org-1');

    expect(result.gatewayUrl).toBe('http://gateway:3100');
  });
});
