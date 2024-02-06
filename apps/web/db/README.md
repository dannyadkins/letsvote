Unfortunately, it's a bit hard to keep the database fully in sync

You need to run `./update_schema.sh python` and `./update_schema.sh node` to generate the respective clients.

Then, you need to make sure the DB is synced with `npx prisma db sync`.

Finally, you need to update the Python schemas in `py-ingest/schema.py`.
