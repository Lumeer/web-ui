import { NgModule }             from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {PivotComponent} from './pivot/pivot.component';
import {QueryComponent} from './query/query.component';

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
          id: 'query', title: 'Query', icon: 'fa-th-list'
        },
        children: []
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(viewsRoutes)
  ],
  declarations: [
    PivotComponent,
    QueryComponent
  ]
})
export class ViewsModule { }
