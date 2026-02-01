import { signOutUser } from '../services/auth';

export const logout = async () => {
  try {
    await signOutUser();
  } catch (e) {}
};
