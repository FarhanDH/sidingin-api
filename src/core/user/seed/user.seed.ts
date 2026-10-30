import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { User } from '../entities/user.entity';
import { RoleEnum } from '~/common/enums/role.enum';
import { DataSource } from 'typeorm';

export default class UserSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    await dataSource.query('TRUNCATE "users" RESTART IDENTITY;');

    const repository = dataSource.getRepository(User);
    await repository.insert({
      email: 'farhandwihartantu@gmail.com',
      phone_number: '823729479373',
      full_name: 'Farhan',
      avatar_url: 'https://ui-avatars.com/api/?name=farhan',
      role: RoleEnum.TECHNICIAN,
      is_profile_completed: true,
    });
    console.log('User seeded successfully');
  }
}
