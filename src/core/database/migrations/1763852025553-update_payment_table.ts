import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePaymentTable1763852025553 implements MigrationInterface {
    name = 'UpdatePaymentTable1763852025553'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "va_number" character varying(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "bank" character varying(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "qr_code_url" text
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "actions" jsonb
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
            ALTER TABLE "payments" DROP COLUMN "actions"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" DROP COLUMN "qr_code_url"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" DROP COLUMN "bank"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" DROP COLUMN "va_number"
        `);
    }

}
