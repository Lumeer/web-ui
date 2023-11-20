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

import {ButtonModule} from '../button/button.module';
import {DirectivesModule} from '../directives/directives.module';
import {PickerModule} from '../picker/picker.module';
import {PipesModule} from '../pipes/pipes.module';
import {PresenterModule} from '../presenter/presenter.module';
import {WarningMessageModule} from '../warning-message/warning-message.module';
import {PostItCollectionAddButtonComponent} from './content/add-button/post-it-collection-add-button.component';
import {PostItCollectionNameComponent} from './content/collection-name/post-it-collection-name.component';
import {EmptyCollectionsComponent} from './content/empty-collections/empty-collections.component';
import {PostItCollectionsContentComponent} from './content/post-it-collections-content.component';
import {PostItCollectionComponent} from './content/post-it/post-it-collection.component';
import {PostItCollectionsComponent} from './post-it-collections.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PickerModule,
    PresenterModule,
    DirectivesModule,
    RouterModule,
    PipesModule,
    WarningMessageModule,
    ButtonModule,
  ],
  declarations: [
    PostItCollectionsComponent,
    PostItCollectionComponent,
    PostItCollectionNameComponent,
    PostItCollectionAddButtonComponent,
    EmptyCollectionsComponent,
    PostItCollectionsContentComponent,
  ],
  exports: [PostItCollectionsComponent],
})
export class PostItCollectionsModule {}
