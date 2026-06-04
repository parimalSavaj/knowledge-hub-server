import { IDatabaseService } from '../../../shared/services/interfaces/database.service.interface';
import { IOrganizationsRepository } from './organizations.repository.interface';

export class OrganizationsRepository implements IOrganizationsRepository {
  private readonly TABLE = 'organizations';

  constructor(private readonly db: IDatabaseService) {}
}
