import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
const database=new DatabaseSync(':memory:');database.exec(readFileSync('drizzle/0000_rapid_morph.sql','utf8'));
let user:string|null='owner-a';
export function setTestUser(value:string|null){user=value;}
export async function inspectionUser(){return user?{userId:user}:null;}
export function getDatabase(){return {prepare(sql:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return database.prepare(sql).get(...args as never[])||null;},async all(){return {results:database.prepare(sql).all(...args as never[])};},async run(){const result=database.prepare(sql).run(...args as never[]);return {meta:{changes:Number(result.changes)}};}};}};}
