import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    const tables = ['comments', 'likes', 'followers', 'communities', 'events'];
    const schemas = {};

    for (const table of tables) {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND table_schema = 'public'`
      });

      if (error) {
        // Fallback: try to fetch one row to see column structure
        const { data: sampleData, error: sampleError } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (sampleError) {
          schemas[table] = { error: sampleError.message };
        } else {
          schemas[table] = sampleData && sampleData[0] ? Object.keys(sampleData[0]) : [];
        }
      } else {
        schemas[table] = data?.map(row => row.column_name) || [];
      }
    }

    return Response.json({ schemas });
  } catch (error) {
    console.error('Schema fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});