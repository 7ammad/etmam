-- System-wide configuration (e.g. V2 engine calibration).
-- Read-only for authenticated; full access for service_role.

CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.system_settings IS 'System-wide config; calibration_v2 holds service_type_calibration for V2 value estimator.';

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated: read-only
CREATE POLICY "Authenticated can read system_settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role: full access (for cron/sync and calibration service)
CREATE POLICY "Service role full access to system_settings"
  ON public.system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed calibration_v2 with built-in HISTORICAL_CALIBRATION (from lib/evaluation/classifier.ts)
INSERT INTO public.system_settings (key, value, updated_at)
VALUES (
  'calibration_v2',
  '{"service_type_calibration":[
    {"serviceType":"software_dev","count":31,"median":41800000,"p25":6900000,"p75":145000000,"min":500000,"max":500000000},
    {"serviceType":"procurement","count":21,"median":4600000,"p25":1600000,"p75":9000000,"min":100000,"max":50000000},
    {"serviceType":"maintenance","count":11,"median":199900000,"p25":6300000,"p75":289000000,"min":500000,"max":500000000},
    {"serviceType":"cybersecurity","count":4,"median":265900000,"p25":9600000,"p75":266000000,"min":5000000,"max":500000000},
    {"serviceType":"consulting","count":2,"median":9200000,"p25":5000000,"p75":15000000,"min":2000000,"max":20000000},
    {"serviceType":"training","count":2,"median":8000000,"p25":3000000,"p75":12000000,"min":1000000,"max":15000000},
    {"serviceType":"license_renewal","count":5,"median":3000000,"p25":500000,"p75":5000000,"min":100000,"max":10000000},
    {"serviceType":"it_hardware","count":8,"median":5000000,"p25":2000000,"p75":15000000,"min":500000,"max":50000000},
    {"serviceType":"integration","count":3,"median":15000000,"p25":5000000,"p75":50000000,"min":2000000,"max":100000000},
    {"serviceType":"managed_services","count":6,"median":25000000,"p25":5000000,"p75":100000000,"min":1000000,"max":200000000},
    {"serviceType":"construction","count":10,"median":50000000,"p25":10000000,"p75":200000000,"min":1000000,"max":500000000},
    {"serviceType":"other","count":20,"median":5000000,"p25":1000000,"p75":20000000,"min":100000,"max":100000000},
    {"serviceType":"cleaning","count":5,"median":2000000,"p25":500000,"p75":5000000,"min":100000,"max":10000000},
    {"serviceType":"vehicles","count":3,"median":3000000,"p25":1000000,"p75":8000000,"min":500000,"max":15000000},
    {"serviceType":"printing","count":2,"median":500000,"p25":200000,"p75":1000000,"min":50000,"max":2000000}
  ]}'::jsonb,
  now()
)
ON CONFLICT (key) DO NOTHING;
