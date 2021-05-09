CREATE TABLE public.petitions (
    id SERIAL PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    photo text,
    creator_name text NOT NULL,
    creator_email text NOT NULL,
    category text,
    signatures integer DEFAULT 1 NOT NULL,
    signatures_goal integer NOT NULL
);

INSERT INTO petitions (
    title, description, category, photo, creator_name, creator_email, date_created, signatures_goal)
    VALUES ('title', 'descr', 'catt', 'photo', 'name', 'email', NOW(), 500);
