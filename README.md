# 拾级 · starbfls 的 3D 个人空间

一个运行时无需后端、无需安装依赖、无需 CDN 的静态网站原型。所有建筑、家具和示意画作均由代码生成；没有使用外部照片。

## 本地打开

Windows 安装 Node.js 后，双击 `start.cmd`，保持启动窗口打开。也可以在本目录执行：

```sh
node server.mjs
```

浏览器访问 http://localhost:4173 。请使用 HTTP 预览，不要直接双击 `index.html`，因为浏览器会限制本地 ES 模块读取。

## 操作

- 拖动鼠标或单指滑动：在中庭绕楼梯旋转，在房间里环顾。
- 滚轮：在中庭上下移动；房间里前后移动。触屏也可用双指纵向移动。
- 点击实际房门、房门标签或底部楼层按钮：从中庭沿楼梯移动到门前，门扇绕铰链打开，然后镜头连续穿过门洞。
- 点击画作：查看大图。图片均为程序绘制的示意图。
- “返回回廊” / ESC：离开房间。移动中 ESC 会取消旅程，并平滑返回建筑总览。
- 方向键：中庭旋转/上下移动；房间内环顾/前后移动。

## 三个示意房间

1. 栖木书房：木地板、书架、桌椅、暖灯和绿植。
2. 留光展厅：浅色墙面、四幅示意画作、展厅长凳。
3. 深夜实验室：深色网格地面、蓝粉灯带、双屏工作台。

## 代码结构

```text
app.js                 初始化场景、连接模块、启动渲染循环
engine.js              WebGL 渲染、批处理、投影与射线拾取
js/
  config.js            楼层参数和房间名称、介绍、配色
  spatial.js           中庭与房间的坐标换算
  scene.js             建筑、门扇、家具和示意画作建模
  navigation.js        镜头状态、行进路径、开关门和返回
  controls.js          鼠标、触屏、滚轮和键盘事件
  ui.js                楼层导航、门口标签、房间介绍与弹窗
  engine/
    math.js            向量和矩阵
    geometry.js        方块、环形和管状几何体
    materials.js       颜色和材质
    shaders.js         顶点与片元着色器
scripts/check.mjs      检查全部 JavaScript 模块的语法
index.html             页面结构和弹窗
style.css              响应式界面样式
server.mjs             本地静态预览服务器
```

修改房间内容从 `js/config.js` 的 `ROOM_DEFINITIONS` 开始；楼高由 `FLOOR_HEIGHT` 控制，楼梯起始方位由 `STAIR_START_ANGLE` 控制。

家具与装饰分别在 `js/scene.js` 的 `furnishStudy()`、`furnishGallery()`、`furnishLab()` 中；`createArtwork()` 绘制示意画，`addArtworkFrame()` 将画作挂到墙上。镜头路线和 `room.door` 的动画在 `js/navigation.js` 中维护；输入的移动速度和范围在 `js/controls.js` 中调整。

## 整理和检查代码

本地预览仍可直接运行 `node server.mjs` 或双击 `start.cmd`，无需安装依赖。只有需要自动排版时才安装开发工具：

```powershell
New-Item -ItemType Directory -Path .local/tmp -Force | Out-Null
$env:TEMP = "$PWD\.local\tmp"
$env:TMP = $env:TEMP
$env:TMPDIR = $env:TEMP
$env:npm_config_cache = "$PWD\.local\npm-cache"
npm ci
npm run format
npm run format:check
npm run check
```

Prettier 只用于开发，不会随网页加载。格式约定见 `.prettierrc.json`：两个空格缩进、单引号、分号、100 字符目标行宽。`.local/`、`node_modules/` 和自动生成的锁文件不参与排版。

## 工作目录

原型已完整复制并核验到 `D:\web\myweb\starbfls.github.io\`，后续统一在本目录开发。现有 Git 元数据已保留，尚未提交或推送。

双击 `start.cmd` 启动本地预览，然后手动打开 http://localhost:4173 。启动脚本将临时目录设为本项目的 `.local/tmp`，npm 缓存设为 `.local/npm-cache`；这些目录不会提交到 Git。无需安装任何依赖。

也可以使用 `npm run dev` 启动、`npm run check` 检查模块语法。工作约定见 `AGENTS.md`。

复制核验记录位于 `.local/prototype-copy-manifest.json`。复制后已修复 `app.js` 中重复的 `art` 和 `frame` 声明。

## GitHub Pages

保留仓库根目录的 `index.html`、`style.css`、`app.js`、`engine.js`，以及完整的 `js/` 目录，再提交用于发布的文件。在仓库 Settings → Pages 中，选择从 `main` 分支的根目录发布。所有路径均为相对路径，也可放到项目子目录。无需构建和数据库。

## 原型边界

这是建筑与交互验证版本，不是写实建筑模型。支持碰撞路径预设、真实门洞与铰链动画；没有物理引擎和键盘自由漫游。常规进入路线经过地面入口、螺旋台阶、桥面和回廊；返回采用连续的中庭飞行镜头。中途取消会平滑返回总览，不保证取消路径避开所有几何体。启用系统“减少动态效果”时，旅程时间减半，仍保留连续移动。

需要支持 WebGL 的浏览器。无网络请求、账号功能和服务器端上传。所有展示内容公开前，请自行替换和确认。
