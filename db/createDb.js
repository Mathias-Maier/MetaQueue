import { upload } from 'pg-upload';
import { connect } from './connect.js';

console.log('Recreating database...');

const db = await connect();

console.log('Dropping tables...');
await db.query('drop table if exists user_selections, party_preferences, genres, songs');
console.log('All tables dropped.');

console.log('Recreating tables...');
await db.query(`
    create table genres (
		name				text,
        genre_id 			bigint primary key,
	    info 				text
    )
`);

await db.query(`
    create table songs (
        track_id 		bigint primary key,
	    title 			text not null,
	    artist 			text not null,
		genre_id 		bigint references genres(genre_id),
	    duration_ms 	bigint not null
    )
`);

await db.query(`
    create table user_selections (
        selection_id    serial primary key,
        party_code      text not null,
        member_id       text not null,
        genre_id        bigint references genres(genre_id),
        artist          text,
        created_at      timestamp default now()
    )
`);

await db.query(`
    create table party_preferences (
        party_code      text primary key,
        genre_counts    jsonb,
        artist_counts   jsonb,
        updated_at      timestamp default now()
    )
`);
console.log('Tables recreated.');

console.log('Importing data from CSV files...');
await upload(db, 'db/genres.csv', `
	copy genres (name, genre_id, info)
	from stdin with csv
	delimiter ','`);
console.log('Data imported.');

await upload(db, 'db/songs.csv', `
	copy songs (track_id, title, artist, genre_id, duration_ms)
	from stdin
	with csv header
	delimiter ','`);
console.log('Data imported.');


await db.end();

console.log('Database recreated.');
