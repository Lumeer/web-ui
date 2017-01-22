import {NgModule} from '@angular/core';
import {TagInputComponent} from './tag-input/tag-input.component';
import {BrowserModule} from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {HttpModule} from '@angular/http';
import {AutoCompleteComponent} from './auto-complete/auto-complete.component';
import {EditableDirective} from './auto-complete/editable.directive';
import {FilterInput} from './tag-input/filter-input.component';
import {FilterComponent} from './tag-input/filter.component';
import {FilterSave} from './tag-input/filter-save.component';
import {UserTagComponent} from './user-tile/user-tag.component';
import {DocumentLinksRowsComponent} from './document/links/documents-links-rows.component';
import {LinksComponent} from './document/links/links.component';
import {DocumentsRowsComponent} from './document/documents-rows.component';
import {PerfectScrollbarModule} from 'angular2-perfect-scrollbar';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    PerfectScrollbarModule
  ],
  declarations: [
    TagInputComponent,
    AutoCompleteComponent,
    EditableDirective,
    FilterInput,
    FilterSave,
    FilterComponent,
    UserTagComponent,
    DocumentLinksRowsComponent,
    DocumentsRowsComponent,
    LinksComponent
  ],
  exports: [
    TagInputComponent,
    AutoCompleteComponent,
    FilterInput,
    FilterSave,
    FilterComponent,
    UserTagComponent,
    DocumentLinksRowsComponent,
    DocumentsRowsComponent,
    LinksComponent
  ]
})

export class CommonComponentsModule { }
