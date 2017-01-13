import {NgModule} from '@angular/core';
import {TagInputComponent} from './tag-input/tag-input.component';
import {BrowserModule} from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {HttpModule} from '@angular/http';
import {AutoCompleteComponent} from './auto-complete/auto-complete.component';
import {EditableDirective} from './auto-complete/editable.directive';
import {FilterInput} from './tag-input/filter-input.component';
import {FilterComponent} from './tag-input/filter.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  declarations: [
    TagInputComponent,
    AutoCompleteComponent,
    EditableDirective,
    FilterInput,
    FilterComponent
  ],
  exports: [
    TagInputComponent,
    AutoCompleteComponent,
    FilterInput,
    FilterComponent
  ]
})

export class CommonComponentsModule { }
