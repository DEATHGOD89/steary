const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kmohuqqpfrufkrbtuirt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vSabtm7DCF5PZzcHwO1Mng_fvVCQKwx';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log('Cleaning up existing navbar table...');
    // Delete all rows in navbar
    const { error: delError } = await supabase
        .from('navbar')
        .delete()
        .neq('id', 0); // Delete all rows
    
    if (delError) {
        console.error('Delete error:', delError);
        process.exit(1);
    }

    console.log('Inserting new categories...');
    const payload = [
        { title: 'Home', tab_id: 'home', sort_order: 1 },
        { title: 'Dev Tools', tab_id: 'dev-tools', sort_order: 2 },
        { title: 'AI Hub', tab_id: 'ai-hub', sort_order: 3 },
        { title: 'Projects', tab_id: 'projects', sort_order: 4 }
    ];

    const { error: insError } = await supabase
        .from('navbar')
        .insert(payload);

    if (insError) {
        console.error('Insert error:', insError);
        process.exit(1);
    }

    console.log('Navbar successfully updated in Supabase!');
    process.exit(0);
}

run();
