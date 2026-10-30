import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryColumn,
    Relation,
    UpdateDateColumn,
} from 'typeorm';
import { OrderStatusEnum } from '~/common/enums/order-status.enum';
import { generateUniqueId } from '~/common/utils';
import { AcUnit } from '~/core/ac-unit/entities/ac-unit.entity';
import { Invoice } from '~/core/invoice/entities/invoice.entity';
import { Notification } from '~/core/notification/entities/notification.entity';
import { User } from '~/core/user/entities/user.entity';

export interface Subject {
    id: string;
    role: string;
    fullName: string;
}

@Entity('orders')
export class Order {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'varchar', array: true })
    ac_problems: string[];

    @Column({ type: 'double precision' })
    latitude_service_location: number;

    @Column({ type: 'double precision' })
    longitude_service_location: number;

    @Column({ type: 'jsonb', nullable: true })
    service_location_detail: object | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    service_location_note?: string;

    @Column({ type: 'varchar', length: 255 })
    property_type: string;

    @Column({ type: 'varchar', length: 2 })
    property_floor: string;

    @Column({ type: 'timestamp with time zone' })
    service_date: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    note: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    cancellation_reason: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    cancellation_note: string;

    @Column({ type: 'json', nullable: true })
    cancelled_by: Subject;

    @Column({
        type: 'enum',
        enum: OrderStatusEnum,
        default: OrderStatusEnum.PENDING,
    })
    status: OrderStatusEnum;

    /**
     * Relations
     */
    @ManyToOne(() => User, (user) => user.orders)
    customer: Relation<User>;

    @ManyToOne(() => User, (user) => user.assigned_orders)
    technician: Relation<User>;

    @OneToMany(() => AcUnit, (acUnit) => acUnit.orders)
    ac_units: Relation<AcUnit>[];

    @OneToMany(() => Notification, (notification) => notification.order)
    notifications: Relation<Notification>[];

    /** The invoice associated with this order. */
    @OneToOne(() => Invoice, (invoice) => invoice.order)
    invoice: Relation<Invoice>;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at: Date;

    @BeforeInsert()
    generateId() {
        this.id = `S-${generateUniqueId(10)}`;
    }
}
