// Importerer upload-funktionen fra pg-upload (bruges til at importere CSV-data til databasen)
import { upload } from 'pg-upload';

// Importerer connect-funktionen fra din lokale connect.js (opretter forbindelse til databasen)
import { connect } from './connect.js';

// Logger status til konsollen
console.log('Recreating database...');

// Opretter forbindelse til databasen og gemmer den i variablen db
const db = await connect();

// Logger status
console.log('Dropping tables...');

// Dropper eksisterende tabeller, hvis de findes
await db.query('drop table if exists user_selections, genres, songs');

// Bekræfter at tabeller er droppet
console.log('All tables dropped.');

// Logger status
console.log('Recreating tables...');

// Opretter genres-tabellen
await db.query(`
    create table genres (
        name        text,
        genre_id    bigint primary key,
        info        text
    )
`);

// Opretter songs-tabellen med reference til genres
await db.query(`
    create table songs (
        track_id    bigint primary key,
        title       text not null,
        artist      text not null,
        genre_id    bigint references genres(genre_id),
        duration_ms bigint not null
    )
`);

// Opretter user_selections-tabellen med auto-increment primary key
await db.query(`
    create table user_selections (
        selection_id serial primary key,
        party_code   text not null,
        member_id    text not null,
        genre_id     bigint references genres(genre_id),
        artist       text,
        created_at   timestamp default now()
    )
`);

// Bekræfter at tabeller er oprettet
console.log('Tables recreated.');

// Logger status
console.log('Importing data from CSV files...');

// Importerer data til genres-tabellen fra CSV
await upload(db, 'db/genres.csv', `
    copy genres (name, genre_id, info)
    from stdin with csv
    delimiter ','
`);
console.log('Data imported.');

// Importerer data til songs-tabellen fra CSV med header
await upload(db, 'db/songs.csv', `
    copy songs (track_id, title, artist, genre_id, duration_ms)
    from stdin
    with csv header
    delimiter ','
`);
console.log('Data imported.');

// Lukker databaseforbindelsen
await db.end();

// Bekræfter at hele processen er færdig
console.log('Database recreated.');