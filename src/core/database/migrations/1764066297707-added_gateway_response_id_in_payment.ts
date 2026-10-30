import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedGatewayResponseIdInPayment1764066297707 implements MigrationInterface {
    name = 'AddedGatewayResponseIdInPayment1764066297707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "gateway_transaction_id" character varying(255)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments" DROP COLUMN "gateway_transaction_id"
        `);
    }

}
