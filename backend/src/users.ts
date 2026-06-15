import { AppDataSource } from './data-source';
import { User as UserEntity } from './models/User.entity';

export async function findUserByUsername(username: string) {
  const userRepository = AppDataSource.getRepository(UserEntity);
  return await userRepository.findOneBy({ username: username });
}

