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
import {FormPerspectiveComponent} from './form-perspective.component';
import {RouterModule} from '@angular/router';
import {FormPerspectiveRoutingModule} from './form-perspective-routing.module';
import { FormPerspectiveContentComponent } from './content/form-perspective-content.component';
import { FormEditorComponent } from './content/editor/form-editor.component';
import {LayoutModule} from '../../../shared/layout/layout.module';
import { FormEditorRowComponent } from './content/editor/row/form-editor-row.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { FormEditorCellComponent } from './content/editor/row/cell/form-editor-cell.component';

@NgModule({
  declarations: [FormPerspectiveComponent, FormPerspectiveContentComponent, FormEditorComponent, FormEditorRowComponent, FormEditorCellComponent],
  imports: [CommonModule, RouterModule, FormPerspectiveRoutingModule, LayoutModule, DragDropModule],
  exports: [FormPerspectiveComponent],
})
export class FormPerspectiveModule {}
