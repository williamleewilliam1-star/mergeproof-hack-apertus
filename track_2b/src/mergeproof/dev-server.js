import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./api/analyze.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "public");
const port = Number(process.env.PORT || 8789);
const host = String(process.env.HOST || "127.0.0.1");
const mime = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8"};

async function parseBody(req){
  let raw="";
  for await (const chunk of req){raw+=chunk;if(raw.length>50000)throw new Error("Request too large");}
  return JSON.parse(raw||"{}");
}
function wrapRes(res){
  res.statusCode=200;
  res.status=n=>{res.statusCode=n;return res;};
  const end=res.end.bind(res);
  res.end=data=>end(data);
  return res;
}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://localhost");
    if(url.pathname==="/api/analyze"){
      if(req.method==="POST") req.body=await parseBody(req);
      return handler(req,wrapRes(res));
    }
    const file=url.pathname==="/"?"index.html":url.pathname.slice(1);
    if(!["index.html","app.js","style.css"].includes(file)){res.writeHead(404);return res.end("Not found");}
    const data=await fs.readFile(path.join(publicDir,file));
    res.writeHead(200,{"content-type":mime[path.extname(file)]||"application/octet-stream"});
    res.end(data);
  }catch(error){res.writeHead(500,{"content-type":"application/json"});res.end(JSON.stringify({error:error.message}));}
});
server.listen(port,host,()=>console.log("MergeProof: http://"+host+":"+port));
