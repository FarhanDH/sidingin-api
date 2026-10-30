import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from 'typeorm';
import { RoleEnum } from '~/common/enums/role.enum';
import { OtpToken } from '~/core/auth/entities/otp-token.entity';
import { NotificationRead } from '~/core/notification-read/entities/notification-read.entity';
import { Notification } from '~/core/notification/entities/notification.entity';
import { Order } from '~/core/order/entities/order.entity';
import { PushSubscription } from '~/core/push-subscription/entities/push-subscription.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 15, unique: true, nullable: true })
    phone_number: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    full_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    avatar_url: string;

    @Column({ type: 'enum', enum: RoleEnum, default: RoleEnum.CUSTOMER })
    role: RoleEnum;

    @Column({ default: false })
    is_profile_completed: boolean;

    /**
     * Relations
     */
    @OneToMany(() => OtpToken, (otpToken) => otpToken.user)
    otp_tokens: Relation<OtpToken>[];

    @OneToMany(() => Order, (order) => order.customer)
    orders: Relation<Order>[];

    /**
     * Orders where this user is the TECHNICIAN.
     * A new relation to handle technician assignments.
     */
    @OneToMany(() => Order, (order) => order.technician)
    assigned_orders: Relation<Order[]>;

    @OneToMany(() => PushSubscription, (subscription) => subscription.user)
    push_subscriptions: Relation<PushSubscription>[];

    @OneToMany(() => Notification, (notification) => notification.recipient)
    notifications: Relation<Notification[]>;

    @OneToMany(
        () => NotificationRead,
        (notificationRead) => notificationRead.user,
    )
    notification_reads: Relation<NotificationRead[]>;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at: Date;
}
