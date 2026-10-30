import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersAndAcUnitsTables1754061569176 implements MigrationInterface {
    name = 'CreateOrdersAndAcUnitsTables1754061569176'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."ac_units_ac_capacity_enum" AS ENUM(
                '0.5 PK',
                '1 PK',
                '1.5 PK',
                '2 PK',
                '2.5 PK',
                '3 PK',
                '5 PK'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."ac_units_brand_enum" AS ENUM('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')
        `);
        await queryRunner.query(`
            CREATE TABLE "ac_units" (
                "id" SERIAL NOT NULL,
                "ac_type_name" character varying(255) NOT NULL,
                "ac_capacity" "public"."ac_units_ac_capacity_enum" NOT NULL,
                "brand" "public"."ac_units_brand_enum" NOT NULL,
                "quantity" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "ordersId" character varying,
                CONSTRAINT "PK_7ee360ab3b1d3fdf2336f263363" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."orders_status_enum" AS ENUM(
                'pending',
                'taken',
                'to_location',
                'in_progress',
                'completed'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" character varying NOT NULL,
                "problems" character varying array NOT NULL,
                "service_location" character varying(255) NOT NULL,
                "property_type" character varying(255) NOT NULL,
                "property_floor" character varying(2) NOT NULL,
                "service_date" date NOT NULL,
                "note" character varying(255) NOT NULL,
                "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "customerId" uuid,
                CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "ac_units"
            ADD CONSTRAINT "FK_ec1fc62dcc38e7f2ed1a70a2767" FOREIGN KEY ("ordersId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_e5de51ca888d8b1f5ac25799dd1" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "FK_e5de51ca888d8b1f5ac25799dd1"
        `);
        await queryRunner.query(`
            ALTER TABLE "ac_units" DROP CONSTRAINT "FK_ec1fc62dcc38e7f2ed1a70a2767"
        `);
        await queryRunner.query(`
            DROP TABLE "orders"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."orders_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "ac_units"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ac_units_brand_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ac_units_ac_capacity_enum"
        `);
    }

}
