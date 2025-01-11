# Backend notes

## Running the server

`npm run dev`

## Migrations

### To create a new migration

`npx knex migrate:make current --knexfile ./knexfile.js`

### To run migrations

* Locally 

`npx knex migrate:up --knexfile ./knexfile.js`

* In production

Just deploy and it'll run automatically.

### Rolling back

* Locally

`npx knex migrate:rollback`

* In production

I don't know. 

### Backing up Heroku

* Create a backup: `heroku pg:backups:capture`

* Download the latest backup to a local file: `heroku pg:backups:download`

This will create a file named "latest.dump" in your current directory

* List all backups `heroku pg:backups`

* Get backup info `heroku pg:backups:info b001`  # where b001 is the backup ID from the list

### Restoring a Heroku backup locally

```
createdb scrabble_stats_test
psql -U joshuacough postgres
> GRANT ALL PRIVILEGES ON DATABASE scrabble_stats_test TO scrabble_user;
pg_restore --verbose --clean --no-acl --no-owner -h localhost -U scrabble_user -d scrabble_stats latest.dump
```

### Insert the initial migration manually

`INSERT INTO knex_migrations (name, batch, migration_time)
VALUES ('20241229235425_initial_schema.js', 1, CURRENT_TIMESTAMP);`








```
other notes:

what if i have more migrations after the initial one?


In this case, if you have multiple migrations in order like:

TIMESTAMP_initial_schema.js (represents existing tables)
TIMESTAMP_add_new_column.js (actual new change)
TIMESTAMP_another_change.js (another new change)
When you deploy:

First migration will fail (because tables exist)
The later migrations won't run because Knex sees the first one failed
So you'll need to:

Let the deploy complete (it will show migration errors but deploy anyway)
Connect to Heroku psql
Insert the record for the initial migration
Then run migrations again with:
bash

Copy
heroku run npx knex migrate:latest --knexfile ./knexfile.js
This time it will skip the initial migration (because we inserted the record) and run your new migrations.

Want me to help you through this process when you're ready to deploy?



By default, `knex migrate:rollback` only rolls back one batch of migrations at a time. A batch is all the migrations that were run together in a single `migrate:latest` command.

You can verify what migrations are in what batch by running:
```bash
npx knex migrate:status
```

If you want to be extra careful, you can also specify rolling back a single migration with:
```bash
npx knex migrate:down 20241231023909_players_and_games.js
```

(Using your specific migration filename)

Also, if you want to see what would be rolled back without actually doing it, you can use:
```bash
npx knex migrate:rollback --dry-run
```

```
