import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ACBrandEnum } from '~/common/enums/ac-brand.enum';
import { ACCapacityEnum } from '~/common/enums/ac-capacity.enum';
import { Order } from '~/core/order/entities/order.entity';

@Entity('ac_units')
export class AcUnit {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Order, (order) => order.ac_units)
  orders: Relation<Order>;

  @Column({ type: 'varchar', length: 255 })
  ac_type_name: string;

  @Column({ type: 'enum', enum: ACCapacityEnum })
  ac_capacity: ACCapacityEnum;

  @Column({ type: 'enum', enum: ACBrandEnum })
  brand: ACBrandEnum;

  @Column({ type: 'integer' })
  quantity: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
