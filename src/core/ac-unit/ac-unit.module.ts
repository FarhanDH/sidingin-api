import { Module } from '@nestjs/common';
import { AcUnit } from './entities/ac-unit.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AcUnit])],
})
export class AcUnitModule {}
