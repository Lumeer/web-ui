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
import {CreateProjectModalComponent} from './create-project-modal.component';
import {PipesModule} from '../../pipes/pipes.module';
import {ModalWrapperModule} from '../wrapper/modal-wrapper.module';
import { CreateProjectTemplatesComponent } from './templates/create-project-templates.component';
import { TemplatesTagsComponent } from './templates/tags/templates-tags.component';
import { TemplatesSelectComponent } from './templates/content/select/templates-select.component';
import { TemplateDetailComponent } from './templates/content/detail/template-detail.component';
import { EmptyTemplatesComponent } from './templates/empty/empty-templates.component';
import {WarningMessageModule} from '../../warning-message/warning-message.module';
import {FormsModule} from '@angular/forms';
import { FilterTemplatesPipe } from './pipes/filter-templates.pipe';
import { TemplateItemComponent } from './templates/content/select/template/template-item.component';
import { TemplatesContentComponent } from './templates/content/templates-content.component';
import { TemplatesToolbarComponent } from './templates/content/toolbar/templates-toolbar.component';

@NgModule({
  declarations: [CreateProjectModalComponent, CreateProjectTemplatesComponent, TemplatesTagsComponent, TemplatesSelectComponent, TemplateDetailComponent, EmptyTemplatesComponent, FilterTemplatesPipe, TemplateItemComponent, TemplatesContentComponent, TemplatesToolbarComponent],
  imports: [CommonModule, PipesModule, ModalWrapperModule, WarningMessageModule, FormsModule],
  exports: [CreateProjectModalComponent],
})
export class CreateProjectModalModule {}
