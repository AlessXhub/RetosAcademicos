-- Ajustes incrementales para instalaciones que ya aplicaron 001-003.

-- El ranking necesita mostrar el nombre y avatar de los participantes activos.
-- La tabla no contiene correos ni credenciales de Auth.
drop policy if exists "perfiles activos visibles" on public.usuarios;
create policy "perfiles activos visibles"
on public.usuarios for select to authenticated
using (estado = 'activo');

-- Los estudiantes solo pueden crear intentos en su estado inicial. La función
-- security definer finalizar_reto es la única responsable de completarlos.
drop policy if exists "crear intentos propios" on public.intentos_reto;
create policy "crear intentos propios"
on public.intentos_reto for insert to authenticated
with check (
  usuario_id = auth.uid()
  and estado = 'en_progreso'
  and fecha_fin is null
  and puntos_obtenidos = 0
  and porcentaje is null
);

drop policy if exists "actualizar intentos propios" on public.intentos_reto;
