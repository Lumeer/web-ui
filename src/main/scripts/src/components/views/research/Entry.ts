export class Entry {

  private key: String;
  private value: any;
  private nested: boolean;

  constructor(key:string, value:any, nested:boolean) {
    this.key = key;
    this.value = value;
    this.nested = nested;
  }
}
