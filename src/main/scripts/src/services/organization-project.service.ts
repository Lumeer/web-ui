import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Subject} from 'rxjs';

@Injectable()
export class OrganizationProject {
  public activeOrgIndex: number;
  public activeOrganization: any;
  public activeProject: any;
  public oganizations: any;
  public organizationOrProjectSubject: Subject<any> = new Subject();

  constructor(private http: Http) {
  }

  public fetchActiveCompany() {
    this.http.get(`${window['lumeer'].constants.publicPath}/data/activecompany.json`)
      .map(res => res.json())
      .subscribe(data => {
        this.activeOrganization = data;
        this.organizationOrProjectSubject.next(data);
      });
  }

  public fetchActiveProject() {
    this.http.get(`${window['lumeer'].constants.publicPath}/data/activeproject.json`)
      .map(res => res.json())
      .subscribe(data => {
        this.activeProject = data;
        this.organizationOrProjectSubject.next(data);
      });
  }

  public fetchOrganizations() {
    return this.http.get(`/lumeer-engine/rest/organizations`)
      .map(res => res.json());
  }

  public fetchProjects(organization: string) {
    return this.http.get(`/lumeer-engine/rest/` + organization + `/projects`)
      .map(res => res.json());
  }
}
