import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledTaskController } from './scheduled-task.controller';
import { ScheduledTaskService } from './scheduled-task.service';

describe('ScheduledTaskController', () => {
  let controller: ScheduledTaskController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduledTaskController],
      providers: [ScheduledTaskService],
    }).compile();

    controller = module.get<ScheduledTaskController>(ScheduledTaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
