import { NgModule }             from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {PivotComponent} from './pivot/pivot.component';
import {ActiveTableComponent} from './active_table/active-table.component';
import {SingleDocumentComponent} from './single_document/single-document.component';
import {CommonComponentsModule} from '../';
import { FormsModule } from '@angular/forms';
import { QueryComponent, FilterComponent, DocumentInfoComponent, DocumentPreviewComponent } from './query';
import {BrowserModule} from '@angular/platform-browser';
import { PerfectScrollbarModule } from 'angular2-perfect-scrollbar';

const viewsRoutes: Routes = [
  {
    path: 'views',
    data: {
      id: 'views',
      title: 'Views',
      icon: 'fa-eye',
      collapsed: true,
    },
    children: [
      {
        path: 'pivot',
        component: PivotComponent,
        data:
        {
          id: 'pivot', title: 'Pivot', icon: 'fa-plus'
        },
        children: []
      },
      {
        path: 'query',
        component: QueryComponent,
        data: {
          id: 'query', title: 'Query builder', icon: 'fa-th-list', contentUrl: '/data/queries.json'
        },
        children: []
      },
      {
        path: 'active_table',
        component: ActiveTableComponent,
        data: {
          id: 'active_table', title: 'Active table', icon: 'fa-table'
        },
        children: []
      },
      {
        path: 'single_document',
        component: SingleDocumentComponent,
        data: {
          id: 'single_document', title: 'Single document', icon: 'fa-folder-open-o'
        },
        children: []
      }
    ]
  }
];

@NgModule({
  imports: [
    CommonComponentsModule,
    BrowserModule,
    PerfectScrollbarModule,
    FormsModule,
    RouterModule.forChild(viewsRoutes)
  ],
  declarations: [
    PivotComponent,
    QueryComponent,
    ActiveTableComponent,
    SingleDocumentComponent,
    FilterComponent,
    DocumentPreviewComponent,
    DocumentInfoComponent
  ],
  exports: [
    FilterComponent
  ]
})
export class ViewsModule { }
