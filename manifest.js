import packageJson from './package.json' assert { type: 'json' };

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = {
  manifest_version: 3,
  name: "VSX Extension - Helper in sidebar",
  version: packageJson.version,
  description: packageJson.description,
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvybZj0roZMxoxcTwC4zcqkZdEO8M1XXzBAgwnDPU2QZOdd2rfmATPPQ+5LBC8MDVxnMro0QZFITqEkL6jPp6/texefzwK1g6b+WXqRIyskx9kYLu88bp6YQcagIoPyajTXmWbgNnIoeDQr59oUVsOdjJ7ZM/p++5bEESA7f2g7WX6wVn669kmQ5TJhd1Bc2juY7RN1Sii4EA1lc1rmktbaa4Pp/WABKX2spGldxFIPprEB9q3+vtNyPK9x9Yrb7vMhtliJEvfz+kMtsI1iRzpeqkiq6xQEV7jUHOvVApZltyC0bSmyQDmjD0lL7nL3bmN7KynTDLxSMwTmrNdBn/4wIDAQAB",
  oauth2: {
    client_id: "843366294780-kb7v3ndujfimi1rvhlar7ii20qg4qcb9.apps.googleusercontent.com",
    scopes:["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"]
  },
  permissions: ['storage', 'sidePanel', "identity"],
  side_panel: {
    default_path: 'src/pages/sidepanel/index.html',
  },
  options_page: 'src/pages/options/index.html',
  background: {
    service_worker: 'src/pages/background/index.js',
    type: 'module',
  },
  action: {
    default_popup: 'src/pages/popup/index.html',
    default_icon: 'icon-34.png',
  },
  // chrome_url_overrides: {
  //   newtab: 'src/pages/newtab/index.html',
  // },
  icons: {
    128: 'icon-128.png',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      js: ['src/pages/content/index.js'],
      // KEY for cache invalidation
      css: ['assets/css/contentStyle<KEY>.chunk.css'],
    },
  ],
  devtools_page: 'src/pages/devtools/index.html',
  web_accessible_resources: [
    {
      resources: ['assets/js/*.js', 'assets/css/*.css', 'icon-128.png', 'icon-34.png', 'assets/img/*'],
      matches: ['*://*/*', "<all_urls>"],
    },
  ],
};

export default manifest;
