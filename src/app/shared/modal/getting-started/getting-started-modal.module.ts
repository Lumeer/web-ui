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
import {FormsModule} from '@angular/forms';
import {GettingStartedModalComponent} from './getting-started-modal.component';
import {PipesModule} from '../../pipes/pipes.module';
import {ModalWrapperModule} from '../wrapper/modal-wrapper.module';
import {WarningMessageModule} from '../../warning-message/warning-message.module';
import {FilterTemplatesPipe} from './pipes/filter-templates.pipe';
import {FilterTemplatesByTagPipe} from './pipes/filter-templates-by-tag.pipe';
import {SelectProjectTemplateComponent} from './steps/template/select-project-template.component';
import {ProjectTemplatesComponent} from './steps/template/templates/project-templates.component';
import {TemplatesTagsComponent} from './steps/template/templates/tags/templates-tags.component';
import {TemplatesSelectComponent} from './steps/template/templates/content/select/templates-select.component';
import {TemplateDetailComponent} from './steps/template/templates/content/detail/template-detail.component';
import {EmptyTemplatesComponent} from './steps/template/templates/empty/empty-templates.component';
import {TemplateItemComponent} from './steps/template/templates/content/select/template/template-item.component';
import {TemplatesToolbarComponent} from './steps/template/templates/content/toolbar/templates-toolbar.component';
import {TemplatesContentComponent} from './steps/template/templates/content/templates-content.component';
import {ChooseOrganizationComponent} from './steps/choose-organization/choose-organization.component';
import {InviteUsersComponent} from './steps/invite-users/invite-users.component';
import {SelectModule} from '../../select/select.module';
import {EmailVerificationComponent} from './steps/email-verification/email-verification.component';
import {GettingStartedVideoComponent} from './steps/video/getting-started-video.component';
import {ProgressModule} from '../../progress/progress.module';

@NgModule({
  declarations: [
    GettingStartedModalComponent,
    ProjectTemplatesComponent,
    TemplatesTagsComponent,
    TemplatesSelectComponent,
    TemplateDetailComponent,
    EmptyTemplatesComponent,
    FilterTemplatesPipe,
    TemplateItemComponent,
    TemplatesContentComponent,
    TemplatesToolbarComponent,
    FilterTemplatesByTagPipe,
    SelectProjectTemplateComponent,
    ChooseOrganizationComponent,
    InviteUsersComponent,
    EmailVerificationComponent,
    GettingStartedVideoComponent,
  ],
  imports: [
    CommonModule,
    PipesModule,
    ModalWrapperModule,
    WarningMessageModule,
    FormsModule,
    SelectModule,
    ProgressModule,
  ],
  exports: [GettingStartedModalComponent],
})
export class GettingStartedModalModule {}
