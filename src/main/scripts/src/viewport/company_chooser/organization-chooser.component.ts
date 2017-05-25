import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';
import {OrganizationProject} from '../../services/organization-project.service';

@Component({
  selector: 'organization-chooser',
  template: require('./organization-chooser.component.html'),
  styles: [require('./organization-chooser.component.scss').toString()],
  animations: [
    trigger('animateHeight', [
      state('in', style({height: '*'})),
      transition('void => *', [
        animate(500, keyframes([
          style({height: 0, offset: 0}),
          style({height: '*', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(500, keyframes([
          style({height: '*', offset: 0}),
          style({height: 0, offset: 1})
        ]))
      ])
    ])
  ]
})
export class OrganizationChooser {

  public readonly squareSize: number = 170;
  @ViewChild('comps') public companiesEl: any;
  @ViewChild('projs') public projectsEl: any;
  @Output() public saveAction: EventEmitter<any> = new EventEmitter();
  public activeOrganization: any;
  public activeProject: any;
  public organizationsWidth: number = 0;
  public projectsWidth: number = 0;
  public activeOrgIndex: number;

  constructor(public organizationProject: OrganizationProject) {
  }

  public ngOnInit() {
    if (this.organizationProject.oganizations) {
      this.organizationsWidth = this.organizationProject.oganizations.length * this.squareSize;
      this.projectsWidth = this.organizationProject.activeOrganization.projects.length * this.squareSize;
      this.activeOrganization = this.organizationProject.activeOrganization;
      this.activeOrgIndex = this.organizationProject.activeOrgIndex;
      this.activeProject = this.organizationProject.activeProject;
    } else {
      this.organizationProject.fetchOrganizations()
        .subscribe(data => {
          this.organizationProject.oganizations = data;
          this.organizationsWidth = this.organizationProject.oganizations.length * this.squareSize;
        });
    }
  }

  public onOrganizationSelected(organization: any, index: number) {
    this.organizationProject.oganizations.forEach((org: any) => org.active = false);
    organization.active = true;
    this.activeOrgIndex = index;
    if (this.activeOrganization && this.activeOrganization.projects) {
      this.activeOrganization.projects.forEach((project: any) => project.active = false);
    }
    if (organization.projects) {
      this.projectsWidth = organization.projects.length * this.squareSize;
    } else {
      this.organizationProject.fetchProjects(organization.code)
        .subscribe(projects => {
          organization.projects = projects;
          this.projectsWidth = projects.length * this.squareSize;
        });
    }
    this.activeOrganization = organization;
    this.activeProject = undefined;
  }

  public onProjectSelected(project: any, index: number) {
    this.activeOrganization.projects.forEach((oneProject: any) => oneProject.active = false);
    this.activeProject = project;
    this.activeProject.active = true;
  }

  public onScrollOrganizations(toRight?: boolean) {
    if (toRight) {
      this.companiesEl.scrollToLeft(this.companiesEl.elementRef.nativeElement.scrollLeft + this.squareSize);
    } else {
      this.companiesEl.scrollToLeft(this.companiesEl.elementRef.nativeElement.scrollLeft - this.squareSize);
    }
  }

  public onScrollProjects(toRight?: boolean) {
    if (toRight) {
      this.projectsEl.scrollToLeft(this.projectsEl.elementRef.nativeElement.scrollLeft + this.squareSize);
    } else {
      this.projectsEl.scrollToLeft(this.projectsEl.elementRef.nativeElement.scrollLeft - this.squareSize);
    }
  }

  public saveActiveItems() {
    if (this.activeOrganization && this.activeProject) {
      this.organizationProject.activeOrgIndex = this.activeOrgIndex;
      this.organizationProject.activeOrganization = this.activeOrganization;
      this.organizationProject.activeProject = this.activeProject;
      this.saveAction.next();
    }
  }
}
