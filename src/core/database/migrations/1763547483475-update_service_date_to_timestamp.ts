import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateServiceDateToTimestamp1763547483475 implements MigrationInterface {
    name = 'UpdateServiceDateToTimestamp1763547483475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "service_date"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "service_date" TIMESTAMP WITH TIME ZONE NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "service_date"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "service_date" date NOT NULL
        `);
    }

}
