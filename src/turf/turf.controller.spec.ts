import { Test, TestingModule } from '@nestjs/testing';
import { TurfController } from './turf.controller';

describe('TurfController', () => {
  let controller: TurfController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurfController],
    }).compile();

    controller = module.get<TurfController>(TurfController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
