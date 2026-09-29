
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- first signed-up account becomes the admin
CREATE OR REPLACE FUNCTION public.grant_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_first_admin();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are public" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  symbol text NOT NULL DEFAULT 'F',
  tint text NOT NULL DEFAULT 'violet',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  equation text NOT NULL,
  description text NOT NULL DEFAULT '',
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_premium boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX formulas_category_idx ON public.formulas(category_id);
GRANT SELECT ON public.formulas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.formulas TO authenticated;
GRANT ALL ON public.formulas TO service_role;
ALTER TABLE public.formulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Formulas are public" ON public.formulas FOR SELECT USING (true);
CREATE POLICY "Admins manage formulas" ON public.formulas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER formulas_updated_at BEFORE UPDATE ON public.formulas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.subjects (slug, name, description, is_active, sort_order) VALUES
 ('physics','Physics','NEB and CBSE high school physics formulas.', true, 1),
 ('chemistry','Chemistry','Coming soon.', false, 2),
 ('biology','Biology','Coming soon.', false, 3);

INSERT INTO public.categories (subject_id, slug, name, description, symbol, tint, sort_order)
SELECT s.id, v.slug, v.name, v.description, v.symbol, v.tint, v.sort_order
FROM public.subjects s, (VALUES
 ('mechanics','Mechanics','Motion, forces, momentum & energy.','F','violet',1),
 ('heat-thermodynamics','Heat & Thermodynamics','Heat, work, entropy & engines.','Q','amber',2),
 ('wave-optics','Wave & Optics','Waves, lenses, diffraction & light.','λ','sky',3),
 ('electricity-magnetism','Electricity & Magnetism','Circuits, fields, induction & EM.','B','rose',4),
 ('modern-physics','Modern Physics','Quantum, relativity & radioactivity.','h','teal',5)
) AS v(slug,name,description,symbol,tint,sort_order)
WHERE s.slug = 'physics';

