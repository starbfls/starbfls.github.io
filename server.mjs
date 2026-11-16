import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {dirname,extname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let path=resolve(root,'.'+pathname);if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return}if((await stat(path)).isDirectory())path=resolve(path,'index.html');const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)}catch{res.writeHead(404).end('Not found')}});
server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log(`Local preview: http://localhost:${server.address().port}`));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'端口 4173 已被占用。可设置 PORT 环境变量后重试。':e.message);process.exit(1)});
