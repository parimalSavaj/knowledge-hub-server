import { v4 as uuidv4 } from "uuid";
import { IIdService } from "./id.service.interface";

export class IdService implements IIdService {
  private static instance: IdService | null = null;

  private constructor() {}

  static getInstance(): IdService {
    if (!IdService.instance) {
      IdService.instance = new IdService();
    }
    return IdService.instance;
  }

  generate(): string {
    return uuidv4();
  }
}
