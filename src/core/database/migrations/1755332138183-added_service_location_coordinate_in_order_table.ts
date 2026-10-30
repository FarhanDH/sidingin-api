import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedServiceLocationCoordinateInOrderTable1755332138183 implements MigrationInterface {
    name = 'AddedServiceLocationCoordinateInOrderTable1755332138183'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "service_location"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "latitude_service_location" point NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "longitude_service_location" point NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "service_location_address" character varying(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "service_location_note" character varying(255)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "service_location_note"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "service_location_address"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "longitude_service_location"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "latitude_service_location"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "service_location" character varying(255) NOT NULL
        `);
    }

}
