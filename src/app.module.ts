import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {LeftPanelComponent} from './viewport/left-panel.component';
import {ContentComponent} from './viewport/content.component';
import {TopPanelComponent} from './viewport/top-panel.component';

@NgModule({
  imports:      [
    BrowserModule,
  ],
  declarations: [ ContentComponent, LeftPanelComponent, TopPanelComponent ],
  bootstrap:    [ ContentComponent, LeftPanelComponent, TopPanelComponent]
})
export class AppModule {}
