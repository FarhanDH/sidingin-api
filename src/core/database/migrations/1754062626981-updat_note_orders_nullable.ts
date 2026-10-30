import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatNoteOrdersNullable1754062626981 implements MigrationInterface {
    name = 'UpdatNoteOrdersNullable1754062626981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "note" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "note" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "note"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "note"
            SET NOT NULL
        `);
    }

}
