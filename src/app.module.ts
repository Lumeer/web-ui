import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {LeftPanelComponent} from './viewport/left-panel.component';
import {ContentComponent} from './viewport/content.component';
import {TopPanelComponent} from './viewport/top-panel.component';
import {ViewPortComponent} from './viewport/viewport.component';
import {Socket} from './services/socket.service';

@NgModule({
  imports:      [
    BrowserModule,
  ],
  providers: [Socket],
  declarations: [
    ViewPortComponent,
    ContentComponent,
    LeftPanelComponent,
    TopPanelComponent
  ],
  bootstrap:    [ ViewPortComponent]
})
export class AppModule {}
