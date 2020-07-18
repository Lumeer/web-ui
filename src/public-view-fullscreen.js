if (typeof lumeer_public_view_fullscreen_fce !== 'function') {
  function lumeer_public_view_fullscreen_fce() {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const language = params.get('l');

    params.set('tp', 'true');

    let publicViewCdn;

    if (language === 'cs') {
      publicViewCdn = `https://d2b894al51csxx.cloudfront.net/cs/index.html`;
    } else {
      publicViewCdn = `https://d2b894al51csxx.cloudfront.net/en/index.html`;
    }

    const queryParamsArray = [];
    const iterator = params.keys();
    let result = iterator.next();
    while (!result.done) {
      const val = result.value.replace(/^_/, '');
      queryParamsArray.push(`${val}=${params.get(result.value)}`);
      result = iterator.next();
    }

    const queryParams = queryParamsArray.join('&');
    const div = document.createElement('div');
    div.style = 'width:100%; height: 100%';
    div.innerHTML = `
      <iframe src="${publicViewCdn}?${queryParams}" width="100%" height="100%" style="min-height: 50px; box-sizing: border-box; border: 0;">
      </iframe>
    </div>
    `;

    document.currentScript.parentElement.appendChild(div);
  }
}

lumeer_public_view_fullscreen_fce();
