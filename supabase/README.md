# Supabase migrations

This folder contains migrations for the OpenLobby Supabase project.

## Apply (when you create the Supabase project)

1. Install Supabase CLI.
2. Link to your project.
3. Push migrations:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

The backend expects these tables:

- `public.documents`
- `public.case_files`
- `public.entities`
- `public.relationships`
- `public.profiles`, `public.saved_queries`, `public.bookmarks` (RLS)

