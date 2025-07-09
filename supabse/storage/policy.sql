-- for books images
CREATE POLICY "Give authenticated users access to books folder" ON storage.objects FOR SELECT TO public USING (bucket_id = 'gynergy' AND (storage.foldername(name))[1] = 'books' AND auth.role() = 'authenticated');
-- for profile pictures
CREATE POLICY "Give authenticated users access to profiles folder" ON storage.objects FOR SELECT TO public USING (bucket_id = 'gynergy' AND (storage.foldername(name))[1] = 'profiles' AND auth.role() = 'authenticated');
-- for upload
CREATE POLICY "Authenticated user can upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gynergy');
-- for vision journal log
CREATE POLICY "Give users access to own vision journal folder" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'gynergy' AND ((storage.foldername(name))[1] = 'visions'::text) AND (select auth.uid()::text) = (storage.foldername(name))[2]);
-- for free flows
CREATE POLICY "Give users access to own fre flows drawings folder" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'gynergy' AND ((storage.foldername(name))[1] = 'drawings'::text) AND (select auth.uid()::text) = (storage.foldername(name))[2]);
-- for delete
CREATE POLICY "User can delete their own profile pictures 856l97_0" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gynergy' AND ((storage.foldername(name))[1] = 'profiles'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[2]));