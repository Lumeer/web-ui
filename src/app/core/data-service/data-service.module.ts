/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {configuration} from '../../../environments/configuration';
import {ApiAttachmentsService} from './attachments/api-attachments.service';
import {AttachmentsService} from './attachments/attachments.service';
import {PublicAttachmentsService} from './attachments/public-attachments.service';
import {ApiAuditLogService} from './audit-log/api-audit-log.service';
import {AuditLogService} from './audit-log/audit-log.service';
import {PublicAuditLogService} from './audit-log/public-audit-log.service';
import {ApiCollectionService} from './collection/api-collection.service';
import {CollectionService} from './collection/collection.service';
import {PublicCollectionService} from './collection/public-collection.service';
import {ApiDashboardDataService} from './dashboard-data/api-dashboard-data.service';
import {DashboardDataService} from './dashboard-data/dashboard-data.service';
import {PublicDashboardDataService} from './dashboard-data/public-dashboard-data.service';
import {ApiDocumentService} from './document/api-document.service';
import {DocumentService} from './document/document.service';
import {PublicDocumentService} from './document/public-document.service';
import {ApiGeocodingService} from './geocoding/api-geocoding.service';
import {GeocodingService} from './geocoding/geocoding.service';
import {PublicGeocodingService} from './geocoding/public-geocoding.service';
import {ApiInformationStoreService} from './information-store/api-information-store.service';
import {InformationStoreService} from './information-store/information-store.service';
import {PublicInformationStoreService} from './information-store/public-information-store.service';
import {ApiLinkInstanceService} from './link-instance/api-link-instance.service';
import {LinkInstanceService} from './link-instance/link-instance.service';
import {PublicLinkInstanceService} from './link-instance/public-link-instance.service';
import {ApiLinkTypeService} from './link-type/api-link-type.service';
import {LinkTypeService} from './link-type/link-type.service';
import {PublicLinkTypeService} from './link-type/public-link-type.service';
import {ApiOrganizationService} from './organization/api-organization.service';
import {OrganizationService} from './organization/organization.service';
import {PublicOrganizationService} from './organization/public-organization.service';
import {ApiProjectService} from './project/api-project.service';
import {ProjectService} from './project/project.service';
import {PublicProjectService} from './project/public-project.service';
import {ApiResourceCommentService} from './resource-comment/api-resource-comment.service';
import {PublicResourceCommentService} from './resource-comment/public-resource-comment.service';
import {ResourceCommentService} from './resource-comment/resource-comment.service';
import {ApiResourceVariablesService} from './resource-variables/api-resource-variables.service';
import {PublicResourceVariablesService} from './resource-variables/public-resource-variables.service';
import {ResourceVariablesService} from './resource-variables/resource-variables.service';
import {ApiSearchService} from './search/api-search.service';
import {PublicSearchService} from './search/public-search.service';
import {SearchService} from './search/search.service';
import {ApiSelectionListsService} from './selection-lists/api-selection-lists.service';
import {PublicSelectionListsService} from './selection-lists/public-selection-lists.service';
import {SelectionListsService} from './selection-lists/selection-lists.service';
import {ApiTeamService} from './team/api-team.service';
import {PublicTeamService} from './team/public-team.service';
import {TeamService} from './team/team.service';
import {ApiUserService} from './user/api-user.service';
import {PublicUserService} from './user/public-user.service';
import {UserService} from './user/user.service';
import {ApiViewService} from './view/api-view.service';
import {PublicViewService} from './view/public-view.service';
import {ViewService} from './view/view.service';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    {
      provide: CollectionService,
      useClass: configuration.publicView ? PublicCollectionService : ApiCollectionService,
    },
    {
      provide: LinkTypeService,
      useClass: configuration.publicView ? PublicLinkTypeService : ApiLinkTypeService,
    },
    {
      provide: ViewService,
      useClass: configuration.publicView ? PublicViewService : ApiViewService,
    },
    {
      provide: DocumentService,
      useClass: configuration.publicView ? PublicDocumentService : ApiDocumentService,
    },
    {
      provide: LinkInstanceService,
      useClass: configuration.publicView ? PublicLinkInstanceService : ApiLinkInstanceService,
    },
    {
      provide: SearchService,
      useClass: configuration.publicView ? PublicSearchService : ApiSearchService,
    },
    {
      provide: UserService,
      useClass: configuration.publicView ? PublicUserService : ApiUserService,
    },
    {
      provide: OrganizationService,
      useClass: configuration.publicView ? PublicOrganizationService : ApiOrganizationService,
    },
    {
      provide: ProjectService,
      useClass: configuration.publicView ? PublicProjectService : ApiProjectService,
    },
    {
      provide: AttachmentsService,
      useClass: configuration.publicView ? PublicAttachmentsService : ApiAttachmentsService,
    },
    {
      provide: GeocodingService,
      useClass: configuration.publicView ? PublicGeocodingService : ApiGeocodingService,
    },
    {
      provide: ResourceCommentService,
      useClass: configuration.publicView ? PublicResourceCommentService : ApiResourceCommentService,
    },
    {
      provide: AuditLogService,
      useClass: configuration.publicView ? PublicAuditLogService : ApiAuditLogService,
    },
    {
      provide: TeamService,
      useClass: configuration.publicView ? PublicTeamService : ApiTeamService,
    },
    {
      provide: SelectionListsService,
      useClass: configuration.publicView ? PublicSelectionListsService : ApiSelectionListsService,
    },
    {
      provide: DashboardDataService,
      useClass: configuration.publicView ? PublicDashboardDataService : ApiDashboardDataService,
    },
    {
      provide: ResourceVariablesService,
      useClass: configuration.publicView ? PublicResourceVariablesService : ApiResourceVariablesService,
    },
    {
      provide: InformationStoreService,
      useClass: configuration.publicView ? PublicInformationStoreService : ApiInformationStoreService,
    },
  ],
})
export class DataServiceModule {}
