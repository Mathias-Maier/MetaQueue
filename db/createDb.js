import { upload } from 'pg-upload';
import { connect } from './connect.js';

console.log('Recreating database...');

const db = await connect();

console.log('Dropping tables...');
await db.query('drop table if exists genres, songs');
console.log('All tables dropped.');

console.log('Recreating tables...');
await db.query(`
    create table genres (
		name				text,
        genre_id 			bigint primary key,
	    text 				text
    )
`);

await db.query(`
    create table songs (
        track_id 		bigint primary key,
	    title 			text not null,
	    artist 			text not null,
		genre_id 		bigint references genre,
	    duration_ms 	bigint not null
    )
`);
console.log('Tables recreated.');

console.log('Importing data from CSV files...');
await upload(db, 'db/genres.csv', `
	copy tracks (track_id, title, artist, duration)
	from stdin
	with csv header`);
console.log('Data imported.');

await db.end();

console.log('Database recreated.');
