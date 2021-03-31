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
import {ModalWrapperModule} from './wrapper/modal-wrapper.module';
import {CreateResourceModalModule} from './create-resource/create-resource-modal.module';
import {AttributeTypeModalModule} from './attribute-type/attribute-type-modal.module';
import {AttributeFunctionModalModule} from './attribute-function/attribute-function-modal.module';
import {DocumentDetailModalModule} from './document-detail/document-detail-modal.module';
import {CreateDocumentModalModule} from './create-document/create-document-modal.module';
import {CreateLinkModalModule} from './create-link/create-link-modal.module';
import {ShareViewModalModule} from './share-view/share-view-modal.module';
import {TextEditorModalModule} from './text-editor/text-editor-modal.module';
import {CalendarEventDetailModalModule} from './calendar-event-detail/calendar-event-detail-modal.module';
import {ChooseLinkDocumentModalModule} from './choose-link-document/choose-link-document-modal.module';
import {DataResourceDetailModalModule} from './data-resource-detail/data-resource-detail-modal.module';
import {ReferralsOverviewModalModule} from './referrals-overview/referrals-overview-modal.module';
import {VerifyEmailModalModule} from './verify-email/verify-email-modal.module';
import {CreateProjectModalModule} from './create-project/create-project-modal.module';
import {CopyProjectModalModule} from './copy-project/copy-project-modal.module';
import {ChooseOrganizationModalModule} from './choose-organization/choose-organization-modal.module';
import {EmbeddedLinkModalModule} from './embedded-link/embedded-link-modal.module';
import {UserSettingsModalModule} from './user-settings/user-settings-modal.module';
import {AttributeDescriptionModalModule} from './attribute-description/attribute-description-modal.module';
import {ModifyDocumentLinksModalModule} from './modify-document-links/modify-document-links-modal.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ModalWrapperModule,
    CreateResourceModalModule,
    AttributeTypeModalModule,
    AttributeFunctionModalModule,
    AttributeDescriptionModalModule,
    DocumentDetailModalModule,
    CreateDocumentModalModule,
    CreateLinkModalModule,
    ShareViewModalModule,
    TextEditorModalModule,
    CalendarEventDetailModalModule,
    ChooseLinkDocumentModalModule,
    DataResourceDetailModalModule,
    ReferralsOverviewModalModule,
    VerifyEmailModalModule,
    CreateProjectModalModule,
    CopyProjectModalModule,
    ChooseOrganizationModalModule,
    EmbeddedLinkModalModule,
    UserSettingsModalModule,
    ModifyDocumentLinksModalModule,
  ],
  exports: [
    ModalWrapperModule,
    CreateResourceModalModule,
    AttributeTypeModalModule,
    AttributeFunctionModalModule,
    AttributeDescriptionModalModule,
    DocumentDetailModalModule,
    CreateDocumentModalModule,
    CreateLinkModalModule,
    ShareViewModalModule,
    TextEditorModalModule,
    CalendarEventDetailModalModule,
    ChooseLinkDocumentModalModule,
    DataResourceDetailModalModule,
    ReferralsOverviewModalModule,
    VerifyEmailModalModule,
    CreateProjectModalModule,
    CopyProjectModalModule,
    ChooseOrganizationModalModule,
    EmbeddedLinkModalModule,
    UserSettingsModalModule,
    ModifyDocumentLinksModalModule,
  ],
})
export class ModalModule {}
