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
import {DocumentDetailModalModule} from './document-detail/document-detail-modal.module';
import {CreateDocumentModalModule} from './create-document/create-document-modal.module';
import {CreateLinkModalModule} from './create-link/create-link-modal.module';
import {TextEditorModalModule} from './text-editor/text-editor-modal.module';
import {CalendarEventDetailModalModule} from './calendar-event-detail/calendar-event-detail-modal.module';
import {ChooseLinkDocumentModalModule} from './choose-link-document/choose-link-document-modal.module';
import {DataResourceDetailModalModule} from './data-resource-detail/data-resource-detail-modal.module';
import {ReferralsOverviewModalModule} from './referrals-overview/referrals-overview-modal.module';
import {GettingStartedModalModule} from './getting-started/getting-started-modal.module';
import {EmbeddedLinkModalModule} from './embedded-link/embedded-link-modal.module';
import {UserSettingsModalModule} from './user-settings/user-settings-modal.module';
import {ModifyDocumentLinksModalModule} from './modify-document-links/modify-document-links-modal.module';
import {ViewModalModule} from './view-modal/view-modal.module';
import {TextInputModalModule} from './text-input/text-input-modal.module';
import {DataResourcesDetailModalModule} from './data-resources-detail/data-resources-detail-modal.module';
import {TabsSettingsModalModule} from './tabs-settings/tabs-settings-modal.module';
import {AttributeModalModule} from './attribute/attribute-modal.module';
import {GetInTouchModalModule} from './get-in-touch/get-in-touch-modal.module';

@NgModule({
  imports: [
    CommonModule,
    ModalWrapperModule,
    CreateResourceModalModule,
    AttributeModalModule,
    DocumentDetailModalModule,
    CreateDocumentModalModule,
    CreateLinkModalModule,
    TextEditorModalModule,
    TextInputModalModule,
    CalendarEventDetailModalModule,
    ChooseLinkDocumentModalModule,
    DataResourceDetailModalModule,
    ReferralsOverviewModalModule,
    GettingStartedModalModule,
    EmbeddedLinkModalModule,
    UserSettingsModalModule,
    ModifyDocumentLinksModalModule,
    ViewModalModule,
    DataResourcesDetailModalModule,
    TabsSettingsModalModule,
    GetInTouchModalModule,
  ],
  exports: [
    ModalWrapperModule,
    CreateResourceModalModule,
    DocumentDetailModalModule,
    CreateDocumentModalModule,
    CreateLinkModalModule,
    TextEditorModalModule,
    TextInputModalModule,
    CalendarEventDetailModalModule,
    ChooseLinkDocumentModalModule,
    DataResourceDetailModalModule,
    ReferralsOverviewModalModule,
    GettingStartedModalModule,
    EmbeddedLinkModalModule,
    UserSettingsModalModule,
    ModifyDocumentLinksModalModule,
    ViewModalModule,
    DataResourcesDetailModalModule,
    TabsSettingsModalModule,
    AttributeModalModule,
    GetInTouchModalModule,
  ],
})
export class ModalModule {}
