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

  // Pagination state untuk pendaftar
  let currentPage = 1;
  let pageSize = 10; // WAJIB 10 data per halaman
  let totalData = 0;

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
      // Statistik sudah auto-update dari loadPendaftar()
      // Hanya reload jika belum ada data
      if (allPendaftarData.length === 0) {
        console.log("[STATISTIK] No cached data, loading...");
        loadPendaftar();
      } else {
        console.log("[STATISTIK] Using cached data:", allPendaftarData.length, "items");
      }
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
      console.log('[PENDAFTAR] 📊 Loading page', currentPage, '(pageSize:', pageSize, ')');
      
      // Show loading state in table
      const tbody = $("#pendaftarTable");
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Memuat data...</td></tr>';
      }
      
      // Fetch pendaftar data dengan pagination
      const url = `/api/pendaftar_list?page=${currentPage}&pageSize=${pageSize}`;
      console.log('[PENDAFTAR] → API:', url);
      
      const r = await fetch(url);
      const result = await r.json();
      if (!(result.success && result.data)) {
        console.error("[STATISTIK] ❌ Failed to fetch pendaftar data:", result);
        return;
      }

      // Update total data dan pagination info
      totalData = result.total || result.data.length;
      console.log('[PENDAFTAR] Page:', currentPage, '| Page Size:', pageSize, '| Total:', totalData);

      console.log("[STATISTIK] 📊 Raw pendaftar data received:");
      console.log("[STATISTIK]   → Success:", result.success);
      console.log("[STATISTIK]   → Data length:", result.data ? result.data.length : 0);
      console.log("[STATISTIK]   → Sample data:", result.data ? result.data.slice(0, 2) : null);

      allPendaftarData = result.data; // simpan untuk detail

      // Fetch ALL data untuk statistik (tanpa pagination)
      console.log("[STATISTIK] Fetching ALL data for statistics...");
      const rAll = await fetch("/api/pendaftar_list?page=1&pageSize=1000"); // Ambil maksimal 1000 data
      const resultAll = await rAll.json();
      const allDataForStats = resultAll.success && resultAll.data ? resultAll.data : result.data;

      // Fetch pembayaran data untuk sinkronisasi statistik
      console.log("[STATISTIK] Fetching pembayaran data untuk sinkronisasi...");
      const rPembayaran = await fetch("/api/pembayaran_list");
      const pembayaranResult = await rPembayaran.json();
      
      // Create map of verified payments by NISN/NIK
      const verifiedPayments = new Map();
      if (pembayaranResult.success && pembayaranResult.data) {
        pembayaranResult.data.forEach(p => {
          if ((p.status || "PENDING").toUpperCase() === "VERIFIED") {
            // Store all possible identifiers for better matching
            const identifiers = [
              p.nisn,
              p.nik, 
              p.nikcalon
            ].filter(Boolean);
            
            identifiers.forEach(key => {
              if (key) verifiedPayments.set(key, true);
            });
          }
        });
        console.log("[STATISTIK] Verified payments found:", verifiedPayments.size);
        console.log("[STATISTIK] Verified payment identifiers:", Array.from(verifiedPayments.keys()).slice(0, 5));
      }

      const tbody = $("#pendaftarTable");
      if (tbody) {
        // Calculate starting number based on current page
        const startNum = (currentPage - 1) * pageSize;
        
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
                <td>${startNum + i + 1}</td>
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

      // Helper function to check if payment is verified
      const hasVerifiedPayment = (d) => {
        const identifiers = [
          d.nisn,
          d.nikcalon,
          d.nik
        ].filter(Boolean);
        
        // Check if any identifier matches verified payments
        const isVerified = identifiers.some(key => verifiedPayments.has(key));
        
        // Debug logging for first few items
        if (window.debugStatistik && identifiers.length > 0) {
          console.log("[MATCH DEBUG]", {
            nama: d.nama,
            identifiers,
            isVerified,
            hasInMap: identifiers.map(id => ({ id, exists: verifiedPayments.has(id) }))
          });
        }
        
        return isVerified;
      };

      // Kartu statistik
      const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      
      // Debug: Check data structure and field mapping
      console.log("[STATISTIK] 🔍 Data structure analysis:");
      console.log("[STATISTIK]   → Total pendaftar (ALL DATA):", allDataForStats.length);
      
      if (allDataForStats.length > 0) {
        const sample = allDataForStats[0];
        console.log("[STATISTIK]   → Sample pendaftar fields:", Object.keys(sample));
        console.log("[STATISTIK]   → Sample status values:", allDataForStats.map(d => d.status).slice(0, 5));
        console.log("[STATISTIK]   → Sample rencana_program values:", allDataForStats.map(d => d.rencana_program || d.rencanaprogram).slice(0, 5));
        console.log("[STATISTIK]   → Sample rencanatingkat values:", allDataForStats.map(d => d.rencanatingkat).slice(0, 5));
      }

      // Total count = all pendaftar (dari total API, bukan hanya halaman saat ini)
      setText("totalCount", totalData);
      console.log("[STATISTIK] ✅ Set totalCount to:", totalData);
      
      // Status counts (gunakan ALL DATA untuk statistik yang akurat)
      const pendingCount = allDataForStats.filter((d) => d.status === "pending").length;
      const revisiCount = allDataForStats.filter((d) => d.status === "revisi").length;
      const diterimaCount = allDataForStats.filter((d) => d.status === "diterima").length;
      const ditolakCount = allDataForStats.filter((d) => d.status === "ditolak").length;
      
      setText("pendingCount", pendingCount);
      setText("revisiCount", revisiCount);
      setText("diterimaCount", diterimaCount);
      setText("ditolakCount", ditolakCount);
      
      console.log("[STATISTIK] ✅ Status counts set:");
      console.log("[STATISTIK]   → Pending:", pendingCount);
      console.log("[STATISTIK]   → Revisi:", revisiCount);
      console.log("[STATISTIK]   → Diterima:", diterimaCount);
      console.log("[STATISTIK]   → Ditolak:", ditolakCount);

      // Breakdown program/jenjang
      const getRencanaProgram = (d) => {
        const program = d.rencana_program || d.rencanaProgram || d.rencanakelas || d.rencanaprogram || "";
        return program.trim(); // Trim whitespace
      };
      
      const getJenjang = (d) => {
        const jenjang = d.rencanatingkat || d.rencanaTingkat || "";
        return jenjang.trim(); // Trim whitespace
      };
      
      // REVISI: Gunakan SEMUA pendaftar untuk statistik, bukan hanya yang verified
      const allPendaftar = allDataForStats; // Gunakan SEMUA data untuk statistik (bukan hanya halaman saat ini)
      
      console.log("[STATISTIK] ========================================");
      console.log("[STATISTIK] Total pendaftar (ALL DATA):", allDataForStats.length);
      console.log("[STATISTIK] Menggunakan SEMUA pendaftar untuk statistik (bukan hanya verified)");
      console.log("[STATISTIK] Verified payments map size:", verifiedPayments.size);
      console.log("[STATISTIK] Pendaftar dengan pembayaran VERIFIED:", allDataForStats.filter(hasVerifiedPayment).length);
      
      // Debug: Log sample data for statistics verification
      if (allPendaftar.length > 0) {
        console.log("[STATISTIK] Sample pendaftar pertama:", {
          nama: allPendaftar[0].nama,
          nisn: allPendaftar[0].nisn,
          nik: allPendaftar[0].nik,
          nikcalon: allPendaftar[0].nikcalon,
          rencana_program: getRencanaProgram(allPendaftar[0]),
          rencanatingkat: getJenjang(allPendaftar[0]),
          jeniskelamin: allPendaftar[0].jeniskelamin
        });
      }
      
      console.log("[STATISTIK] ========================================");
      console.log("💡 Tip: Statistik sekarang menggunakan SEMUA pendaftar (bukan hanya verified)");

      // REVISI: Hitung SEMUA pendaftar untuk breakdown statistics
      console.log("[STATISTIK] 🔍 Calculating breakdown statistics...");
      console.log("[STATISTIK]   → Total pendaftar count:", allPendaftar.length);
      
      const putraIndukMts = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isMatch = program === "Asrama Putra Induk" && jenjang === "MTs";
          return isMatch;
        }
      ).length;
      const putraIndukMa = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isMatch = program === "Asrama Putra Induk" && jenjang === "MA";
          return isMatch;
        }
      ).length;
      const putraIndukKuliah = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isMatch = program === "Asrama Putra Induk" && jenjang === "Kuliah";
          return isMatch;
        }
      ).length;
      const putraIndukTotal = putraIndukMts + putraIndukMa + putraIndukKuliah;

      const putraTahfidzMts = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isMatch = program === "Asrama Putra Tahfidz" && jenjang === "MTs";
          return isMatch;
        }
      ).length;
      const putraTahfidzMa = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isMatch = program === "Asrama Putra Tahfidz" && jenjang === "MA";
          return isMatch;
        }
      ).length;
      const putraTahfidzKuliah = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isMatch = program === "Asrama Putra Tahfidz" && jenjang === "Kuliah";
          return isMatch;
        }
      ).length;
      const putraTahfidzTotal =
        putraTahfidzMts + putraTahfidzMa + putraTahfidzKuliah;

      const putriMts = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isMatch = program === "Asrama Putri" && jenjang === "MTs";
          return isMatch;
        }
      ).length;
      const putriMa = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isMatch = program === "Asrama Putri" && jenjang === "MA";
          return isMatch;
        }
      ).length;
      const putriKuliah = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isMatch = program === "Asrama Putri" && jenjang === "Kuliah";
          return isMatch;
        }
      ).length;
      const putriTotal = putriMts + putriMa + putriKuliah;

      const hanyaSekolahMtsL = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isGenderMatch = (d.jeniskelamin && d.jeniskelamin.trim().toUpperCase() === "L") || (d.jenisKelamin && d.jenisKelamin.trim().toUpperCase() === "L");
          const isMatch = program === "Hanya Sekolah" && jenjang === "MTs" && isGenderMatch;
          return isMatch;
        }
      ).length;
      const hanyaSekolahMtsP = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isGenderMatch = (d.jeniskelamin && d.jeniskelamin.trim().toUpperCase() === "P") || (d.jenisKelamin && d.jenisKelamin.trim().toUpperCase() === "P");
          const isMatch = program === "Hanya Sekolah" && jenjang === "MTs" && isGenderMatch;
          return isMatch;
        }
      ).length;
      const hanyaSekolahMaL = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isGenderMatch = (d.jeniskelamin && d.jeniskelamin.trim().toUpperCase() === "L") || (d.jenisKelamin && d.jenisKelamin.trim().toUpperCase() === "L");
          const isMatch = program === "Hanya Sekolah" && jenjang === "MA" && isGenderMatch;
          return isMatch;
        }
      ).length;
      const hanyaSekolahMaP = allPendaftar.filter(
        (d) => {
          const program = getRencanaProgram(d);
          const jenjang = getJenjang(d);
          const isGenderMatch = (d.jeniskelamin && d.jeniskelamin.trim().toUpperCase() === "P") || (d.jenisKelamin && d.jenisKelamin.trim().toUpperCase() === "P");
          const isMatch = program === "Hanya Sekolah" && jenjang === "MA" && isGenderMatch;
          return isMatch;
        }
      ).length;
      const hanyaSekolahTotal =
        hanyaSekolahMtsL + hanyaSekolahMtsP + hanyaSekolahMaL + hanyaSekolahMaP;

      // Debug: Log calculated statistics (SEMUA PENDAFTAR)
      console.log("[STATISTIK] Hasil perhitungan (SEMUA PENDAFTAR):");
      console.log("Asrama Putra Induk:", { MTs: putraIndukMts, MA: putraIndukMa, Kuliah: putraIndukKuliah, Total: putraIndukTotal });
      console.log("Asrama Putra Tahfidz:", { MTs: putraTahfidzMts, MA: putraTahfidzMa, Kuliah: putraTahfidzKuliah, Total: putraTahfidzTotal });
      console.log("Asrama Putri:", { MTs: putriMts, MA: putriMa, Kuliah: putriKuliah, Total: putriTotal });
      console.log("Hanya Sekolah:", { 
        MTs_L: hanyaSekolahMtsL, 
        MTs_P: hanyaSekolahMtsP, 
        MA_L: hanyaSekolahMaL, 
        MA_P: hanyaSekolahMaP, 
        Total: hanyaSekolahTotal 
      });
      console.log("[STATISTIK] ========================================");

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

      // Update pagination UI
      updatePaginationUI();
    } catch (err) {
      console.error("loadPendaftar error:", err);
    }
  }

  /* =========================
     3.1) PAGINATION FUNCTIONS
     ========================= */
  function updatePaginationUI() {
    const totalPages = Math.ceil(totalData / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalData);

    // Update pagination info text
    const paginationInfo = $("#paginationInfo");
    if (paginationInfo) {
      paginationInfo.textContent = `Menampilkan ${startIndex} - ${endIndex} dari ${totalData} data`;
    }

    // Update page info
    const pageInfo = $("#pageInfo");
    if (pageInfo) {
      pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    }

    // Update button states
    const btnPrev = $("#btnPrevPage");
    const btnNext = $("#btnNextPage");
    
    if (btnPrev) {
      btnPrev.disabled = currentPage === 1;
    }
    
    if (btnNext) {
      btnNext.disabled = currentPage >= totalPages;
    }

    console.log('[PAGINATION] UI Updated:', { currentPage, totalPages, startIndex, endIndex, totalData });
  }

  function nextPage() {
    const totalPages = Math.ceil(totalData / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      console.log('[PAGINATION] Next page:', currentPage);
      loadPendaftar();
    }
  }

  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
      console.log('[PAGINATION] Previous page:', currentPage);
      loadPendaftar();
    }
  }

  // Expose pagination functions
  window.nextPage = nextPage;
  window.previousPage = previousPage;

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
        
        // Build success message
        let successMsg = `✅ Status berhasil diubah menjadi "${status}"!`;
        
        // Add WhatsApp notification status if available
        if (result.whatsapp) {
          if (result.whatsapp.sent) {
            successMsg += `\n\n📱 WhatsApp Notification: TERKIRIM ✅`;
            successMsg += `\n   Provider: ${result.whatsapp.provider}`;
            console.log('[VERIFIKASI] WhatsApp sent:', result.whatsapp);
          } else {
            successMsg += `\n\n📱 WhatsApp Notification: GAGAL ⚠️`;
            successMsg += `\n   ${result.whatsapp.message}`;
            console.warn('[VERIFIKASI] WhatsApp failed:', result.whatsapp);
          }
        } else if (status.toUpperCase() === 'DITERIMA') {
          // Status diterima but no WhatsApp info (API token not configured)
          successMsg += `\n\n📱 WhatsApp: Tidak dikonfigurasi (set WHATSAPP_API_TOKEN di Vercel)`;
          console.warn('[VERIFIKASI] WhatsApp not configured');
        }
        
        alert(successMsg);
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
      
      // Show loading notification
      console.log('⏳ Generating ZIP file...');
      alert('⏳ Memproses pembuatan ZIP semua berkas...\nProses ini mungkin memakan waktu. Mohon tunggu dan jangan tutup halaman ini.');
      
      // Fetch ZIP generation endpoint
      console.log('[ZIP] Requesting:', url);
      const response = await fetch(url);
      const result = await response.json();
      
      console.log('[ZIP] Response:', result);
      
      if (!result.ok || !result.download_url) {
        throw new Error(result.error || result.message || 'Gagal membuat file ZIP');
      }
      
      // Success - redirect to download URL
      console.log('✓ ZIP ready:', result.filename, `(${result.size_mb} MB)`);
      console.log('✓ Total files:', result.success_count, '/', result.total_files);
      console.log('✓ Download URL:', result.download_url);
      
      // Show success message
      alert(`✅ ${result.message}\n\n📦 File: ${result.filename}\n📊 Ukuran: ${result.size_mb} MB\n📁 Berhasil: ${result.success_count}/${result.total_files} file\n⏱️ Link berlaku: ${result.expires_in}\n\nDownload akan dimulai...`);
      
      // Redirect to signed download URL
      window.location.href = result.download_url;
      
      console.log('✓ ZIP download initiated via storage URL');
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('❌ Error: ' + error.message);
    }
  }
  window.downloadAllZip = downloadAllZip;

  /* =========================
     5) PEMBAYARAN
     ========================= */
  // Track if pembayaran has been loaded at least once
  let pembayaranLoadedOnce = false;
  
  async function loadPembayaran() {
    try {
      console.log('[PEMBAYARAN] 💳 Loading payment data...');
      
      // Show loading state
      const tbody = $("#pembayaranTableBody");
      if (tbody && !pembayaranLoadedOnce) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Memuat data pembayaran...</td></tr>';
      }
      
      const r = await fetch("/api/pembayaran_list");
      const result = await r.json();
      
      pembayaranLoadedOnce = true;
      console.log('[PEMBAYARAN] ✅ Data loaded:', result.data?.length || 0, 'items');
      
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
PONDOK PESANTREN AL IKHSAN BEJI`
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
   * Load gelombang data from API endpoint and render forms
   */
  async function loadGelombangData(forceRefresh = false) {
    const container = document.getElementById('gelombangContainer');
    if (!container) {
      console.error('[GELOMBANG] ❌ Container #gelombangContainer not found!');
      return;
    }
    
    console.log('[GELOMBANG] ========================================');
    console.log('[GELOMBANG] 📊 Loading gelombang data', forceRefresh ? '(FORCE REFRESH)' : '(normal load)');
    console.log('[GELOMBANG] ========================================');
    
    // Show loading state
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Memuat...</span>
        </div>
        <p class="text-muted mt-3"><i class="bi bi-arrow-repeat"></i> ${forceRefresh ? 'Memperbarui' : 'Memuat'} data gelombang...</p>
      </div>
    `;
    
    try {
      // Fetch gelombang data from API endpoint
      const cacheBuster = forceRefresh ? `?_t=${Date.now()}` : '';
      const url = `/api/get_gelombang_list${cacheBuster}`;
      
      console.log('[GELOMBANG] Step 1: Fetching from', url);
      const response = await fetch(url);
      
      console.log('[GELOMBANG] Step 2: Response received');
      console.log('[GELOMBANG]   → Status:', response.status, response.statusText);
      console.log('[GELOMBANG]   → Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GELOMBANG] ❌ HTTP Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[GELOMBANG] Step 3: JSON parsed successfully');
      console.log('[GELOMBANG]   → Result:', result);
      
      if (!result.ok) {
        console.error('[GELOMBANG] ❌ API returned ok=false');
        throw new Error(result.error || 'API returned ok=false');
      }
      
      if (!result.data || !Array.isArray(result.data)) {
        console.error('[GELOMBANG] ❌ Invalid data format:', result);
        throw new Error('Invalid data format: expected array');
      }
      
      if (result.data.length === 0) {
        console.warn('[GELOMBANG] ⚠️ No gelombang data found');
        throw new Error('No gelombang data found in database');
      }
      
      console.log('[GELOMBANG] Step 4: Data validation passed');
      console.log('[GELOMBANG]   → Count:', result.data.length, 'gelombang');
      console.log('[GELOMBANG]   → Data:');
      console.table(result.data);
      
      // Count active gelombang
      const activeCount = result.data.filter(g => g.is_active === true).length;
      console.log('[GELOMBANG]   → Active count:', activeCount);
      
      if (activeCount === 0) {
        console.warn('[GELOMBANG] ⚠️ WARNING: No active gelombang!');
      } else if (activeCount > 1) {
        console.error('[GELOMBANG] ❌ ERROR: Multiple active gelombang!', activeCount);
      } else {
        const activeGelombang = result.data.find(g => g.is_active === true);
        console.log('[GELOMBANG]   ✅ Active:', activeGelombang.nama, '(ID', activeGelombang.id + ')');
      }
      
      console.log('[GELOMBANG] Step 5: Storing data and rendering...');
      currentGelombangData = result.data;
      renderGelombangForms(result.data);
      
      console.log('[GELOMBANG] ========================================');
      console.log('[GELOMBANG] ✅ SUCCESS: Data loaded and rendered!');
      console.log('[GELOMBANG] ========================================');
      
    } catch (error) {
      console.log('[GELOMBANG] ========================================');
      console.error('[GELOMBANG] ❌ ERROR loading data:', error);
      console.error('[GELOMBANG] ❌ Error message:', error.message);
      console.error('[GELOMBANG] ❌ Error stack:', error.stack);
      console.log('[GELOMBANG] ========================================');
      
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i> 
          <strong>Gagal memuat data gelombang:</strong> ${error.message}
          <hr>
          <p class="mb-2"><small>Buka Console (F12) untuk detail error.</small></p>
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
    if (!container) {
      console.error('[GELOMBANG] ❌ renderGelombangForms: Container not found!');
      return;
    }
    
    console.log('[GELOMBANG] ----------------------------------------');
    console.log('[GELOMBANG] 🎨 RENDERING gelombang forms');
    console.log('[GELOMBANG] ----------------------------------------');
    console.log('[GELOMBANG] Input data:', gelombangList);
    
    if (!gelombangList || gelombangList.length === 0) {
      console.error('[GELOMBANG] ❌ No data to render!');
      container.innerHTML = '<div class="alert alert-warning">Tidak ada data gelombang</div>';
      return;
    }
    
    const formsHTML = gelombangList.map((gelombang, index) => {
      // Use is_active from database as source of truth
      const isActive = gelombang.is_active === true;
      
      // Map is_active to UI colors
      let statusColor, statusBadge, borderColor, buttonHTML;
      
      if (isActive) {
        statusColor = 'success';  // Green
        statusBadge = 'Aktif';
        borderColor = 'success';
        buttonHTML = `
          <button type="button" class="btn btn-secondary btn-sm" disabled>
            <i class="bi bi-check-circle-fill"></i> Gelombang Aktif
          </button>
        `;
      } else {
        statusColor = 'secondary'; // Gray
        statusBadge = 'Ditutup';
        borderColor = 'secondary';
        buttonHTML = `
          <button type="button" class="btn btn-success btn-sm" onclick="setGelombangActive(${gelombang.id})">
            <i class="bi bi-check-circle"></i> Jadikan Aktif
          </button>
        `;
      }
      
      console.log(`[GELOMBANG] ${gelombang.nama}:`, {
        id: gelombang.id,
        is_active: isActive,
        badge: statusBadge,
        borderColor: borderColor,
        button: isActive ? 'DISABLED (Aktif)' : 'ENABLED (Jadikan Aktif)'
      });
      
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
              ${buttonHTML}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    console.log('[GELOMBANG] Setting container.innerHTML with', gelombangList.length, 'forms');
    container.innerHTML = formsHTML;
    
    console.log('[GELOMBANG] ----------------------------------------');
    console.log('[GELOMBANG] ✅ RENDER COMPLETE!');
    console.log('[GELOMBANG] ----------------------------------------');
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
      if (typeof toastr !== 'undefined' && toastr.error) {
        toastr.error('Semua field harus diisi!');
      } else {
        alert('Semua field harus diisi!');
      }
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      if (typeof toastr !== 'undefined' && toastr.error) {
        toastr.error('Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir!');
      } else {
        alert('Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir!');
      }
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
      if (typeof toastr !== 'undefined' && toastr.success) {
        toastr.success('✓ Perubahan berhasil disimpan!');
      }
      
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
      if (typeof toastr !== 'undefined' && toastr.error) {
        toastr.error(`✗ Gagal menyimpan: ${error.message}`);
      } else {
        alert(`✗ Gagal menyimpan: ${error.message}`);
      }
      
      // Restore button
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  }
  window.updateGelombang = updateGelombang;

  /**
   * Set gelombang as active using API endpoint
   * INSTANT UI UPDATE: Button langsung berubah tanpa delay
   */
  async function setGelombangActive(id) {
    // Ensure ID is a number (convert from string if needed)
    id = parseInt(id, 10);
    
    // Validation
    if (!id || isNaN(id)) {
      console.error('[GELOMBANG] ❌ Invalid ID:', id);
      alert('Error: ID gelombang tidak valid');
      return;
    }
    
    // Confirmation dialog
    if (!confirm(`Jadikan Gelombang ${id} aktif?\n\nGelombang lain akan otomatis dinonaktifkan.`)) {
      console.log('[GELOMBANG] ⏹️ User cancelled activation');
      return;
    }
    
    console.log('[GELOMBANG] ========================================');
    console.log('[GELOMBANG] 🚀 START: Activating Gelombang', id);
    console.log('[GELOMBANG] ========================================');
    
    // Show loading overlay to prevent multiple clicks
    const container = document.getElementById('gelombangContainer');
    const originalContent = container ? container.innerHTML : '';
    if (container) {
      container.style.opacity = '0.6';
      container.style.pointerEvents = 'none';
    }
    
    try {
      console.log('[GELOMBANG] Step 1: Calling API /api/set_gelombang_active');
      console.log('[GELOMBANG]   → Request payload:', { id: id });
      
      // Call API endpoint to set gelombang active
      const response = await fetch('/api/set_gelombang_active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id })
      });
      
      console.log('[GELOMBANG]   → Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GELOMBANG] ❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[GELOMBANG] Step 2: API Response received:', result);
      
      // Check if result has proper structure
      if (result.ok === false) {
        console.error('[GELOMBANG] ❌ API returned ok=false:', result);
        throw new Error(result.error || result.message || 'Failed to activate gelombang');
      }
      
      // SUCCESS: If result.ok is true OR if response.ok is true (backend succeeded)
      console.log('[GELOMBANG] ✅ Step 2 SUCCESS - API call completed');
      console.log('[GELOMBANG]   → Activated:', result.data || result);
      
      // Step 3: Broadcast to other tabs via localStorage
      console.log('[GELOMBANG] Step 3: Broadcasting to other tabs via localStorage');
      const updatePayload = {
        timestamp: Date.now(),
        activeId: id,
        action: 'gelombang_activated',
        source: 'admin'
      };
      
      // Remove old value first (ensures storage event fires in other tabs)
      localStorage.removeItem('gelombang_update');
      
      // Wait a bit then set new value
      await new Promise(resolve => setTimeout(resolve, 50));
      localStorage.setItem('gelombang_update', JSON.stringify(updatePayload));
      console.log('[GELOMBANG]   ✅ Broadcast sent:', updatePayload);
      
      // Step 4: Trigger custom event for same-window sync
      console.log('[GELOMBANG] Step 4: Dispatching custom event');
      window.dispatchEvent(new CustomEvent('gelombangUpdated', { 
        detail: updatePayload 
      }));
      console.log('[GELOMBANG]   ✅ Custom event dispatched');
      
      // Step 5: RELOAD data from database to ensure UI is accurate
      console.log('[GELOMBANG] Step 5: Reloading data from database (force refresh)');
      console.log('[GELOMBANG]   → Calling loadGelombangData(true)...');
      
      try {
        await loadGelombangData(true);
        console.log('[GELOMBANG]   ✅ Data reloaded successfully');
        
        // Verify UI was updated
        const updatedContainer = document.getElementById('gelombangContainer');
        if (updatedContainer) {
          console.log('[GELOMBANG]   → Container content length:', updatedContainer.innerHTML.length);
          console.log('[GELOMBANG]   → Container has gelombang cards:', updatedContainer.querySelectorAll('.card').length);
        }
      } catch (reloadError) {
        console.error('[GELOMBANG]   ❌ Failed to reload data:', reloadError);
        throw reloadError; // Re-throw to trigger error handling
      }
      
      console.log('[GELOMBANG] ========================================');
      console.log('[GELOMBANG] ✅ SUCCESS: Gelombang', id, 'is now ACTIVE');
      console.log('[GELOMBANG] ========================================');
      
      // Restore container interaction (loadGelombangData will update content)
      if (container) {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
      }
      
      // Optional: success notification (disabled to avoid third-party issues)
      // Intentionally no toast/alert to keep UX quiet and avoid library errors
      
      // No need for location.reload() - loadGelombangData(true) already refreshed the UI
      console.log('[GELOMBANG] ✅ UI updated successfully - staying on Gelombang tab');
      
      // Final verification - check if UI actually updated
      setTimeout(() => {
        const finalContainer = document.getElementById('gelombangContainer');
        if (finalContainer) {
          const activeCards = finalContainer.querySelectorAll('.border-success');
          const inactiveCards = finalContainer.querySelectorAll('.border-secondary');
          console.log('[GELOMBANG] 🔍 Final verification:');
          console.log('[GELOMBANG]   → Active cards (green border):', activeCards.length);
          console.log('[GELOMBANG]   → Inactive cards (gray border):', inactiveCards.length);
          
          if (activeCards.length === 1) {
            console.log('[GELOMBANG] ✅ UI refresh successful - exactly 1 active gelombang');
          } else {
            console.warn('[GELOMBANG] ⚠️ UI refresh may have failed - unexpected active count:', activeCards.length);
          }
        }
      }, 1000);
      
      // Enforce a secondary refresh to be extra safe
      setTimeout(async () => {
        try {
          await loadGelombangData(true);
          console.log('[GELOMBANG] 🔁 Forced secondary refresh (success path) completed');
        } catch (e2) {
          console.warn('[GELOMBANG] ⚠️ Secondary refresh (success path) failed');
        }
      }, 800);
      
    } catch (error) {
      console.log('[GELOMBANG] ========================================');
      console.error('[GELOMBANG] ❌ ERROR during activation:', error);
      console.error('[GELOMBANG] ❌ Error message:', error.message);
      console.error('[GELOMBANG] ❌ Error stack:', error.stack);
      console.log('[GELOMBANG] ========================================');
      
      // Restore container interaction on error
      if (container) {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
      }
      
      // Silent mode: do not show error toast/alert; rely on auto-refresh fallback
      
      // Rollback: Force reload from database
      console.log('[GELOMBANG] 🔄 Rollback: Reloading data from database...');
      try {
        await loadGelombangData(true);
        console.log('[GELOMBANG]   ✅ Rollback complete');
      } catch (rollbackError) {
        console.error('[GELOMBANG]   ❌ Rollback failed:', rollbackError);
        
        // Last resort: manual page refresh
        console.log('[GELOMBANG] 🔄 Last resort: Manual page refresh in 1.5 seconds...');
        setTimeout(() => {
          console.log('[GELOMBANG] 🔄 Refreshing page...');
          location.reload();
        }, 1500);
      }
      
      // Enforce a second refresh attempt to make sure UI updates
      setTimeout(async () => {
        try {
          await loadGelombangData(true);
          console.log('[GELOMBANG] 🔁 Forced secondary refresh completed');
        } catch (e2) {
          console.warn('[GELOMBANG] ⚠️ Secondary refresh failed');
        }
      }, 800);
    }
  }
  
  /**
   * Helper: Extract gelombang ID from card element
   */
  function extractIdFromCard(card) {
    const button = card.querySelector('button[onclick*="setGelombangActive"]');
    if (button) {
      const match = button.getAttribute('onclick').match(/setGelombangActive\((\d+)\)/);
      return match ? parseInt(match[1], 10) : null;
    }
    return null;
  }
  
  // Expose gelombang functions
  window.loadGelombangData = loadGelombangData;
  window.setGelombangActive = setGelombangActive;

  /* =========================
     8) INIT
     ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[ADMIN] 🚀 Page loaded - initializing...");
    
    // ✅ ONLY load active tab (pendaftar)
    // Other tabs will lazy-load when clicked via switchTab()
    console.log("[ADMIN] 📊 Loading initial data: Pendaftar only");
    loadPendaftar();
    
    // ❌ REMOVED: loadPembayaran() - will lazy load on tab switch
    console.log("[ADMIN] ✅ Initial load complete (lazy loading enabled for other tabs)");
  });
})();
