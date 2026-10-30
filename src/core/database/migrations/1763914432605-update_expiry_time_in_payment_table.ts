import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateExpiryTimeInPaymentTable1763914432605 implements MigrationInterface {
    name = 'UpdateExpiryTimeInPaymentTable1763914432605'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments" DROP COLUMN "expiry_time"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "expiry_time" TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments" DROP COLUMN "expiry_time"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "expiry_time" TIMESTAMP WITH TIME ZONE
        `);
    }

}
