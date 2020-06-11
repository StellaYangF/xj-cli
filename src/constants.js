const { version: VERSION } = require('../package.json');
const DOWNLOAD_DIRECTORY = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`
const GIT_REPO_API = 'https://api.github.com/orgs/xj-cli/repos';

module.exports = {
  VERSION,
  GIT_REPO_API,
  DOWNLOAD_DIRECTORY,
};
