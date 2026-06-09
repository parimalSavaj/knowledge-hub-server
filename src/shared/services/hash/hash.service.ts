import bcrypt from "bcrypt";
import { IHashService } from "./hash.service.interface";

export class HashService implements IHashService {
  private static instance: HashService | null = null;
  private readonly SALT_ROUNDS = 12;

  private constructor() {}

  static getInstance(): HashService {
    if (!HashService.instance) {
      HashService.instance = new HashService();
    }
    return HashService.instance;
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
