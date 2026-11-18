# 拾级 · starbfls 的 3D 个人空间

一个由 3D 回廊入口和静态房间内页组成的个人网站。运行时无需后端、无需安装依赖、无需 CDN。建筑、家具和静态房间插画均由代码绘制；尚未添加真实照片和音乐。

## 本地打开

Windows 安装 Node.js 后，双击 `start.cmd`，保持启动窗口打开。也可以在本目录执行：

```sh
node server.mjs
```

浏览器访问 http://localhost:4173 。请使用 HTTP 预览，不要直接双击 `index.html`，因为浏览器会限制本地 ES 模块读取。

## 操作

- 拖动鼠标或单指滑动：在中庭绕楼梯旋转，在实验室的 3D 原型里环顾。
- 滚轮：在中庭上下移动；实验室原型里前后移动；静态内页正常滚动。触屏也可用双指纵向移动。
- 点击实际房门、房门标签或底部楼层按钮：直接平滑移动到门前并停留，完整观察门框与两侧外墙。
- 门前再次点击门扇或底部“开门”按钮：门扇缓慢打开，镜头穿过门洞后进入对应页面。书房和展厅使用独立静态内页，实验室保留原型。
- 点击画作：查看大图。图片均为程序绘制的示意图。
- “返回回廊” / ESC：离开房间。移动中 ESC 会取消旅程，并平滑返回建筑总览。
- 方向键：中庭旋转/上下移动；房间内环顾/前后移动。

## 三个示意房间

1. 栖木书房：古典艺术风格的静态书房、完整木质书桌、三本可放大旋转查看封面的日记、照片墙，以及右下角留声机。
2. 留光展厅：现代美术馆风格的静态展厅、六个空白画框、轨道灯和长凳，等待实际照片。
3. 深夜实验室：暂不新增静态内页，保留原来的 3D 原型。

## 代码结构

```text
app.js                 初始化场景、连接模块、启动渲染循环
engine.js              WebGL 渲染、批处理、投影与射线拾取
js/
  config.js            楼层参数和房间名称、介绍、配色
  pages/
    study.js           书架选择、书本放大旋转与封面展示
    gallery.js         空白画框和照片展示
    photos.js          每本日记的照片墙
    photo-viewer.js    已配置照片的大图查看器
    record-player.js   留声机和音乐预留
    collections.js    相册、照片和音乐配置
  spatial.js           中庭与房间的坐标换算
  scene.js             建筑、门扇、家具和示意画作建模
  navigation.js        总览、门前停留、开门进入和返回
  controls.js          鼠标、触屏、滚轮和键盘事件
  ui.js                楼层导航、门口标签、房间介绍与弹窗
  engine/
    math.js            向量和矩阵
    geometry.js        方块、环形和管状几何体
    materials.js       颜色和材质
    shaders.js         顶点与片元着色器
scripts/check.mjs      检查全部 JavaScript 模块的语法
study.html             古典书房静态内页
gallery.html           现代美术馆静态内页
photos.html            日记中的照片墙
styles/                房间共享样式和各页面样式
assets/                本地 SVG 插画、照片和音乐目录
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

保留仓库根目录的 `index.html`、`style.css`、`app.js`、`engine.js`，以及 `study.html`、`gallery.html`、`photos.html` 和完整的 `js/`、`styles/`、`assets/` 目录，再提交用于发布的文件。在仓库 Settings → Pages 中，选择从 `main` 分支的根目录发布。所有路径均为相对路径，也可放到项目子目录。无需构建和数据库。

## 原型边界

这是建筑与交互验证版本，不是写实建筑模型。支持碰撞路径预设、真实门洞与铰链动画；没有物理引擎和键盘自由漫游。楼层切换采用直接的镜头过渡，不再播放上楼和绕行动画；门前会等待用户主动开门，房间内部始终在同一个场景里。中途取消会平滑返回总览，不保证取消路径避开所有几何体。启用系统“减少动态效果”时，旅程时间减半，仍保留连续移动。

需要支持 WebGL 的浏览器。无网络请求、账号功能和服务器端上传。所有展示内容公开前，请自行替换和确认。

门前视角在 `js/navigation.js` 的 `doorway()` 中调整；开门时长由 `DOOR_OPEN_DURATION` 控制。三个房间的外立面分别在 `js/scene.js` 的 `decorateStudyFacade()`、`decorateGalleryFacade()`、`decorateLabFacade()` 中定义。

## 静态房间内页

- `http://localhost:4173/study.html`：书房；点击三本金边日记中的任意一本，书本会放大旋转展示封面，再点击封面或“翻开相册”进入照片墙。
- `http://localhost:4173/gallery.html`：展厅；六个画框目前保持空白，不使用示意照片冒充实际作品。
- `http://localhost:4173/photos.html?album=travel`：旅行日记照片墙；其他相册为 `days` 和 `light`。

书房和展厅均可独立访问，也已接入 3D 中庭的开门流程。静态页面上的“返回回廊”会回到对应房间门前。实验室暂不新增内页。

### 添加照片

把照片放入 `assets/photos/`，再编辑 `js/pages/collections.js`。相册的 `photos` 数组可使用：

```js
{
  src: './assets/photos/travel-01.jpg',
  alt: '照片内容的简要描述',
  caption: '照片下方的文字',
}
```

展厅的 `galleryFrames` 每项对应一个现有画框，填写同样的 `src`、`alt`、`caption` 即可。空项会继续保持留白；添加照片后即可点击查看大图，并使用“上一张”“下一张”或左右方向键切换。当前不包含上传服务，图片作为网站的本地静态素材发布。

### 添加音乐

把音频放入 `assets/music/`，再配置 `collections.js` 中的 `studyRecord`，例如：

```js
export const studyRecord = {
  src: './assets/music/study.mp3',
  title: '唱片名称',
  artist: '演奏者',
};
```

未配置音乐时，留声机只提示“尚未放入唱片”；配置后点击即可播放或暂停，默认不自动播放。支持 MP3、M4A、OGG 和 WAV 文件。
