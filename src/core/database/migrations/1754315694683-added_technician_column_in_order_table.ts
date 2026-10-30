import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedTechnicianColumnInOrderTable1754315694683 implements MigrationInterface {
    name = 'AddedTechnicianColumnInOrderTable1754315694683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "technicianId" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_1de74120eac3dfddb4b8e8f6a9b" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "FK_1de74120eac3dfddb4b8e8f6a9b"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "technicianId"
        `);
    }

}