INSERT INTO public.formulas (category_id, name, equation, description, variables, is_premium, sort_order)
SELECT c.id, v.name, v.equation, v.description, v.variables::jsonb, v.is_premium, v.sort_order
FROM public.categories c, (VALUES
 ('mechanics','Equation of motion','v = u + at','Final velocity of a body under constant acceleration.','[{"symbol":"v","meaning":"final velocity (m/s)"},{"symbol":"u","meaning":"initial velocity (m/s)"},{"symbol":"a","meaning":"acceleration (m/s²)"},{"symbol":"t","meaning":"time (s)"}]',false,1),
 ('mechanics','Newton''s second law','F = ma','Net force on a body equals mass times acceleration.','[{"symbol":"F","meaning":"net force (N)"},{"symbol":"m","meaning":"mass (kg)"},{"symbol":"a","meaning":"acceleration (m/s²)"}]',false,2),
 ('mechanics','Kinetic energy','KE = ½mv²','Energy possessed by a body because of its motion.','[{"symbol":"m","meaning":"mass (kg)"},{"symbol":"v","meaning":"velocity (m/s)"}]',false,3),
 ('mechanics','Gravitational potential energy','U = mgh','Energy stored by raising a mass to a height.','[{"symbol":"m","meaning":"mass (kg)"},{"symbol":"g","meaning":"gravitational field (9.8 m/s²)"},{"symbol":"h","meaning":"height (m)"}]',false,4),
 ('mechanics','Momentum','p = mv','Quantity of motion of a moving body.','[{"symbol":"p","meaning":"momentum (kg·m/s)"},{"symbol":"m","meaning":"mass (kg)"},{"symbol":"v","meaning":"velocity (m/s)"}]',false,5),
 ('mechanics','Centripetal force','F = mv² / r','Inward force keeping a body in circular motion.','[{"symbol":"m","meaning":"mass (kg)"},{"symbol":"v","meaning":"speed (m/s)"},{"symbol":"r","meaning":"radius (m)"}]',true,6),
 ('heat-thermodynamics','Heat energy','Q = mcΔT','Heat needed to change the temperature of a substance.','[{"symbol":"Q","meaning":"heat (J)"},{"symbol":"m","meaning":"mass (kg)"},{"symbol":"c","meaning":"specific heat capacity (J/kg·K)"},{"symbol":"ΔT","meaning":"temperature change (K)"}]',false,1),
 ('heat-thermodynamics','Latent heat','Q = mL','Heat needed for a change of state at constant temperature.','[{"symbol":"Q","meaning":"heat (J)"},{"symbol":"m","meaning":"mass (kg)"},{"symbol":"L","meaning":"specific latent heat (J/kg)"}]',false,2),
 ('heat-thermodynamics','Ideal gas equation','PV = nRT','Relates pressure, volume and temperature of an ideal gas.','[{"symbol":"P","meaning":"pressure (Pa)"},{"symbol":"V","meaning":"volume (m³)"},{"symbol":"n","meaning":"moles"},{"symbol":"R","meaning":"gas constant (8.314 J/mol·K)"},{"symbol":"T","meaning":"temperature (K)"}]',false,3),
 ('heat-thermodynamics','First law of thermodynamics','ΔQ = ΔU + ΔW','Heat supplied raises internal energy and does work.','[{"symbol":"ΔQ","meaning":"heat supplied (J)"},{"symbol":"ΔU","meaning":"change in internal energy (J)"},{"symbol":"ΔW","meaning":"work done by gas (J)"}]',false,4),
 ('heat-thermodynamics','Carnot efficiency','η = 1 − T₂/T₁','Maximum efficiency of a heat engine between two reservoirs.','[{"symbol":"η","meaning":"efficiency"},{"symbol":"T₁","meaning":"source temperature (K)"},{"symbol":"T₂","meaning":"sink temperature (K)"}]',true,5),
 ('wave-optics','Wave equation','v = fλ','Links wave speed, frequency and wavelength.','[{"symbol":"v","meaning":"wave speed (m/s)"},{"symbol":"f","meaning":"frequency (Hz)"},{"symbol":"λ","meaning":"wavelength (m)"}]',false,1),
 ('wave-optics','Lens formula','1/f = 1/v − 1/u','Relates focal length to image and object distance.','[{"symbol":"f","meaning":"focal length (m)"},{"symbol":"v","meaning":"image distance (m)"},{"symbol":"u","meaning":"object distance (m)"}]',false,2),
 ('wave-optics','Snell''s law','n₁ sin i = n₂ sin r','Refraction of light at the boundary of two media.','[{"symbol":"n₁, n₂","meaning":"refractive indices"},{"symbol":"i","meaning":"angle of incidence"},{"symbol":"r","meaning":"angle of refraction"}]',false,3),
 ('wave-optics','Simple harmonic motion','T = 2π√(l/g)','Time period of a simple pendulum.','[{"symbol":"T","meaning":"time period (s)"},{"symbol":"l","meaning":"length (m)"},{"symbol":"g","meaning":"gravitational field (m/s²)"}]',false,4),
 ('wave-optics','Young''s double slit','β = λD/d','Fringe width in a double-slit interference pattern.','[{"symbol":"β","meaning":"fringe width (m)"},{"symbol":"λ","meaning":"wavelength (m)"},{"symbol":"D","meaning":"slit-to-screen distance (m)"},{"symbol":"d","meaning":"slit separation (m)"}]',true,5),
 ('electricity-magnetism','Ohm''s law','V = IR','Potential difference across a conductor and the current through it.','[{"symbol":"V","meaning":"voltage (V)"},{"symbol":"I","meaning":"current (A)"},{"symbol":"R","meaning":"resistance (Ω)"}]',false,1),
 ('electricity-magnetism','Coulomb''s law','F = kq₁q₂ / r²','Electrostatic force between two point charges.','[{"symbol":"F","meaning":"force (N)"},{"symbol":"k","meaning":"9×10⁹ N·m²/C²"},{"symbol":"q₁, q₂","meaning":"charges (C)"},{"symbol":"r","meaning":"separation (m)"}]',false,2),
 ('electricity-magnetism','Electrical power','P = VI = I²R','Rate at which electrical energy is used.','[{"symbol":"P","meaning":"power (W)"},{"symbol":"V","meaning":"voltage (V)"},{"symbol":"I","meaning":"current (A)"},{"symbol":"R","meaning":"resistance (Ω)"}]',false,3),
 ('electricity-magnetism','Capacitance','C = Q/V','Charge stored per unit potential difference.','[{"symbol":"C","meaning":"capacitance (F)"},{"symbol":"Q","meaning":"charge (C)"},{"symbol":"V","meaning":"voltage (V)"}]',false,4),
 ('electricity-magnetism','Force on a moving charge','F = qvB sinθ','Magnetic force on a charge moving in a field.','[{"symbol":"q","meaning":"charge (C)"},{"symbol":"v","meaning":"velocity (m/s)"},{"symbol":"B","meaning":"magnetic flux density (T)"},{"symbol":"θ","meaning":"angle between v and B"}]',false,5),
 ('electricity-magnetism','Faraday''s law of induction','ε = −N dΦ/dt','Induced emf from a changing magnetic flux.','[{"symbol":"ε","meaning":"induced emf (V)"},{"symbol":"N","meaning":"number of turns"},{"symbol":"dΦ/dt","meaning":"rate of change of flux (Wb/s)"}]',true,6),
 ('modern-physics','Photon energy','E = hf','Energy carried by a single photon of light.','[{"symbol":"E","meaning":"energy (J)"},{"symbol":"h","meaning":"Planck constant (6.63×10⁻³⁴ J·s)"},{"symbol":"f","meaning":"frequency (Hz)"}]',false,1),
 ('modern-physics','Photoelectric equation','hf = φ + KEmax','Photon energy splits into work function and electron energy.','[{"symbol":"hf","meaning":"photon energy (J)"},{"symbol":"φ","meaning":"work function (J)"},{"symbol":"KEmax","meaning":"maximum kinetic energy (J)"}]',false,2),
 ('modern-physics','Mass–energy equivalence','E = mc²','Energy released by converting mass.','[{"symbol":"E","meaning":"energy (J)"},{"symbol":"m","meaning":"mass (kg)"},{"symbol":"c","meaning":"speed of light (3×10⁸ m/s)"}]',false,3),
 ('modern-physics','de Broglie wavelength','λ = h/p','Wavelength associated with a moving particle.','[{"symbol":"λ","meaning":"wavelength (m)"},{"symbol":"h","meaning":"Planck constant"},{"symbol":"p","meaning":"momentum (kg·m/s)"}]',false,4),
 ('modern-physics','Radioactive decay','N = N₀e^(−λt)','Number of undecayed nuclei remaining after time t.','[{"symbol":"N","meaning":"nuclei remaining"},{"symbol":"N₀","meaning":"initial nuclei"},{"symbol":"λ","meaning":"decay constant (1/s)"},{"symbol":"t","meaning":"time (s)"}]',true,5)
) AS v(cat,name,equation,description,variables,is_premium,sort_order)
WHERE c.slug = v.cat;
