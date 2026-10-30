import { Test, TestingModule } from '@nestjs/testing';
import { PushSubscriptionService } from './push-subscription.service';

describe('PushSubscriptionService', () => {
  let service: PushSubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PushSubscriptionService],
    }).compile();

    service = module.get<PushSubscriptionService>(PushSubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
