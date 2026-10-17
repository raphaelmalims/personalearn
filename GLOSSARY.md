# Glossary

**Admission number**: Student id text; script pages are grouped by the number written on each page (`public.students`, `docs/sprint-3-decision-log.md`).
**AI Hub**: Class-scoped chat. One assistant can query, generate, and save only after the teacher confirms (`docs/sprint-3-specs.md`).
**Amber**: Script identity when the admission read is missing, unreadable, or off the roster. The teacher confirms before that script is graded (`docs/eval-direct-multimodal.md`).
**Assessment**: Class task typed practical, written, formative, or summative. May link to a resource (`supabase/migrations/20260621_init_schema.sql`).
**CBC**: Kenyan Competency-Based Curriculum. Classes use grades 1–9 (`docs/sprint-3-decision-log.md`, `public.classes`).
**Class**: One teacher's grade, subject, term (1–3), and year. Child rows use `class_id` (`public.classes`).
**Competency progress**: Per student and strand: `mastered`, `developing`, or `not_yet` (`public.competency_progress`).
**Embedding**: 1024-number Voyage `voyage-3.5` vector on a resource chunk (`src/lib/ai/embeddings.ts`, `supabase/migrations/20260701_voyage_embedding_dims.sql`).
**Evaluation batch**: One grading session for a class assessment and a marking-scheme resource (`public.evaluation_batches`).
**Ingest**: Split resource text into chunks and store their embeddings (`src/lib/ai/ingest-resource.ts`).
**Marking scheme**: Resource id on `evaluation_batches.marking_scheme_resource_id`, sent with the script when grading (`supabase/migrations/20260709_evaluation_batches.sql`).
**RAG**: Answer a class question using only retrieved resource chunks (`src/lib/ai/rag.ts`).
**Resource**: Class material, uploaded or AI-generated, status `draft`, `active`, or `archived` (`public.resources`).
**Resource chunk**: A slice of resource text plus its embedding (`public.resource_chunks`).
**Retrieval**: Cosine search of chunk embeddings inside one class (`match_resource_chunks` in `supabase/migrations/20260701_voyage_embedding_dims.sql`).
**RLS**: Postgres policies so a signed-in teacher sees only their classes (`docs/production-deploy-checklist.md`).
**Scheme of work**: Class JSON document, status `draft`, `active`, or `archived` (`public.schemes_of_work`).
**Sign-off**: Teacher approval that stores evaluation results (`docs/eval-direct-multimodal.md`).
**Student**: Roster row on a class: name and optional admission number (`public.students`).
**Teacher**: `public.users` row linked to `auth.users`. Owns classes through `teacher_id`.
**Tenant**: Another teacher's rows. RLS blocks cross-tenant select and insert (`docs/production-deploy-checklist.md`).
