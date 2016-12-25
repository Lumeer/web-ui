import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LeftPanelComponent, ContentComponent, TopPanelComponent, ViewPortComponent, HomeComponent } from './viewport';
import { RouterModule, Routes } from '@angular/router';
import {LumFormsModule, ViewsModule} from './components';
import {FormsModule} from '@angular/forms';
import {KeycloakService, BreadcrumbService, SocketService, DocumentInfoService, KeycloakHttp} from './services';
import {Http, XHRBackend, RequestOptions} from '@angular/http';

const appRoutes: Routes = [
  { path: '', component: HomeComponent}
];

@NgModule({
  imports:      [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    ViewsModule,
    FormsModule,
    LumFormsModule
  ],
  providers: [
    SocketService,
    DocumentInfoService,
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
  bootstrap:    [ ViewPortComponent ]
})
export class AppModule {}
