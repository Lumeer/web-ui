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

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {environment} from '../../../environments/environment';
import {MockCollectionService} from './collection/mock-collection.service';
import {ApiCollectionService} from './collection/api-collection.service';
import {CollectionService} from './collection/collection.service';
import {LinkTypeService} from './link-type/link-type.service';
import {MockLinkTypeService} from './link-type/mock-link-type.service';
import {ApiLinkTypeService} from './link-type/api-link-type.service';
import {ViewService} from './view/view.service';
import {MockViewService} from './view/mock-view.service';
import {ApiViewService} from './view/api-view.service';
import {DocumentService} from './document/document.service';
import {MockDocumentService} from './document/mock-document.service';
import {ApiDocumentService} from './document/api-document.service';
import {LinkInstanceService} from './link-instance/link-instance.service';
import {MockLinkInstanceService} from './link-instance/mock-link-instance.service';
import {ApiLinkInstanceService} from './link-instance/api-link-instance.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    {
      provide: CollectionService,
      useClass: environment.publicView ? MockCollectionService : ApiCollectionService
    },
    {
      provide: LinkTypeService,
      useClass: environment.publicView ? MockLinkTypeService : ApiLinkTypeService
    },
    {
      provide: ViewService,
      useClass: environment.publicView ? MockViewService : ApiViewService
    },
    {
      provide: DocumentService,
      useClass: environment.publicView ? MockDocumentService : ApiDocumentService
    },
    {
      provide: LinkInstanceService,
      useClass: environment.publicView ? MockLinkInstanceService : ApiLinkInstanceService
    },
  ]
})
export class DataServiceModule {
}
