import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LeftPanelComponent, ContentComponent, TopPanelComponent, ViewPortComponent, HomeComponent } from './viewport';
import {SocketService} from './services/socket.service';
import { RouterModule, Routes } from '@angular/router';
import {FormsModule, ViewsModule} from './components';
import {BreadcrumbService, KeycloakHttp, KeycloakService} from './services';
import {XHRBackend, RequestOptions, Http} from '@angular/http';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

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
    BreadcrumbService,
    {
      provide: Http,
      useFactory:
        (
          backend: XHRBackend,
          defaultOptions: RequestOptions,
          keycloakService: KeycloakService
        ) => new KeycloakHttp(backend, defaultOptions, keycloakService),
      deps: [XHRBackend, RequestOptions, KeycloakService]
    },
    KeycloakService
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
