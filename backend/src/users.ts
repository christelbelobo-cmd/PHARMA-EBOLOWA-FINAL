import bcrypt from 'bcryptjs';
import { PHARMACIES } from './data/pharmacies';

export type User = {
  username: string;
  passwordHash: string;
  role: 'admin' | 'pharmacist';
  pharmacyId?: string | null;
};

// Static users are now migrated to the database.
export const USERS: User[] = [];

import { AppDataSource } from './data-source';
import { User as UserEntity } from './models/User.entity';

export async function findUserByUsername(username: string) {
  const userRepository = AppDataSource.getRepository(UserEntity);
  return await userRepository.findOneBy({ username });
}
