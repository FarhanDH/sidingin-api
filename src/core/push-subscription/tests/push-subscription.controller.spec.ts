import { Test, TestingModule } from '@nestjs/testing';
import { PushSubscriptionController } from './push-subscription.controller';
import { PushSubscriptionService } from './push-subscription.service';

describe('PushSubscriptionController', () => {
  let controller: PushSubscriptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushSubscriptionController],
      providers: [PushSubscriptionService],
    }).compile();

    controller = module.get<PushSubscriptionController>(PushSubscriptionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
