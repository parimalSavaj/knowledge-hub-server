import { PoolClient } from "pg";
import { OrganizationEntity } from "../../../domain/entities/organization.entity";

export interface IOrganizationsRepository {
  create(entity: OrganizationEntity, client?: PoolClient): Promise<void>;
}
