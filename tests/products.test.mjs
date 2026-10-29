import test from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';

const domain=loader()('@/server/domain/product');
const photo=`https://media.example.test/images/products/${'a'.repeat(8)}-aaaa-aaaa-aaaa-${'a'.repeat(12)}.webp`;
const form=(product={...domain.DEFAULT_PRODUCT,mainImage:photo},price='599000')=>{const f=new FormData();f.set('price',price);f.set('product',JSON.stringify(product));return f;};

function fixture(){
  let allowed=true,row=null,uploads=0,writes=0,reads=0;
  const load=loader({
    './admin-auth':{requireAdmin:async()=>{if(!allowed)throw Error('Unauthorized');}},
    '@/server/infrastructure/r2':{R2_PUBLIC_BASE_URL:'https://media.example.test'},
    '@/server/infrastructure/character-image':{prepareCharacterImage:async bytes=>{if(bytes.toString()==='invalid')throw Error('invalid image');return bytes;}},
    '@/server/repositories/images':{uploadProductImage:async()=>{uploads++;return {url:photo,key:'private'};}},
    '@/server/repositories/settings':{
      readShopSettings:async()=>{reads++;return row;},
      writeShopProduct:async(product,productPrice)=>{writes++;row={product,productPrice};},
    },
  });
  return {service:load('@/server/services/products'),catalog:load('@/server/services/catalog'),set allowed(v){allowed=v;},get counts(){return {uploads,writes,reads};},get row(){return row;}};
}

test('admin permission precedes product reads, updates and image uploads',async()=>{
  const run=fixture();run.allowed=false;
  for(const call of [()=>run.service.adminProduct(),()=>run.service.saveProduct(form()),()=>run.service.uploadProductPhoto(new FormData())])await assert.rejects(call,/Unauthorized/);
  assert.deepEqual(run.counts,{uploads:0,writes:0,reads:0});
});

test('legacy price-only stores keep default content; product content and checkout price share a snapshot',async()=>{
  const legacy=loader({'@/server/repositories/settings':{readShopSettings:async()=>({productPrice:123000})}})('@/server/services/catalog');
  const original=await legacy.shopProduct();assert.equal(original.name,domain.DEFAULT_PRODUCT.name);assert.equal(original.price,123000);assert.equal(original.ready,true);
  const run=fixture();const data={...domain.DEFAULT_PRODUCT,name:'Sản phẩm mới',mainImage:photo,gallery:[{url:photo,description:'Thẻ nhân vật'}],description:'Thông tin chi tiết',tags:['Lịch sử']};
  await run.service.saveProduct(form(data,'699000'));
  const product=await run.catalog.shopProduct();assert.equal(product.name,data.name);assert.equal(product.price,699000);assert.equal(product.mainImage,photo);assert.deepEqual(product.gallery,data.gallery);assert.equal(run.counts.writes,1);
  assert.equal(JSON.stringify(product).includes('private'),false);
});

test('legacy URL galleries remain readable without truncation or database writes',async()=>{
  const urls=Array.from({length:6},(_,i)=>`https://media.example.test/legacy-${i}.webp`);
  const catalog=loader({'@/server/repositories/settings':{readShopSettings:async()=>({productPrice:123000,product:{...domain.DEFAULT_PRODUCT,gallery:urls}})}})('@/server/services/catalog');
  const product=await catalog.shopProduct();
  assert.deepEqual(product.gallery,urls.map(url=>({url,description:''})));
  assert.throws(()=>domain.validateProductContent(product),/5 ảnh phụ/);
});

