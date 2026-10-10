import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize} from '../extension/settings.js';
test('分档按门槛升序，丢弃无效颜色和负门槛',()=>{
 const s=normalize({rateBands:[{min:10,color:'pink'},{min:-1,color:'blue'},{min:3,color:'green'},{min:0,color:'invalid'}]});
 assert.deepEqual(s.rateBands,[{min:3,color:'green'},{min:10,color:'pink'}]);
 assert.deepEqual(normalize({rateBands:[]}).rateBands,[]);
});
test('白名单名称仅保存当前名单，并限制长度',()=>{
 const s=normalize({whitelist:['123'],whitelistNames:{123:'作者',456:'旧名字'}});
 assert.deepEqual(s.whitelistNames,{'123':'作者'});
});
