import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LeftPanelComponent, ContentComponent, TopPanelComponent, ViewPortComponent, HomeComponent} from './viewport';
import {RouterModule, Routes} from '@angular/router';
import {SettingsModule, ViewsModule} from './components';
import {FormsModule} from '@angular/forms';
import {KeycloakService, BreadcrumbService, SocketService, DocumentInfoService, KeycloakHttp} from './services';
import {Http, XHRBackend, RequestOptions} from '@angular/http';
import {Ng2Webstorage} from 'ng2-webstorage';
import {NavigationChildrenService} from './services/navigation-children.service';
import {DocumentService} from './services/document.service';
import {CommonComponentsModule} from './components/common/common-components.module';
import {QueryTagService} from './services/query-tags.service';

const appRoutes: Routes = [
  {path: '', component: HomeComponent}
];

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    ViewsModule,
    FormsModule,
    Ng2Webstorage,
    SettingsModule,
    CommonComponentsModule
  ],
  providers: [
    SocketService,
    NavigationChildrenService,
    DocumentService,
    DocumentInfoService,
    BreadcrumbService,
    QueryTagService,
    {
      provide: Http,
      useFactory: (backend: XHRBackend,
                   defaultOptions: RequestOptions,
                   keycloakService: KeycloakService) => new KeycloakHttp(backend, defaultOptions, keycloakService),
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
  bootstrap: [ViewPortComponent]
})
export class AppModule {
}
