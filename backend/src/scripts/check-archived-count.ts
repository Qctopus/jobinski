import db from '../config/sqlite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

function checkArchivedCount() {
    console.log('📊 Checking archived job counts in local SQLite...\n');

    try {
        const total = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number };
        const archived = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE archived = 1').get() as { count: number };
        const notArchived = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE archived = 0 OR archived IS NULL').get() as { count: number };

        const results = {
            total: total.count,
            archived: archived.count,
            notArchived: notArchived.count,
            diff: total.count - archived.count
        };

        console.log(JSON.stringify(results, null, 2));
        fs.writeFileSync(path.join(__dirname, '../../archived_count.json'), JSON.stringify(results, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

checkArchivedCount();
