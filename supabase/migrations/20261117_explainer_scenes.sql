-- PSL-28: one shared teaching picture per topic, grade, and language.
-- Not applied by the agent. Apply this on personalearn-dev before the pictures persist.

INSERT INTO storage.buckets (id, name, public)
VALUES ('explainers', 'explainers', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Signed-in teachers read explainer pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'explainers' AND name LIKE 'scenes/%');

CREATE POLICY "Signed-in teachers store explainer pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'explainers' AND name LIKE 'scenes/%');

CREATE POLICY "Signed-in teachers replace explainer pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'explainers' AND name LIKE 'scenes/%')
WITH CHECK (bucket_id = 'explainers' AND name LIKE 'scenes/%');
