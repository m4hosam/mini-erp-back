import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Product } from './product.entity';
import { User } from '../../users/entities/user.entity';

export enum StockMovementType {
    IN = 'in',
    OUT = 'out',
    ADJUSTMENT = 'adjustment',
    SALE = 'sale',
    RETURN = 'return',
}

export enum StockMovementDirection {
    IN = 'IN',
    OUT = 'OUT',
}

@Entity({ name: 'stock_movements' })
export class StockMovement extends BaseTransactionEntity {
    @Column({ name: 'product_id' })
    productId: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({
        type: 'enum',
        enum: StockMovementType,
    })
    type: StockMovementType;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    quantity: number;

    @Column({
        type: 'enum',
        enum: StockMovementDirection,
    })
    direction: StockMovementDirection;

    @Column()
    reason: string;

    @Column({ nullable: true })
    reference: string;

    @Column({ name: 'user_id', nullable: true })
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
