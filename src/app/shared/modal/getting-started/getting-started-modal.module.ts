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
import {SelectProjectTemplateComponent} from './template/select-project-template.component';
import {ProjectTemplatesComponent} from './template/templates/project-templates.component';
import {TemplatesTagsComponent} from './template/templates/tags/templates-tags.component';
import {TemplatesSelectComponent} from './template/templates/content/select/templates-select.component';
import {TemplateDetailComponent} from './template/templates/content/detail/template-detail.component';
import {EmptyTemplatesComponent} from './template/templates/empty/empty-templates.component';
import {TemplateItemComponent} from './template/templates/content/select/template/template-item.component';
import {TemplatesToolbarComponent} from './template/templates/content/toolbar/templates-toolbar.component';
import {TemplatesContentComponent} from './template/templates/content/templates-content.component';

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
  ],
  imports: [CommonModule, PipesModule, ModalWrapperModule, WarningMessageModule, FormsModule],
  exports: [GettingStartedModalComponent],
})
export class GettingStartedModalModule {}
