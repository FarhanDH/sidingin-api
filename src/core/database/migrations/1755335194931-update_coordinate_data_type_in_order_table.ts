import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCoordinateDataTypeInOrderTable1755335194931 implements MigrationInterface {
    name = 'UpdateCoordinateDataTypeInOrderTable1755335194931'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "latitude_service_location"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "latitude_service_location" double precision NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "longitude_service_location"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "longitude_service_location" double precision NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "longitude_service_location"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "longitude_service_location" point NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "latitude_service_location"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "latitude_service_location" point NOT NULL
        `);
    }

}
