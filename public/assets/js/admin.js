/* =========================================================
   admin.js — clean & structured
   - Guard login, sidebar toggle, tab switch
   - Pendaftar (list, detail modal, verifikasi)
   - Pembayaran (list, detail modal, verifikasi)
   - Export CSV
   ========================================================= */

(() => {
  "use strict";

  /* =========================
     0) UTIL & GLOBAL STATE
     ========================= */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const exists = (el) => !!el;

  // Global state (dipakai lintas modul)
  let allPendaftarData = []; // cache pendaftar untuk detail
  let currentPembayaranData = null; // data pembayaran yang sedang dilihat
  let pembayaranAutoRefreshInterval = null;

  const CACHE_DURATION = 30_000; // (opsi, saat ingin cache) 30s
  const AUTO_REFRESH_INTERVAL = 30_000; // auto refresh pembayaran tiap 30s

  const PAGE_TITLES = {
    pendaftar: "Data Pendaftar",
    pembayaran: "Data Pembayaran",
    profil: "Profil Yayasan",
    prestasi: "Prestasi",
    berita: "Berita",
    gelombang: "Kelola Gelombang",
  };

  const formatIDDate = (d) =>
    d ? new Date(d).toLocaleDateString("id-ID") : "Belum ada data";

  const formatIDDatetime = (d) =>
    d ? new Date(d).toLocaleString("id-ID") : "-";

  const rupiah = (n) => "Rp " + parseFloat(n || 0).toLocaleString("id-ID");

  const badge = (text, cls) => `<span class="badge bg-${cls}">${text}</span>`;

  /* =========================
     1) LOGIN GUARD & HEADER
     ========================= */
  // guard login (jalan seawal mungkin)
  if (localStorage.getItem("isAdminLoggedIn") !== "true") {
    window.location.href = "/login";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const adminEmail = localStorage.getItem("adminEmail") || "Admin";
    const adminEmailEl = $("#adminEmail");
    if (adminEmailEl) adminEmailEl.textContent = adminEmail;

    const logoutBtn = $("#logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Yakin ingin logout?")) {
          localStorage.removeItem("isAdminLoggedIn");
          localStorage.removeItem("adminEmail");
          window.location.href = "/login";
        }
      });
    }
  });

  /* =========================
     2) SIDEBAR & TABS
     ========================= */
  function toggleSidebar() {
    const sidebar = $("#sidebar");
    const overlay = $(".sidebar-overlay");
    if (!sidebar || !overlay) return;
    sidebar.classList.toggle("show");
    overlay.classList.toggle("show");
  }

  function switchTab(tab) {
    // Sembunyikan semua konten tab
    $$(".tab-content").forEach((el) => (el.style.display = "none"));
    // Hapus active dari semua nav
    $$(".sidebar .nav-link").forEach((el) => el.classList.remove("active"));

    // Tampilkan tab terpilih
    const pane = document.getElementById(`tab-${tab}`);
    if (pane) pane.style.display = "block";

    // Set nav aktif
    const nav = document.querySelector(`[data-tab="${tab}"]`);
    if (nav) nav.classList.add("active");

    // Ubah judul halaman
    const title = $("#pageTitle");
    if (title) title.textContent = PAGE_TITLES[tab] || "Panel";

    // Hentikan auto refresh saat pindah dari pembayaran
    if (pembayaranAutoRefreshInterval) {
      clearInterval(pembayaranAutoRefreshInterval);
      pembayaranAutoRefreshInterval = null;
    }

    // Auto-load jika tab tertentu
    if (tab === "pembayaran") {
      loadPembayaran();
      // aktifkan auto refresh
      pembayaranAutoRefreshInterval = setInterval(
        loadPembayaran,
        AUTO_REFRESH_INTERVAL
      );
    } else if (tab === "pendaftar") {
      loadPendaftar();
    } else if (tab === "statistik") {
      // Load data pendaftar untuk update statistik
      loadPendaftar();
    } else if (tab === "gelombang") {
      // Load gelombang data
      loadGelombangData();
    }

    // Tutup sidebar di mobile
    if (window.innerWidth <= 768) toggleSidebar();
  }

  // expose agar bisa dipakai dari HTML
  window.toggleSidebar = toggleSidebar;
  window.switchTab = switchTab;

  /* =========================
     3) PENDAFTAR
     ========================= */
  async function loadPendaftar() {
    try {
      const r = await fetch("/api/pendaftar_list");
      const result = await r.json();
      if (!(result.success && result.data)) return;

      allPendaftarData = result.data; // simpan untuk detail

      const tbody = $("#pendaftarTable");
      if (tbody) {
        tbody.innerHTML = result.data
          .map((item, i) => {
            const statusClass =
              item.status === "pending"
                ? "warning"
                : item.status === "revisi"
                ? "info"
                : item.status === "diterima"
                ? "success"
                : "danger";

            return `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${
                  item.nisn || item.nikcalon || item.nik || "-"
                }</strong></td>
                <td>${item.nama}</td>
                <td>${badge(item.status, statusClass)}</td>
                <td>${formatIDDate(item.createdat)}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="lihatDetail(${
                    item.id
                  })" title="Lihat Detail & Berkas">
                    <i class="bi bi-eye"></i>
                  </button>
                  ${
                    item.status === "pending" || item.status === "revisi"
                      ? `
                        <button class="btn btn-sm btn-success" onclick="openVerifikasiModal(${item.id}, 'diterima')" title="Terima">
                          <i class="bi bi-check-circle"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="openVerifikasiModal(${item.id}, 'revisi')" title="Revisi">
                          <i class="bi bi-arrow-repeat"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="openVerifikasiModal(${item.id}, 'ditolak')" title="Tolak">
                          <i class="bi bi-x-circle"></i>
                        </button>
                      `
                      : `<span class="badge bg-secondary">Selesai</span>`
                  }
                </td>
              </tr>
            `;
          })
          .join("");
      }

      // Kartu statistik
      const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setText("totalCount", result.data.length);
      setText(
        "pendingCount",
        result.data.filter((d) => d.status === "pending").length
      );
      setText(
        "revisiCount",
        result.data.filter((d) => d.status === "revisi").length
      );
      setText(
        "diterimaCount",
        result.data.filter((d) => d.status === "diterima").length
      );
      setText(
        "ditolakCount",
        result.data.filter((d) => d.status === "ditolak").length
      );

      // Breakdown program/jenjang
      const getRencanaProgram = (d) =>
        d.rencana_program ||
        d.rencanaProgram ||
        d.rencanakelas ||
        d.rencanaprogram ||
        "";
      const getJenjang = (d) => d.rencanatingkat || d.rencanaTingkat || "";

      const putraIndukMts = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Pondok Putra Induk" &&
          getJenjang(d) === "MTs"
      ).length;
      const putraIndukMa = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Pondok Putra Induk" &&
          getJenjang(d) === "MA"
      ).length;
      const putraIndukKuliah = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Pondok Putra Induk" &&
          getJenjang(d) === "Kuliah"
      ).length;
      const putraIndukTotal = putraIndukMts + putraIndukMa + putraIndukKuliah;

      const putraTahfidzMts = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Pondok Putra Tahfidz" &&
          getJenjang(d) === "MTs"
      ).length;
      const putraTahfidzMa = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Pondok Putra Tahfidz" &&
          getJenjang(d) === "MA"
      ).length;
      const putraTahfidzKuliah = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Pondok Putra Tahfidz" &&
          getJenjang(d) === "Kuliah"
      ).length;
      const putraTahfidzTotal =
        putraTahfidzMts + putraTahfidzMa + putraTahfidzKuliah;

      const putriMts = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Pondok Putri" && getJenjang(d) === "MTs"
      ).length;
      const putriMa = result.data.filter(
        (d) => getRencanaProgram(d) === "Pondok Putri" && getJenjang(d) === "MA"
      ).length;
      const putriKuliah = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Pondok Putri" && getJenjang(d) === "Kuliah"
      ).length;
      const putriTotal = putriMts + putriMa + putriKuliah;

      const hanyaSekolahMtsL = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Hanya Sekolah" &&
          getJenjang(d) === "MTs" &&
          (d.jeniskelamin === "L" || d.jenisKelamin === "L")
      ).length;
      const hanyaSekolahMtsP = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Hanya Sekolah" &&
          getJenjang(d) === "MTs" &&
          (d.jeniskelamin === "P" || d.jenisKelamin === "P")
      ).length;
      const hanyaSekolahMaL = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Hanya Sekolah" &&
          getJenjang(d) === "MA" &&
          (d.jeniskelamin === "L" || d.jenisKelamin === "L")
      ).length;
      const hanyaSekolahMaP = result.data.filter(
        (d) =>
          getRencanaProgram(d) === "Hanya Sekolah" &&
          getJenjang(d) === "MA" &&
          (d.jeniskelamin === "P" || d.jenisKelamin === "P")
      ).length;
      const hanyaSekolahTotal =
        hanyaSekolahMtsL + hanyaSekolahMtsP + hanyaSekolahMaL + hanyaSekolahMaP;

      // Pasang ke DOM
      const mapSet = (m) =>
        Object.entries(m).forEach(([id, val]) => setText(id, val));
      mapSet({
        putraIndukMts,
        putraIndukMa,
        putraIndukKuliah,
        putraIndukTotal,
        putraTahfidzMts,
        putraTahfidzMa,
        putraTahfidzKuliah,
        putraTahfidzTotal,
        putriMts,
        putriMa,
        putriKuliah,
        putriTotal,
        hanyaSekolahMtsL,
        hanyaSekolahMtsP,
        hanyaSekolahMaL,
        hanyaSekolahMaP,
        hanyaSekolahTotal,
      });

      const upd = $("#updateTimePendaftar");
      if (upd)
        upd.textContent = `Data update: ${new Date().toLocaleTimeString(
          "id-ID"
        )}`;

      const upd2 = $("#updateTimeStatistik");
      if (upd2)
        upd2.textContent = `Data update: ${new Date().toLocaleTimeString(
          "id-ID"
        )}`;
    } catch (err) {
      console.error("loadPendaftar error:", err);
    }
  }

  async function updateStatus(id, status) {
    if (!confirm(`Yakin mengubah status menjadi "${status}"?`)) return;
    try {
      const r = await fetch("/api/pendaftar_status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await r.json();
      if (result.success) {
        alert("Status berhasil diupdate!");
        loadPendaftar();
      } else {
        alert("Error: " + (result.error || "Gagal update"));
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  async function lihatDetail(id) {
    try {
      const pendaftar = allPendaftarData.find((p) => p.id === id);
      if (!pendaftar) return alert("Data tidak ditemukan");

      // Payment status lookup
      let paymentStatus = "Belum Ada";
      let paymentBadgeClass = "secondary";
      try {
        const r = await fetch("/api/pembayaran_list");
        const result = await r.json();
        if (r.ok && result.data) {
          const nisn = pendaftar.nisn;
          const payment = result.data.find(
            (p) => p.nisn === nisn
          );
          if (payment) {
            const raw = (payment.status || "PENDING").toUpperCase();
            paymentStatus =
              raw === "VERIFIED"
                ? "Verified"
                : raw === "REJECTED"
                ? "Rejected"
                : "Pending";
            paymentBadgeClass =
              raw === "VERIFIED"
                ? "success"
                : raw === "REJECTED"
                ? "danger"
                : "warning";
          }
        }
      } catch (e) {
        console.error("fetch pembayaran error:", e);
      }

      // Detail content (diringkas dari punyamu)
      let html = `
        <div class="row g-3">
          <div class="col-12"><h6 class="bg-success text-white p-2 rounded">
            <i class="bi bi-card-checklist"></i> Data Registrasi
          </h6></div>
          <div class="col-md-4"><strong>Tanggal Daftar:</strong><br>${formatIDDatetime(
            pendaftar.createdat
          )}</div>
          <div class="col-md-4"><strong>Status Berkas:</strong><br>${badge(
            pendaftar.statusberkas || "PENDING",
            pendaftar.statusberkas === "PENDING"
              ? "warning"
              : pendaftar.statusberkas === "REVISI"
              ? "info"
              : pendaftar.statusberkas === "DITERIMA"
              ? "success"
              : "danger"
          )}</div>
          <div class="col-md-4"><strong>Status Pembayaran:</strong><br>${badge(
            paymentStatus,
            paymentBadgeClass
          )}</div>
          <div class="col-md-12"><strong>Alasan/Catatan:</strong><br>${
            pendaftar.alasan || "-"
          }</div>

          <div class="col-12 mt-3"><h6 class="bg-success text-white p-2 rounded">
            <i class="bi bi-person"></i> Data Calon Siswa
          </h6></div>
          <div class="col-md-6"><strong>NISN:</strong><br><span class="badge bg-primary">${
            pendaftar.nisn || pendaftar.nikcalon || pendaftar.nik || "-"
          }</span></div>
          <div class="col-md-6"><strong>NIK:</strong><br>${
            pendaftar.nikcalon || pendaftar.nik || "-"
          }</div>
          <div class="col-md-12"><strong>Nama Lengkap:</strong><br><span class="fs-5 text-primary">${
            pendaftar.namalengkap || "-"
          }</span></div>
          <div class="col-md-6"><strong>Tempat Lahir:</strong><br>${
            pendaftar.tempatlahir || "-"
          }${
        pendaftar.provinsitempatlahir
          ? ", " + pendaftar.provinsitempatlahir
          : ""
      }</div>
          <div class="col-md-6"><strong>Tanggal Lahir:</strong><br>${
            pendaftar.tanggallahir || "-"
          }</div>
          <div class="col-md-6"><strong>Jenis Kelamin:</strong><br>${
            pendaftar.jeniskelamin === "L"
              ? "Laki-laki"
              : pendaftar.jeniskelamin === "P"
              ? "Perempuan"
              : "-"
          }</div>
          <div class="col-md-6"><strong>Telepon Orang Tua:</strong><br>${
            pendaftar.telepon_orang_tua
              ? `<a href="https://wa.me/62${pendaftar.telepon_orang_tua.replace(
                  /^0/,
                  ""
                )}" target="_blank">
                   <i class="bi bi-whatsapp text-success"></i> ${
                     pendaftar.telepon_orang_tua
                   }
                 </a>`
              : "-"
          }</div>

          <div class="col-12 mt-3"><h6 class="bg-success text-white p-2 rounded">
            <i class="bi bi-geo-alt"></i> Alamat Lengkap
          </h6></div>
          <div class="col-md-12"><strong>Alamat Jalan:</strong><br>${
            pendaftar.alamatjalan || "-"
          }</div>
          <div class="col-md-6"><strong>Desa/Kelurahan:</strong><br>${
            pendaftar.desa || "-"
          }</div>
          <div class="col-md-6"><strong>Kecamatan:</strong><br>${
            pendaftar.kecamatan || "-"
          }</div>
          <div class="col-md-6"><strong>Kabupaten/Kota:</strong><br>${
            pendaftar.kotakabupaten || pendaftar.kabkota || "-"
          }</div>
          <div class="col-md-6"><strong>Provinsi:</strong><br>${
            pendaftar.provinsi || "-"
          }</div>

          <div class="col-12 mt-3"><h6 class="bg-success text-white p-2 rounded">
            <i class="bi bi-mortarboard"></i> Pendidikan & Rencana
          </h6></div>
          <div class="col-md-6"><strong>Ijazah Formal Terakhir:</strong><br>${
            pendaftar.ijazahformalterakhir || "-"
          }</div>
          <div class="col-md-6"><strong>Rencana Tingkat:</strong><br>${
            pendaftar.rencanatingkat || "-"
          }</div>
          <div class="col-md-6"><strong>Rencana Program:</strong><br>${
            pendaftar.rencanaprogram || "-"
          }</div>

          <div class="col-12 mt-3"><h6 class="bg-success text-white p-2 rounded">
            <i class="bi bi-people"></i> Data Orang Tua
          </h6></div>
          <div class="col-md-6"><strong>Nama Ayah:</strong><br>${
            pendaftar.namaayah || "-"
          }</div>
          <div class="col-md-6"><strong>NIK Ayah:</strong><br>${
            pendaftar.nikayah || "-"
          }</div>
          <div class="col-md-6"><strong>Status Ayah:</strong><br>${badge(
            pendaftar.statusayah || "-",
            pendaftar.statusayah === "Hidup" ? "success" : "secondary"
          )}</div>
          <div class="col-md-6"><strong>Pekerjaan Ayah:</strong><br>${
            pendaftar.pekerjaanayah || "-"
          }</div>
          <div class="col-md-6"><strong>Nama Ibu:</strong><br>${
            pendaftar.namaibu || "-"
          }</div>
          <div class="col-md-6"><strong>NIK Ibu:</strong><br>${
            pendaftar.nikibu || "-"
          }</div>
          <div class="col-md-6"><strong>Status Ibu:</strong><br>${badge(
            pendaftar.statusibu || "-",
            pendaftar.statusibu === "Hidup" ? "success" : "secondary"
          )}</div>
          <div class="col-md-6"><strong>Pekerjaan Ibu:</strong><br>${
            pendaftar.pekerjaanibu || "-"
          }</div>

          <div class="col-12 mt-3"><h6 class="bg-success text-white p-2 rounded">
            <i class="bi bi-file-earmark-arrow-up"></i> Berkas Upload
          </h6></div>
      `;

      // files
      const files = [
        { key: "file_ijazah", label: "Scan Ijazah", icon: "file-pdf" },
        { key: "file_akta", label: "Scan Akta Kelahiran", icon: "file-pdf" },
        { key: "file_foto", label: "Pas Foto 3x4", icon: "image" },
        { key: "file_bpjs", label: "Kartu BPJS (Opsional)", icon: "file-pdf" },
      ];
      let hasFiles = false;
      files.forEach((f) => {
        const url = pendaftar[f.key];
        if (url) {
          hasFiles = true;
          html += `
            <div class="col-md-6">
              <div class="card border-success">
                <div class="card-body">
                  <h6 class="card-title"><i class="bi bi-${f.icon} text-success"></i> ${f.label}</h6>
                  <a href="${url}" target="_blank" class="btn btn-sm btn-success">
                    <i class="bi bi-download"></i> Download / Lihat
                  </a>
                </div>
              </div>
            </div>`;
        }
      });
      if (!hasFiles) {
        html += `
          <div class="col-12">
            <div class="alert alert-info">
              <i class="bi bi-info-circle"></i> Tidak ada berkas yang diupload
            </div>
          </div>`;
      }
      html += `</div>`;

      // tampilkan modal
      const detailContent = $("#detailContent");
      if (detailContent) detailContent.innerHTML = html;
      const modalEl = $("#detailModal");
      if (modalEl)
        (
          bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)
        ).show();
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  function openVerifikasiModal(id, status) {
    const idEl = $("#verifikasi-id");
    const stEl = $("#verifikasi-status");
    if (idEl) idEl.value = id;
    if (stEl) stEl.value = status;

    const statusText = {
      diterima: "Diterima",
      revisi: "Perlu Revisi",
      ditolak: "Ditolak",
    };
    const statusColors = {
      diterima: "success",
      revisi: "info",
      ditolak: "danger",
    };

    const title = $("#verifikasiModalTitle");
    if (title) title.textContent = `Verifikasi: ${statusText[status]}`;

    const display = $("#verifikasi-status-display");
    if (display) {
      display.value = statusText[status];
      display.className = `form-control bg-${statusColors[status]} text-white`;
    }

    const catatanLabel = $("#catatanLabel");
    const catatanInput = $("#verifikasi-catatan");
    if (catatanLabel && catatanInput) {
      if (status === "revisi") {
        catatanLabel.textContent = "Catatan Revisi";
        catatanInput.placeholder = "Jelaskan apa yang perlu direvisi...";
      } else if (status === "ditolak") {
        catatanLabel.textContent = "Alasan Penolakan";
        catatanInput.placeholder = "Jelaskan alasan penolakan...";
      } else {
        catatanLabel.textContent = "Catatan";
        catatanInput.placeholder = "Tambahkan catatan (opsional)...";
      }
      catatanInput.value = "";
    }

    const btnConfirm = $("#btnConfirmVerifikasi");
    if (btnConfirm) {
      btnConfirm.className = `btn btn-${statusColors[status]}`;
      btnConfirm.textContent = statusText[status];
    }

    const modalEl = $("#verifikasiModal");
    if (modalEl)
      (
        bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)
      ).show();
  }

  async function confirmVerifikasi() {
    const id = $("#verifikasi-id")?.value;
    const status = $("#verifikasi-status")?.value;
    const catatan = $("#verifikasi-catatan")?.value;
    const adminEmail = localStorage.getItem("adminEmail") || "admin";
    try {
      const r = await fetch("/api/pendaftar_status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parseInt(id, 10),
          status,
          alasan: catatan || null,
          verifiedBy: adminEmail,
        }),
      });
      const result = await r.json();
      if (result.success) {
        const modal = bootstrap.Modal.getInstance($("#verifikasiModal"));
        if (modal) modal.hide();
        alert(`Status berhasil diubah menjadi "${status}"!`);
        loadPendaftar();
      } else {
        alert("Error: " + (result.error || "Gagal mengubah status"));
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  /* =========================
     DOWNLOAD FOTO ZIP
     ========================= */
  
  /**
   * Helper function to create slug from name
   */
  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '');         // Trim - from end of text
  }

  // expose
  window.lihatDetail = lihatDetail;
  window.openVerifikasiModal = openVerifikasiModal;
  window.confirmVerifikasi = confirmVerifikasi;
  window.updateStatus = updateStatus;

  /* =========================
     4) EXPORT CSV PENDAFTAR
     ========================= */
  /**
   * Export to Excel (.xlsx) via Server-side API
   * Data from v_pendaftar_export view, sorted by rencana_program A-Z
   */
  function exportToExcel() {
    try {
      // Show alert notification
      alert('Memproses export Excel...\nFile akan segera diunduh.');
      
      // Trigger server-side Excel download
      window.location.href = '/api/export_pendaftar_xlsx';
      
      console.log('✓ Excel export initiated via server');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('❌ Error: ' + error.message);
    }
  }
  window.exportToExcel = exportToExcel;

  /**
   * Download ALL files from ALL pendaftar as ZIP
   */
  function downloadAllZip(filters = {}) {
    try {
      // Build query string
      const params = new URLSearchParams();
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.date_from) {
        params.append('date_from', filters.date_from);
      }
      
      if (filters.date_to) {
        params.append('date_to', filters.date_to);
      }
      
      if (filters.only) {
        params.append('only', filters.only);
      }
      
      const queryString = params.toString();
      const url = `/api/pendaftar_download_zip${queryString ? '?' + queryString : ''}`;
      
      // Show notification
      alert('Memproses download ZIP semua berkas...\nProses ini mungkin memakan waktu beberapa saat.');
      
      // Trigger download
      window.location.href = url;
      
      console.log('✓ ZIP download initiated via server');
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('❌ Error: ' + error.message);
    }
  }
  window.downloadAllZip = downloadAllZip;

  /* =========================
     5) PEMBAYARAN
     ========================= */
  async function loadPembayaran() {
    try {
      const r = await fetch("/api/pembayaran_list");
      const result = await r.json();
      if (!(result.success && result.data)) return;

      // Tabel
      const tbody = $("#pembayaranTableBody");
      if (tbody) {
        tbody.innerHTML = result.data
          .map((item, i) => {
            const raw = (item.status || "PENDING").toUpperCase();
            const cls =
              raw === "VERIFIED"
                ? "success"
                : raw === "REJECTED"
                ? "danger"
                : "warning";
            return `
            <tr>
              <td>${i + 1}</td>
              <td>${item.nisn || item.nik || "-"}</td>
              <td>${item.nama_lengkap || "-"}</td>
              <td>${rupiah(item.jumlah)}</td>
              <td>${badge(
                raw === "VERIFIED"
                  ? "Verified"
                  : raw === "REJECTED"
                  ? "Rejected"
                  : "Pending",
                cls
              )}</td>
              <td>${formatIDDate(item.tanggal_upload)}</td>
              <td>
                <button class="btn btn-sm btn-success" onclick="loadPembayaranDetail('${
                  item.nisn || item.nik
                }')">Lihat Detail</button>
              </td>
            </tr>
          `;
          })
          .join("");
      }

      // Statistik
      const totalPending = result.data.filter(
        (p) => (p.status || "PENDING").toUpperCase() === "PENDING"
      ).length;
      const totalVerified = result.data.filter(
        (p) => (p.status || "PENDING").toUpperCase() === "VERIFIED"
      ).length;
      const totalRejected = result.data.filter(
        (p) => (p.status || "PENDING").toUpperCase() === "REJECTED"
      ).length;
      const totalRevenue = result.data
        .filter((p) => (p.status || "PENDING").toUpperCase() === "VERIFIED")
        .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);

      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      set("statPending", totalPending);
      set("statVerified", totalVerified);
      set("statRejected", totalRejected);
      set("statRevenue", rupiah(totalRevenue));

      const upd = $("#updateTimePembayaran");
      if (upd)
        upd.textContent = `Data update: ${new Date().toLocaleTimeString(
          "id-ID"
        )}`;
    } catch (e) {
      console.error("loadPembayaran error:", e);
    }
  }

  function viewPembayaranDetail(payment) {
    currentPembayaranData = payment;

    const setText = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    setText("detail-nisn", payment.nisn || payment.nik || "-");
    setText("detail-nama-lengkap", payment.nama_lengkap || "-");
    setText("detail-jumlah", rupiah(payment.jumlah));
    setText("detail-metode", payment.metode_pembayaran || "-");
    setText("detail-tanggal-upload", formatIDDatetime(payment.tanggal_upload));
    setText(
      "detail-tanggal-verifikasi",
      formatIDDatetime(payment.tanggal_verifikasi)
    );
    setText("detail-verified-by", payment.verified_by || "-");
    setText("detail-catatan-admin", payment.catatan_admin || "-");

    const raw = (payment.status || "PENDING").toUpperCase();
    const cls =
      raw === "VERIFIED"
        ? "success"
        : raw === "REJECTED"
        ? "danger"
        : "warning";
    const txt =
      raw === "VERIFIED"
        ? "Verified"
        : raw === "REJECTED"
        ? "Rejected"
        : "Pending";
    const statusEl = $("#detail-status");
    if (statusEl) statusEl.innerHTML = badge(txt, cls);

    const img = $("#detail-bukti-img");
    if (img) {
      if (payment.bukti_pembayaran) {
        img.src = payment.bukti_pembayaran;
        img.style.display = "block";
      } else {
        img.style.display = "none";
      }
    }

    const btnVerify = $("#btnVerifyPayment");
    const btnReject = $("#btnRejectPayment");
    if (btnVerify && btnReject) {
      if (raw === "PENDING") {
        btnVerify.style.display = "inline-block";
        btnReject.style.display = "inline-block";
      } else {
        btnVerify.style.display = "none";
        btnReject.style.display = "none";
      }
    }

    const modalEl = $("#detailPembayaranModal");
    if (modalEl)
      (
        bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)
      ).show();
  }

  function openVerifikasiPembayaran(status) {
    if (!currentPembayaranData) {
      alert(
        "⚠️ Data pembayaran tidak ditemukan. Silakan buka detail pembayaran terlebih dahulu."
      );
      return;
    }
    $("#verify-nisn").value =
      currentPembayaranData.nisn || currentPembayaranData.nik;
    $("#verify-status").value = status;
    $("#verify-catatan").value = "";

    const title =
      status === "VERIFIED" ? "Terima Pembayaran" : "Tolak Pembayaran";
    const cls = status === "VERIFIED" ? "alert-success" : "alert-danger";
    const text =
      status === "VERIFIED"
        ? `Apakah Anda yakin ingin MENERIMA pembayaran dari <strong>${currentPembayaranData.nama_lengkap}</strong>?`
        : `Apakah Anda yakin ingin MENOLAK pembayaran dari <strong>${currentPembayaranData.nama_lengkap}</strong>?`;

    $("#verifikasiPembayaranTitle").textContent = title;
    const alertBox = $("#verify-alert");
    if (alertBox) {
      alertBox.className = "alert " + cls;
      alertBox.innerHTML = text;
      alertBox.style.display = "";
    }

    // tutup modal detail jika sedang terbuka
    const detailModalEl = $("#detailPembayaranModal");
    if (detailModalEl) {
      const inst = bootstrap.Modal.getInstance(detailModalEl);
      if (inst) inst.hide();
    }

    const verifyEl = $("#verifikasiPembayaranModal");
    if (verifyEl)
      (
        bootstrap.Modal.getInstance(verifyEl) || new bootstrap.Modal(verifyEl)
      ).show();
  }

  async function confirmVerifikasiPembayaran() {
    const nisn = $("#verify-nisn").value;
    const status = $("#verify-status").value;
    const catatan = $("#verify-catatan").value;
    const btn = $("#btnConfirmVerifyPayment");

    try {
      btn.disabled = true;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span> Proses...';

      const r = await fetch("/api/pembayaran_verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nisn: nisn,
          status,
          catatan_admin: catatan,
          verified_by: localStorage.getItem("adminEmail") || "admin",
        }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Gagal verifikasi");

      alert("✅ Pembayaran berhasil diverifikasi!");

      // tutup modal verifikasi & detail
      const vModal = bootstrap.Modal.getInstance(
        $("#verifikasiPembayaranModal")
      );
      if (vModal) vModal.hide();
      const dModal = bootstrap.Modal.getInstance($("#detailPembayaranModal"));
      if (dModal) dModal.hide();

      // Kirim WA jika VERIFIED
      if (status === "VERIFIED" && currentPembayaranData) {
        try {
          const pRes = await fetch("/api/pendaftar_list");
          const pJson = await pRes.json();
          if (pJson.success && pJson.data) {
            const pendaftar = pJson.data.find(
              (p) =>
                (p.nisn || p.nikcalon || p.nik) === (currentPembayaranData.nisn || currentPembayaranData.nik)
            );
            if (pendaftar && pendaftar.telepon_orang_tua) {
              const phone = pendaftar.telepon_orang_tua.replace(/^0/, "62");
              const message = encodeURIComponent(
                `Assalamualaikum Bapak/Ibu,

✅ *Pembayaran telah TERVERIFIKASI*

• Nama Siswa: *${currentPembayaranData.nama_lengkap}*
• NISN: ${currentPembayaranData.nisn || currentPembayaranData.nik}
• Jumlah: ${rupiah(currentPembayaranData.jumlah)}

🎉 *Proses pendaftaran telah SELESAI!*
Kami akan menghubungi Anda kembali untuk informasi lebih lanjut.

Jazakumullahu khairan,
SMP SAINS AN NAJAH PURWOKERTO`
              );

              // coba buka WA app, fallback ke web
              const waApp = `whatsapp://send?phone=${phone}&text=${message}`;
              const waWeb = `https://wa.me/${phone}?text=${message}`;

              const a = document.createElement("a");
              a.href = waApp;
              a.target = "_blank";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);

              setTimeout(() => {
                if (
                  confirm(
                    "Jika WhatsApp tidak terbuka, klik OK untuk membuka di browser."
                  )
                ) {
                  window.open(waWeb, "_blank");
                }
              }, 2000);
            }
          }
        } catch (err) {
          console.error("WA notify error:", err);
          alert("⚠️ Gagal mengirim notifikasi WhatsApp.");
        }
      }

      // refresh
      loadPembayaran();
    } catch (e) {
      console.error("verify error:", e);
      alert("❌ Error: " + e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = "Konfirmasi";
    }
  }

  async function loadPembayaranDetail(nisn) {
    try {
      const r = await fetch("/api/pembayaran_list");
      const result = await r.json();
      if (result.success && result.data) {
        const payment = result.data.find(
          (p) => (p.nisn || p.nik) === nisn
        );
        if (payment) {
          currentPembayaranData = payment;
          viewPembayaranDetail(payment);
        } else {
          alert("Pembayaran tidak ditemukan.");
        }
      }
    } catch (e) {
      console.error("loadPembayaranDetail error:", e);
    }
  }

  // expose pembayaran fns
  window.loadPembayaran = loadPembayaran;
  window.viewPembayaranDetail = viewPembayaranDetail;
  window.openVerifikasiPembayaran = openVerifikasiPembayaran;
  window.confirmVerifikasiPembayaran = confirmVerifikasiPembayaran;
  window.loadPembayaranDetail = loadPembayaranDetail;

  /* =========================
     6) MODAL CLEANUP HANDLERS
     ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    const detailPembayaranModal = $("#detailPembayaranModal");
    if (detailPembayaranModal) {
      detailPembayaranModal.addEventListener("hidden.bs.modal", () => {
        const img = $("#detail-bukti-img");
        if (img) img.src = "";
        const verifyCatatan = $("#verify-catatan");
        if (verifyCatatan) verifyCatatan.value = "";
      });
    }

    const verifikasiPembayaranModal = $("#verifikasiPembayaranModal");
    if (verifikasiPembayaranModal) {
      verifikasiPembayaranModal.addEventListener("hidden.bs.modal", () => {
        const verifyCatatan = $("#verify-catatan");
        if (verifyCatatan) verifyCatatan.value = "";
        const verifyAlert = $("#verify-alert");
        if (verifyAlert) {
          verifyAlert.className = "alert";
          verifyAlert.textContent = "";
          verifyAlert.style.display = "none";
        }
      });
    }

    const detailModal = $("#detailModal");
    if (detailModal) {
      detailModal.addEventListener("hidden.bs.modal", () => {
        const detailContent = $("#detailContent");
        if (detailContent) detailContent.innerHTML = "";
      });
    }

    const verifikasiModal = $("#verifikasiModal");
    if (verifikasiModal) {
      verifikasiModal.addEventListener("hidden.bs.modal", () => {
        const verifikasiCatatan = $("#verifikasi-catatan");
        if (verifikasiCatatan) verifikasiCatatan.value = "";
      });
    }
  });

  /* =========================
     7) GELOMBANG MANAGEMENT
     ========================= */
  let currentGelombangData = [];

  /**
   * Load gelombang data from Supabase and render forms
   */
  async function loadGelombangData(forceRefresh = false) {
    const container = document.getElementById('gelombangContainer');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Memuat...</span>
        </div>
        <p class="text-muted mt-3"><i class="bi bi-arrow-repeat"></i> ${forceRefresh ? 'Memperbarui' : 'Memuat'} data gelombang dari Supabase...</p>
      </div>
    `;
    
    try {
      console.log('[GELOMBANG] Loading data from Supabase...', forceRefresh ? '(force refresh)' : '');
      
      // Check if Supabase client is available
      if (!window.supabase) {
        throw new Error('Supabase client not initialized. Please check your Supabase credentials in admin.html.');
      }
      
      // Fetch gelombang data from Supabase
      const { data, error } = await window.supabase
        .from('gelombang')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No gelombang data found in database');
      }
      
      console.log('[GELOMBANG] Data loaded from Supabase:', data);
      console.table(data);
      
      currentGelombangData = data;
      renderGelombangForms(data);
      
      console.log('[GELOMBANG] Data rendered successfully:', data.length, 'items');
    } catch (error) {
      console.error('[GELOMBANG] Error loading:', error);
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i> 
          <strong>Gagal memuat data gelombang:</strong> ${error.message}
          <hr>
          <button class="btn btn-sm btn-danger" onclick="loadGelombangData(true)">
            <i class="bi bi-arrow-repeat"></i> Coba Lagi
          </button>
        </div>
      `;
    }
  }

  /**
   * Render gelombang forms with status-based styling
   */
  function renderGelombangForms(gelombangList) {
    const container = document.getElementById('gelombangContainer');
    if (!container) return;
    
    const formsHTML = gelombangList.map((gelombang, index) => {
      // Map status to colors
      const status = (gelombang.status || 'ditutup').toLowerCase();
      let statusColor, statusBadge, borderColor;
      
      if (status === 'aktif') {
        statusColor = 'success';  // Green
        statusBadge = 'Aktif';
        borderColor = 'success';
      } else if (status === 'dibuka') {
        statusColor = 'primary';  // Blue
        statusBadge = 'Dibuka';
        borderColor = 'primary';
      } else { // ditutup
        statusColor = 'secondary'; // Gray
        statusBadge = 'Ditutup';
        borderColor = 'secondary';
      }
      
      const isActive = gelombang.is_active || status === 'aktif';
      
      return `
        <div class="card mb-3 border-${borderColor}">
          <div class="card-header bg-${borderColor} bg-opacity-10 d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
              <i class="bi bi-${index + 1}-circle"></i> ${gelombang.nama}
            </h6>
            <span class="badge bg-${statusColor}">${statusBadge}</span>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label"><i class="bi bi-calendar-event"></i> Tanggal Mulai</label>
                <input type="date" class="form-control" id="start_date_${gelombang.id}" 
                       value="${gelombang.start_date}" required>
              </div>
              <div class="col-md-6">
                <label class="form-label"><i class="bi bi-calendar-x"></i> Tanggal Akhir</label>
                <input type="date" class="form-control" id="end_date_${gelombang.id}" 
                       value="${gelombang.end_date}" required>
              </div>
              <div class="col-md-12">
                <label class="form-label"><i class="bi bi-book"></i> Tahun Ajaran</label>
                <input type="text" class="form-control" id="tahun_ajaran_${gelombang.id}" 
                       value="${gelombang.tahun_ajaran}" placeholder="2026/2027" required>
              </div>
            </div>
            <div class="d-flex gap-2 mt-3 flex-wrap">
              <button type="button" class="btn btn-outline-primary btn-sm" onclick="updateGelombang(${gelombang.id})">
                <i class="bi bi-save"></i> Simpan Perubahan
              </button>
              ${!isActive ? `
              <button type="button" class="btn btn-success btn-sm" onclick="setGelombangActive(${gelombang.id})">
                <i class="bi bi-check-circle"></i> Jadikan Aktif
              </button>
              ` : `
              <button type="button" class="btn btn-secondary btn-sm" disabled>
                <i class="bi bi-check-circle-fill"></i> Gelombang Aktif
              </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = formsHTML;
  }

  /**
   * Update gelombang data (FAST - no full reload)
   */
  async function updateGelombang(id) {
    // Ensure ID is a number
    id = parseInt(id, 10);
    
    const startDate = document.getElementById(`start_date_${id}`).value;
    const endDate = document.getElementById(`end_date_${id}`).value;
    const tahunAjaran = document.getElementById(`tahun_ajaran_${id}`).value;
    
    // Validate
    if (!startDate || !endDate || !tahunAjaran) {
      toastr.error('Semua field harus diisi!', '', {
        timeOut: 2000,
        progressBar: true
      });
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toastr.error('Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir!', '', {
        timeOut: 2000,
        progressBar: true
      });
      return;
    }
    
    console.log('[GELOMBANG] Updating gelombang:', id, { startDate, endDate, tahunAjaran });
    
    // Find the button and show minimal loading state
    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="bi bi-check-circle"></i> Menyimpan...';
    
    try {
      const response = await fetch('/api/update_gelombang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          start_date: startDate,
          end_date: endDate,
          tahun_ajaran: tahunAjaran
        })
      });
      
      const result = await response.json();
      
      console.log('[GELOMBANG] Update response:', result);
      
      if (!result.ok) {
        throw new Error(result.error || 'Gagal mengupdate gelombang');
      }
      
      // Update local data cache
      const gelombangIndex = currentGelombangData.findIndex(g => g.id === id);
      if (gelombangIndex !== -1) {
        currentGelombangData[gelombangIndex].start_date = startDate;
        currentGelombangData[gelombangIndex].end_date = endDate;
        currentGelombangData[gelombangIndex].tahun_ajaran = tahunAjaran;
      }
      
      // Success notification (FAST)
      toastr.success('✓ Perubahan berhasil disimpan!', '', {
        timeOut: 2000,
        progressBar: true
      });
      
      // Restore button immediately
      button.disabled = false;
      button.innerHTML = originalHTML;
      
      // Visual feedback: quick pulse animation
      const card = button.closest('.card');
      if (card) {
        card.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
          card.style.animation = '';
        }, 500);
      }
      
    } catch (error) {
      console.error('[GELOMBANG] Error updating:', error);
      toastr.error(`✗ Gagal menyimpan: ${error.message}`, '', {
        timeOut: 3000,
        progressBar: true
      });
      
      // Restore button
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  }
  window.updateGelombang = updateGelombang;

  /**
   * Set gelombang as active using Supabase RPC
   */
  async function setGelombangActive(id) {
    // Ensure ID is a number (convert from string if needed)
    id = parseInt(id, 10);
    
    // Confirmation dialog
    if (!confirm('Jadikan gelombang ini aktif? Gelombang lain akan otomatis diatur statusnya.')) {
      return;
    }
    
    console.log('[GELOMBANG] Activating gelombang via Supabase RPC:', id);
    
    // Check if Supabase client is available
    if (!window.supabase) {
      toastr.error('❌ Supabase client not initialized!', '', {
        timeOut: 3000,
        progressBar: true
      });
      return;
    }
    
    try {
      // Show loading indicator
      toastr.info('⏳ Mengaktifkan gelombang...', '', {
        timeOut: 2000,
        progressBar: true
      });
      
      // Call Supabase RPC function
      const { data, error } = await window.supabase.rpc('set_gelombang_status', { p_id: id });
      
      if (error) {
        throw new Error(`Supabase RPC error: ${error.message}`);
      }
      
      console.log('[GELOMBANG] RPC success:', data);
      
      // Show success notification
      toastr.success(`✅ Gelombang ${id} berhasil diaktifkan!`, '', {
        timeOut: 2000,
        progressBar: true
      });
      
      // Reload data to show updated status and colors
      await loadGelombangData(true);
      
      // Trigger localStorage event to sync with index.html
      localStorage.setItem('gelombang_update', Date.now().toString());
      console.log('[GELOMBANG] 📡 Broadcasting update to public pages via localStorage');
      
      console.log('[GELOMBANG] ✅ UI refreshed successfully');
      
    } catch (error) {
      console.error('[GELOMBANG] Error activating:', error);
      
      toastr.error(`❌ Gagal mengubah gelombang: ${error.message}`, '', {
        timeOut: 4000,
        progressBar: true
      });
    }
  }
  window.setGelombangActive = setGelombangActive;

  /* =========================
     8) INIT
     ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    // default tab load
    loadPendaftar();
    loadPembayaran();
  });
})();
