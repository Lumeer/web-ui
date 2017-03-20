import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LeftPanelComponent, ContentComponent, TopPanelComponent, ViewPortComponent, HomeComponent} from './viewport';
import {RouterModule, Routes} from '@angular/router';
import {SettingsModule, ViewsModule} from './components';
import {FormsModule} from '@angular/forms';
import {
  KeycloakService, BreadcrumbService, SocketService, DocumentInfoService, KeycloakHttp, KEYCLOAK_HTTP_PROVIDER
} from './services';
import {Ng2Webstorage} from 'ng2-webstorage';
import {NavigationChildrenService} from './services/navigation-children.service';
import {DocumentService} from './services/document.service';
import {CommonComponentsModule} from './components/common/common-components.module';
import {QueryTagService} from './services/query-tags.service';
import { DragScrollModule } from 'angular2-drag-scroll';
import {DocumentNavigationService} from './services/document-navigation.service';

const appRoutes: Routes = [
  {path: '', redirectTo: '/views/pick_item', pathMatch: 'full'}
];

@NgModule({
  imports: [
    DragScrollModule,
    BrowserModule,
    RouterModule.forRoot(appRoutes, { useHash: true }),
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
    KeycloakService,
    KeycloakHttp,
    DocumentNavigationService,
    KEYCLOAK_HTTP_PROVIDER
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
