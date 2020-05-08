# 实现简易的 CLI
`CLI` 全称 `command-line interface` 命令行界面，通常不支持鼠标，用户通过**键盘**输入指令，计算机收到指令，予以执行。

本文结合 `vue-cli`，`create-react-app` 即 **Vue 脚手架**，定制个人项目脚手架，快速创建初始化文件。

定制脚手架初衷：
1. 快速搭建项目初始化文件；
2. 统一代码规范。

> Tip: 文章旨在记录个人开发 `cli` 的经验。后续文章提及的 `xj-cli` 为个人开发脚手架示例，可在 [npm](https://www.npmjs.com/) 上 download 之后，就能快速生成项目。

## xj-cli
开发之前，需创建一个 Github 组织 **organization** 账户（如果你有，即可跳过）。先创建一个普通 Github 账户，并升级为 **organization** 组织账户，后续会将个人初始化后的项目放入该组织账户下，供脚手架逻辑使用。

### 下载依赖包
- `axios`: http 库
- `commander`: 命令行参数解析
- `consolidate`: 统一模板引擎
- `download-git-repo`: 下载并提取出 Git 仓库代码
- `ejs`: 模板引擎
- `inquirer`: 交互式命令行，实现命令行选择功能
- `metalsmith`: 极简、插件化的静态站点生成器

**Metalsmith** (译自官网)
为什么 `Metalsmith` 是一个插件化的静态站点生成器？
1. 从事源码目录中读取源文件，抽取信息；
2. 可操作抽取的信息；
3. 将操作后的信息写入文件，最后移至目标目录。

### 初始化 package.json
```json
"bin": {
  "xj-cli": "./bin/www"
},
```
> Tip: **bin** 属性是为包增加一个