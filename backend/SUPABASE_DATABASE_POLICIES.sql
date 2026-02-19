-- Políticas RLS para la tabla videos
-- Ejecuta este SQL en el SQL Editor de Supabase

-- Habilitar RLS en la tabla videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow public read access" ON videos;
DROP POLICY IF EXISTS "Allow anon insert" ON videos;
DROP POLICY IF EXISTS "Allow anon delete" ON videos;

-- Política 1: Permitir lectura pública
CREATE POLICY "Allow public read access"
ON videos FOR SELECT
TO public
USING (true);

-- Política 2: Permitir inserción con rol anon
CREATE POLICY "Allow anon insert"
ON videos FOR INSERT
TO anon
WITH CHECK (true);

-- Política 3: Permitir eliminación con rol anon
CREATE POLICY "Allow anon delete"
ON videos FOR DELETE
TO anon
USING (true);

-- Verificar que las políticas se crearon
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'videos'
ORDER BY policyname;
