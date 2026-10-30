import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameProblemsInOrdersTableToAcProblems1754062507612 implements MigrationInterface {
    name = 'RenameProblemsInOrdersTableToAcProblems1754062507612'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
                RENAME COLUMN "problems" TO "ac_problems"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."ac_units_brand_enum"
            RENAME TO "ac_units_brand_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."ac_units_brand_enum" AS ENUM(
                'Panasonic',
                'LG',
                'Daikin',
                'Samsung',
                'Sharp',
                'Polytron',
                'Gree',
                'TCL',
                'Mitsubishi',
                'Aqua'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "ac_units"
            ALTER COLUMN "brand" TYPE "public"."ac_units_brand_enum" USING "brand"::"text"::"public"."ac_units_brand_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ac_units_brand_enum_old"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."ac_units_brand_enum"
            RENAME TO "ac_units_brand_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."ac_units_brand_enum" AS ENUM(
                'Panasonic',
                'LG',
                'Daikin',
                'Samsung',
                'Sharp',
                'Polytron',
                'Gree',
                'TCL',
                'Mitsubishi',
                'Aqua'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "ac_units"
            ALTER COLUMN "brand" TYPE "public"."ac_units_brand_enum" USING "brand"::"text"::"public"."ac_units_brand_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ac_units_brand_enum_old"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."ac_units_brand_enum_old" AS ENUM('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')
        `);
        await queryRunner.query(`
            ALTER TABLE "ac_units"
            ALTER COLUMN "brand" TYPE "public"."ac_units_brand_enum_old" USING "brand"::"text"::"public"."ac_units_brand_enum_old"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ac_units_brand_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."ac_units_brand_enum_old"
            RENAME TO "ac_units_brand_enum"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."ac_units_brand_enum_old" AS ENUM('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')
        `);
        await queryRunner.query(`
            ALTER TABLE "ac_units"
            ALTER COLUMN "brand" TYPE "public"."ac_units_brand_enum_old" USING "brand"::"text"::"public"."ac_units_brand_enum_old"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ac_units_brand_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."ac_units_brand_enum_old"
            RENAME TO "ac_units_brand_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
                RENAME COLUMN "ac_problems" TO "problems"
        `);
    }

}
