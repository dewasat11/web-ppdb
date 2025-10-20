-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.berita (
  id bigint NOT NULL DEFAULT nextval('berita_id_seq'::regclass),
  judul character varying NOT NULL,
  konten text NOT NULL,
  foto text,
  tanggal_publish date DEFAULT CURRENT_DATE,
  penulis character varying,
  status character varying DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT berita_pkey PRIMARY KEY (id)
);
CREATE TABLE public.konfigurasi_pembayaran (
  id integer NOT NULL DEFAULT nextval('konfigurasi_pembayaran_id_seq'::regclass),
  nama_setting character varying NOT NULL UNIQUE,
  nilai text NOT NULL,
  deskripsi text,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT konfigurasi_pembayaran_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pembayaran (
  id integer NOT NULL DEFAULT nextval('pembayaran_id_seq'::regclass),
  nomor_pembayaran character varying NOT NULL UNIQUE,
  nomor_registrasi character varying NOT NULL,
  nama_lengkap character varying NOT NULL,
  jumlah numeric NOT NULL DEFAULT 500000.00,
  metode_pembayaran character varying DEFAULT 'Transfer Bank BRI'::character varying,
  bukti_pembayaran text,
  status_pembayaran character varying DEFAULT 'PENDING'::character varying CHECK (status_pembayaran::text = ANY (ARRAY['PENDING'::character varying, 'VERIFIED'::character varying, 'REJECTED'::character varying]::text[])),
  tanggal_upload timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  tanggal_verifikasi timestamp without time zone,
  verified_by character varying,
  catatan_admin text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pembayaran_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pendaftar (
  id bigint NOT NULL DEFAULT nextval('pendaftar_id_seq'::regclass),
  nomor_registrasi text NOT NULL UNIQUE,
  nikcalon text NOT NULL,
  kkno text NOT NULL,
  nisn text NOT NULL,
  namalengkap text NOT NULL,
  tempatlahir text NOT NULL,
  tanggallahir date NOT NULL,
  jeniskelamin character NOT NULL CHECK (jeniskelamin = ANY (ARRAY['L'::bpchar, 'P'::bpchar])),
  alamatjalan text NOT NULL,
  desa text NOT NULL,
  kecamatan text NOT NULL,
  kotakabupaten text NOT NULL,
  provinsi text NOT NULL,
  ijazahformalterakhir text NOT NULL,
  rencanadomisili text,
  rencanatingkat text NOT NULL,
  rencanakelas text,
  namaayah text NOT NULL,
  nikayah text NOT NULL,
  namaibu text NOT NULL,
  nikibu text NOT NULL,
  statusberkas text DEFAULT 'PENDING'::text CHECK (statusberkas = ANY (ARRAY['PENDING'::text, 'DITERIMA'::text, 'DITOLAK'::text, 'REVISI'::text])),
  deskripsistatus text,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  verifiedat timestamp with time zone,
  verifiedby character varying,
  alasan text,
  file_ijazah text,
  file_kk text,
  file_akta text,
  file_foto text,
  telepon_orang_tua character varying,
  file_bpjs text,
  provinsitempatlahir character varying,
  jenjangpendidikan character varying,
  statusayah character varying CHECK (statusayah::text = ANY (ARRAY['Hidup'::character varying, 'Meninggal'::character varying]::text[])),
  pekerjaanayah character varying,
  statusibu character varying CHECK (statusibu::text = ANY (ARRAY['Hidup'::character varying, 'Meninggal'::character varying]::text[])),
  pekerjaanibu character varying,
  rencanaprogram character varying,
  CONSTRAINT pendaftar_pkey PRIMARY KEY (id)
);
CREATE TABLE public.prestasi (
  id bigint NOT NULL DEFAULT nextval('prestasi_id_seq'::regclass),
  nama_santri character varying NOT NULL,
  jenis_prestasi character varying NOT NULL,
  tingkat character varying NOT NULL CHECK (tingkat::text = ANY (ARRAY['Kecamatan'::character varying, 'Kabupaten'::character varying, 'Provinsi'::character varying, 'Nasional'::character varying, 'Internasional'::character varying]::text[])),
  tahun integer NOT NULL,
  deskripsi text,
  foto text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prestasi_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profile_pondok (
  id bigint NOT NULL DEFAULT nextval('profile_pondok_id_seq'::regclass),
  nama_pondok character varying NOT NULL,
  alamat text NOT NULL,
  telepon character varying,
  email character varying,
  sejarah text,
  visi text,
  misi text,
  logo text,
  foto_pondok text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_pondok_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sambutan (
  id bigint NOT NULL DEFAULT nextval('sambutan_id_seq'::regclass),
  jabatan character varying NOT NULL,
  nama character varying NOT NULL,
  isi_sambutan text NOT NULL,
  foto text,
  urutan integer DEFAULT 1,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sambutan_pkey PRIMARY KEY (id)
);