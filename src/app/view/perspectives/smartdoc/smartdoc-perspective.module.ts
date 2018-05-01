/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';
import {ClickOutsideModule} from 'ng-click-outside';
import {QuillModule} from 'ngx-quill';
import {SmartDocEffects} from '../../../core/store/smartdoc/smartdoc.effects';
import {smartDocReducer} from '../../../core/store/smartdoc/smartdoc.reducer';
import {initialSmartDocState} from '../../../core/store/smartdoc/smartdoc.state';
import {DragAndDropModule} from '../../../shared/drag-and-drop/drag-and-drop.module';
import {PickerModule} from '../../../shared/picker/picker.module';
import {SharedModule} from '../../../shared/shared.module';
import {SmartDocBottomPanelComponent} from './bottom-panel/smartdoc-bottom-panel.component';
import {SmartDocDocumentComponent} from './document/smartdoc-document.component';
import {SmartDocEmbeddedComponent} from './embedded/smartdoc-embedded.component';
import {SmartDocSidePanelComponent} from './side-panel/smartdoc-side-panel.component';
import {SmartDocPartComponent} from './smartdoc-part/smartdoc-part.component';
import {SmartDocPerspectiveRoutingModule} from './smartdoc-perspective-routing.module';
import {SmartDocPerspectiveComponent} from './smartdoc-perspective.component';
import {SafeHtmlPipe} from './text/safe-html.pipe';
import {SmartDocTextComponent} from './text/smartdoc-text.component';

@NgModule({
  imports: [
    SharedModule,
    StoreModule.forFeature('smartDoc', smartDocReducer, {initialState: initialSmartDocState}),
    EffectsModule.forFeature([SmartDocEffects]),
    QuillModule,
    ClickOutsideModule,
    DragAndDropModule,
    PickerModule,
    SmartDocPerspectiveRoutingModule
  ],
  declarations: [
    SmartDocDocumentComponent,
    SmartDocEmbeddedComponent,
    SmartDocTextComponent,
    SmartDocPerspectiveComponent,
    SmartDocSidePanelComponent,
    SmartDocBottomPanelComponent,
    SafeHtmlPipe,
    SmartDocPartComponent
  ],
  entryComponents: [
    SmartDocPerspectiveComponent,
    SmartDocEmbeddedComponent,
    SmartDocTextComponent
  ],
  exports: [
    SmartDocPerspectiveComponent
  ]
})
export class SmartDocPerspectiveModule {
}
