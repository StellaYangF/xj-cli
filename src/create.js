const axios = require('axios');
const ora = require('ora');
const Inquirer = require('inquirer');
let downloadGitRepo = require('download-git-repo');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const MetalSmith = require('metalsmith');
let { render } = require('consolidate').ejs;
const ncp = require('ncp');
const { downloadDirectory } = require('./constants');

render = promisify(render);
downloadGitRepo = promisify(downloadGitRepo);

const fetchRepoList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/xj-cli/repos');
  return data;
};

const fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/xj-cli/${repo}/tags`);
  return data;
};

const waitFnLoading = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start();
  const result = await fn(...args);
  spinner.succeed();
  return result;
};

const download = async (repo, tag) => {
  let api = `xj-cli/${repo}`;
  if (tag) {
    api += `#${tag}`;
  }
  const dest = `${downloadDirectory}/${repo}`;
  await downloadGitRepo(api, dest);
  return dest;
};

function checkProjectName(projectName) {
  if (!projectName) {
    console.error('请输入要创建的项目名称');
    return false;
  }
  return true;
}

module.exports = async (projectName) => {
  if (!checkProjectName(projectName)) return;

  let repos = await waitFnLoading(fetchRepoList, 'fetching template...')();
  repos = repos.map((item) => item.name);
  const { repo } = await Inquirer.prompt({
    name: 'repo',
    type: 'list',
    message: 'please choose a template to create project',
    choices: repos,
  });
  let tags = await waitFnLoading(fetchTagList, 'fetching tags...')(repo);
  tags = tags.map((item) => item.name);

  const { tag } = await Inquirer.prompt({
    name: 'tag',
    type: 'list',
    message: 'please choose a template to create project',
    choices: tags,
  });

  const result = await waitFnLoading(download, 'downloading template')(repo, tag);
  if (!fs.existsSync(path.join(result, 'ask.js'))) {
    await ncp(result, path.resolve(projectName));
  } else {
    await new Promise((resolve, reject) => {
      MetalSmith(__dirname)
        .source(result)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          const args = require(path.join(result, 'ask.js'));
          const obj = await Inquirer.prompt(args);
          const meta = metal.metadata();
          Object.assign(meta, obj);
          Reflect.deleteProperty(files, 'ask.js');
          done();
        })
        .use((files, metal, done) => {
          const obj = metal.metadata();
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString();
              if (content.includes('<%')) {
                content = await render(content, obj);
                files[file].contents = Buffer.from(content);
              }
            }
          });
          done();
        })
        .build((err) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        })
    });
  }
};
