import {NgModule} from '@angular/core';
import {TagInputComponent} from './tag-input/tag-input.component';
import {BrowserModule} from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Ng2AutoCompleteModule } from 'ng2-auto-complete';
import {HttpModule} from '@angular/http';
import {AutoCompleteComponent} from './auto-complete/auto-complete.component';
import {LumEditable} from './auto-complete/lum-editable';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    Ng2AutoCompleteModule,
    HttpModule
  ],
  declarations: [
    TagInputComponent,
    AutoCompleteComponent,
    LumEditable
  ],
  exports: [
    TagInputComponent,
    AutoCompleteComponent
  ]
})
export class CommonComponentsModule { }
