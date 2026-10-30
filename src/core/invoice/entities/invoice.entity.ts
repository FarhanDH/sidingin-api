import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from 'typeorm';
import { InvoiceStatus } from '~/common/enums/invoice.enum';
import { Order } from '~/core/order/entities/order.entity';
import { Payment } from '~/core/payment/entities/payment.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity('invoices')
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Order, (order) => order.invoice)
    @JoinColumn()
    order: Relation<Order>;

    @Column({ unique: true })
    invoice_number: string;

    @Column({
        type: 'enum',
        enum: InvoiceStatus,
        default: InvoiceStatus.UNPAID,
    })
    status: InvoiceStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_amount: number;

    @Column({ type: 'timestamp with time zone' })
    issued_at: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    paid_at: Date | null;

    /** The list of items included in this invoice. */
    @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
    items: Relation<InvoiceItem[]>;

    /** A log of all payment attempts for this invoice. */
    @OneToOne(() => Payment, (transaction) => transaction.invoice)
    @JoinColumn()
    payment: Relation<Payment>;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at: Date;
}
