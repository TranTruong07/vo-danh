import fs from 'node:fs';
import assert from 'node:assert/strict';
import { MongoClient } from 'mongodb';
import { configureTestEnvironment, TEST_DATABASE, safeError } from './knowledge-generation-test-env.mjs';
let client;
const report={target:TEST_DATABASE,checkedAt:new Date().toISOString(),readOnly:true};
try {
  const {uri}=configureTestEnvironment();client=new MongoClient(uri,{serverSelectionTimeoutMS:10000});await client.connect();
  const db=client.db(TEST_DATABASE);
  report.collections={};
  for(const name of ['knowledge_sources','knowledge_source_chunks','knowledge_private_files.files','knowledge_private_files.chunks','knowledge_proposals','knowledge_questions','knowledge_question_revisions','knowledge_generation_audit','knowledge_audit','chat_interactions'])report.collections[name]=await db.collection(name).countDocuments();
  report.proposalStatuses=await db.collection('knowledge_proposals').aggregate([{$group:{_id:'$generationStatus',count:{$sum:1}}}]).toArray();
  report.revisionStatuses=await db.collection('knowledge_question_revisions').aggregate([{$group:{_id:'$status',count:{$sum:1}}}]).toArray();
  report.publishedPointers=await db.collection('knowledge_questions').countDocuments({publishedVersionId:{$exists:true}});
  report.approvePublishActions=await db.collection('knowledge_audit').countDocuments({action:{$in:['approve','publish']}});
  report.testBudget=await db.collection('knowledge_generation_budget').find({}, {projection:{_id:1,calls:1}}).toArray();
  report.mockProposals=await db.collection('knowledge_proposals').countDocuments({generationModel:'fixture-no-provider'});
  const fixture=JSON.parse(fs.readFileSync('.local/chat-phase-5e1/integration-fixture.json','utf8'));
  const normalize=text=>text.normalize('NFC').replace(/\s+/g,' ').trim();
  const pdfSources=await db.collection('knowledge_sources').find({fileType:'pdf'}).toArray();
  for(const source of pdfSources){const chunks=await db.collection('knowledge_source_chunks').find({sourceId:source._id}).sort({order:1}).toArray();assert.equal(normalize(chunks.map(c=>c.text).join(' ')),normalize(fixture.core));}
  report.pdfFullTextFidelity={passed:pdfSources.length,normalization:'NFC and whitespace only; no rewritten content'};
  report.status='passed';
}catch(error){report.status='failed';report.error=safeError(error);process.exitCode=1;}
finally{await client?.close();fs.writeFileSync('.local/chat-phase-5e1/test-database-inventory.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
