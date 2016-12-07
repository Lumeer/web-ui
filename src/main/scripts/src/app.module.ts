import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LeftPanelComponent } from './viewport/left-panel.component';
import {ContentComponent} from './viewport/content.component';
import {TopPanelComponent} from './viewport/top-panel.component';
import {ViewPortComponent} from './viewport/viewport.component';
import {SocketService} from './services/socket.service';
import { RouterModule, Routes } from '@angular/router';
import {FormsModule} from './components/forms/forms.module';
import {ViewsModule} from './components/views/views.module';
import {HomeComponent} from './viewport/home.component';
import {BreadcrumbService} from './services/breadcrumb.service';

const appRoutes: Routes = [
  { path: '', component: HomeComponent}
];

@NgModule({
  imports:      [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    ViewsModule,
    FormsModule
  ],
  providers: [
    SocketService,
    BreadcrumbService
  ],
  declarations: [
    ViewPortComponent,
    ContentComponent,
    LeftPanelComponent,
    TopPanelComponent,
    HomeComponent
  ],
  bootstrap:    [ ViewPortComponent]
})
export class AppModule {}
