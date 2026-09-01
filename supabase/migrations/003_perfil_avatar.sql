-- Campos editables del perfil y almacenamiento seguro de avatares.
alter table public.usuarios add column if not exists usuario text;
alter table public.usuarios add column if not exists foto_url text;

create unique index if not exists usuarios_usuario_unico
  on public.usuarios (lower(usuario))
  where usuario is not null;

create or replace function public.actualizar_perfil(
  p_nombre text,
  p_usuario text default null,
  p_foto_url text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida';
  end if;

  if nullif(trim(p_nombre), '') is null then
    raise exception 'El nombre es obligatorio';
  end if;

  update public.usuarios
  set nombre = trim(p_nombre),
      usuario = nullif(trim(p_usuario), ''),
      foto_url = p_foto_url
  where id = auth.uid();

  if not found then
    raise exception 'No existe el perfil del usuario';
  end if;
end;
$$;

revoke all on function public.actualizar_perfil(text, text, text) from public;
grant execute on function public.actualizar_perfil(text, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "usuarios suben avatar propio" on storage.objects;
create policy "usuarios suben avatar propio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "usuarios actualizan avatar propio" on storage.objects;
create policy "usuarios actualizan avatar propio"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "usuarios leen avatar propio" on storage.objects;
create policy "usuarios leen avatar propio"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
