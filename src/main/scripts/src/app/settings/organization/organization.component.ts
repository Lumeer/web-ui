/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, OnInit} from '@angular/core';
import {OrganizationService} from './organization.service';
import {ActivatedRoute} from '@angular/router';
import {Location} from '@angular/common';

import {Organization} from '../../shared/organization';

@Component({
  selector: 'organization',
  template: require('./organization.component.html'),
  styles: [require('./organization.component.scss').toString()]
})
export class OrganizationComponent implements OnInit {

  private organization: Organization;
  private orgCode: string;

  constructor(private organizationService: OrganizationService,
              private route: ActivatedRoute,
              private location: Location) {
  }

  public ngOnInit(): void {
    this.organization = new Organization();
    this.route.params.subscribe(params => {
      this.orgCode = params['code'];
      if (this.orgCode) {
        this.organizationService.getOrganization(this.orgCode)
          .subscribe((organization: Organization) => this.organization = organization);
      }
    });
  }

  public onSave() {
    if (this.orgCode) {
      this.organizationService.editOrganization(this.orgCode, this.organization);
    } else {
      this.organizationService.createOrganization(this.organization);
    }
    this.location.back();
  }

  public onCancel() {
    this.location.back();
  }

  public onDelete() {
    this.organizationService.deleteOrganization(this.orgCode);
    this.location.back();
  }

}
