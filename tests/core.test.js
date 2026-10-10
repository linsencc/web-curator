import test from 'node:test';
import assert from 'node:assert/strict';
import {decide,normalize,recordReason} from '../extension/core.js';
const video=stats=>({id:'BV0000000001',kind:'video',stats});
const rules=[{id:'combined',enabled:true,minViews:5000,likeRate:3},{id:'likes',enabled:true,likeRate:1},{id:'views',enabled:true,minViews:500}];
test('每条独立阈值、未命中继续，所有未命中保留',()=>{
 assert.equal(decide(video({view:1000,like:40}),{rules}).filter,false);
 assert.equal(decide(video({view:10000,like:50}),{rules}).rule,'likes');
 assert.equal(decide(video({view:400,like:100}),{rules}).rule,'views');
 assert.equal(decide(video({view:1000,like:10}),{rules}).rule,'combined');
});
test('顺序决定首个过滤原因，不再提前保留',()=>{
 const value=video({view:100,like:0});
 assert.equal(decide(value,{rules}).rule,'combined');
 assert.equal(decide(value,{rules:[rules[2],rules[1],rules[0]]}).rule,'views');
});
test('边界、缺失数据和0点赞',()=>{
 assert.equal(decide(video({view:5000,like:50}),{rules}).filter,false);
 assert.equal(decide(video({view:1000,like:30}),{rules}).filter,false);
 assert.equal(decide(video({view:1000}),{rules}).filter,false);
 assert.equal(decide(video({view:0,like:0}),{rules}).rule,'views');
 assert.equal(decide(video({view:1000,like:0}),{rules}).filter,true);
});
test('旧总开关与预览无效，共享阈值转换为独立值',()=>{
 const value=normalize({enabled:false,preview:true,minViews:8000,likeRate:4,rules:[{id:'combined',enabled:true},{id:'likes',enabled:true,likeRate:2}]});
 assert.equal('enabled' in value,false);assert.equal('preview' in value,false);
 assert.equal(value.rules[0].minViews,8000);assert.equal(value.rules[0].likeRate,4);assert.equal(value.rules[1].likeRate,2);
 assert.equal(decide(video({view:1000,like:0}),value).filter,true);
});
test('恢复、白名单和质量开关保留；类型开关独立',()=>{
 for(const patch of [{quality:false},{restored:['BV0000000001']},{whitelist:['1']}])assert.equal(decide({...video({view:1,like:0}),mid:1},{rules,...patch}).filter,false);
 assert.equal(decide({kind:'ad',id:'ad'},{}).filter,true);
 assert.equal(decide({kind:'live',id:'live'},{live:false}).filter,false);
});

test('过滤原因包含两项阈值，旧记录使用当时快照',()=>{
 assert.equal(decide(video({view:1000,like:10}),{rules}).reason,'播放量 1000 < 5000；点赞率 1.00% < 3%');
 assert.equal(recordReason({reason:'低播放；点赞率 2.08% < 3%',stats:{view:1200},thresholds:[{id:'combined',minViews:30000}]}),'播放量 1200 < 30000；点赞率 2.08% < 3%');
 assert.equal(recordReason({reason:'低播放；点赞率 2.08% < 3%'}),'低播放；点赞率 2.08% < 3%');
});
