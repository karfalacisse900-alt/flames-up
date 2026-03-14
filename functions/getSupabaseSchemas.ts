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
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', table);

      if (error) {
        console.error(`Error fetching ${table}:`, error);
        schemas[table] = { error: error.message };
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