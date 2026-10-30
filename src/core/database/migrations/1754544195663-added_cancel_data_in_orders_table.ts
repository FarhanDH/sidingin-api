import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedCancelDataInOrdersTable1754544195663 implements MigrationInterface {
    name = 'AddedCancelDataInOrdersTable1754544195663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "cancellation_reason" character varying(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "cancellation_note" character varying(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "cancelled_by" json
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "cancelled_by"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "cancellation_note"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "cancellation_reason"
        `);
    }

}
