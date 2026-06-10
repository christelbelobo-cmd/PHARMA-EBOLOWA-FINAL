import bcrypt from 'bcryptjs';
import { PHARMACIES } from './data/pharmacies';

export type User = {
  username: string;
  passwordHash: string;
  role: 'admin' | 'pharmacist';
  pharmacyId?: string | null;
};

const plainUsers: Array<{ username: string; password: string; role: 'admin' | 'pharmacist'; pharmacyId?: string }> = [
  { username: 'admin', password: 'admin', role: 'admin' },
  // pharmacists: username = pharmacy id, password = pharmacy id
  ...PHARMACIES.map((p) => ({ username: p.id, password: p.id, role: 'pharmacist', pharmacyId: p.id })),
];

export const USERS: User[] = plainUsers.map((u) => ({
  username: u.username,
  passwordHash: bcrypt.hashSync(u.password, 10),
  role: u.role,
  pharmacyId: u.pharmacyId ?? null,
}));

export function findUserByUsername(username: string) {
  return USERS.find((u) => u.username === username);
}
