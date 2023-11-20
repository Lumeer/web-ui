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
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';

import {PipesModule} from '../../pipes/pipes.module';
import {ProgressModule} from '../../progress/progress.module';
import {SelectModule} from '../../select/select.module';
import {WarningMessageModule} from '../../warning-message/warning-message.module';
import {ModalWrapperModule} from '../wrapper/modal-wrapper.module';
import {GettingStartedModalComponent} from './getting-started-modal.component';
import {FilterTemplatesByTagPipe} from './pipes/filter-templates-by-tag.pipe';
import {FilterTemplatesPipe} from './pipes/filter-templates.pipe';
import {ChooseOrganizationComponent} from './steps/choose-organization/choose-organization.component';
import {CopyProjectComponent} from './steps/copy-project/copy-project.component';
import {EmailVerificationComponent} from './steps/email-verification/email-verification.component';
import {InviteUsersComponent} from './steps/invite-users/invite-users.component';
import {SelectProjectTemplateComponent} from './steps/template/select-project-template.component';
import {TemplateDetailComponent} from './steps/template/templates/content/detail/template-detail.component';
import {TemplateItemComponent} from './steps/template/templates/content/select/template/template-item.component';
import {TemplatesSelectComponent} from './steps/template/templates/content/select/templates-select.component';
import {TemplatesContentComponent} from './steps/template/templates/content/templates-content.component';
import {TemplatesToolbarComponent} from './steps/template/templates/content/toolbar/templates-toolbar.component';
import {EmptyTemplatesComponent} from './steps/template/templates/empty/empty-templates.component';
import {ProjectTemplatesComponent} from './steps/template/templates/project-templates.component';
import {TemplatesTagsComponent} from './steps/template/templates/tags/templates-tags.component';
import {GettingStartedVideoComponent} from './steps/video/getting-started-video.component';

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
    CopyProjectComponent,
  ],
  imports: [
    CommonModule,
    PipesModule,
    ModalWrapperModule,
    RouterModule,
    WarningMessageModule,
    FormsModule,
    SelectModule,
    ProgressModule,
  ],
  exports: [GettingStartedModalComponent],
})
export class GettingStartedModalModule {}
