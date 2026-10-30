import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOrderStatus1754143990066 implements MigrationInterface {
    name = 'UpdateOrderStatus1754143990066'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "public"."orders_status_enum"
            RENAME TO "orders_status_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."orders_status_enum" AS ENUM(
                'pending',
                'confirmed',
                'technician_on_the_way',
                'waiting_payment',
                'on_working',
                'completed',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status" TYPE "public"."orders_status_enum" USING "status"::"text"::"public"."orders_status_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
        `);
        await queryRunner.query(`
            DROP TYPE "public"."orders_status_enum_old"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."orders_status_enum"
            RENAME TO "orders_status_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."orders_status_enum" AS ENUM(
                'pending',
                'confirmed',
                'technician_on_the_way',
                'waiting_payment',
                'on_working',
                'completed',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status" TYPE "public"."orders_status_enum" USING "status"::"text"::"public"."orders_status_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
        `);
        await queryRunner.query(`
            DROP TYPE "public"."orders_status_enum_old"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."orders_status_enum_old" AS ENUM(
                'pending',
                'taken',
                'to_location',
                'in_progress',
                'completed'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status" TYPE "public"."orders_status_enum_old" USING "status"::"text"::"public"."orders_status_enum_old"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
        `);
        await queryRunner.query(`
            DROP TYPE "public"."orders_status_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."orders_status_enum_old"
            RENAME TO "orders_status_enum"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."orders_status_enum_old" AS ENUM(
                'pending',
                'taken',
                'to_location',
                'in_progress',
                'completed'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status" TYPE "public"."orders_status_enum_old" USING "status"::"text"::"public"."orders_status_enum_old"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
        `);
        await queryRunner.query(`
            DROP TYPE "public"."orders_status_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."orders_status_enum_old"
            RENAME TO "orders_status_enum"
        `);
    }

}
