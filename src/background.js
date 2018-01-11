let lastRequestId;
let proxyConfig = {};
window.urls = []; // for cache

chrome.storage.sync.get('config', (result) => {
  try {
    proxyConfig = JSON.parse(result.config);
  } catch (e) {}
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.config) {
    try {
      proxyConfig = JSON.parse(changes.config.newValue);
    } catch (e) {}
  }
});

const redirectToMatchingRule = (details) => {
  const rules = proxyConfig.proxy;
  try {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (rule && rule[0]) {
        const reg = new RegExp(rule[0]);
        if (reg.test(details.url) && details.requestId !== lastRequestId) {
          lastRequestId = details.requestId;
          return {
            redirectUrl: details.url.replace(reg, rule[1]),
          };
        }
      }
    }
  } catch (e) {
    return {};
  }
};

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (/http(s?):\/\//i.test(details.url) && window.urls.indexOf(details.url) < 0) {
      window.urls.push(details.url);
    }
    return redirectToMatchingRule(details);
  },
  {
    urls: ['<all_urls>'],
  },
  ['blocking'],
);