import { NgModule }             from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AnalyticsComponent} from './analytics/analytics.component';
import {ReportComponent} from './report/report.component';

const formsRoutes: Routes = [
  {
    path: 'forms',
    data: {
      id: 'forms',
      title: 'Forms',
      icon: 'fa-pencil-square-o',
      collapsed: true,
    },
    children: [
      {
        path: 'analytic',
        component: AnalyticsComponent,
        data: {
          id: 'analytic', title: 'Analytics', icon: 'fa-lightbulb-o'
        },
        children: []
      },
      {
        path: 'report',
        component: ReportComponent,
        data: {
          id: 'report', title: 'Report', icon: 'fa-area-chart'
        },
        children: []
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(formsRoutes)
  ],
  declarations: [
    AnalyticsComponent,
    ReportComponent
  ]
})
export class LumFormsModule { }
