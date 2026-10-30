import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem {
    @PrimaryGeneratedColumn('increment')
    id: number;

    /** The invoice this item belongs to. */
    @ManyToOne(() => Invoice, (invoice) => invoice.items)
    invoice: Relation<Invoice>;

    @Column()
    description: string;

    @Column({ type: 'integer', default: 1 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unit_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_price: number;
}
