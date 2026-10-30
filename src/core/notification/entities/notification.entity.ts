import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
} from 'typeorm';
import { NotificationType } from '~/common/enums/notification-type.enum';
import { NotificationRead } from '~/core/notification-read/entities/notification-read.entity';
import { Order } from '~/core/order/entities/order.entity';
import { User } from '~/core/user/entities/user.entity';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    message: string;

    /**
     * Relations
     */
    @ManyToOne(() => User, (user) => user.notifications, {
        nullable: true,
    })
    recipient: Relation<User>;

    @ManyToOne(() => Order, (order) => order.notifications, {
        nullable: true,
    })
    order: Relation<Order>;

    @OneToMany(
        () => NotificationRead,
        (notificationRead) => notificationRead.notification,
    )
    reads: Relation<NotificationRead[]>;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;
}