test('gallery permits five captioned images, rejects six, invalid captions and untrusted secondary URLs',async()=>{
  const gallery=Array.from({length:5},(_,i)=>({url:photo.replace('aaaaaaaa-aaaa',`${i}aaaaaaa-aaaa`),description:`  Mô tả ảnh ${i}\nDòng hai  `}));
  const run=fixture();const saved=await run.service.saveProduct(form({...domain.DEFAULT_PRODUCT,gallery}));
  assert.equal(saved.gallery.length,5);assert.equal(saved.gallery[0].description,'Mô tả ảnh 0\nDòng hai');
  assert.equal((await run.catalog.shopProduct()).gallery[4].description,'Mô tả ảnh 4\nDòng hai');
  for(const invalid of [[...gallery,{url:photo,description:''}],[{url:photo,description:'x'.repeat(501)}],[{url:photo,description:12}],[gallery[0],gallery[0]],[{url:'https://evil.test/image.webp',description:''}]])await assert.rejects(()=>run.service.saveProduct(form({...domain.DEFAULT_PRODUCT,gallery:invalid})));
  assert.equal(run.counts.writes,1);
});

test('invalid data and untrusted image URLs do not write settings',async()=>{
  const run=fixture();
  for(const value of [{...domain.DEFAULT_PRODUCT,name:''},{...domain.DEFAULT_PRODUCT,gallery:Array(7).fill(photo)},{...domain.DEFAULT_PRODUCT,tags:['x'.repeat(51)]},{...domain.DEFAULT_PRODUCT,description:'x'.repeat(12001)},{...domain.DEFAULT_PRODUCT,mainImage:'https://evil.test/a.webp'},{...domain.DEFAULT_PRODUCT,mainImage:'https://media.example.test/images/products/../avatars/a.webp'},{...domain.DEFAULT_PRODUCT,mainImage:'javascript:alert(1)'}])await assert.rejects(()=>run.service.saveProduct(form(value)));
  await assert.rejects(()=>run.service.saveProduct(form(undefined,'-1')));assert.equal(run.counts.writes,0);
});

test('image upload validates size and decodes bytes before sending to R2',async()=>{
  const run=fixture();for(const content of ['', 'invalid']){const f=new FormData();f.set('file',new File([content],'x.jpg'));await assert.rejects(()=>run.service.uploadProductPhoto(f));}
  const large=new FormData();large.set('file',new File([new Uint8Array(3*1024*1024+1)],'x.jpg'));await assert.rejects(()=>run.service.uploadProductPhoto(large));assert.equal(run.counts.uploads,0);
  const valid=new FormData();valid.set('file',new File(['fixture'],'x.png'));assert.deepEqual(await run.service.uploadProductPhoto(valid),{url:photo});assert.equal(run.counts.uploads,1);
});

test('repository updates only product fields; legacy price updates preserve images and content',async()=>{
  const updates=[];const repo=loader({'@/lib/db/client':{getDatabase:async()=>({collection:name=>{assert.equal(name,'settings');return{updateOne:async(...args)=>updates.push(args)};}})}})('@/server/repositories/settings');
  await repo.writeShopProduct(domain.DEFAULT_PRODUCT,599000);await repo.writeProductPrice(699000);
  assert.deepEqual(updates[0][0],{_id:'shop'});assert.deepEqual(updates[0][1].$set.product,domain.DEFAULT_PRODUCT);assert.equal(updates[0][1].$set.productPrice,599000);
  assert.deepEqual(Object.keys(updates[1][1].$set).sort(),['productPrice','updatedAt']);
});

test('product updates change offline version; missing catalog does not prevent quiz pack creation',async()=>{
  let product={...domain.DEFAULT_PRODUCT,price:599000,ready:true};
  const {offlineGamePack}=loader({
    './catalog':{shopProduct:async()=>{if(!product)throw Error('catalog unavailable');return product;}},
    '@/server/repositories/offline-game':{readOfflineGame:async()=>({characters:[{id:'one'}],questions:[{id:'q',characterId:'one'}]})},
    './quiz-audio-playback':{attachQuestionAudio:async value=>value},
  })('@/server/services/offline-game');
  const first=await offlineGamePack();product={...product,mainImage:photo,price:699000};const second=await offlineGamePack();
  assert.notEqual(first.version,second.version);assert.equal(second.product.mainImage,photo);assert.deepEqual(first.questions,second.questions);
  product=null;const third=await offlineGamePack();assert.equal(third.product,undefined);assert.equal(third.questions.length,1);
});
