-- Create a new storage bucket for CVs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cvs', 'cvs', false);

-- Allow authenticated users to insert files (they will store files in their own folder: user_id/filename)
CREATE POLICY "Users can upload their own CV" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cvs' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow authenticated users to read their own CVs
CREATE POLICY "Users can read their own CV" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cvs' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow admins to read all CVs
CREATE POLICY "Admins can read all CVs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'cvs' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
