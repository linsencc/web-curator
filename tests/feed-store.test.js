import test from 'node:test';
import assert from 'node:assert/strict';
import {FeedStore} from '../extension/feed-store.js';
import {likeRate,normalize,decide} from '../extension/core.js';
const card={bvid:'BV1xx411c7mD',id:'BV1xx411c7mD',kind:'video',stats:{view:6764}};
test('数据更新去重，缺失字段不会变为零，UP变化也会刷新',()=>{
 const store=new FeedStore();
 const item={bvid:card.bvid,mid:1,stats:{view:100,like:5}};
 assert.equal(store.update([item]),true);assert.equal(store.update([item]),false);
 assert.equal(likeRate(store.enrich(card).stats),5);
 assert.equal(store.update([{...item,mid:2,stats:{view:100}}]),true);
 assert.equal(likeRate(store.enrich(card).stats),null);
 assert.equal(store.enrich(card).mid,'2');
 assert.equal(likeRate({view:100,like:0}),0);assert.equal(likeRate({view:0,like:1}),null);
});
test('已移除的手动屏蔽配置不参与决策',()=>{
 const settings=normalize({quality:false,blocked:[card.id],blockedUsers:['1'],blockedTitles:['test']});
 assert.equal('blocked' in settings,false);assert.equal(decide(card,settings).filter,false);
});
