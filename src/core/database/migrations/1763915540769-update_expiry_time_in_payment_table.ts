import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateExpiryTimeInPaymentTable1763915540769 implements MigrationInterface {
    name = 'UpdateExpiryTimeInPaymentTable1763915540769'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments" DROP COLUMN "expiry_time"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "expiry_time" TIMESTAMP WITH TIME ZONE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments" DROP COLUMN "expiry_time"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "expiry_time" TIMESTAMP
        `);
    }

}
