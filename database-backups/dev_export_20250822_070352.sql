--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: neondb_owner
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: neondb_owner
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: neondb_owner
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: __drizzle_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.__drizzle_migrations (
    id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.__drizzle_migrations OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.__drizzle_migrations_id_seq OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.__drizzle_migrations_id_seq OWNED BY public.__drizzle_migrations.id;


--
-- Name: activities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activities (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    duration integer NOT NULL,
    teaching_objectives json DEFAULT '[]'::json NOT NULL,
    milestone_ids json DEFAULT '[]'::json NOT NULL,
    material_ids json DEFAULT '[]'::json NOT NULL,
    instructions json DEFAULT '[]'::json NOT NULL,
    video_url text,
    image_url text,
    category text NOT NULL,
    tenant_id character varying NOT NULL,
    location_id character varying NOT NULL,
    age_group_ids jsonb DEFAULT '[]'::jsonb,
    usage_count integer DEFAULT 0,
    last_used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    status text DEFAULT 'active'::text NOT NULL,
    deleted_at timestamp without time zone,
    objectives jsonb DEFAULT '[]'::jsonb,
    preparation_time integer,
    safety_considerations jsonb DEFAULT '[]'::jsonb,
    space_required text,
    group_size text,
    mess_level text,
    variations jsonb DEFAULT '[]'::jsonb,
    min_children integer DEFAULT 1,
    max_children integer DEFAULT 10,
    is_active boolean DEFAULT true,
    deleted_on timestamp without time zone,
    s3_image_key text,
    s3_video_key text
);


ALTER TABLE public.activities OWNER TO neondb_owner;

--
-- Name: activity_records; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activity_records (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    scheduled_activity_id character varying NOT NULL,
    user_id character varying NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    notes text,
    materials_used boolean,
    material_feedback text,
    rating integer,
    rating_feedback text,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_records OWNER TO neondb_owner;

--
-- Name: age_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.age_groups (
    id character varying NOT NULL,
    tenant_id character varying NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    age_range_start integer NOT NULL,
    age_range_end integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    location_id character varying NOT NULL
);


ALTER TABLE public.age_groups OWNER TO neondb_owner;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id character varying NOT NULL,
    tenant_id character varying NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    color character varying(7),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    location_id character varying NOT NULL
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: lesson_plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lesson_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    teacher_id character varying NOT NULL,
    week_start text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    submitted_at timestamp without time zone,
    approved_at timestamp without time zone,
    tenant_id character varying NOT NULL,
    location_id character varying NOT NULL,
    room_id character varying NOT NULL,
    schedule_type character varying(50) DEFAULT 'time-based'::character varying,
    submitted_by character varying,
    approved_by character varying,
    rejected_at timestamp without time zone,
    rejected_by character varying,
    review_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lesson_plans OWNER TO neondb_owner;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.locations (
    id character varying NOT NULL,
    tenant_id character varying NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    address text,
    capacity integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.locations OWNER TO neondb_owner;

--
-- Name: material_collection_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.material_collection_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    material_id character varying NOT NULL,
    collection_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.material_collection_items OWNER TO neondb_owner;

--
-- Name: material_collections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.material_collections (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    location_ids json DEFAULT '[]'::json NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.material_collections OWNER TO neondb_owner;

--
-- Name: materials; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.materials (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    location text NOT NULL,
    tenant_id character varying NOT NULL,
    age_groups json DEFAULT '[]'::json NOT NULL,
    photo_url text,
    location_ids json DEFAULT '[]'::json NOT NULL,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    s3_key text
);


ALTER TABLE public.materials OWNER TO neondb_owner;

--
-- Name: milestones; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.milestones (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    age_range_start integer NOT NULL,
    age_range_end integer NOT NULL,
    learning_objective text NOT NULL,
    tenant_id character varying NOT NULL,
    location_id character varying NOT NULL,
    location_ids jsonb DEFAULT '[]'::jsonb,
    age_group_ids jsonb DEFAULT '[]'::jsonb,
    image_url text,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    s3_key text
);


ALTER TABLE public.milestones OWNER TO neondb_owner;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    type text NOT NULL,
    lesson_plan_id character varying,
    title text NOT NULL,
    message text NOT NULL,
    review_notes text,
    week_start timestamp without time zone,
    location_id character varying,
    room_id character varying,
    is_read boolean DEFAULT false NOT NULL,
    is_dismissed boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    dismissed_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.permissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    tenant_id character varying NOT NULL
);


ALTER TABLE public.permissions OWNER TO neondb_owner;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.role_permissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    role_id character varying NOT NULL,
    permission_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    tenant_id character varying NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO neondb_owner;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    tenant_id character varying NOT NULL
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: rooms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rooms (
    id character varying NOT NULL,
    tenant_id character varying NOT NULL,
    location_id character varying NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    capacity integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rooms OWNER TO neondb_owner;

--
-- Name: scheduled_activities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.scheduled_activities (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    lesson_plan_id character varying NOT NULL,
    activity_id character varying NOT NULL,
    day_of_week integer NOT NULL,
    time_slot integer NOT NULL,
    notes text,
    tenant_id character varying NOT NULL,
    location_id character varying NOT NULL,
    room_id character varying NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamp without time zone
);


ALTER TABLE public.scheduled_activities OWNER TO neondb_owner;

--
-- Name: tenant_permission_overrides; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenant_permission_overrides (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    permission_name text NOT NULL,
    roles_required json DEFAULT '[]'::json NOT NULL,
    auto_approve_roles json DEFAULT '[]'::json NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_permission_overrides OWNER TO neondb_owner;

--
-- Name: tenant_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenant_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    schedule_type character varying(50) DEFAULT 'time-based'::character varying NOT NULL,
    start_time character varying(5) DEFAULT '06:00'::character varying,
    end_time character varying(5) DEFAULT '18:00'::character varying,
    slots_per_day integer DEFAULT 8,
    week_start_day integer DEFAULT 1,
    auto_save_interval integer DEFAULT 5,
    enable_notifications boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    location_settings jsonb DEFAULT '{}'::jsonb,
    default_schedule_type character varying(50) DEFAULT 'time-based'::character varying,
    default_start_time character varying(5) DEFAULT '06:00'::character varying,
    default_end_time character varying(5) DEFAULT '18:00'::character varying,
    default_slots_per_day integer DEFAULT 8
);


ALTER TABLE public.tenant_settings OWNER TO neondb_owner;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.tenants OWNER TO neondb_owner;

--
-- Name: token_secrets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.token_secrets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    jwt_secret text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.token_secrets OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id text NOT NULL,
    username text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role text NOT NULL,
    locations json DEFAULT '[]'::json NOT NULL,
    first_login_date timestamp without time zone DEFAULT now() NOT NULL,
    last_login_date timestamp without time zone DEFAULT now() NOT NULL,
    login_count integer DEFAULT 1 NOT NULL,
    last_token_payload json,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('public.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: neondb_owner
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
\.


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.__drizzle_migrations (id, file_name, created_at) FROM stdin;
1	0000_baseline_migration_existing_database	2025-08-21 04:24:17.972214
\.


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activities (id, title, description, duration, teaching_objectives, milestone_ids, material_ids, instructions, video_url, image_url, category, tenant_id, location_id, age_group_ids, usage_count, last_used_at, created_at, updated_at, status, deleted_at, objectives, preparation_time, safety_considerations, space_required, group_size, mess_level, variations, min_children, max_children, is_active, deleted_on, s3_image_key, s3_video_key) FROM stdin;
7f5c567e-157c-4df0-9c04-7be3f332e2b9	Magic Mask Parade	Children will design and decorate their own wearable masks using paper plates, colorful collage materials, and safe craft supplies. After creating their unique masks, children will participate in a fun indoor parade where they can show off their creations and express themselves through imaginative character play. This activity encourages self-expression, fine motor development, creativity, and social confidence.	35	[]	["72236a10-da6a-4b3f-8b90-37ae205c1fcc"]	["4da6d60a-65a9-497c-b811-edc17f977856","095cc861-947b-4306-934c-19c78f936414","f890566e-9f33-4ab1-897d-a839be9cc71f"]	[{"stepNumber":1,"text":"Prepare a table with paper plates (one for each child), child-safe scissors (adult assistance as needed), glue sticks, crayons or markers, yarn or elastic bands for straps, and assorted collage materials such as tissue paper pieces, feathers, buttons, stickers, and fabric scraps.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755546714110_a9b8a87a.png"},{"stepNumber":2,"text":"Demonstrate how to cut eye holes in the center of each plate with help from an adult if necessary.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755546739318_d5c2f518.png"},{"stepNumber":3,"text":"Invite children to choose which kind of mask they want to create - it could be an animal face, superhero mask or something from their imagination.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755546773986_8a954db3.png"},{"stepNumber":4,"text":"Let children decorate the front of their masks using the available art supplies. Encourage them to layer materials for texture and use bright colors for visual impact.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755546797624_fb582b93.png"},{"stepNumber":5,"text":"Assist each child in attaching yarn or elastic bands securely so the mask can be worn comfortably around their head.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755546822386_2e86b5ce.png"},{"stepNumber":6,"text":"Once all masks are finished and dry enough to wear safely (check glue is set), organize a Magic Mask Parade where children walk around the classroom showing off their creations while music plays softly in the background.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755546853016_11d74ab9.png"},{"stepNumber":7,"text":"Afterward invite children to share which character they created or act out simple movements inspired by their mask design if desired.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755546883830_e5f46c53.png"}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_7f5c567e-157c-4df0-9c04-7be3f332e2b9_1755838814120_ai_generated_1755546661219_42bb93f2.png	Art & Creativity	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c"]	0	\N	2025-08-18 19:42:50.397675	2025-08-18 19:42:50.397675	active	\N	["Develop fine motor skills through cutting gluing coloring and assembling various materials", "Foster self expression creativity and confidence by designing personal wearable art", "Practice social skills during group sharing activities like parades discussions or role play"]	10	["- Adult supervision required when using scissors especially for younger preschoolers", "- Ensure small decorative items are used under supervision due to choking hazard risk"]	Indoor	Full class	Medium	["- Nature Masks - incorporate natural items like leaves twigs petals collected during a previous nature walk into mask designs", "- Emotion Masks - encourage children to create masks that show different emotions then use them for simple feelings-based games"]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_7f5c567e-157c-4df0-9c04-7be3f332e2b9_1755838814120_ai_generated_1755546661219_42bb93f2.png	\N
d182883c-4828-4ffa-b643-aeae3a49efcc	Colorful Stomp and Stamp Mural	Children will explore large-scale collaborative art by using their feet to create a vibrant group mural on paper laid out across the floor. Wearing clean socks or washable shoe covers, they will dip their feet in trays of non-toxic paint and stomp, slide, and stamp patterns onto the mural surface. This energetic activity encourages creative expression, sensory exploration, teamwork, and gross motor development while introducing children to new ways of making art.	30	[]	["16b4900d-14a8-493b-8ecc-fb7d5e5144aa"]	["f890566e-9f33-4ab1-897d-a839be9cc71f","402dae30-caec-440b-b570-a58c780f6094","207ce39b-f8cb-4ebf-ad75-bb7ef30e89b7","bb05b529-4805-4e24-84ba-7a6c112f0740"]	[{"stepNumber":1,"text":"Roll out large sheets of butcher paper or poster paper on the classroom floor and securely tape down all edges.","tip":"","imageUrl":""},{"stepNumber":2,"text":"Set up shallow trays with different colors of washable tempera paint along one side of the paper.","tip":"","imageUrl":""},{"stepNumber":3,"text":"Have each child put on a pair of clean socks or washable shoe covers designated for painting.","tip":"","imageUrl":""},{"stepNumber":4,"text":"Demonstrate how to step gently into a tray of paint and then walk, stomp, jump or slide across the paper to make colorful footprints and patterns.","tip":"","imageUrl":""},{"stepNumber":5,"text":"Encourage children to try different movements (tiptoeing, hopping with both feet) for varied effects.","tip":"","imageUrl":""},{"stepNumber":6,"text":"Invite children to work together by overlapping prints or creating shapes as a team if desired.","tip":"","imageUrl":""},{"stepNumber":7,"text":"When finished, carefully help each child remove socks/shoe covers before washing hands and feet. Allow mural to dry before displaying it in the classroom gallery area.","tip":"","imageUrl":""}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_d182883c-4828-4ffa-b643-aeae3a49efcc_1755838817055_ai_generated_1755550355252_1ad0d554.png	Art & Creativity	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c"]	0	\N	2025-08-18 20:55:43.895909	2025-08-18 20:55:43.895909	active	\N	["Develop gross motor coordination through movement-based art making", "Foster creativity by experimenting with color mixing and abstract design", "Promote social skills through collaboration on a shared group artwork"]	10	["'Supervise closely so only small amounts of paint are used at once to prevent slipping.'", "'Ensure all materials are non-toxic and that floor is protected from spills outside activity area.'"]	Indoor	Full class	High	["'Shape Hunt' - Place cut-out shapes under clear plastic over parts of the mural; challenge children to cover them with specific colored footprints.", "'Texture Walk' - Add bubble wrap or soft mats under sections of paper so children experience new textures as they move."]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_d182883c-4828-4ffa-b643-aeae3a49efcc_1755838817055_ai_generated_1755550355252_1ad0d554.png	\N
409dea9c-c2ff-4e84-b36e-196fc846b913	Mystery Sound Match-Up	Children will explore and identify everyday sounds using a set of covered containers, each filled with different familiar objects. By shaking and listening carefully, they will match pairs of containers that make the same sound, encouraging focused listening, auditory discrimination, and logical reasoning. This engaging activity builds memory skills, attention, and early scientific thinking as children hypothesize and test which sounds belong together.	20	[]	[]	["f890566e-9f33-4ab1-897d-a839be9cc71f","0b4335c1-03d3-4cb4-890f-c75df8feacfb","7d3abe74-ad53-4c2c-92b2-4b8cd2b96653"]	[{"stepNumber":1,"text":"Prepare several small, opaque containers (such as clean plastic jars or boxes) and fill pairs with matching materials, such as dried beans, paper clips, rice, buttons, or small bells. Secure lids tightly.","tip":"","imageUrl":""},{"stepNumber":2,"text":"Arrange all the closed containers on a table or carpet area, ensuring the contents are hidden from view.","tip":"","imageUrl":""},{"stepNumber":3,"text":"Explain to children that each container has a mystery sound inside, and their job is to find the matching pairs by shaking and listening carefully.","tip":"","imageUrl":""},{"stepNumber":4,"text":"Demonstrate how to gently shake a container and listen closely to the sound it makes.","tip":"","imageUrl":""},{"stepNumber":5,"text":"Invite children to take turns shaking different containers, comparing sounds, and working together or individually to find and group the pairs that match.","tip":"","imageUrl":""},{"stepNumber":6,"text":"Once all pairs are found, open the containers together to reveal what was inside and discuss how they figured out the matches.","tip":"","imageUrl":""}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_409dea9c-c2ff-4e84-b36e-196fc846b913_1755838818940_ai_generated_1755705001187_9d244e21.png	Cognitive Development	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c"]	0	\N	2025-08-20 15:50:04.564915	2025-08-20 15:50:04.564915	active	\N	["Develop auditory discrimination by identifying and comparing different sounds", "Strengthen memory and logical reasoning through matching and problem-solving", "Encourage cooperative turn-taking and communication during group exploration"]	10	["Ensure all containers are securely closed and cannot be opened without adult help to prevent choking hazards", "Use only non-toxic, age-appropriate materials inside the containers"]	Indoor	2-6 children	Low	["Shape Hunt - Hide containers around the room and have children find and match them by sound as part of an indoor scavenger hunt", "Sound Story - After matching, encourage children to use the sounds to create a simple group story or sound pattern sequence"]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_409dea9c-c2ff-4e84-b36e-196fc846b913_1755838818940_ai_generated_1755705001187_9d244e21.png	\N
524e1a10-1f2e-46b6-8015-d33033b97e64	Tunnel Tumble and Balance Adventure	Children will crawl through soft tunnels, step across gentle balance pads, and climb over low obstacles arranged in a safe indoor circuit. This engaging activity strengthens large muscles, improves coordination, and promotes spatial awareness as children explore moving their bodies in different ways.	25	[]	["4ead1815-cbb3-480f-a03d-4ee22857c5df"]	["ac69ac81-0f88-442e-b24c-e5bff45eff9c"]	[{"stepNumber":1,"text":"Set up a simple obstacle course using soft play tunnels, balance pads or cushions, and low, stable objects like foam blocks or sturdy boxes.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482563207_c4807728.png"},{"stepNumber":2,"text":"Show children how to begin by crawling through the tunnel, encouraging them to use hands and knees.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482582049_ef99383b.png"},{"stepNumber":3,"text":"Invite children to step or walk carefully across the balance pads or cushions, helping them if needed to keep steady.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482599913_15ef0876.png"},{"stepNumber":4,"text":"Guide them to climb over a low obstacle or block, modeling safe climbing and stepping down.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482628448_d0ccf234.png"},{"stepNumber":5,"text":"Encourage children to repeat the course, moving at their own pace and cheering for their efforts.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482646984_e97fd51e.png"},{"stepNumber":6,"text":"Offer gentle support and celebrate as children experiment with crawling, balancing, and climbing.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482665586_db81dd26.png"}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_524e1a10-1f2e-46b6-8015-d33033b97e64_1755838815085_chatgpt_image_aug_17__2025__11_12_33_pm_1755486789.png	Physical Development	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3"]	0	\N	2025-08-18 03:13:57.074333	2025-08-18 03:13:57.074333	active	\N	["Develop gross motor skills through crawling, balancing, and climbing", "Enhance coordination and body control", "Increase spatial awareness and confidence in movement"]	10	["Ensure all obstacles are soft, stable, and free of sharp edges", "Supervise closely to prevent falls and provide support as needed"]	Indoor	2-6 children	Low	["Shape Hunt - Place colored shapes along the course for children to find and collect as they go", "Animal Moves - Encourage children to use animal movements like bear walks or bunny hops at different sections of the course"]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_524e1a10-1f2e-46b6-8015-d33033b97e64_1755838815085_chatgpt_image_aug_17__2025__11_12_33_pm_1755486789.png	\N
8f888600-8a83-4791-8915-7be84b8381da	Friendship Bridge Builders	Children will work together in small groups to build a pretend bridge using soft blocks, pillows, and classroom materials. As they build, each child will take turns sharing kind words or compliments with a partner before placing their piece on the bridge. This cooperative activity strengthens teamwork, positive communication, and helps children practice expressing kindness and appreciation.	25	[]	[]	["ac69ac81-0f88-442e-b24c-e5bff45eff9c"]	[{"stepNumber":1,"text":"Gather soft building materials such as foam blocks, pillows, or large cardboard pieces in an open indoor space.","tip":"","imageUrl":""},{"stepNumber":2,"text":"Divide children into small groups of three to five.","tip":"","imageUrl":""},{"stepNumber":3,"text":"Explain that the goal is to build a 'Friendship Bridge' together by taking turns adding pieces.","tip":"","imageUrl":""},{"stepNumber":4,"text":"Before placing each block or pillow on the bridge, the child must share a kind word or compliment with another group member (e.g., I like how you helped me clean up).","tip":"","imageUrl":""},{"stepNumber":5,"text":"Encourage everyone in the group to listen closely and respond with thank you after receiving a compliment.","tip":"","imageUrl":""},{"stepNumber":6,"text":"Continue building until all materials are used and every child has had several chances to give and receive kind words.","tip":"","imageUrl":""},{"stepNumber":7,"text":"Once complete, invite groups to walk over their bridges (with supervision) while holding hands as a symbol of friendship.","tip":"","imageUrl":""}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_8f888600-8a83-4791-8915-7be84b8381da_1755838816732_a0c7a391_7543_4c85_b9fc_fcf41ff1c314_1755495179001.jpeg	Social & Emotional	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c"]	0	\N	2025-08-18 05:33:11.480999	2025-08-18 05:33:11.480999	active	\N	["Practice giving and receiving compliments", "Strengthen teamwork skills through cooperative play", "Develop positive communication for social confidence"]	10	["(Supervise closely so bridges remain low and stable)", "(Remind children not to throw building materials)"]	Indoor	3-5 children per group	Low	["(Color Match) - Children can choose only blocks of certain colors when giving compliments about something specific such as favorite color.", "(Emotion Bridge) - Instead of compliments use feeling words like happy or proud before placing each piece."]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_8f888600-8a83-4791-8915-7be84b8381da_1755838816732_a0c7a391_7543_4c85_b9fc_fcf41ff1c314_1755495179001.jpeg	\N
d3a6888d-ddec-4651-acd1-2379f50b2a0a	Basketball Bowling Bash	Children will roll small basketballs across the floor to knock down soft, lightweight pins arranged in a triangle. This playful game develops hand-eye coordination, arm strength, and aim while encouraging movement and group participation in a safe indoor space.	20	[]	["4ead1815-cbb3-480f-a03d-4ee22857c5df"]	["bb05b529-4805-4e24-84ba-7a6c112f0740","b25e4338-2137-4c3c-9760-9f52769f6a1d"]	[{"stepNumber":1,"text":"Set up a bowling lane using masking tape on the floor to mark a start line and a triangle at the end for the pins.","tip":"","imageUrl":""},{"stepNumber":2,"text":"Arrange six to eight soft pins or empty plastic bottles in a triangle shape at the end of the lane.","tip":"","imageUrl":""},{"stepNumber":3,"text":"Give each child a small basketball and show them how to roll the ball underhanded from the start line toward the pins.","tip":"","imageUrl":""},{"stepNumber":4,"text":"Let each child take turns rolling the basketball to try and knock down as many pins as possible.","tip":"","imageUrl":""},{"stepNumber":5,"text":"After each turn, help children count the number of pins knocked down, then reset the pins for the next child.","tip":"","imageUrl":""},{"stepNumber":6,"text":"Encourage children to cheer for their friends and try different rolling techniques.","tip":"","imageUrl":""}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activity_d3a6888d-ddec-4651-acd1-2379f50b2a0a_1755759472153_ai_generated_activity_1755759472152_6500f83c.png	Physical Development	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["2934afa6-9cf6-4411-9fe4-2ab3c3f8529a"]	0	\N	2025-08-19 05:53:25.875753	2025-08-19 05:53:25.875753	active	\N	["Develop hand-eye coordination and aim", "Strengthen arm and core muscles through rolling motion", "Practice taking turns and cheering for peers"]	10	["Ensure the bowling pins are made from soft, lightweight materials to avoid injury.", "Keep the play area clear of obstacles and ensure children have enough space to roll the basketball safely."]	Indoor	2-6 children	Low	["Shape Hunt - Arrange the pins in different shapes like a circle or square and ask children to notice and name the shape before rolling.", "Color Match - Use colored pins and encourage children to roll their basketball toward a specific color called out by the teacher."]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activity_d3a6888d-ddec-4651-acd1-2379f50b2a0a_1755759472153_ai_generated_activity_1755759472152_6500f83c.png	\N
bc58797f-6ccc-4420-953a-99e53cb8c111	Salt Painting Rainbow Discovery	Children will explore colors and textures by creating vibrant artwork using glue, salt, and watercolor paints. This sensory-rich activity encourages creativity, fine motor development, and early science concepts as children observe how salt absorbs paint to make magical patterns.	20	[]	["72236a10-da6a-4b3f-8b90-37ae205c1fcc"]	["c5c0f382-606b-4cd9-831c-3b1012036372","402dae30-caec-440b-b570-a58c780f6094","98af349b-d9b4-45da-89eb-93602f21dd59","0b4335c1-03d3-4cb4-890f-c75df8feacfb","207ce39b-f8cb-4ebf-ad75-bb7ef30e89b7"]	[{"stepNumber":1,"text":"Gather white paper, liquid glue (non-toxic), table salt, and watercolor paints with brushes.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482142480_b76ea514.png"},{"stepNumber":2,"text":"Help each child use the glue to draw simple lines or shapes on their paper. Keep designs large and open for easy painting.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482163945_61c0aaf7.png"},{"stepNumber":3,"text":"Sprinkle a generous amount of salt over the glued areas so it covers all the wet glue.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482333515_eed699ac.png"},{"stepNumber":4,"text":"Shake off any excess salt onto a tray or container.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482202310_2d1cedeb.png"},{"stepNumber":5,"text":"Allow children to select watercolor paints; show them how to gently touch their brush onto the salty lines so color spreads along the crystals.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482222173_71caabf0.png"},{"stepNumber":6,"text":"Encourage children to experiment with different colors and watch how they blend together on the salty surface.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755482237340_93f96a04.png"}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_bc58797f-6ccc-4420-953a-99e53cb8c111_1755838814625_ai_generated_1755482081323_8678eec6.png	Art & Creativity	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c", "bede5912-b242-436e-815d-9879d79f038a"]	0	\N	2025-08-18 01:59:28.342696	2025-08-18 01:59:28.342696	active	\N	["Develop fine motor skills through squeezing glue bottles and handling paintbrushes", "Explore color mixing while creating art with watercolors", "Discover basic science concepts by observing how salt absorbs liquid"]	10	["- Supervise closely so children do not ingest or taste art materials such as glue or paint", "- Ensure all materials are non-toxic and wash hands after activity"]	Indoor	2-6 children	Medium	["Shape Hunt - Draw simple geometric shapes like circles or squares with glue for a themed artwork session", "- Use colored construction paper instead of white for added contrast"]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_bc58797f-6ccc-4420-953a-99e53cb8c111_1755838814625_ai_generated_1755482081323_8678eec6.png	\N
7d4675fb-5c07-4589-9185-dbdff7dc656e	Animal Relay Adventure	Children will participate in an outdoor relay race where they move across a course by imitating different animal movements such as hopping like a frog, crawling like a bear, or waddling like a duck. This active game encourages gross motor skill development, coordination, balance, and imaginative movement while promoting teamwork and physical fitness.	25	[]	[]	["add9bcb1-a896-499a-b1f6-545f86113f8d","7a67f5d3-5c34-4d97-93ba-725d89caf261","4da6d60a-65a9-497c-b811-edc17f977856","4e89186c-f35f-4459-b941-8a46b4a4b1d4"]	[{"stepNumber":1,"text":"Set up a start and finish line in an open outdoor space using cones, ropes, or natural markers.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755490005330_e3100e38.png"},{"stepNumber":2,"text":"Divide children into small teams and explain that each team member will take turns moving along the course using a specific animal movement.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755490024719_e8fdf8cc.png"},{"stepNumber":3,"text":"Demonstrate several animal movements for the children, such as frog hops, bear crawls, crab walks, kangaroo jumps, and duck waddles.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755490043133_eefe26bb.png"},{"stepNumber":4,"text":"Give each team a list or picture cards of the animal movements they will use during their turns.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755490070858_1e18fd81.png"},{"stepNumber":5,"text":"On your signal, the first child from each team performs the first animal movement from start to finish, then tags the next teammate.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755490098070_d7b639ee.png"},{"stepNumber":6,"text":"Each subsequent child uses a different animal movement until all team members have had a turn.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755490126853_ba21aa32.png"},{"stepNumber":7,"text":"After everyone has finished, gather the group to stretch and talk about which animal movements were the most fun or challenging.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755490149518_1033a287.png"}]		https://duploservices-dev-activities-748544146453.s3.ca-central-1.amazonaws.com/lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activity_7d4675fb-5c07-4589-9185-dbdff7dc656e_1755839287577_ai_generated_activity_1755839287576_c8b7a8da.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA24SFVHQK4GLX44QY%2F20250822%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20250822T050808Z&X-Amz-Expires=3600&X-Amz-Signature=fc5261a872f021e6cfbe669a11b26bd98efd34b58c95acd040e4cfb4eceb2aaf&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject	Physical Development	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["bede5912-b242-436e-815d-9879d79f038a"]	0	\N	2025-08-18 04:09:27.10095	2025-08-18 04:09:27.10095	active	\N	["Develop gross motor skills by practicing a variety of full-body movements", "Enhance balance, coordination, and spatial awareness through playful locomotion", "Foster teamwork and cooperative play in a group setting"]	10	["Check the outdoor area for hazards such as rocks, holes, or slippery surfaces before starting", "Ensure children have enough space to move safely without bumping into each other"]	Outdoor	Full class or small teams (3-6 children per team)	Low	["Shape Hunt - Children search for natural objects in the play area shaped like different animal footprints before the relay begins", "Sound Safari - Children make the sound of their chosen animal as they move, encouraging vocal play and creativity"]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activity_7d4675fb-5c07-4589-9185-dbdff7dc656e_1755839287577_ai_generated_activity_1755839287576_c8b7a8da.png	\N
021b022d-f6f2-4e5c-ba95-783a4f634f2b	Rainbow Ribbon Parade	Children will create their own colorful ribbon wands using simple craft materials, then participate in an energetic group dance where they move, twirl, and wave their ribbons to music. This activity encourages creative self-expression through movement and visual art while supporting gross motor skills and rhythm awareness.	30	[]	["16b4900d-14a8-493b-8ecc-fb7d5e5144aa","4ead1815-cbb3-480f-a03d-4ee22857c5df"]	[]	[{"stepNumber":1,"text":"Prepare ribbon wands in advance or invite children to help attach long colorful ribbons to sticks or dowels using tape.","tip":"","imageUrl":""},{"stepNumber":2,"text":"Gather the children in a spacious indoor area with enough room for everyone to move safely.","tip":"","imageUrl":""},{"stepNumber":3,"text":"Introduce a variety of lively music tracks with different tempos and encourage children to experiment waving, twirling, and swirling their ribbon wands as the music plays.","tip":"","imageUrl":""},{"stepNumber":4,"text":"Guide the group through simple movements such as making circles above their heads, sweeping figure eights on the floor, or moving high and low with their ribbons.","tip":"","imageUrl":""},{"stepNumber":5,"text":"Invite children to invent new movements or patterns with their ribbons-moving fast or slow, big or small-and share these ideas with friends for everyone to try together.","tip":"","imageUrl":""},{"stepNumber":6,"text":"Encourage group dances where all participants follow one child’s creative ribbon movement before switching leaders so everyone gets a turn.","tip":"","imageUrl":""}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_021b022d-f6f2-4e5c-ba95-783a4f634f2b_1755838813474_9deadb94_c1b3_441e_86b2_71c7e94d6c45_1755546992864.jpeg	Art & Creativity	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c"]	0	\N	2025-08-18 19:41:48.135203	2025-08-18 19:41:48.135203	active	\N	["Develop gross motor coordination by moving arms and bodies in varied ways", "Express creativity through improvisational dance using visual art props", "Recognize changes in musical tempo and express them physically"]	10	["(1) Ensure adequate space between dancers so that waving ribbons do not hit other children.", "(2) Check that all stick ends are smooth or covered securely so there are no sharp edges."]	Indoor	Full class	Low	["'Shape Hunt' - Call out shapes (circle, zigzag) for children to make in the air with their ribbons as they move.", "'Color Parade' - Assign each child a color; have them form groups by color for collaborative mini-dances before rejoining the main parade."]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_021b022d-f6f2-4e5c-ba95-783a4f634f2b_1755838813474_9deadb94_c1b3_441e_86b2_71c7e94d6c45_1755546992864.jpeg	\N
9075be5f-7a15-47fa-a47d-132dc7a336fc	Story Stones Theater	Children will create their own set of story stones using smooth pebbles and art materials, then use the stones to invent and act out collaborative stories with classmates. This activity fosters creative expression, narrative skills, and fine motor development as children paint, draw, and bring their own imaginative tales to life.	35	[]	["d9bc8d7d-831a-4a5a-9e59-6a2e792eb857"]	["095cc861-947b-4306-934c-19c78f936414","98af349b-d9b4-45da-89eb-93602f21dd59","402dae30-caec-440b-b570-a58c780f6094","add9bcb1-a896-499a-b1f6-545f86113f8d"]	[{"stepNumber":1,"text":"Provide each child with 4-6 clean, smooth stones and a selection of art materials such as washable paints, permanent markers, and stickers.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755489458637_f33f7ba6.png"},{"stepNumber":2,"text":"Invite children to decorate each stone with a different character, object, animal, or setting, encouraging them to use their imagination and add lots of details.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755489479513_e79106c2.png"},{"stepNumber":3,"text":"Allow the stones to dry if using paint or glue-based materials.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755489498269_c84326e7.png"},{"stepNumber":4,"text":"Gather children in a circle and encourage each child to introduce their stones and explain what each one represents.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755489517036_23efacea.png"},{"stepNumber":5,"text":"Mix all the story stones together in a central basket.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755489543099_a1c48f57.png"},{"stepNumber":6,"text":"Take turns drawing 2-3 stones from the basket and work together as a group to invent a story that includes each chosen stone, acting out the story with gestures, voices, and movement.","tip":"","imageUrl":"/api/activities/images/ai_generated_1755489566961_8fb0e529.png"}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_9075be5f-7a15-47fa-a47d-132dc7a336fc_1755838815731_ai_generated_1755489382238_e3e4c907.png	Art & Creativity	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["bede5912-b242-436e-815d-9879d79f038a"]	0	\N	2025-08-18 04:02:37.375452	2025-08-18 04:02:37.375452	active	\N	["Develop fine motor skills through painting and drawing on small surfaces", "Enhance oral language and storytelling abilities", "Foster creativity, collaboration, and confidence in sharing ideas"]	10	["Ensure all stones are large enough to avoid choking hazards", "Supervise use of permanent markers and paint to prevent accidental staining or ingestion"]	Indoor	Full class or small groups of 3-6 children	Medium	["Shape Hunt - Children create stones with different shapes and use them to tell shape-based stories or search for matching objects around the room", "Emotion Stones - Children decorate stones with different facial expressions and create stories exploring feelings and empathy"]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_9075be5f-7a15-47fa-a47d-132dc7a336fc_1755838815731_ai_generated_1755489382238_e3e4c907.png	\N
fb610bb5-5d33-46e0-b0ee-5941c2741ab6	Attribute Detective: Sorting Mystery Bags	Children become Attribute Detectives, each receiving a mystery bag filled with assorted everyday objects of different colors, shapes, and sizes. Together at the table or in a circle, they explore and discuss the items, then sort them into groups by a chosen attribute, such as color, shape, or size. This activity directly builds the ability to notice, describe, and classify objects by their attributes, strengthening critical thinking and laying the foundation for math and science reasoning by giving children hands-on practice with grouping and sorting.	25	[]	["1ffb128d-9ae9-47b3-ba19-c21d385f1bea"]	["0b4335c1-03d3-4cb4-890f-c75df8feacfb","ac69ac81-0f88-442e-b24c-e5bff45eff9c"]	[{"stepNumber":1,"text":"Prepare small bags or containers, each filled with a mix of safe classroom objects varying in color, shape, and size, such as buttons, blocks, pom-poms, or plastic animals.","tip":"","imageUrl":""},{"stepNumber":2,"text":"Seat children around a table or in a circle and give each child or small group a mystery bag.","tip":"","imageUrl":""},{"stepNumber":3,"text":"Invite children to take out all objects and observe them closely, encouraging them to describe what they see using words like color, shape, or size.","tip":"","imageUrl":""},{"stepNumber":4,"text":"Ask children to choose one way to group the items, such as by color. Guide them as they sort the objects into piles or sections by the chosen attribute.","tip":"","imageUrl":""},{"stepNumber":5,"text":"After sorting, discuss with the group why certain items were grouped together and how they are similar or different.","tip":"","imageUrl":""},{"stepNumber":6,"text":"Repeat the activity, this time choosing a new attribute (for example, shape or size), and have children re-sort the objects accordingly.","tip":"","imageUrl":""},{"stepNumber":7,"text":"Encourage children to explain their thinking and to notice if any objects belong in more than one group.","tip":"","imageUrl":""}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_fb610bb5-5d33-46e0-b0ee-5941c2741ab6_1755838818475_ai_generated_1755663267177_e7afe245.png	Cognitive Development	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c"]	0	\N	2025-08-20 04:14:53.923025	2025-08-20 04:14:53.923025	active	\N	["Identify and describe attributes such as color, shape, and size", "Sort and classify objects by a selected attribute", "Explain reasoning for grouping choices, supporting language and critical thinking"]	10	["Ensure all small objects are large enough to prevent choking hazards and are appropriate for preschool age", "Supervise children at all times to prevent putting items in mouths or using them unsafely"]	Indoor	2-6 children	Low	["Shape Hunt - Children search the classroom for objects to add to their sorting groups, expanding the activity into a scavenger challenge", "Mystery Sorting Challenge - The teacher secretly selects an attribute and children guess the rule as they sort, building reasoning and prediction skills"]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_fb610bb5-5d33-46e0-b0ee-5941c2741ab6_1755838818475_ai_generated_1755663267177_e7afe245.png	\N
8a98e808-46a1-401f-acf9-fc0b85886b81	Button Bash Collage Party	Children will create vibrant, textured collages using an assortment of colorful buttons and other small, safe craft materials. They will arrange and glue the buttons onto sturdy paper in unique patterns or pictures, exploring shape, color, and tactile design while practicing decision-making and fine motor skills. This activity encourages creativity, spatial awareness, and sensory exploration as children experiment with different arrangements.	30	[]	[]	["f890566e-9f33-4ab1-897d-a839be9cc71f","c5c0f382-606b-4cd9-831c-3b1012036372","18e0160b-4c99-44b0-b2f3-72c225ef50da","98af349b-d9b4-45da-89eb-93602f21dd59"]	[{"stepNumber":1,"text":"Prepare a selection of large buttons in various colors and shapes along with non-toxic glue sticks or liquid glue on each table.","tip":"","imageUrl":""},{"stepNumber":2,"text":"Provide each child with a piece of sturdy construction paper or cardboard as their collage base.","tip":"","imageUrl":""},{"stepNumber":3,"text":"Encourage children to sort through the button collection and select their favorite pieces.","tip":"","imageUrl":""},{"stepNumber":4,"text":"Invite children to arrange the buttons on their paper in creative designs such as patterns, pictures (like flowers or faces), or abstract art before gluing anything down.","tip":"","imageUrl":""},{"stepNumber":5,"text":"Once they are happy with their arrangement, help them use glue to securely attach each button to the collage base.","tip":"","imageUrl":""},{"stepNumber":6,"text":"Allow time for drying while discussing everyone's creations as a group-children can describe what they made if they wish.","tip":"","imageUrl":""}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_8a98e808-46a1-401f-acf9-fc0b85886b81_1755838818024_ai_generated_1755584073235_9f8b3ab9.png	Art & Creativity	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c"]	0	\N	2025-08-19 06:14:43.786097	2025-08-19 06:14:43.786097	active	\N	["Develop fine motor skills through picking up and placing small objects", "Explore colors, shapes, textures, and pattern formation", "Encourage self-expression by creating original artwork"]	10	["- Supervise closely when handling small items like buttons to prevent choking hazards.", "- Ensure all adhesives used are non-toxic and safe for preschoolers."]	Indoor	Full class	Low	["Shape Hunt - Hide shaped buttons around the room for children to find before starting their collage project.", "- Add fabric scraps or yarn pieces alongside buttons for extra texture variety."]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_8a98e808-46a1-401f-acf9-fc0b85886b81_1755838818024_ai_generated_1755584073235_9f8b3ab9.png	\N
162a5a86-1eb7-4603-9132-e27315c4897a	Shadow Silhouette Story Mural	Children will work together to create a large group mural featuring colorful silhouette shapes of themselves and imaginative objects, using paper, light, and drawing. Each child will strike a unique pose or hold a favorite prop while a partner traces their shadow onto large paper hung on the wall. Children will then color, decorate, and assemble their silhouettes into a collaborative mural, sparking creativity, teamwork, and self-expression while exploring light and shadow.	35	[]	["d9bc8d7d-831a-4a5a-9e59-6a2e792eb857"]	["f890566e-9f33-4ab1-897d-a839be9cc71f","a75d3c76-1929-4f79-9c46-ff47368114ee","add9bcb1-a896-499a-b1f6-545f86113f8d","6487e4f8-59da-4851-8017-0be90930380f","402dae30-caec-440b-b570-a58c780f6094"]	[{"stepNumber":1,"text":"Hang a large sheet of white butcher paper or several large papers taped together on a classroom wall.","tip":"","imageUrl":""},{"stepNumber":2,"text":"Set up a bright lamp or flashlight to cast a clear shadow onto the paper. Turn off overhead lights if needed to make the shadow visible.","tip":"","imageUrl":""},{"stepNumber":3,"text":"Invite each child, one at a time, to stand in front of the paper and strike a creative pose, or hold a simple prop (like a cardboard crown or paper star).","tip":"","imageUrl":""},{"stepNumber":4,"text":"Have a partner or adult trace the outline of the child’s shadow onto the paper using a pencil or marker.","tip":"","imageUrl":""},{"stepNumber":5,"text":"After all silhouettes are traced, children return to the mural to fill in and decorate their own outlines with crayons, markers, collage materials, or paint.","tip":"","imageUrl":""},{"stepNumber":6,"text":"Encourage children to add extra details, patterns, or scenery around their silhouette to tell a story or show their interests.","tip":"","imageUrl":""},{"stepNumber":7,"text":"Once all decorations are complete, display the collaborative mural and invite children to share stories about their pose or character.","tip":"","imageUrl":""}]		/api/activities/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_162a5a86-1eb7-4603-9132-e27315c4897a_1755838817546_ai_generated_1755583913888_e90aaa9b.png	Art & Creativity	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["bede5912-b242-436e-815d-9879d79f038a"]	0	\N	2025-08-19 06:12:16.100671	2025-08-19 06:12:16.100671	active	\N	["Explore how light and shadow work through hands-on experience", "Develop fine motor skills by tracing, coloring, and decorating", "Express individuality and imagination while collaborating on group art"]	10	["Ensure lamp or flashlight is securely placed and cords are taped down to prevent tripping", "Supervise children closely when tracing and decorating to avoid crowding or bumping"]	Indoor	Full class	Medium	["Shape Hunt - Instead of people, children can trace and decorate the shadows of classroom objects or favorite toys for a themed mural", "Color Collage - Children fill their silhouettes with torn tissue paper or magazine pieces to create vibrant, textured art"]	1	10	t	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/activities/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_activities_162a5a86-1eb7-4603-9132-e27315c4897a_1755838817546_ai_generated_1755583913888_e90aaa9b.png	\N
\.


--
-- Data for Name: activity_records; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activity_records (id, tenant_id, scheduled_activity_id, user_id, completed, notes, materials_used, material_feedback, rating, rating_feedback, completed_at, created_at, updated_at) FROM stdin;
53197169-fefb-4e85-a568-731cfb452bde	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	986ddfc9-3012-42e1-8c15-9aa556423c13	e5b7f0de-c868-4e40-a0bd-e15937cb3097	t	This activity went really well. The class was engaged, and Billy stood up and did more than he usually does. So did other children. 	t	All the materials for this activty were great with one exception. The glue was not very sticky. 	5	It was fun and relativly easy to do and the kids had somethign to take home in the end. 	2025-08-19 06:28:32.855	2025-08-19 06:28:32.87527	2025-08-19 06:28:32.87527
89684bd8-534b-4fec-83f4-1b48ee73057a	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	5c71131a-da99-492d-a5e8-c9d4e108e98c	e5b7f0de-c868-4e40-a0bd-e15937cb3097	t	This went great	f	they didn't work very well. 	3	The kids we're just not that interested.	2025-08-19 06:40:50.882	2025-08-19 06:40:50.902517	2025-08-19 06:40:50.902517
b32b3e46-2a7e-46e0-bce1-6cfe54e73343	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	9849758e-818f-402d-832e-87ae80582b88	e5b7f0de-c868-4e40-a0bd-e15937cb3097	t	This was a fun one. 	t	The materials worked great we'll need to get more	5		2025-08-19 06:41:32.189	2025-08-19 06:41:32.210076	2025-08-19 06:41:32.210076
5805b00b-9b29-4109-80f8-a2afa2bb35c3	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	70a97669-2e61-4099-aae7-246386a0293d	teacher2_123	t	The kids had a ton of fun and learned a lot from this activity. 	t	All went well with the materials	4	Great activtiy I would make it better by blah blah blah\n	2025-08-20 00:54:05.869	2025-08-20 00:54:05.888489	2025-08-20 00:54:05.888489
ae24e01c-d761-42a1-95b7-61a6b8af7298	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	01806456-ba1e-43d7-b91a-d7558f46c387	e5b7f0de-c868-4e40-a0bd-e15937cb3097	t	The children had a really hard time with this activity. It couldn't hold their attention. I might choose somethign differnet to achecive this milestone next time. 	f	The materials were ok with the exception of the glue. Most of our glue containers are drying out. 	1	The kids didn't like this activtiy it could not hold their attention. 	2025-08-20 01:17:44.538	2025-08-20 01:17:44.557594	2025-08-20 01:17:44.557594
\.


--
-- Data for Name: age_groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.age_groups (id, tenant_id, name, description, age_range_start, age_range_end, is_active, created_at, location_id) FROM stdin;
aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Infant	0-18 months	0	2	t	2025-08-06 07:13:45.413031	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4
2934afa6-9cf6-4411-9fe4-2ab3c3f8529a	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Toddler	18 months - 3 years	2	3	t	2025-08-06 07:13:45.413031	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4
8fcab5ad-7da0-49a0-b97a-bdf77ea5212c	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Preschool	3-5 years	3	5	t	2025-08-06 07:13:45.413031	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4
bede5912-b242-436e-815d-9879d79f038a	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Kindergarten	5-6 years	5	6	t	2025-08-06 07:13:45.413031	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.categories (id, tenant_id, name, description, color, is_active, created_at, location_id) FROM stdin;
97b88f7e-e625-4891-85fe-6dbdb9a21671	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Art & Creativity	Creative activities and artistic expression	#ec4899	t	2025-08-06 06:48:33.101674	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4
1cd49b9f-f032-4f44-a066-9b4a015e4340	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Physical Development	Gross and fine motor skills development	#22c55e	t	2025-08-06 06:48:33.101674	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4
cef1b9fa-1583-41c1-8210-1d258b53a3ba	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Cognitive Development	Learning and thinking skills	#3b82f6	t	2025-08-06 06:48:33.101674	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4
1d39300c-bb2a-4dce-b165-4bc2a3eb5af8	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Social & Emotional	Social and Emotional skill building	#f97316	t	2025-08-16 20:02:26.608105	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4
\.


--
-- Data for Name: lesson_plans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lesson_plans (id, teacher_id, week_start, status, submitted_at, approved_at, tenant_id, location_id, room_id, schedule_type, submitted_by, approved_by, rejected_at, rejected_by, review_notes, created_at, updated_at) FROM stdin;
ee8aa1a0-97b5-4f19-94f1-4aa8b464650d	8a0a4958-0d17-4235-82b4-f2f9df8314b8	2025-09-01T00:00:00.000Z	approved	2025-08-18 21:15:43.813	2025-08-18 21:18:54.322	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	position-based	8a0a4958-0d17-4235-82b4-f2f9df8314b8	28e15245-8027-435e-b1e5-320ec4c28b32	\N	\N	this is great	2025-08-18 20:02:09.148371	2025-08-18 21:18:54.322
e87b49cf-623b-4b48-ba93-311b573bdd0e	8a0a4958-0d17-4235-82b4-f2f9df8314b8	2025-09-22T00:00:00.000Z	draft	\N	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	position-based	\N	\N	\N	\N	\N	2025-08-20 05:19:56.969342	2025-08-20 05:19:56.969342
e70493a6-916c-4e75-9bf4-a80fe46ff19f	8a0a4958-0d17-4235-82b4-f2f9df8314b8	2025-12-29T00:00:00.000Z	draft	\N	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	position-based	\N	\N	\N	\N	\N	2025-08-21 03:43:51.39129	2025-08-21 03:43:51.39129
52c99f46-e1ac-43cd-a073-57e0ccc45927	8a0a4958-0d17-4235-82b4-f2f9df8314b8	2025-08-18T00:00:00.000Z	approved	\N	2025-08-18 20:14:22.102	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	position-based	\N	28e15245-8027-435e-b1e5-320ec4c28b32	\N	\N	Auto-approved	2025-08-18 20:00:48.217452	2025-08-18 20:14:22.102
6fec37fa-4d16-4a05-8d3b-169533629a95	8a0a4958-0d17-4235-82b4-f2f9df8314b8	2025-08-25T00:00:00.000Z	approved	2025-08-18 20:01:29.65	2025-08-18 20:15:12.314	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	position-based	8a0a4958-0d17-4235-82b4-f2f9df8314b8	28e15245-8027-435e-b1e5-320ec4c28b32	\N	\N		2025-08-18 20:01:18.418992	2025-08-18 20:15:12.314
dd8e7417-ec63-415a-8bc3-67c8fabe01e3	8a0a4958-0d17-4235-82b4-f2f9df8314b8	2025-09-08T00:00:00.000Z	rejected	2025-08-18 20:37:25.955	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	position-based	8a0a4958-0d17-4235-82b4-f2f9df8314b8	\N	2025-08-18 20:38:31.045	28e15245-8027-435e-b1e5-320ec4c28b32	hey I want make some changes	2025-08-18 20:37:19.325336	2025-08-18 20:38:31.045
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.locations (id, tenant_id, name, description, address, capacity, is_active, created_at) FROM stdin;
2fcbb3b4-554b-4464-808f-20fe3d830937	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Test Frontend Location	\N	789 Frontend St	100	t	2025-08-06 06:05:22.588485
bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Main Campus	Primary educational facility.	123 Education St, Learning City	200	t	2025-08-06 05:51:33.873498
d6b17df7-04b8-4bc3-bb5a-cab25b88c602	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Third Location	test third location		100	t	2025-08-07 03:02:56.835067
\.


--
-- Data for Name: material_collection_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.material_collection_items (id, material_id, collection_id, created_at) FROM stdin;
29943c28-19ca-4936-beaf-21c8793dabad	095cc861-947b-4306-934c-19c78f936414	2f9a28a9-0570-4c08-bb88-709bbceb14c9	2025-08-18 03:56:47.493133
c762cf0c-4be5-4694-9505-2f8155d4c40a	4da6d60a-65a9-497c-b811-edc17f977856	f68aec8b-e94c-46e4-853d-62000e30564d	2025-08-18 04:05:53.402606
751425b2-10c7-4de5-81bf-500dc6d1194a	4e89186c-f35f-4459-b941-8a46b4a4b1d4	9ea9e23c-017c-4b8b-a55b-f4cf734063db	2025-08-18 04:06:08.34012
9d3a61a9-4bfb-463a-86f1-82cad5c5570e	bb05b529-4805-4e24-84ba-7a6c112f0740	744f78ed-0d4c-4e6c-aa9b-8dfdcb65c9d8	2025-08-19 04:29:19.30909
1f79ff51-5e04-46a3-ae64-c20c20980a40	4a03433d-3a0a-45dd-af9e-34a69804b45f	dc1b037a-f1c4-4a3f-afbe-1cce82f9bf55	2025-08-19 04:33:03.131489
6141572a-a246-4186-b08b-242bac5f904d	19982068-d4bf-4dd5-ae4a-64444cb4e5ba	9d847f2f-72bd-497a-abbb-c17259f815ba	2025-08-19 04:41:37.843976
dfd8d2cd-add9-4293-b7da-ec5dda0878d8	b25e4338-2137-4c3c-9760-9f52769f6a1d	31e36af8-eaf2-41e5-98aa-89e95ceffa22	2025-08-19 05:49:29.462505
9c4f866e-8e40-4340-8b17-eba459fbc4e8	f890566e-9f33-4ab1-897d-a839be9cc71f	4a2a8d7c-4753-456d-a853-a46c9953adab	2025-08-19 06:01:47.6295
7557691e-ccf0-4be6-bb82-655446df375e	a75d3c76-1929-4f79-9c46-ff47368114ee	4a2a8d7c-4753-456d-a853-a46c9953adab	2025-08-19 06:01:50.51684
c1e78781-1c14-4228-9b20-b2f396d7ce83	add9bcb1-a896-499a-b1f6-545f86113f8d	4a2a8d7c-4753-456d-a853-a46c9953adab	2025-08-19 06:01:51.86324
758e09db-fbf4-49d2-aa85-2fb1e99ccd07	6487e4f8-59da-4851-8017-0be90930380f	5a5ff51d-5d43-45c1-bdd7-4a2ed4559388	2025-08-19 06:02:25.157058
58ad083c-34c9-4042-ad90-482c812624f1	095cc861-947b-4306-934c-19c78f936414	5a5ff51d-5d43-45c1-bdd7-4a2ed4559388	2025-08-19 06:02:27.990621
f26b0905-4e45-4a0d-850b-d27add06dbde	f890566e-9f33-4ab1-897d-a839be9cc71f	a1f02221-952c-4536-9770-ee6368e499d9	2025-08-19 06:10:49.7701
f84a1b08-f4fd-4587-8c06-58b6a6382956	a75d3c76-1929-4f79-9c46-ff47368114ee	a1f02221-952c-4536-9770-ee6368e499d9	2025-08-19 06:10:50.056259
b5424d64-95cc-4bb2-809b-e923da32159a	add9bcb1-a896-499a-b1f6-545f86113f8d	a1f02221-952c-4536-9770-ee6368e499d9	2025-08-19 06:10:50.609469
758c8774-2b2f-4732-b79b-956265a23513	6487e4f8-59da-4851-8017-0be90930380f	a1f02221-952c-4536-9770-ee6368e499d9	2025-08-19 06:10:51.329665
b1a44d0c-2075-4f65-ae24-3bf6d4e56f24	402dae30-caec-440b-b570-a58c780f6094	a1f02221-952c-4536-9770-ee6368e499d9	2025-08-19 06:10:51.999002
15ea9a58-cfb4-440f-ad18-0688ae277454	f890566e-9f33-4ab1-897d-a839be9cc71f	f03e8285-a607-49bf-be6a-3a6810b7b79b	2025-08-19 06:12:59.735258
e9c41c6a-4352-4e88-961a-6c03582c5983	c5c0f382-606b-4cd9-831c-3b1012036372	f03e8285-a607-49bf-be6a-3a6810b7b79b	2025-08-19 06:13:01.832676
a696b440-8515-4919-9e17-f6348022a863	98af349b-d9b4-45da-89eb-93602f21dd59	f03e8285-a607-49bf-be6a-3a6810b7b79b	2025-08-19 06:13:10.683314
cb0e7c27-b8cb-4c87-807b-df58e0d469f3	0b4335c1-03d3-4cb4-890f-c75df8feacfb	d1c547c3-714d-4728-b09d-da68d6c6d483	2025-08-20 04:14:02.662482
e5261c48-fde6-44b2-a259-c272c2d4d6cb	ac69ac81-0f88-442e-b24c-e5bff45eff9c	d1c547c3-714d-4728-b09d-da68d6c6d483	2025-08-20 04:14:03.091475
2c29190f-fc3d-4917-8fa8-5f0b7066c214	f890566e-9f33-4ab1-897d-a839be9cc71f	ddc45f9f-d984-4e29-adaf-e328234475e1	2025-08-20 15:49:35.530488
decbada2-f4ff-46d3-982e-42368f258411	0b4335c1-03d3-4cb4-890f-c75df8feacfb	ddc45f9f-d984-4e29-adaf-e328234475e1	2025-08-20 15:49:36.006936
cfd7ad59-84a1-4569-8738-fa8963262098	18e0160b-4c99-44b0-b2f3-72c225ef50da	f03e8285-a607-49bf-be6a-3a6810b7b79b	2025-08-21 06:28:41.174826
a04662e6-f48f-4c29-a1e7-79b6b4d3aa81	7d3abe74-ad53-4c2c-92b2-4b8cd2b96653	ddc45f9f-d984-4e29-adaf-e328234475e1	2025-08-21 06:36:34.041455
\.


--
-- Data for Name: material_collections; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.material_collections (id, tenant_id, location_ids, name, description, created_at, updated_at) FROM stdin;
f0315be1-542e-431b-9c3d-4cd42fd2ec00	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Salt Painting Rainbow Discovery	Materials for Salt Painting Rainbow Discovery activity	2025-08-18 01:54:44.412154	2025-08-18 01:54:44.412154
de769f53-5589-4100-8940-4e2a1a39d87a	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Tunnel Tumble and Balance Adventure	Materials for Tunnel Tumble and Balance Adventure activity	2025-08-18 03:13:27.062788	2025-08-18 03:13:27.062788
007155ad-2b3f-49e0-b87d-acf88c4cf37c	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Feelings Friendship Parade	Materials for Feelings Friendship Parade activity	2025-08-18 03:34:29.276813	2025-08-18 03:34:29.276813
2f9a28a9-0570-4c08-bb88-709bbceb14c9	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Story Stones Theater	Materials for Story Stones Theater activity	2025-08-18 03:56:47.24821	2025-08-18 03:56:47.24821
f68aec8b-e94c-46e4-853d-62000e30564d	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Animal Relay Adventure	Materials for Animal Relay Adventure activity	2025-08-18 04:05:53.16293	2025-08-18 04:05:53.16293
9ea9e23c-017c-4b8b-a55b-f4cf734063db	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Animal Relay Adventure	Materials for Animal Relay Adventure activity	2025-08-18 04:06:08.095299	2025-08-18 04:06:08.095299
744f78ed-0d4c-4e6c-aa9b-8dfdcb65c9d8	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Colorful Stomp and Stamp Mural	Materials for Colorful Stomp and Stamp Mural activity	2025-08-18 20:53:09.182292	2025-08-18 20:53:09.182292
dc1b037a-f1c4-4a3f-afbe-1cce82f9bf55	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Shadow Shape Gallery	Materials for Shadow Shape Gallery activity	2025-08-18 21:40:33.604101	2025-08-18 21:40:33.604101
9d847f2f-72bd-497a-abbb-c17259f815ba	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Bubble Pathway Adventure	Materials for Bubble Pathway Adventure activity	2025-08-19 04:41:37.5739	2025-08-19 04:41:37.5739
31e36af8-eaf2-41e5-98aa-89e95ceffa22	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Basketball Bowling Bash	Materials for Basketball Bowling Bash activity	2025-08-19 05:49:29.205943	2025-08-19 05:49:29.205943
4a2a8d7c-4753-456d-a853-a46c9953adab	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Musical Mural Journey	Materials for Musical Mural Journey activity	2025-08-19 06:01:47.523553	2025-08-19 06:01:47.523553
5a5ff51d-5d43-45c1-bdd7-4a2ed4559388	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Musical Mural Journey	Materials for Musical Mural Journey activity	2025-08-19 06:02:24.916103	2025-08-19 06:02:24.916103
a1f02221-952c-4536-9770-ee6368e499d9	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Shadow Silhouette Story Mural	Materials for Shadow Silhouette Story Mural activity	2025-08-19 06:10:49.665016	2025-08-19 06:10:49.665016
f03e8285-a607-49bf-be6a-3a6810b7b79b	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Button Bash Collage Party	Materials for Button Bash Collage Party activity	2025-08-19 06:12:59.633341	2025-08-19 06:12:59.633341
d1c547c3-714d-4728-b09d-da68d6c6d483	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Attribute Detective: Sorting Mystery Bags	Materials for Attribute Detective: Sorting Mystery Bags activity	2025-08-20 04:14:02.532011	2025-08-20 04:14:02.532011
ddc45f9f-d984-4e29-adaf-e328234475e1	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	[]	Mystery Sound Match-Up	Materials for Mystery Sound Match-Up activity	2025-08-20 15:49:35.399867	2025-08-20 15:49:35.399867
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.materials (id, name, description, location, tenant_id, age_groups, photo_url, location_ids, status, created_at, updated_at, deleted_at, s3_key) FROM stdin;
4a03433d-3a0a-45dd-af9e-34a69804b45f	No Flame Battery-Powered Tea Lights	Battery powered tealights that do not have a flame.	Art Cabinet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["2934afa6-9cf6-4411-9fe4-2ab3c3f8529a","8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/images/ai_generated_material_1755577895912_37b40a78.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	deleted	2025-08-19 03:48:09.349538	2025-08-19 04:40:03.73	2025-08-19 04:40:03.73	\N
c5c0f382-606b-4cd9-831c-3b1012036372	Drawing Paper	Required for: Salt Painting Rainbow Discovery	Art Cabinet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3","2934afa6-9cf6-4411-9fe4-2ab3c3f8529a"]	/api/materials/images/drawing_paper.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	deleted	2025-08-19 03:48:09.349538	2025-08-20 15:48:46.683	2025-08-20 15:48:46.683	\N
19982068-d4bf-4dd5-ae4a-64444cb4e5ba	Bubble Solution	Required for: Bubble Pathway Adventure	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3","2934afa6-9cf6-4411-9fe4-2ab3c3f8529a","8fcab5ad-7da0-49a0-b97a-bdf77ea5212c"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_19982068-d4bf-4dd5-ae4a-64444cb4e5ba_1755803839757_ai_generated_material_1755575837386_043be1e1.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 04:41:37.743986	2025-08-19 04:41:37.743986	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_19982068-d4bf-4dd5-ae4a-64444cb4e5ba_1755803839757_ai_generated_material_1755575837386_043be1e1.png
402dae30-caec-440b-b570-a58c780f6094	Washable Paint	Required for: Salt Painting Rainbow Discovery	Art Cabinet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3","2934afa6-9cf6-4411-9fe4-2ab3c3f8529a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_402dae30-caec-440b-b570-a58c780f6094_1755803791528_washable_paint.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_402dae30-caec-440b-b570-a58c780f6094_1755803791528_washable_paint.png
98af349b-d9b4-45da-89eb-93602f21dd59	Glue Supplies	Required for: Salt Painting Rainbow Discovery	Art Cabinet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3","2934afa6-9cf6-4411-9fe4-2ab3c3f8529a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_98af349b-d9b4-45da-89eb-93602f21dd59_1755803792108_glue_supplies.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_98af349b-d9b4-45da-89eb-93602f21dd59_1755803792108_glue_supplies.png
18e0160b-4c99-44b0-b2f3-72c225ef50da	Natural Sticks	Required for: Button Bash Collage Party	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["2934afa6-9cf6-4411-9fe4-2ab3c3f8529a","8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_noid_1755757716220_ai_generated_material_1755757716220_63130bae.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 06:13:08.115672	2025-08-19 06:13:08.115672	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_noid_1755757716220_ai_generated_material_1755757716220_63130bae.png
7d3abe74-ad53-4c2c-92b2-4b8cd2b96653	Small Jars	Required for: Mystery Sound Match-Up	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["2934afa6-9cf6-4411-9fe4-2ab3c3f8529a","8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_7d3abe74-ad53-4c2c-92b2-4b8cd2b96653_1755758193100_ai_generated_material_1755758193100_97da007b.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-20 15:49:39.509954	2025-08-20 15:49:39.509954	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_7d3abe74-ad53-4c2c-92b2-4b8cd2b96653_1755758193100_ai_generated_material_1755758193100_97da007b.png
0b4335c1-03d3-4cb4-890f-c75df8feacfb	Storage Containers	Required for: Salt Painting Rainbow Discovery	Art Cabinet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3","2934afa6-9cf6-4411-9fe4-2ab3c3f8529a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_0b4335c1-03d3-4cb4-890f-c75df8feacfb_1755803792436_storage_containers.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_0b4335c1-03d3-4cb4-890f-c75df8feacfb_1755803792436_storage_containers.png
207ce39b-f8cb-4ebf-ad75-bb7ef30e89b7	Activity Trays	Required for: Salt Painting Rainbow Discovery	Art Cabinet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3","2934afa6-9cf6-4411-9fe4-2ab3c3f8529a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_207ce39b-f8cb-4ebf-ad75-bb7ef30e89b7_1755803792856_activity_trays.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_207ce39b-f8cb-4ebf-ad75-bb7ef30e89b7_1755803792856_activity_trays.png
a75d3c76-1929-4f79-9c46-ff47368114ee	Washable Crayons Set	Required for: Feelings Friendship Parade	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["2934afa6-9cf6-4411-9fe4-2ab3c3f8529a","8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_a75d3c76-1929-4f79-9c46-ff47368114ee_1755803793529_washable_crayons_set.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_a75d3c76-1929-4f79-9c46-ff47368114ee_1755803793529_washable_crayons_set.png
f890566e-9f33-4ab1-897d-a839be9cc71f	Drawing Paper	Required for: Feelings Friendship Parade	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["2934afa6-9cf6-4411-9fe4-2ab3c3f8529a","8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_f890566e-9f33-4ab1-897d-a839be9cc71f_1755803793955_drawing_paper.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_f890566e-9f33-4ab1-897d-a839be9cc71f_1755803793955_drawing_paper.png
7a67f5d3-5c34-4d97-93ba-725d89caf261	Blank Cards	Required for: Feelings Friendship Parade	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["2934afa6-9cf6-4411-9fe4-2ab3c3f8529a","8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_7a67f5d3-5c34-4d97-93ba-725d89caf261_1755803794620_blank_cards.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_7a67f5d3-5c34-4d97-93ba-725d89caf261_1755803794620_blank_cards.png
095cc861-947b-4306-934c-19c78f936414	Sticker Sheets	Required for: Story Stones Theater	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_095cc861-947b-4306-934c-19c78f936414_1755803794908_sticker_sheets.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_095cc861-947b-4306-934c-19c78f936414_1755803794908_sticker_sheets.png
4e89186c-f35f-4459-b941-8a46b4a4b1d4	Jump Ropes	Required for: Animal Relay Adventure	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_4e89186c-f35f-4459-b941-8a46b4a4b1d4_1755803795596_jump_ropes.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_4e89186c-f35f-4459-b941-8a46b4a4b1d4_1755803795596_jump_ropes.png
b25e4338-2137-4c3c-9760-9f52769f6a1d	Play Balls	Required for: Basketball Bowling Bash	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3","2934afa6-9cf6-4411-9fe4-2ab3c3f8529a","8fcab5ad-7da0-49a0-b97a-bdf77ea5212c"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_b25e4338-2137-4c3c-9760-9f52769f6a1d_1755803840548_ai_generated_material_1755576583121_37877eaa.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 05:49:29.35979	2025-08-19 05:49:29.35979	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_b25e4338-2137-4c3c-9760-9f52769f6a1d_1755803840548_ai_generated_material_1755576583121_37877eaa.png
ac69ac81-0f88-442e-b24c-e5bff45eff9c	Building Blocks	Required for: Tunnel Tumble and Balance Adventure	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3","2934afa6-9cf6-4411-9fe4-2ab3c3f8529a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_ac69ac81-0f88-442e-b24c-e5bff45eff9c_1755803793188_building_blocks.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_ac69ac81-0f88-442e-b24c-e5bff45eff9c_1755803793188_building_blocks.png
add9bcb1-a896-499a-b1f6-545f86113f8d	Washable Markers	Required for: Feelings Friendship Parade	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["2934afa6-9cf6-4411-9fe4-2ab3c3f8529a","8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_add9bcb1-a896-499a-b1f6-545f86113f8d_1755803794268_washable_markers.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_add9bcb1-a896-499a-b1f6-545f86113f8d_1755803794268_washable_markers.png
4da6d60a-65a9-497c-b811-edc17f977856	Activity Cones	Required for: Animal Relay Adventure	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_4da6d60a-65a9-497c-b811-edc17f977856_1755803795271_activity_cones.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_4da6d60a-65a9-497c-b811-edc17f977856_1755803795271_activity_cones.png
bb05b529-4805-4e24-84ba-7a6c112f0740	Tape	Required for: Colorful Stomp and Stamp Mural	Art Cabinet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["2934afa6-9cf6-4411-9fe4-2ab3c3f8529a","8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_bb05b529-4805-4e24-84ba-7a6c112f0740_1755803795927_ai_generated_material_1755577504495_cf9a780a.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 03:48:09.349538	2025-08-19 03:48:09.349538	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_bb05b529-4805-4e24-84ba-7a6c112f0740_1755803795927_ai_generated_material_1755577504495_cf9a780a.png
6487e4f8-59da-4851-8017-0be90930380f	Colored Pencils	Required for: Musical Mural Journey	Supply Closet	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	["8fcab5ad-7da0-49a0-b97a-bdf77ea5212c","bede5912-b242-436e-815d-9879d79f038a"]	/api/materials/s3/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_6487e4f8-59da-4851-8017-0be90930380f_1755803841063_ai_generated_material_1755576830901_caffa2a4.png	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	active	2025-08-19 06:02:25.058906	2025-08-19 06:02:25.058906	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/materials/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_material_6487e4f8-59da-4851-8017-0be90930380f_1755803841063_ai_generated_material_1755576830901_caffa2a4.png
\.


--
-- Data for Name: milestones; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.milestones (id, title, description, category, age_range_start, age_range_end, learning_objective, tenant_id, location_id, location_ids, age_group_ids, image_url, status, created_at, updated_at, deleted_at, s3_key) FROM stdin;
402b1b60-d528-4530-b472-5e0767adc343	Uses scissors to cut shapes	Controls scissors to cut along lines and create simple shapes, showing fine motor development.	Physical	48	60	Develop fine motor control and hand-eye coordination	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	2fcbb3b4-554b-4464-808f-20fe3d830937	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3", "2934afa6-9cf6-4411-9fe4-2ab3c3f8529a", "8fcab5ad-7da0-49a0-b97a-bdf77ea5212c", "bede5912-b242-436e-815d-9879d79f038a"]	https://duploservices-dev-activities-748544146453.s3.ca-central-1.amazonaws.com/lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_402b1b60-d528-4530-b472-5e0767adc343_1755760863909_uses_scissors.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA24SFVHQK4GLX44QY%2F20250821%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20250821T072104Z&X-Amz-Expires=3600&X-Amz-Signature=eb67f55ea23bacb7860d2751ae639a01a28f99c0d087ef1a03808b7151e94fd0&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject	active	2025-08-07 05:46:53.691921	2025-08-21 07:21:04.269467	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_402b1b60-d528-4530-b472-5e0767adc343_1755760863909_uses_scissors.png
16b4900d-14a8-493b-8ecc-fb7d5e5144aa	Comforts others when upset	Shows empathy by comforting peers who are sad or distressed	Emotional	24	48	Develop emotional awareness and empathy for others	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	["53f4ce44-fb2f-4c36-b72d-e8ea5e35f51d"]	https://duploservices-dev-activities-748544146453.s3.ca-central-1.amazonaws.com/lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_16b4900d-14a8-493b-8ecc-fb7d5e5144aa_1755761389053_child_comforting_sad_friend_f0ba417c.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA24SFVHQK4GLX44QY%2F20250821%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20250821T072949Z&X-Amz-Expires=3600&X-Amz-Signature=40ec107f34a428cef6529e1de6e7010c66b4e1df1c11f406274a717c631234dd&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject	active	2025-08-07 05:46:53.691921	2025-08-21 07:29:49.506739	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_16b4900d-14a8-493b-8ecc-fb7d5e5144aa_1755761389053_child_comforting_sad_friend_f0ba417c.png
72236a10-da6a-4b3f-8b90-37ae205c1fcc	Completes simple puzzles	Successfully completes age-appropriate puzzles with 4-8 pieces	Cognitive	18	36	Develop problem-solving skills and spatial awareness	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	["53f4ce44-fb2f-4c36-b72d-e8ea5e35f51d", "18c18b06-f9ba-42f6-bf1e-5c97d388f0d3"]	https://duploservices-dev-activities-748544146453.s3.ca-central-1.amazonaws.com/lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_72236a10-da6a-4b3f-8b90-37ae205c1fcc_1755761389597_children_solving_block_puzzles_42948e6c.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA24SFVHQK4GLX44QY%2F20250821%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20250821T072950Z&X-Amz-Expires=3600&X-Amz-Signature=be5a252ab65b8ae138843fe387deb0f276ff6d5e4261798534af2106df4e438b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject	active	2025-08-07 05:46:53.691921	2025-08-21 07:29:50.056341	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_72236a10-da6a-4b3f-8b90-37ae205c1fcc_1755761389597_children_solving_block_puzzles_42948e6c.png
1ffb128d-9ae9-47b3-ba19-c21d385f1bea	Sorts objects by attributes	Groups objects by color, size, shape, or function, demonstrating classification skills.	Cognitive	36	48	Develop logical thinking and categorization skills	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	2fcbb3b4-554b-4464-808f-20fe3d830937	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3", "2934afa6-9cf6-4411-9fe4-2ab3c3f8529a", "8fcab5ad-7da0-49a0-b97a-bdf77ea5212c", "bede5912-b242-436e-815d-9879d79f038a"]	https://duploservices-dev-activities-748544146453.s3.ca-central-1.amazonaws.com/lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_1ffb128d-9ae9-47b3-ba19-c21d385f1bea_1755760863282_sorts_objects.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA24SFVHQK4GLX44QY%2F20250821%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20250821T072103Z&X-Amz-Expires=3600&X-Amz-Signature=bba2cdab9f1104dd3c4228ddeab99a6cf971d4131d628cff15dbe608fd145552&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject	active	2025-08-07 05:46:53.691921	2025-08-21 07:21:03.863434	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_1ffb128d-9ae9-47b3-ba19-c21d385f1bea_1755760863282_sorts_objects.png
4ead1815-cbb3-480f-a03d-4ee22857c5df	Shares toys with peers	Child willingly shares toys and materials with classmates during play activities, demonstrating early cooperation skills.	Social	36	48	Develop cooperation and social interaction skills	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	2fcbb3b4-554b-4464-808f-20fe3d830937	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3", "2934afa6-9cf6-4411-9fe4-2ab3c3f8529a", "8fcab5ad-7da0-49a0-b97a-bdf77ea5212c", "bede5912-b242-436e-815d-9879d79f038a"]	https://duploservices-dev-activities-748544146453.s3.ca-central-1.amazonaws.com/lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_4ead1815-cbb3-480f-a03d-4ee22857c5df_1755761388146_children_sharing_toys_cooperatively_16e7d139.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA24SFVHQK4GLX44QY%2F20250821%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20250821T072948Z&X-Amz-Expires=3600&X-Amz-Signature=d1879a38c20d9f24fd866efc0c715e69676c56ec9c4821d93ad684e572cf093d&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject	active	2025-08-07 05:46:53.691921	2025-08-21 07:29:48.980128	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_4ead1815-cbb3-480f-a03d-4ee22857c5df_1755761388146_children_sharing_toys_cooperatively_16e7d139.png
92b31b7d-83f4-4e3e-ae78-0d984c8cb283	Climbs playground equipment	Safely climbs up and down playground structures with confidence	Physical	36	60	Build gross motor skills, strength, and coordination	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	["18c18b06-f9ba-42f6-bf1e-5c97d388f0d3", "05e9ed15-5a83-4bc4-870e-6e09c09e8a60"]	https://duploservices-dev-activities-748544146453.s3.ca-central-1.amazonaws.com/lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_92b31b7d-83f4-4e3e-ae78-0d984c8cb283_1755761390138_children_climbing_playground_equipment_ec0ff208.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA24SFVHQK4GLX44QY%2F20250821%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20250821T072950Z&X-Amz-Expires=3600&X-Amz-Signature=78f8114a41eeda7219cf455046cc934c794b6acffbc4575a25042cb12c24d383&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject	active	2025-08-07 05:46:53.691921	2025-08-21 07:29:50.601218	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_92b31b7d-83f4-4e3e-ae78-0d984c8cb283_1755761390138_children_climbing_playground_equipment_ec0ff208.png
d9bc8d7d-831a-4a5a-9e59-6a2e792eb857	Expresses feelings verbally	Uses words to communicate basic emotions like happy, sad, angry, or excited instead of only physical reactions.	Emotional	36	48	Develop emotional vocabulary and self-expression	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	2fcbb3b4-554b-4464-808f-20fe3d830937	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	["aa9665cc-fe0e-49ae-8a2b-f4f3439f30f3", "2934afa6-9cf6-4411-9fe4-2ab3c3f8529a", "8fcab5ad-7da0-49a0-b97a-bdf77ea5212c", "bede5912-b242-436e-815d-9879d79f038a"]	https://duploservices-dev-activities-748544146453.s3.ca-central-1.amazonaws.com/lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_d9bc8d7d-831a-4a5a-9e59-6a2e792eb857_1755841628775_ai_generated_milestone_1755841628775_c8a63b31.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA24SFVHQK4GLX44QY%2F20250822%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20250822T054709Z&X-Amz-Expires=3600&X-Amz-Signature=492904c56518cf60162d6a47840bf63d2e72662fb3707c409b507a1bbd7cc2b4&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject	active	2025-08-07 05:46:53.691921	2025-08-22 05:47:09.638002	\N	lesson-planning/7cb6c28d-164c-49fa-b461-dfc47a8a3fed/milestones/7cb6c28d-164c-49fa-b461-dfc47a8a3fed_milestone_d9bc8d7d-831a-4a5a-9e59-6a2e792eb857_1755841628775_ai_generated_milestone_1755841628775_c8a63b31.png
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, tenant_id, user_id, type, lesson_plan_id, title, message, review_notes, week_start, location_id, room_id, is_read, is_dismissed, created_at, dismissed_at) FROM stdin;
d8d6e486-a45a-4d98-a787-2f978f253838	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	8a0a4958-0d17-4235-82b4-f2f9df8314b8	lesson_plan_approved	52c99f46-e1ac-43cd-a073-57e0ccc45927	Lesson Plan Approved	Your lesson plan for Toddler 2 at Main Campus has been approved.		2025-08-18 00:00:00	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	f	2025-08-18 20:03:53.44758	\N
c77cd8c0-af59-4d8c-ae1a-50a7f937990e	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	8a0a4958-0d17-4235-82b4-f2f9df8314b8	lesson_plan_approved	6fec37fa-4d16-4a05-8d3b-169533629a95	Lesson Plan Approved	Your lesson plan for Toddler 2 at Main Campus has been approved.		2025-08-25 00:00:00	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	f	2025-08-18 20:15:12.450918	\N
4ffbe1f3-2cf3-48ce-8f42-c16ffb57a527	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	8a0a4958-0d17-4235-82b4-f2f9df8314b8	lesson_plan_approved	ee8aa1a0-97b5-4f19-94f1-4aa8b464650d	Lesson Plan Approved	Your lesson plan for Toddler 2 at Main Campus has been approved.	this is great	2025-09-01 00:00:00	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	f	2025-08-18 21:18:54.455243	\N
6f527115-0b89-4460-80b8-8e4e9035fca9	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	8a0a4958-0d17-4235-82b4-f2f9df8314b8	lesson_plan_returned	dd8e7417-ec63-415a-8bc3-67c8fabe01e3	Lesson Plan Returned for Revision	Your lesson plan for Toddler 2 at Main Campus has been returned for revision.	hey I want make some changes	2025-09-08 00:00:00	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	t	t	2025-08-18 20:38:31.17819	2025-08-19 06:14:57.047
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.permissions (id, name, resource, action, description, created_at, updated_at, tenant_id) FROM stdin;
ed9fac69-2dd1-4235-8766-62fee10df919	lesson_plan.create	lesson_plan	create	Create new lesson plans	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
c93651de-8567-424b-a8c5-7b6d8a0cf9b4	lesson_plan.read	lesson_plan	read	View lesson plans	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
232a5705-c3cf-4fac-b69a-e6923eaf0366	lesson_plan.update	lesson_plan	update	Edit existing lesson plans	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
d39f9f8b-8350-4be4-aaec-36b87093567b	lesson_plan.delete	lesson_plan	delete	Delete lesson plans	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
7c2b89c9-a188-4ac5-a2dc-b376a958cdd6	lesson_plan.submit	lesson_plan	submit	Submit plans for review	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
008f99e5-3366-4a00-bab8-337beb1f29c2	lesson_plan.approve	lesson_plan	approve	Approve submitted plans	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
556eaab7-8671-4c86-8f85-f61b67ab8791	lesson_plan.reject	lesson_plan	reject	Reject submitted plans	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
a775c818-c157-4445-bbdf-923be7fc6b54	lesson_plan.manage	lesson_plan	manage	Full lesson plan management	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
85a089c7-a07c-4fa1-81f8-e6ce10bb210a	activity.create	activity	create	Create new activities	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
3c9b7d7e-05a5-4aac-9b49-e9d1947c2063	activity.read	activity	read	View activities	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
d0833626-fcca-40f2-8fd6-9b269d662193	activity.update	activity	update	Edit existing activities	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
60a3913c-9d89-42c8-a7a0-79e86862f2c9	activity.delete	activity	delete	Delete activities	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
eda4a285-61c1-4938-a369-0324cd20cc3e	activity.manage	activity	manage	Full activity management	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
10222e5b-a5ed-4647-9762-1e82b25ce244	material.create	material	create	Create new materials	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
674645ba-ede9-4558-91c8-91eb1acc036b	material.read	material	read	View materials	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
737040cb-1aee-418d-9db1-dc79539f5df1	material.update	material	update	Edit existing materials	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
d6fe0add-38a7-4489-8078-e9bce276f23b	material.delete	material	delete	Delete materials	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
d3d2614f-23f1-49b3-ac20-a9de5738e0cc	material.manage	material	manage	Full material management	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
ef3aba4d-bdec-4179-aba1-523d49fcc481	milestone.create	milestone	create	Create new milestones	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
8f9081cd-b933-4e26-8c8b-cbaaf045619a	milestone.read	milestone	read	View milestones	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
bbd6ea04-2301-4d75-8268-64b669862ac7	milestone.update	milestone	update	Edit existing milestones	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
480c11ed-1400-41a2-a1fd-549a3f1326b0	milestone.delete	milestone	delete	Delete milestones	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
a1983ec5-19d7-416d-a16f-df2ef243f248	milestone.manage	milestone	manage	Full milestone management	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
8d708621-3e25-424a-bf57-f1ee9348abbb	settings.read	settings	read	View organization settings	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
06cde94c-ed28-4f57-b0f6-6c2aa5ef9936	settings.update	settings	update	Modify organization settings	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
d8a19bdb-c6d2-49ee-a0a8-ce1c1af5766e	settings.manage	settings	manage	Full settings management	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
c3818d66-b8ed-4f08-8f7f-a34efc7cd74f	location.manage	location	manage	Manage locations	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
7ab5084e-f2ba-419a-a9ca-144ab76c8bc3	room.manage	room	manage	Manage rooms	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permissions (id, role_id, permission_id, created_at, tenant_id) FROM stdin;
25cca4c2-1828-4572-8feb-4baa3d114b75	a8cf7866-51d4-47c6-b101-6eda987622ae	10222e5b-a5ed-4647-9762-1e82b25ce244	2025-08-20 05:02:04.720698	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
eed91d95-3b41-4dd3-9dec-22deefbda811	a8cf7866-51d4-47c6-b101-6eda987622ae	60a3913c-9d89-42c8-a7a0-79e86862f2c9	2025-08-20 05:02:04.720698	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
d32771a4-c1e2-4059-8f22-86938c198bc4	a8cf7866-51d4-47c6-b101-6eda987622ae	d0833626-fcca-40f2-8fd6-9b269d662193	2025-08-20 05:02:04.720698	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
b64e1d29-669e-413b-8320-aa91ff979341	a8cf7866-51d4-47c6-b101-6eda987622ae	d6fe0add-38a7-4489-8078-e9bce276f23b	2025-08-20 05:02:04.720698	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
20e53f2d-0c55-4d7b-be0d-5e87659bae83	a8cf7866-51d4-47c6-b101-6eda987622ae	737040cb-1aee-418d-9db1-dc79539f5df1	2025-08-20 05:02:04.720698	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
2cb7bd3b-b2e0-44c3-a793-13de8446ae1f	ab06360e-5fac-4a64-9d4d-90c1118f5d43	d6fe0add-38a7-4489-8078-e9bce276f23b	2025-08-20 05:02:17.586199	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
b936c438-ca40-4d59-93bc-86a3235edd4a	a8cf7866-51d4-47c6-b101-6eda987622ae	ed9fac69-2dd1-4235-8766-62fee10df919	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
2cb9c77d-02cb-4543-bb36-55359ac5dfec	ab06360e-5fac-4a64-9d4d-90c1118f5d43	ed9fac69-2dd1-4235-8766-62fee10df919	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
9b36bbf0-5253-4568-b4e5-33b10dd7db8e	51a88e2a-992a-432a-862a-71f0db317cfb	ed9fac69-2dd1-4235-8766-62fee10df919	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
24d60764-ce89-4d55-bb98-38036c613cbb	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	ed9fac69-2dd1-4235-8766-62fee10df919	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
86a4470f-6c1a-4a47-98af-0fb2cc588688	a8cf7866-51d4-47c6-b101-6eda987622ae	c93651de-8567-424b-a8c5-7b6d8a0cf9b4	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
e886cf0f-0797-450a-b9f1-9c079acd5bf4	ab06360e-5fac-4a64-9d4d-90c1118f5d43	c93651de-8567-424b-a8c5-7b6d8a0cf9b4	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
fea2859c-939f-4fc9-a455-019b262bac49	51a88e2a-992a-432a-862a-71f0db317cfb	c93651de-8567-424b-a8c5-7b6d8a0cf9b4	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
cfd50640-c5a4-4c6e-9268-efb1f66b93b3	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	c93651de-8567-424b-a8c5-7b6d8a0cf9b4	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
50fbb7e6-8c8a-48c3-8c19-5990e0edd13d	a8cf7866-51d4-47c6-b101-6eda987622ae	232a5705-c3cf-4fac-b69a-e6923eaf0366	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
6426fcf7-a6c2-4ecc-be0a-4ce2fe9fc11f	ab06360e-5fac-4a64-9d4d-90c1118f5d43	232a5705-c3cf-4fac-b69a-e6923eaf0366	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
f0a2e700-45e6-4dcd-a15a-3420432d3e41	51a88e2a-992a-432a-862a-71f0db317cfb	232a5705-c3cf-4fac-b69a-e6923eaf0366	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
2cfeacd3-fa75-45bd-9b23-f563ba0e2eb2	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	232a5705-c3cf-4fac-b69a-e6923eaf0366	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
e0cf6b8b-c346-4d65-8059-358cd7e6f986	ab06360e-5fac-4a64-9d4d-90c1118f5d43	d39f9f8b-8350-4be4-aaec-36b87093567b	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
c3c0f80c-7189-4485-92e5-9a60f56aa309	51a88e2a-992a-432a-862a-71f0db317cfb	d39f9f8b-8350-4be4-aaec-36b87093567b	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
a8829bb7-6270-4a72-aa01-30a1b5c7e713	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	d39f9f8b-8350-4be4-aaec-36b87093567b	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
1cdf82c0-2310-4953-b04f-35b55ca14630	a8cf7866-51d4-47c6-b101-6eda987622ae	7c2b89c9-a188-4ac5-a2dc-b376a958cdd6	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
7bc44449-42be-412f-8b55-e7967e657660	ab06360e-5fac-4a64-9d4d-90c1118f5d43	7c2b89c9-a188-4ac5-a2dc-b376a958cdd6	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
a3d04617-70b1-4e25-80a6-44ac47c1c263	51a88e2a-992a-432a-862a-71f0db317cfb	7c2b89c9-a188-4ac5-a2dc-b376a958cdd6	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
a1419540-becf-4851-a8d7-63131e3a12b8	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	7c2b89c9-a188-4ac5-a2dc-b376a958cdd6	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
7c42ec2f-bc67-48ab-934f-f1a209f0ed6a	ab06360e-5fac-4a64-9d4d-90c1118f5d43	008f99e5-3366-4a00-bab8-337beb1f29c2	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
f9ae7820-2487-431f-888b-71025895ec88	c811782d-5542-4a0c-be1c-86568429f826	008f99e5-3366-4a00-bab8-337beb1f29c2	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
e19ee3d8-0aab-4727-a8fa-13c21934362a	51a88e2a-992a-432a-862a-71f0db317cfb	008f99e5-3366-4a00-bab8-337beb1f29c2	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
672c203c-f69a-4b77-838a-541d5ae8cae5	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	008f99e5-3366-4a00-bab8-337beb1f29c2	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
3729470c-01c7-4f49-bb36-ab27bd520079	ab06360e-5fac-4a64-9d4d-90c1118f5d43	556eaab7-8671-4c86-8f85-f61b67ab8791	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
6a48a3d3-33e9-4854-8ac7-01af20dbb2e5	c811782d-5542-4a0c-be1c-86568429f826	556eaab7-8671-4c86-8f85-f61b67ab8791	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
b292393f-a649-48c3-8535-8a5b8b1249f0	51a88e2a-992a-432a-862a-71f0db317cfb	556eaab7-8671-4c86-8f85-f61b67ab8791	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
c6c46859-a1ff-421a-b05e-9b1df43b9f0a	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	556eaab7-8671-4c86-8f85-f61b67ab8791	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
3d3da8a0-fd0f-4f03-8122-9fd829f4f393	c811782d-5542-4a0c-be1c-86568429f826	a775c818-c157-4445-bbdf-923be7fc6b54	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
a881d666-f52c-415c-bebe-2121af43dffd	51a88e2a-992a-432a-862a-71f0db317cfb	a775c818-c157-4445-bbdf-923be7fc6b54	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
f9ea8573-6345-491b-88da-6348deaeadf6	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	a775c818-c157-4445-bbdf-923be7fc6b54	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
604cc87c-b297-469b-9a5c-cae6e742209f	a8cf7866-51d4-47c6-b101-6eda987622ae	85a089c7-a07c-4fa1-81f8-e6ce10bb210a	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
4d7c4eb7-af6d-4ac5-b19b-b3edb6ba3cad	ab06360e-5fac-4a64-9d4d-90c1118f5d43	85a089c7-a07c-4fa1-81f8-e6ce10bb210a	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
5d125793-b584-4dd6-bf70-f7654c9bc3fb	51a88e2a-992a-432a-862a-71f0db317cfb	85a089c7-a07c-4fa1-81f8-e6ce10bb210a	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
e1202442-e821-4e44-970d-812e7f8c440d	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	85a089c7-a07c-4fa1-81f8-e6ce10bb210a	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
64b454b1-5b9d-4e3a-85ef-c57b0269ecbc	a8cf7866-51d4-47c6-b101-6eda987622ae	3c9b7d7e-05a5-4aac-9b49-e9d1947c2063	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
126a50ae-4358-4942-931b-b40e3116d1fd	ab06360e-5fac-4a64-9d4d-90c1118f5d43	3c9b7d7e-05a5-4aac-9b49-e9d1947c2063	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
e97c68c3-35a0-4c1e-844d-19b6c0af0021	51a88e2a-992a-432a-862a-71f0db317cfb	3c9b7d7e-05a5-4aac-9b49-e9d1947c2063	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
73f628a0-7ee9-4712-a12e-68bbffc7fe78	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	3c9b7d7e-05a5-4aac-9b49-e9d1947c2063	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
afc09be9-5c6e-40f6-9e9d-0c2812e8c52a	ab06360e-5fac-4a64-9d4d-90c1118f5d43	d0833626-fcca-40f2-8fd6-9b269d662193	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
12a45d90-e703-4506-abe4-b6a601093709	51a88e2a-992a-432a-862a-71f0db317cfb	d0833626-fcca-40f2-8fd6-9b269d662193	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
483b1b09-53a4-4f9d-9f38-acdf5d96e2ec	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	d0833626-fcca-40f2-8fd6-9b269d662193	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
1d7492fe-b914-4ffb-b55a-93beb673e0db	ab06360e-5fac-4a64-9d4d-90c1118f5d43	60a3913c-9d89-42c8-a7a0-79e86862f2c9	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
500ed110-6246-4705-8fba-da78ef97293d	51a88e2a-992a-432a-862a-71f0db317cfb	60a3913c-9d89-42c8-a7a0-79e86862f2c9	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
1a33c063-f1ba-4d60-8014-cfed472f71c7	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	60a3913c-9d89-42c8-a7a0-79e86862f2c9	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
9c3b2b78-3dd6-4325-b01b-89997d41d81b	c811782d-5542-4a0c-be1c-86568429f826	eda4a285-61c1-4938-a369-0324cd20cc3e	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
7e9a80d8-3328-4446-b425-3195237f3fd4	51a88e2a-992a-432a-862a-71f0db317cfb	eda4a285-61c1-4938-a369-0324cd20cc3e	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
67c1b6c0-f7b4-42a1-996e-6dc3a265c9d1	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	eda4a285-61c1-4938-a369-0324cd20cc3e	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
8c6a458b-5c4b-40f2-85d5-e57622887129	ab06360e-5fac-4a64-9d4d-90c1118f5d43	10222e5b-a5ed-4647-9762-1e82b25ce244	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
af3172ec-4d9f-4af4-aacd-d340b800f097	51a88e2a-992a-432a-862a-71f0db317cfb	10222e5b-a5ed-4647-9762-1e82b25ce244	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
a7bd2416-4e62-40d5-8cea-cd0df8b2a91d	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	10222e5b-a5ed-4647-9762-1e82b25ce244	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
3efb194b-cbdf-4cf7-bb50-cee484b33cd5	a8cf7866-51d4-47c6-b101-6eda987622ae	674645ba-ede9-4558-91c8-91eb1acc036b	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
92e85bb9-d39e-4e6c-867a-be2839b08e92	ab06360e-5fac-4a64-9d4d-90c1118f5d43	674645ba-ede9-4558-91c8-91eb1acc036b	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
a945162a-289e-4831-b380-c84db313028a	51a88e2a-992a-432a-862a-71f0db317cfb	674645ba-ede9-4558-91c8-91eb1acc036b	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
f96517b6-b31a-4162-99f2-c70dc7127332	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	674645ba-ede9-4558-91c8-91eb1acc036b	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
37bd7246-86d7-49c8-8088-f75048616f25	ab06360e-5fac-4a64-9d4d-90c1118f5d43	737040cb-1aee-418d-9db1-dc79539f5df1	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
fc84f8d1-ca97-4b8e-b98a-321996efe74c	51a88e2a-992a-432a-862a-71f0db317cfb	737040cb-1aee-418d-9db1-dc79539f5df1	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
82e29ce2-528b-47ad-a1f9-d52e3b5b595f	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	737040cb-1aee-418d-9db1-dc79539f5df1	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
0ddfe79c-0e5a-410d-ab53-666d5bedddda	51a88e2a-992a-432a-862a-71f0db317cfb	d6fe0add-38a7-4489-8078-e9bce276f23b	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
66aff883-7856-474b-8c07-7ed079c1fd73	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	d6fe0add-38a7-4489-8078-e9bce276f23b	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
f69f0de8-021c-486d-aebc-5a45fb63301f	c811782d-5542-4a0c-be1c-86568429f826	d3d2614f-23f1-49b3-ac20-a9de5738e0cc	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
8374c87d-9692-450d-a506-d65a2ea271ce	51a88e2a-992a-432a-862a-71f0db317cfb	d3d2614f-23f1-49b3-ac20-a9de5738e0cc	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
e91303aa-6235-4ca6-880c-ae9fdc7b6173	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	d3d2614f-23f1-49b3-ac20-a9de5738e0cc	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
474c5267-168d-4926-8e79-432a34f31219	ab06360e-5fac-4a64-9d4d-90c1118f5d43	ef3aba4d-bdec-4179-aba1-523d49fcc481	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
1ff0638c-a5f2-4605-b169-30c0749e494a	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	ef3aba4d-bdec-4179-aba1-523d49fcc481	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
fb6f27b2-5912-4ffa-961c-08f9b7e2168e	a8cf7866-51d4-47c6-b101-6eda987622ae	8f9081cd-b933-4e26-8c8b-cbaaf045619a	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
e4726f05-2543-4e9d-86f3-c8dd64e01101	ab06360e-5fac-4a64-9d4d-90c1118f5d43	8f9081cd-b933-4e26-8c8b-cbaaf045619a	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
a694885e-061f-4a06-aa38-8f79a3676063	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	8f9081cd-b933-4e26-8c8b-cbaaf045619a	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
d60f816f-e33a-45b1-9bc3-38ae195aaf55	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	bbd6ea04-2301-4d75-8268-64b669862ac7	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
63975c68-6ba5-4c89-bfbb-f11fa4d3846b	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	480c11ed-1400-41a2-a1fd-549a3f1326b0	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
6ed1c790-9ee3-44a4-bd5f-ddac6acf8b9c	c811782d-5542-4a0c-be1c-86568429f826	a1983ec5-19d7-416d-a16f-df2ef243f248	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
a7472e9a-3ebc-414f-8212-7c084c1e7da2	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	a1983ec5-19d7-416d-a16f-df2ef243f248	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
5a071b92-8021-406a-83ed-10de4ff1ae7e	c811782d-5542-4a0c-be1c-86568429f826	8d708621-3e25-424a-bf57-f1ee9348abbb	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
2dabe1f4-5072-468e-bb10-84d6f326e33f	51a88e2a-992a-432a-862a-71f0db317cfb	8d708621-3e25-424a-bf57-f1ee9348abbb	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
18d7044f-61f7-441e-93af-65b11ac4842c	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	8d708621-3e25-424a-bf57-f1ee9348abbb	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
b82a462c-d3b1-4faf-92e2-c830bd67e64b	51a88e2a-992a-432a-862a-71f0db317cfb	06cde94c-ed28-4f57-b0f6-6c2aa5ef9936	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
11b03555-10e4-47e7-8e36-4075b796e42f	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	06cde94c-ed28-4f57-b0f6-6c2aa5ef9936	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
acfb3bc7-ba04-46c7-92df-b97464684343	51a88e2a-992a-432a-862a-71f0db317cfb	d8a19bdb-c6d2-49ee-a0a8-ce1c1af5766e	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
6cf3b999-cd5a-4908-9c66-13943d7dc122	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	d8a19bdb-c6d2-49ee-a0a8-ce1c1af5766e	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
0120fb08-a97a-4b32-9938-ce3fb1ab39c4	51a88e2a-992a-432a-862a-71f0db317cfb	c3818d66-b8ed-4f08-8f7f-a34efc7cd74f	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
c253db4d-0dd1-488b-9eb0-6b4bf01acf76	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	c3818d66-b8ed-4f08-8f7f-a34efc7cd74f	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
b79e6f4d-93b1-456a-b25b-a256e4657cc4	c811782d-5542-4a0c-be1c-86568429f826	7ab5084e-f2ba-419a-a9ca-144ab76c8bc3	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
233f0f9b-af32-45a2-b8b8-34737a3b7036	51a88e2a-992a-432a-862a-71f0db317cfb	7ab5084e-f2ba-419a-a9ca-144ab76c8bc3	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
e135d237-daa8-496b-beb9-35adb42e8f60	ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	7ab5084e-f2ba-419a-a9ca-144ab76c8bc3	2025-08-10 03:11:13.738747	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, description, is_system, created_at, updated_at, tenant_id) FROM stdin;
a8cf7866-51d4-47c6-b101-6eda987622ae	teacher	Basic educator role	t	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
ab06360e-5fac-4a64-9d4d-90c1118f5d43	assistant_director	Mid-level management	t	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
c811782d-5542-4a0c-be1c-86568429f826	director	Location management	t	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
51a88e2a-992a-432a-862a-71f0db317cfb	admin	Organization administration	t	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
ce5f1ee2-425f-4838-bddb-57bc0f3df2b5	superadmin	Full system access	t	2025-08-10 03:11:02.016926	2025-08-10 03:11:02.016926	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
1a7e8d70-13b7-4a64-8fe7-92004548fc37	parent	Parent role for viewing approved lesson plans for their child	t	2025-08-16 02:27:59.967356	2025-08-16 02:27:59.967356	7cb6c28d-164c-49fa-b461-dfc47a8a3fed
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rooms (id, tenant_id, location_id, name, description, capacity, is_active, created_at) FROM stdin;
be3e6a76-17cb-4421-824a-272e24cf302f	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	Toddler 2	A room without age restrictions	25	t	2025-08-06 06:18:19.584055
568e0562-29e4-450b-a854-f4596fff24b6	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	d6b17df7-04b8-4bc3-bb5a-cab25b88c602	Infant		11	t	2025-08-09 04:09:58.011481
1cf7ca57-5bd8-4a5b-98f3-2b730da35fd2	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	Toddler 3		15	t	2025-08-16 05:15:54.461305
\.


--
-- Data for Name: scheduled_activities; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.scheduled_activities (id, lesson_plan_id, activity_id, day_of_week, time_slot, notes, tenant_id, location_id, room_id, completed, completed_at) FROM stdin;
ad665104-7954-4255-aad2-9b8cf9f86c51	52c99f46-e1ac-43cd-a073-57e0ccc45927	524e1a10-1f2e-46b6-8015-d33033b97e64	0	2	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
c50f65e2-b5f5-4399-80a8-f1f6bfb3a543	6fec37fa-4d16-4a05-8d3b-169533629a95	9075be5f-7a15-47fa-a47d-132dc7a336fc	2	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
0f8d5bd2-0456-4496-8641-9b9a29a06b34	6fec37fa-4d16-4a05-8d3b-169533629a95	7d4675fb-5c07-4589-9185-dbdff7dc656e	1	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
0b933163-a2c0-4a3d-9a81-9ac08dadb5dc	6fec37fa-4d16-4a05-8d3b-169533629a95	8f888600-8a83-4791-8915-7be84b8381da	3	1	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
fd279915-879d-45ea-8c42-75e98bd4d988	ee8aa1a0-97b5-4f19-94f1-4aa8b464650d	7f5c567e-157c-4df0-9c04-7be3f332e2b9	2	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
4ccd6963-ce92-4143-b5e4-f519143d52b7	ee8aa1a0-97b5-4f19-94f1-4aa8b464650d	524e1a10-1f2e-46b6-8015-d33033b97e64	3	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
b03216ff-55d5-483e-87a5-d7f75f291fc4	52c99f46-e1ac-43cd-a073-57e0ccc45927	524e1a10-1f2e-46b6-8015-d33033b97e64	4	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
e3c527a7-ed54-4002-906d-e54bc91fdf8d	52c99f46-e1ac-43cd-a073-57e0ccc45927	9075be5f-7a15-47fa-a47d-132dc7a336fc	3	2	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
da671c90-2683-4d21-9bb3-8a25327ed2b4	52c99f46-e1ac-43cd-a073-57e0ccc45927	8f888600-8a83-4791-8915-7be84b8381da	2	2	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
6c1a87b3-3f29-4dff-b43c-fb06e8624763	dd8e7417-ec63-415a-8bc3-67c8fabe01e3	021b022d-f6f2-4e5c-ba95-783a4f634f2b	1	1	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
033dc6c6-5957-427e-a732-252ecf361c10	dd8e7417-ec63-415a-8bc3-67c8fabe01e3	021b022d-f6f2-4e5c-ba95-783a4f634f2b	3	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
707c1aba-01fe-4056-8062-15b022386f6e	ee8aa1a0-97b5-4f19-94f1-4aa8b464650d	021b022d-f6f2-4e5c-ba95-783a4f634f2b	2	1	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
bb291721-fcae-4750-bbc6-f8b2d03cf9ba	ee8aa1a0-97b5-4f19-94f1-4aa8b464650d	7f5c567e-157c-4df0-9c04-7be3f332e2b9	0	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
986ddfc9-3012-42e1-8c15-9aa556423c13	52c99f46-e1ac-43cd-a073-57e0ccc45927	7f5c567e-157c-4df0-9c04-7be3f332e2b9	0	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	t	2025-08-19 06:28:32.919
5c71131a-da99-492d-a5e8-c9d4e108e98c	52c99f46-e1ac-43cd-a073-57e0ccc45927	8f888600-8a83-4791-8915-7be84b8381da	2	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	t	2025-08-19 06:40:50.926
9849758e-818f-402d-832e-87ae80582b88	52c99f46-e1ac-43cd-a073-57e0ccc45927	524e1a10-1f2e-46b6-8015-d33033b97e64	2	1	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	t	2025-08-19 06:41:32.235
70a97669-2e61-4099-aae7-246386a0293d	52c99f46-e1ac-43cd-a073-57e0ccc45927	021b022d-f6f2-4e5c-ba95-783a4f634f2b	0	1	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	t	2025-08-20 00:54:05.937
01806456-ba1e-43d7-b91a-d7558f46c387	52c99f46-e1ac-43cd-a073-57e0ccc45927	bc58797f-6ccc-4420-953a-99e53cb8c111	3	1	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	t	2025-08-20 01:17:44.586
d6c1e13c-3743-48f8-a10c-d443587d916d	e87b49cf-623b-4b48-ba93-311b573bdd0e	021b022d-f6f2-4e5c-ba95-783a4f634f2b	2	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
7c6e931c-2fe8-435b-a4e6-ed734bbfe8b4	e87b49cf-623b-4b48-ba93-311b573bdd0e	524e1a10-1f2e-46b6-8015-d33033b97e64	4	1	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
837dfe04-e8c4-4490-9929-a177e64f2240	e70493a6-916c-4e75-9bf4-a80fe46ff19f	021b022d-f6f2-4e5c-ba95-783a4f634f2b	3	0	\N	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4	be3e6a76-17cb-4421-824a-272e24cf302f	f	\N
\.


--
-- Data for Name: tenant_permission_overrides; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenant_permission_overrides (id, tenant_id, permission_name, roles_required, auto_approve_roles, created_at, updated_at) FROM stdin;
43b1bfd5-86e2-4c05-9d89-3f03f89d6f8c	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	settings.access	[]	["director","admin"]	2025-08-10 03:46:50.309902	2025-08-10 03:46:50.309902
4505b52f-6613-452e-b1a2-714199780cdf	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	settings.access	[]	["director","admin"]	2025-08-10 03:47:19.422522	2025-08-10 03:47:19.422522
fb9a0530-0b95-4449-86ec-dba7c651fd88	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	activity.update	[]	["admin","director"]	2025-08-20 05:13:37.71985	2025-08-20 18:03:46.84
0619c264-798e-485a-85f5-b034628cd610	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	material.delete	[]	["admin","director"]	2025-08-20 05:13:47.097607	2025-08-20 18:03:46.878
aa3e7e44-5347-4a16-b43c-0bcd6ff99b34	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	settings.access	[]	["director","admin"]	2025-08-10 03:49:18.033828	2025-08-10 03:49:18.033828
1bb23117-0ec2-40f7-a3be-a574b6a99593	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	material.update	[]	["director","admin"]	2025-08-20 05:13:47.09224	2025-08-20 18:03:46.88
4d3c30ac-49c9-4842-96e6-258be4e4032a	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	settings.access	[]	["admin","director"]	2025-08-10 04:11:47.188035	2025-08-16 04:33:48.68
350fdca2-7a3e-456b-b4c4-4d914ec41e9a	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	material.create	[]	["admin","director"]	2025-08-20 05:13:47.067248	2025-08-20 18:03:46.883
d228dfc0-b3df-41bf-93cf-ee28429261e6	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	settings.access	[]	["director","admin"]	2025-08-10 03:49:33.227295	2025-08-10 03:49:33.227295
0f6fadba-648b-4273-a1e8-8906981dc7bc	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	settings.access	[]	["admin"]	2025-08-10 03:49:51.273695	2025-08-10 03:49:51.273695
76a2b6ba-d066-4732-acb0-7ec7f6efc443	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	lesson_plan.reject	[]	["director","admin","superadmin"]	2025-08-10 03:11:23.88497	2025-08-20 18:03:46.654
26d84b81-4dca-4176-b2e1-9038dbc7f3d3	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	lesson_plan.approve	[]	["director","admin","superadmin"]	2025-08-10 03:11:23.88497	2025-08-20 18:03:46.657
847f59fc-2d30-47b9-9804-771e1dcf6f5f	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	settings.access	[]	[]	2025-08-10 04:06:24.638445	2025-08-20 18:03:46.64
bb895d6e-ad22-4f17-9e97-243dd62b0e7a	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	lesson_plan.copy	[]	["director","admin"]	2025-08-16 04:33:48.706161	2025-08-20 18:03:46.648
a9f47146-a04f-4df1-8d78-e3b11b1bc943	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	activity.create	[]	["director","admin"]	2025-08-20 05:13:37.622403	2025-08-20 18:03:46.66
bb9f8ace-8002-44a8-a648-299f511d8fc2	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	activity.delete	[]	["director","admin"]	2025-08-20 05:13:37.730739	2025-08-20 18:03:46.772
6a65fa5a-01d6-40dc-afb3-7ac8274c1684	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	lesson_plan.submit	["teacher","assistant_director"]	["director","admin","superadmin"]	2025-08-10 03:11:23.88497	2025-08-20 18:03:46.643
\.


--
-- Data for Name: tenant_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenant_settings (id, tenant_id, schedule_type, start_time, end_time, slots_per_day, week_start_day, auto_save_interval, enable_notifications, updated_at, created_at, location_settings, default_schedule_type, default_start_time, default_end_time, default_slots_per_day) FROM stdin;
eb2bb120-e3dd-4e97-8995-a4f6a737b298	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	time-based	06:00	18:00	8	1	5	t	2025-08-09 06:19:59.94	2025-08-09 04:02:13.945857	{"2fcbb3b4-554b-4464-808f-20fe3d830937": {"slotsPerDay": 8, "scheduleType": "position-based"}, "bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4": {"slotsPerDay": 3, "scheduleType": "position-based"}, "d6b17df7-04b8-4bc3-bb5a-cab25b88c602": {"endTime": "18:00", "startTime": "06:00", "scheduleType": "time-based"}}	time-based	06:00	18:00	8
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenants (id, name, created_at, is_active) FROM stdin;
7cb6c28d-164c-49fa-b461-dfc47a8a3fed	Development Tenant	2025-08-06 05:09:39.421249	t
\.


--
-- Data for Name: token_secrets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.token_secrets (id, tenant_id, jwt_secret, created_at, is_active) FROM stdin;
c8a2a680-57d2-4868-8464-b3c5a6186d1e	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	4f245b088aea6deb51e32e2042019f1b2cf9f8a935ee05c42bfe5dba981df7dcdc7b67a82c1ef191558d58547db133b73966daa14cada97aa3e008d32fbe6509	2025-08-06 05:10:45.657725	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, tenant_id, user_id, username, first_name, last_name, role, locations, first_login_date, last_login_date, login_count, last_token_payload, created_at, updated_at) FROM stdin;
00368edc-1f27-4482-8379-1ce4786924f5	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	parent_toddler2_123	lisa.johnson@parent.com	Lisa	Johnson	parent	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	2025-08-16 02:53:13.101992	2025-08-16 04:17:14.436	168	{"tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","userId":"parent_toddler2_123","userFirstName":"Lisa","userLastName":"Johnson","username":"lisa.johnson@parent.com","role":"parent","locations":["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"],"locationNames":["Main Campus"],"roomId":"be3e6a76-17cb-4421-824a-272e24cf302f","roomName":"Toddler 2","childRoom":"be3e6a76-17cb-4421-824a-272e24cf302f","iat":1755312612}	2025-08-16 02:53:13.101992	2025-08-16 04:17:14.436
c8742835-d8b5-4cd9-b029-97388fc1f98a	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	c9a4f0e4-cd31-44e3-9423-e4ccd91a03dc	teacher2	Test	Teacher	teacher	["c983168a-8400-41ab-8149-1734b7f112c8"]	2025-08-17 23:15:02.030089	2025-08-18 00:22:47.632	4	{"sub":"c9a4f0e4-cd31-44e3-9423-e4ccd91a03dc","userId":"c9a4f0e4-cd31-44e3-9423-e4ccd91a03dc","userFirstName":"Test","userLastName":"Teacher","username":"teacher2","role":"teacher","tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","locations":["c983168a-8400-41ab-8149-1734b7f112c8"],"iat":1755472482,"exp":1756077282}	2025-08-17 23:15:02.030089	2025-08-18 00:22:47.632
28e15245-8027-435e-b1e5-320ec4c28b32	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	director123	director@example.com	Michael	Brown	Director	["Main Campus","Third Location"]	2025-08-10 03:23:50.2801	2025-08-21 03:19:14.994	17384	{"tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","userId":"director123","userFirstName":"Michael","userLastName":"Brown","username":"director@example.com","role":"Director","locations":["Main Campus","Third Location"],"iat":1754803034}	2025-08-10 03:23:50.2801	2025-08-21 03:19:14.994
b441632b-0694-476a-a52d-897087f2daee	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	superadmin123	superadmin@example.com	Super	Admin	SuperAdmin	["Main Campus","Third Location"]	2025-08-10 03:24:00.656094	2025-08-21 05:53:03.996	3835	{"tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","userId":"superadmin123","userFirstName":"Super","userLastName":"Admin","username":"superadmin@example.com","role":"SuperAdmin","locations":["Main Campus","Third Location"],"iat":1754803034}	2025-08-10 03:24:00.656094	2025-08-21 05:53:03.996
64120838-110e-49a9-a3cb-54c742731c31	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	teacher2_123	teacher2@example.com	Jennifer	Wilson	Teacher	["Main Campus"]	2025-08-11 03:50:13.401453	2025-08-21 23:26:39.384	1954	{"tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","userId":"teacher2_123","userFirstName":"Jennifer","userLastName":"Wilson","username":"teacher2@example.com","role":"Teacher","locations":["Main Campus"],"iat":1754803034}	2025-08-11 03:50:13.401453	2025-08-21 23:26:39.384
0164d5b1-fed8-4533-a896-38481643f442	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	e5b7f0de-c868-4e40-a0bd-e15937cb3097	admin@example.com	Admin	User	Admin	["Main Campus","Third Location"]	2025-08-09 08:11:38.515901	2025-08-22 07:03:30.635	9584	{"tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","userId":"e5b7f0de-c868-4e40-a0bd-e15937cb3097","userFirstName":"Admin","userLastName":"User","username":"admin@example.com","role":"Admin","locations":["Main Campus","Third Location"],"iat":1754803034}	2025-08-09 08:11:38.515901	2025-08-22 07:03:30.635
8a0a4958-0d17-4235-82b4-f2f9df8314b8	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	teacher123	teacher@example.com	Sarah	Johnson	Teacher	["Main Campus","Third Location"]	2025-08-10 02:37:00.34438	2025-08-21 05:57:48.667	8011	{"tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","userId":"teacher123","userFirstName":"Sarah","userLastName":"Johnson","username":"teacher@example.com","role":"Teacher","locations":["Main Campus","Third Location"],"iat":1754803034}	2025-08-10 02:37:00.34438	2025-08-21 05:57:48.667
482f735d-e499-44f3-b55a-e5a28c3abde9	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	user123	john.doe@kindertales.com	John	Doe	Admin	["Main Campus","Third Location"]	2025-08-09 07:34:30.590007	2025-08-21 19:00:59.038	1079	{"tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","userId":"user123","userFirstName":"John","userLastName":"Doe","username":"john.doe@kindertales.com","role":"Admin","locations":["Main Campus","Third Location"],"iat":1754536185}	2025-08-09 07:34:30.590007	2025-08-21 19:00:59.038
bcb8fb8a-34aa-4898-a979-646e6a1a33db	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	assistant_director123	assistant_director@example.com	Emily	Davis	assistant_director	["Main Campus","Third Location"]	2025-08-10 04:28:18.329087	2025-08-16 19:40:06.524	349	{"tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","userId":"assistant_director123","userFirstName":"Emily","userLastName":"Davis","username":"assistant_director@example.com","role":"assistant_director","locations":["Main Campus","Third Location"],"iat":1754803034}	2025-08-10 04:28:18.329087	2025-08-16 19:40:06.524
a4e143b5-814c-4e5b-bcdf-aa9a96a1af66	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	parent_123	parent@example.com	Sarah	Johnson	parent	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	2025-08-15 07:08:09.885501	2025-08-15 07:13:58.621	5	{"tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","userId":"parent_123","userFirstName":"Sarah","userLastName":"Johnson","username":"parent@example.com","role":"parent","locations":["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"],"childRoom":"be3e6a76-17cb-4421-824a-272e24cf302f","iat":1755241644}	2025-08-15 07:08:09.885501	2025-08-15 07:13:58.621
9159f47c-19c3-4773-809b-3bf2c447c18e	7cb6c28d-164c-49fa-b461-dfc47a8a3fed	teacher_parent_123	mary.thompson@example.com	Mary	Thompson	teacher	["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"]	2025-08-15 07:21:56.924682	2025-08-15 07:21:56.924682	1	{"tenantId":"7cb6c28d-164c-49fa-b461-dfc47a8a3fed","userId":"teacher_parent_123","userFirstName":"Mary","userLastName":"Thompson","username":"mary.thompson@example.com","role":"teacher","locations":["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"],"locationNames":["Main Campus"],"roomId":"be3e6a76-17cb-4421-824a-272e24cf302f","roomName":"Toddler 2","iat":1755242280}	2025-08-15 07:21:56.924682	2025-08-15 07:21:56.924682
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: neondb_owner
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.__drizzle_migrations_id_seq', 1, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activity_records activity_records_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_records
    ADD CONSTRAINT activity_records_pkey PRIMARY KEY (id);


--
-- Name: age_groups age_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.age_groups
    ADD CONSTRAINT age_groups_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: lesson_plans lesson_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lesson_plans
    ADD CONSTRAINT lesson_plans_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: material_collection_items material_collection_items_material_id_collection_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_collection_items
    ADD CONSTRAINT material_collection_items_material_id_collection_id_key UNIQUE (material_id, collection_id);


--
-- Name: material_collection_items material_collection_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_collection_items
    ADD CONSTRAINT material_collection_items_pkey PRIMARY KEY (id);


--
-- Name: material_collections material_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_collections
    ADD CONSTRAINT material_collections_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: milestones milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: tenant_permission_overrides organization_permission_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_permission_overrides
    ADD CONSTRAINT organization_permission_overrides_pkey PRIMARY KEY (id);


--
-- Name: tenant_settings organization_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT organization_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_settings organization_settings_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT organization_settings_tenant_id_key UNIQUE (tenant_id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: scheduled_activities scheduled_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.scheduled_activities
    ADD CONSTRAINT scheduled_activities_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: token_secrets token_secrets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.token_secrets
    ADD CONSTRAINT token_secrets_pkey PRIMARY KEY (id);


--
-- Name: users unique_user_tenant; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_user_tenant UNIQUE (user_id, tenant_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_milestones_status_deleted; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_milestones_status_deleted ON public.milestones USING btree (status, deleted_at);


--
-- Name: idx_milestones_tenant_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_milestones_tenant_status ON public.milestones USING btree (tenant_id, status);


--
-- Name: idx_users_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_tenant_id ON public.users USING btree (tenant_id);


--
-- Name: idx_users_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_user_id ON public.users USING btree (user_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: unique_user_id_tenant; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX unique_user_id_tenant ON public.users USING btree (user_id, tenant_id);


--
-- Name: activities activities_location_id_locations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: activities activities_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: age_groups age_groups_location_id_locations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.age_groups
    ADD CONSTRAINT age_groups_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: age_groups age_groups_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.age_groups
    ADD CONSTRAINT age_groups_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: categories categories_location_id_locations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: categories categories_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: activity_records fk_activity_records_scheduled_activity; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_records
    ADD CONSTRAINT fk_activity_records_scheduled_activity FOREIGN KEY (scheduled_activity_id) REFERENCES public.scheduled_activities(id);


--
-- Name: activity_records fk_activity_records_tenant; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_records
    ADD CONSTRAINT fk_activity_records_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: activity_records fk_activity_records_user_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_records
    ADD CONSTRAINT fk_activity_records_user_id FOREIGN KEY (user_id, tenant_id) REFERENCES public.users(user_id, tenant_id);


--
-- Name: lesson_plans lesson_plans_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lesson_plans
    ADD CONSTRAINT lesson_plans_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: lesson_plans lesson_plans_location_id_locations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lesson_plans
    ADD CONSTRAINT lesson_plans_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: lesson_plans lesson_plans_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lesson_plans
    ADD CONSTRAINT lesson_plans_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: lesson_plans lesson_plans_room_id_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lesson_plans
    ADD CONSTRAINT lesson_plans_room_id_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- Name: lesson_plans lesson_plans_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lesson_plans
    ADD CONSTRAINT lesson_plans_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id);


--
-- Name: lesson_plans lesson_plans_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lesson_plans
    ADD CONSTRAINT lesson_plans_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: locations locations_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: material_collection_items material_collection_items_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_collection_items
    ADD CONSTRAINT material_collection_items_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.material_collections(id) ON DELETE CASCADE;


--
-- Name: material_collection_items material_collection_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_collection_items
    ADD CONSTRAINT material_collection_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;


--
-- Name: material_collections material_collections_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.material_collections
    ADD CONSTRAINT material_collections_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: materials materials_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: milestones milestones_location_id_locations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: milestones milestones_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: notifications notifications_lesson_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_lesson_plan_id_fkey FOREIGN KEY (lesson_plan_id) REFERENCES public.lesson_plans(id);


--
-- Name: notifications notifications_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: notifications notifications_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- Name: notifications notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tenant_permission_overrides organization_permission_overrides_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_permission_overrides
    ADD CONSTRAINT organization_permission_overrides_organization_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_settings organization_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT organization_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: permissions permissions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: role_permissions role_permissions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: roles roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: rooms rooms_location_id_locations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: rooms rooms_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: scheduled_activities scheduled_activities_activity_id_activities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.scheduled_activities
    ADD CONSTRAINT scheduled_activities_activity_id_activities_id_fk FOREIGN KEY (activity_id) REFERENCES public.activities(id);


--
-- Name: scheduled_activities scheduled_activities_lesson_plan_id_lesson_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.scheduled_activities
    ADD CONSTRAINT scheduled_activities_lesson_plan_id_lesson_plans_id_fk FOREIGN KEY (lesson_plan_id) REFERENCES public.lesson_plans(id);


--
-- Name: scheduled_activities scheduled_activities_location_id_locations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.scheduled_activities
    ADD CONSTRAINT scheduled_activities_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: scheduled_activities scheduled_activities_room_id_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.scheduled_activities
    ADD CONSTRAINT scheduled_activities_room_id_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- Name: scheduled_activities scheduled_activities_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.scheduled_activities
    ADD CONSTRAINT scheduled_activities_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: token_secrets token_secrets_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.token_secrets
    ADD CONSTRAINT token_secrets_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

