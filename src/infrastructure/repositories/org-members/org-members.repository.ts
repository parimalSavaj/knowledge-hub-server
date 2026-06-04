import { IDatabaseService } from '../../../shared/services/interfaces/database.service.interface';
import { IOrgMembersRepository } from './org-members.repository.interface';

export class OrgMembersRepository implements IOrgMembersRepository {
  private readonly TABLE = 'org_members';

  constructor(private readonly db: IDatabaseService) {}
}
