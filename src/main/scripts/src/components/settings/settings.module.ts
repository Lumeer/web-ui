import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {CollectionsComponent} from './collections/collections.component';
import {SystemComponent} from './system/system.component';
import {ProfileComponent} from './profile/profile.component';

const formsRoutes: Routes = [
  {
    path: 'settings',
    data: {
      id: 'settings',
      title: 'Settings',
      icon: 'fa-cog',
      collapsed: true,
    },
    children: [
      {
        path: 'collections',
        component: CollectionsComponent,
        data: {
          id: 'collections', title: 'Collections', icon: 'fa-server'
        },
        children: []
      },
      {
        path: 'system',
        component: SystemComponent,
        data: {
          id: 'system', title: 'System', icon: 'fa-tachometer'
        },
        children: []
      }
      ,
      {
        path: 'profile',
        component: ProfileComponent,
        data: {
          id: 'profile', title: 'Profile', icon: 'fa-folder'
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
    CollectionsComponent,
    SystemComponent,
    ProfileComponent
  ]
})
export class SettingsModule {
}
