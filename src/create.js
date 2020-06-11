const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const axios = require('axios');
const ora = require('ora'); // 拉取信息 loading
const Inquirer = require('inquirer');
let downloadGitRepo = require('download-git-repo');
const MetalSmith = require('metalsmith');
let { render } = require('consolidate').ejs;
const ncp = require('ncp'); // 异步赋值文件及文件目录
const { DOWNLOAD_DIRECTORY, GIT_REPO_API } = require('./constants');

render = promisify(render);
downloadGitRepo = promisify(downloadGitRepo);

/**
 * 拉取远程仓库代码
 */
const fetchRepoList = async () => {
  const { data } = await axios.get(GIT_REPO_API);
  return data;
};

/**
 * 拉取选中项目对应的标签列表
 * @param {string} repo 获取远程仓库名
 */
const fetchTagList = async repo => {
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
  const dest = `${DOWNLOAD_DIRECTORY}/${repo}`;
  await downloadGitRepo(api, dest); // 拉取放置在缓存目录下
  return dest;
};

function checkProjectName(projectName) {
  if (!projectName) {
    console.error('请输入要创建的项目名称');
    return false;
  }
  return true;
}

module.exports = async projectName => {
  if (!checkProjectName(projectName)) return;

  let repos = await waitFnLoading(fetchRepoList, '正在拉取远程仓库……')();
  // 映射所有仓库名称
  repos = repos.map((item) => item.name);
  // 获取用户选择的仓库名
  const { repo } = await Inquirer.prompt({
    name: 'repo',
    type: 'list',
    message: 'please choose a template to create project',
    choices: repos,
  });

  let tags = await waitFnLoading(fetchTagList, '正在拉取仓库标签列表……')(repo);
  // 映射仓库所有 tag 名
  tags = tags.map((item) => item.name);
  const { tag } = await Inquirer.prompt({
    name: 'tag',
    type: 'list',
    message: 'please choose a template to create project',
    choices: tags,
  });

  const result = await waitFnLoading(download, `下载 ${repo} 模板……`)(repo, tag);
  if (!fs.existsSync(path.join(result, 'ask.js'))) {
    await ncp(result, path.resolve(projectName)); // 将已缓存的目录直接拷贝到当前创建的目录下
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
