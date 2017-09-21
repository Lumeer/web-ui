import { LumeerUiPage } from './app.po';

describe('lumeer-ui App', () => {
  let page: LumeerUiPage;

  beforeEach(() => {
    page = new LumeerUiPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
