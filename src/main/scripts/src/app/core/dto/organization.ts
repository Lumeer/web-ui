import {Project} from './project';

export class Organization {

  public code: string = '';
  public name: string = '';
  public color: string = '';
  public icon: string = '';
  public index?: number;
  public projects?: Project[];
  public active?: boolean;

}
