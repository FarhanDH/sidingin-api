import {
    Column,
    CreateDateColumn,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '~/common/enums/payment-status.enum';
import { PaymentMethod } from '~/common/enums/payment.enum';
import { Invoice } from '~/core/invoice/entities/invoice.entity';

type MidtransAction = {
    name: string;
    method: string;
    url: string;
};

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** The invoice this transaction is for. */
    @OneToOne(() => Invoice, (invoice) => invoice.payment)
    invoice: Relation<Invoice>;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
    })
    status: PaymentStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        nullable: true,
    })
    method: PaymentMethod | null;

    /** Store the full webhook response from the payment gateway for auditing. */
    @Column({ type: 'jsonb', nullable: true })
    gateway_response: object | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    gateway_transaction_id: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    va_number: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    bank: string;

    @Column({ type: 'text', nullable: true })
    qr_code_url: string;

    @Column({ type: 'jsonb', nullable: true })
    actions: MidtransAction[];

    @Column({ type: 'timestamp with time zone', nullable: true })
    expiry_time: Date;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at: Date;
}
