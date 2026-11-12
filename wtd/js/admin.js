/* ==========================================================
   Supabase Administration and local demo mode
   D.S. Senanayake Central College, Mirigama
   The database enforces authorization and records the audit trail.
   ========================================================== */

(function () {
  "use strict";

  const cfg = window.DSCC_CONFIG || {};
  const pageType = document.body.getAttribute("data-admin-page");
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const EDITOR_SESSION_LIMIT = 60 * 60 * 1000;
  let currentSession = null;

  /* ---------- DOM Creation Helper ---------- */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    let pendingValue;
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "value") pendingValue = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach((c) => {
      if (c == null || c === false) return;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    if (pendingValue !== undefined) el.value = pendingValue;
    return el;
  }

  /* ---------- Notification Toast ---------- */
  let toastTimer;
  function toast(msg, kind) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = (kind === "error" ? "⚠️ " : "✓ ") + msg;
    t.className = "show" + (kind === "error" ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ""; }, 4000);
  }

  /* ---------- Seed Sample Data for Local / Demo Mode ---------- */
  const DEFAULT_DATA = {
    news: [
      {
        id: "news-1",
        title: "Annual Inter-House Athletic Championship 2026",
        summary: "Athletes from Senanayake, Jayathilake, Gemunu, and Parakrama houses competed with fierce athletic prowess.",
        body: "The Annual Inter-House Athletic Championship of D.S. Senanayake Central College concluded in grand style at the college grounds. Senanayake House emerged as overall champions following thrilling track and field events.",
        status: "published",
        published_at: "2026-03-24T09:00:00Z",
        updated_at: "2026-03-24T14:30:00Z"
      },
      {
        id: "news-2",
        title: "Outstanding G.C.E. Advanced Level Academic Results",
        summary: "Our students have once again achieved stellar performance in the Science, Commerce, and Arts streams.",
        body: "D.S. Senanayake Central College students achieved remarkable results in the latest G.C.E. A/L examinations, securing numerous university entrance qualifications with high island rankings in Mathematics and Bio Science.",
        status: "published",
        published_at: "2026-03-15T08:00:00Z",
        updated_at: "2026-03-15T11:00:00Z"
      },
      {
        id: "news-3",
        title: "National Cadeting Platoon Advances to All-Island Finals",
        summary: "The College Cadet Platoon (6th NCC Battalion) demonstrated unparalleled discipline and precision drill.",
        body: "Continuing a glorious military tradition, the college senior cadet platoon qualified for the prestigious Herman Loos all-island assessment camp finals after a dominant performance at battalion drill competitions.",
        status: "published",
        published_at: "2026-03-02T10:00:00Z",
        updated_at: "2026-03-02T12:00:00Z"
      },
      {
        id: "news-4",
        title: "College ICT Society Launches Robotics & Artificial Intelligence Guild",
        summary: "A cutting-edge initiative introducing students from Grade 7-12 to modern robotics, coding, and problem-solving.",
        body: "The newly renovated Innovation & Robotics Lab was inaugurated by the Principal, providing young Senanayakeans access to microcontrollers, 3D modelling, and computer programming.",
        status: "draft",
        published_at: null,
        updated_at: "2026-03-28T16:00:00Z"
      }
    ],
    announcements: [
      {
        id: "ann-1",
        title: "Admissions Open for Grade 6 & Advanced Level (2026/2027)",
        body: "Prospectuses and application guidelines are now available at the administrative secretariat during regular office hours.",
        priority: "Notice",
        status: "active",
        created_at: "2026-03-20T08:30:00Z",
        updated_at: "2026-03-20T08:30:00Z"
      },
      {
        id: "ann-2",
        title: "Term 1 Final Examination Schedule Released",
        body: "Parents and students are requested to consult the academic timetable portal for exact dates and hall allocations.",
        priority: "Important",
        status: "archived",
        created_at: "2026-02-15T10:00:00Z",
        updated_at: "2026-03-01T10:00:00Z"
      }
    ],
    gallery: [
      {
        id: "gal-1",
        category: "Campus",
        caption: "Main Academic Building & College Hall",
        media_type: "image",
        image_url: "../images/school/main-hall.jpg",
        sort_order: 0,
        updated_at: "2026-03-01T08:00:00Z"
      },
      {
        id: "gal-2",
        category: "Sports",
        caption: "College 1st XI Cricket Team in Action",
        media_type: "image",
        image_url: "../images/gallery/gallery-1.jpg",
        sort_order: 1,
        updated_at: "2026-03-05T09:00:00Z"
      },
      {
        id: "gal-3",
        category: "Cadets",
        caption: "Senior Cadet Platoon Ceremonial Parade",
        media_type: "image",
        image_url: "../images/gallery/gallery-2.jpg",
        sort_order: 2,
        updated_at: "2026-03-10T11:00:00Z"
      },
      {
        id: "gal-4",
        category: "Clubs",
        caption: "Science & Innovation Annual Exhibition",
        media_type: "image",
        image_url: "../images/gallery/gallery-3.jpg",
        sort_order: 3,
        updated_at: "2026-03-12T14:00:00Z"
      },
      {
        id: "gal-5",
        category: "Awards",
        caption: "Annual College Prize Giving Ceremony",
        media_type: "image",
        image_url: "../images/gallery/gallery-4.jpg",
        sort_order: 4,
        updated_at: "2026-03-18T16:00:00Z"
      },
      {
        id: "gal-6",
        category: "Heritage",
        caption: "Founders' Commemoration Assembly",
        media_type: "image",
        image_url: "../images/gallery/gallery-5.jpg",
        sort_order: 5,
        updated_at: "2026-03-22T10:00:00Z"
      }
    ],
    activities: [
      {
        id: "act-1",
        title: "First XI Cricket Team",
        category: "Sports",
        description: "Representing D.S. Senanayake Central College in Division I inter-school tournaments with legendary pride.",
        status: "published",
        updated_at: "2026-03-12T10:00:00Z"
      },
      {
        id: "act-2",
        title: "Senior Cadet Platoon (6th NCC Bn)",
        category: "Clubs",
        description: "Exemplifying military discipline, drill precision, and national leadership training.",
        status: "published",
        updated_at: "2026-03-14T11:00:00Z"
      },
      {
        id: "act-3",
        title: "College Western Brass Band",
        category: "Societies",
        description: "Providing musical splendour at state and college ceremonial pageants.",
        status: "published",
        updated_at: "2026-03-16T12:00:00Z"
      },
      {
        id: "act-4",
        title: "Buddhist Society & Dhamma Guild",
        category: "Societies",
        description: "Cultivating mindfulness, spiritual values, and moral rectitude among all students.",
        status: "published",
        updated_at: "2026-03-18T09:00:00Z"
      }
    ],
    users: [
      {
        id: "usr-1",
        email: "admin@dssenanayake.lk",
        full_name: "Dr. R. M. Senanayake (Principal)",
        role: "main_admin",
        active: true
      },
      {
        id: "usr-2",
        email: "viceprincipal@dssenanayake.lk",
        full_name: "Mrs. K. Jayathilake (Vice Principal)",
        role: "main_admin",
        active: true
      },
      {
        id: "usr-3",
        email: "editor@dssenanayake.lk",
        full_name: "Mr. S. Perera (Web Coordinator)",
        role: "editor",
        active: true
      }
    ],
    audit: [
      {
        id: "aud-1",
        user_email: "admin@dssenanayake.lk",
        action: "published",
        table_name: "news",
        title: "Annual Inter-House Athletic Championship 2026",
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: "aud-2",
        user_email: "admin@dssenanayake.lk",
        action: "updated",
        table_name: "announcements",
        title: "Admissions Open for Grade 6 & Advanced Level",
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: "aud-3",
        user_email: "editor@dssenanayake.lk",
        action: "uploaded",
        table_name: "gallery",
        title: "Founders' Commemoration Assembly",
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  };

  function getLocal(key) {
    try {
      const raw = localStorage.getItem("dscc_" + key);
      if (raw == null) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new TypeError("Expected an array.");
      return parsed;
    } catch (error) {
      console.error("Invalid local data for " + key + ".", error);
      toast("Saved " + key + " data is invalid. No changes were made.", "error");
      throw new Error("Could not read saved " + key + " data.");
    }
  }

  function setLocal(key, val) {
    if (currentSession && currentSession.role === "editor" &&
        Date.now() - currentSession.signedInAt >= EDITOR_SESSION_LIMIT) {
      signOutAndReturn("Your one-hour editor session has ended.");
      return false;
    }
    try {
      localStorage.setItem("dscc_" + key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.error("Could not save " + key + " data.", e);
      toast("Could not save " + key + " data. Check available browser storage.", "error");
      return false;
    }
  }

  function initializeDemoData() {
    try {
      for (const [key, value] of Object.entries({ ...DEFAULT_DATA, page_content: [] })) {
        const storageKey = "dscc_" + key;
        if (localStorage.getItem(storageKey) === null && !setLocal(key, value)) return false;
      }
      return true;
    } catch (error) {
      console.error("Could not initialize local demo data.", error);
      toast("Demo data could not be initialized in this browser.", "error");
      return false;
    }
  }

  async function saveChange(key, value, action, title) {
    if (currentSession && currentSession.role === "editor" &&
        Date.now() - currentSession.signedInAt >= EDITOR_SESSION_LIMIT) {
      signOutAndReturn("Your one-hour editor session has ended.");
      return false;
    }
    let previous;
    if (!sb) {
      if (!setLocal(key, value)) return false;
      try {
        const audit = getLocal("audit");
        audit.unshift({
          id: "demo-audit-" + Date.now(),
          user_email: currentSession.email,
          action: action || "updated",
          table_name: key,
          title: title || "",
          created_at: new Date().toISOString()
        });
        if (!setLocal("audit", audit)) {
          toast("The change was saved locally, but the activity feed could not be updated.", "error");
        }
      } catch (error) {
        console.error("Could not update the local demo activity feed.", error);
      }
      return true;
    }
    try {
      previous = getLocal(key);
      await syncCloudChange(key, previous, value);
    } catch (error) {
      console.error("Could not save " + key + " to Supabase.", error);
      toast("Could not " + (action || "save") + (title ? " “" + title + "”" : "") + ": " + (error.message || "Supabase request failed."), "error");
      return false;
    }
    if (!setLocal(key, value)) {
      toast("The change was saved to Supabase, but this browser could not update its cache.", "error");
      return false;
    }
    try {
      const { data, error } = await sb.from("audit_log")
        .select("id,user_email,action,table_name,details,created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      const audit = data.map((entry) => ({
        id: entry.id,
        user_email: entry.user_email || "Staff",
        action: entry.action.toLowerCase(),
        table_name: entry.table_name,
        title: entry.details && entry.details.title || "",
        created_at: entry.created_at
      }));
      if (!setLocal("audit", audit)) {
        setTimeout(() => toast("The database audit entry is safe, but its local cache could not be refreshed.", "error"), 100);
      }
    } catch (error) {
      console.error("Could not refresh the database audit log.", error);
      toast("Saved successfully, but the audit log could not be refreshed.", "error");
    }
    return true;
  }

  /* ---------- Session Helpers ---------- */
  function getSession() {
    try {
      const s = localStorage.getItem("dscc_admin_session");
      return s ? JSON.parse(s) : null;
    } catch (error) {
      console.error("Could not read the saved staff session.", error);
      return null;
    }
  }

  function setSession(user) {
    try {
      localStorage.setItem("dscc_admin_session", JSON.stringify(user));
      return true;
    } catch (error) {
      console.error("Could not save the admin session.", error);
      return false;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem("dscc_admin_session");
    } catch (error) {
      console.error("Could not clear the saved staff session.", error);
    }
  }

  function clearAdminCache() {
    ["news", "announcements", "activities", "gallery", "page_content", "audit", "users"].forEach((key) => {
      try {
        localStorage.removeItem("dscc_" + key);
      } catch (error) {
        console.error("Could not clear cached " + key + " data.", error);
      }
    });
  }

  /* Supabase Client setup if available */
  const hasSupabase = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const sb = hasSupabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  }) : null;

  async function loadCloudData(isMain) {
    const queries = [
      ["news", sb.from("news").select("*").order("created_at", { ascending: false })],
      ["announcements", sb.from("announcements").select("*").order("created_at", { ascending: false })],
      ["activities", sb.from("activities").select("*").order("created_at", { ascending: false })],
      ["gallery", sb.from("gallery_items").select("*").order("sort_order", { ascending: true })],
      ["page_content", sb.from("page_content").select("*").order("page", { ascending: true })],
      ["audit", sb.from("audit_log").select("id,user_email,action,table_name,details,created_at").order("created_at", { ascending: false }).limit(100)]
    ];
    if (isMain) queries.push(["users", sb.from("profiles").select("id,email,full_name,role,active").order("created_at", { ascending: true })]);
    const results = await Promise.all(queries.map(async ([key, query]) => {
      const { data, error } = await query;
      if (error) throw error;
      return [key, data || []];
    }));
    results.forEach(([key, rows]) => {
      const normalized = key === "audit" ? rows.map((entry) => ({
        id: entry.id,
        user_email: entry.user_email || "Staff",
        action: entry.action.toLowerCase(),
        table_name: entry.table_name,
        title: entry.details && entry.details.title || "",
        created_at: entry.created_at
      })) : rows;
      if (!setLocal(key, normalized)) throw new Error("Could not cache " + key + " data in this browser.");
    });
  }

  function cloudRecord(key, row) {
    if (key === "news") {
      return { title: row.title, summary: row.summary, body: row.body, status: row.status, published_at: row.published_at };
    }
    if (key === "announcements") {
      return { title: row.title, body: row.body, priority: row.priority || "Notice", status: row.status };
    }
    if (key === "activities") {
      return { title: row.title, category: row.category, description: row.description, status: row.status };
    }
    if (key === "gallery") {
      const imageUrl = row.image_url ? new URL(row.image_url, location.href).href : null;
      if (row.media_type === "image" && (!imageUrl || !/^https:\/\//i.test(imageUrl))) {
        throw new Error("Gallery images must use an https:// URL.");
      }
      return { category: row.category, caption: row.caption, media_type: row.media_type, image_url: imageUrl, video_url: row.video_url || null, sort_order: row.sort_order };
    }
    if (key === "page_content") {
      return { key: row.key, page: row.page, label: row.label, value: row.value };
    }
    if (key === "users") {
      return { role: row.role, active: row.active };
    }
    throw new Error("Unsupported data set: " + key);
  }

  async function syncCloudChange(key, previous, next) {
    if (!sb) throw new Error("Supabase is not configured.");
    const table = key === "gallery" ? "gallery_items" : key === "users" ? "profiles" : key;
    if (key === "page_content") {
      for (const row of next) {
        const old = previous.find((item) => item.key === row.key);
        const payload = cloudRecord(key, row);
        if (!old || old.value !== row.value) {
          const { error } = await sb.from(table).update({ value: payload.value }).eq("key", row.key);
          if (error) throw error;
        }
      }
      return;
    }
    if (key === "users") {
      for (const row of next) {
        const old = previous.find((item) => item.id === row.id);
        if (!old || (old.role === row.role && old.active === row.active)) continue;
        const { error } = await sb.from(table).update(cloudRecord(key, row)).eq("id", row.id);
        if (error) throw error;
      }
      return;
    }

    const rowsById = new Map(previous.map((row) => [row.id, row]));
    const retainedIds = new Set();
    for (const row of next) {
      const old = rowsById.get(row.id);
      const payload = cloudRecord(key, row);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id || "");
      if (old && isUuid) {
        retainedIds.add(row.id);
        if (JSON.stringify(cloudRecord(key, old)) !== JSON.stringify(payload)) {
          const { error } = await sb.from(table).update(payload).eq("id", row.id);
          if (error) throw error;
        }
      } else {
        const { data, error } = await sb.from(table).insert(payload).select("id").single();
        if (error) throw error;
        row.id = data.id;
        retainedIds.add(row.id);
      }
    }
    for (const row of previous) {
      if (row.id && !retainedIds.has(row.id)) {
        const { error } = await sb.from(table).delete().eq("id", row.id);
        if (error) throw error;
      }
    }
  }

  async function signOutAndReturn(message) {
    clearSession();
    if (sb) {
      clearAdminCache();
      try {
        const { error } = await sb.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error("Could not complete server sign out.", error);
      }
    }
    if (message) toast(message, "error");
    location.replace("login.html");
  }

  /* Run page controllers */
  if (pageType === "login") initLogin();
  else if (pageType === "dashboard") initDashboard();

  /* =====================================================================
     LOGIN CONTROLLER
     ===================================================================== */
  function initLogin() {
    const signinForm = $("#signin-form");
    const forgotForm = $("#forgot-form");
    const resetForm = $("#reset-form");
    const msg = $("#login-msg");
    const loginIdentifier = $("#email");
    if (sb) {
      $("#auth-mode-pill").textContent = "Secure Login";
      $("#login-description").textContent = "For school administrators, principals, and academic editors. Sign-in requires an active staff account.";
      $("#login-identifier-label").textContent = "Work Email";
      loginIdentifier.type = "email";
      loginIdentifier.placeholder = "name@school.lk";
    } else {
      $("#auth-mode-pill").textContent = "Demo Mode";
      $("#login-identifier-label").textContent = "Username";
      loginIdentifier.placeholder = "Enter username";
      $("#login-description").textContent = "Local demo only — this browser-only login is not secure and must not be used on a public website.";
      $("#to-forgot").closest(".login-links").hidden = true;
      forgotForm.hidden = true;
      resetForm.hidden = true;
    }
    function say(text, kind) {
      if (!msg) return;
      msg.textContent = text;
      msg.className = "form-msg " + (kind || "");
    }

    function showForm(name) {
      if (signinForm) signinForm.hidden = name !== "signin";
      if (forgotForm) forgotForm.hidden = name !== "forgot";
      if (resetForm) resetForm.hidden = name !== "reset";
      say("");
    }

    // Toggle forms
    $("#to-forgot")?.addEventListener("click", (e) => { e.preventDefault(); showForm("forgot"); $("#forgot-email")?.focus(); });
    $("#to-signin")?.addEventListener("click", (e) => { e.preventDefault(); showForm("signin"); $("#email")?.focus(); });

    // Standard Sign In Form Submit
    if (signinForm) {
      signinForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = ($("#email").value || "").trim().toLowerCase();
        const password = $("#password").value || "";
        const submitBtn = $("#btn-submit-login");

        if (!email || !password) {
          say("Please provide both required fields.", "error");
          return;
        }

        submitBtn.disabled = true;
        say(sb ? "Verifying credentials…" : "Checking demo credentials…");
        if (!sb) {
          if (email !== "malith" || password !== "malith123") {
            say("Incorrect username or password.", "error");
            submitBtn.disabled = false;
            return;
          }
          const signedInAt = Date.now();
          if (!setSession({
            id: "demo-admin",
            email: "malith",
            full_name: "Malith",
            role: "main_admin",
            signedInAt,
            demo: true
          })) {
            say("Could not save the demo session in this browser.", "error");
            submitBtn.disabled = false;
            return;
          }
          location.replace("dashboard.html");
          return;
        }

        try {
          const { data, error } = await sb.auth.signInWithPassword({ email, password });
          if (error || !data.user) throw error || new Error("Authentication failed.");
          const { data: profile, error: profileError } = await sb.from("profiles")
            .select("id,email,full_name,role,active")
            .eq("id", data.user.id)
            .maybeSingle();
          if (profileError) throw profileError;
          if (!profile || !profile.active || !["main_admin", "editor"].includes(profile.role)) {
            await sb.auth.signOut();
            say("This account is not active for staff access. Contact a main administrator.", "error");
            return;
          }
          const signedInAt = Date.now();
          if (!setSession({ id: profile.id, email: profile.email || data.user.email, full_name: profile.full_name, role: profile.role, signedInAt })) {
            await sb.auth.signOut();
            say("Could not save the sign-in session in this browser.", "error");
            return;
          }
          location.replace("dashboard.html");
        } catch (error) {
          console.error("Staff sign-in failed.", error);
          say(error.message || "Sign-in failed. Check your credentials and try again.", "error");
        } finally {
          submitBtn.disabled = false;
        }
      });
    }

    // Forgot password handling
    if (forgotForm) {
      forgotForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = ($("#forgot-email").value || "").trim().toLowerCase();
        if (!sb) {
          say("Password recovery is unavailable until Supabase is configured.", "error");
          return;
        }
        try {
          const { error } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: new URL("login.html", location.href).href
          });
          if (error) throw error;
          say("If the account is registered, a password reset email has been sent.", "ok");
        } catch (error) {
          console.error("Password reset request failed.", error);
          say(error.message || "Could not request a password reset. Try again.", "error");
        }
      });
    }

    if (sb && location.hash.includes("type=recovery") && resetForm) showForm("reset");
    if (resetForm) {
      resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = $("#new-password").value;
        const confirmation = $("#new-password2").value;
        if (password.length < 12 || password !== confirmation) {
          say(password.length < 12 ? "Choose a password with at least 12 characters." : "The passwords do not match.", "error");
          return;
        }
        if (!sb) {
          say("Password updates are unavailable until Supabase is configured.", "error");
          return;
        }
        try {
          const { error } = await sb.auth.updateUser({ password });
          if (error) throw error;
          await sb.auth.signOut();
          clearSession();
          showForm("signin");
          say("Password updated. Sign in with your new password.", "ok");
        } catch (error) {
          console.error("Password update failed.", error);
          say(error.message || "Could not update the password. Try again.", "error");
        }
      });
    }
  }

  /* =====================================================================
     DASHBOARD CONTROLLER
     ===================================================================== */
  async function initDashboard() {
    const storedSession = getSession();
    let authData;
    let profile;
    if (sb) {
      try {
        const authResult = await sb.auth.getUser();
        if (authResult.error || !authResult.data.user) throw authResult.error || new Error("No signed-in user.");
        authData = authResult.data;
        const profileResult = await sb.from("profiles").select("id,email,full_name,role,active")
          .eq("id", authData.user.id).maybeSingle();
        if (profileResult.error) throw profileResult.error;
        profile = profileResult.data;
      } catch (error) {
        console.error("Could not verify the staff session.", error);
        signOutAndReturn("Your staff session could not be verified. Please sign in again.");
        return;
      }
    } else {
      if (!storedSession || storedSession.demo !== true || storedSession.id !== "demo-admin") {
        signOutAndReturn("Sign in to the local demo first.");
        return;
      }
      profile = {
        id: "demo-admin",
        email: "malith",
        full_name: "Malith",
        role: "main_admin",
        active: true
      };
      if (!initializeDemoData()) return;
    }
    if (!profile || !profile.active || !["main_admin", "editor"].includes(profile.role)) {
      signOutAndReturn("Your staff account is inactive or no longer authorized.");
      return;
    }
    const view = $("#view");
    const signedInAt = Number(storedSession && storedSession.signedInAt);
    if (profile.role === "editor" && (!Number.isFinite(signedInAt) || Date.now() - signedInAt >= EDITOR_SESSION_LIMIT)) {
      signOutAndReturn("Editor sessions are limited to one hour. Please sign in again.");
      return;
    }
    currentSession = {
      id: profile.id,
      email: profile.email || (authData && authData.user.email),
      full_name: profile.full_name,
      role: profile.role,
      signedInAt: signedInAt || Date.now(),
      demo: !sb
    };
    if (!setSession(currentSession)) {
      signOutAndReturn("Could not save the verified staff session.");
      return;
    }
    const isMain = profile.role === "main_admin";
    if (sb) {
      try {
        await loadCloudData(isMain);
      } catch (error) {
        console.error("Could not load dashboard data from Supabase.", error);
        view.replaceChildren(h("p", { class: "form-msg error", text: "Dashboard data could not be loaded: " + (error.message || "Supabase request failed.") }));
        return;
      }
    }
    if (profile.role === "editor") {
      setTimeout(() => signOutAndReturn("Your one-hour editor session has ended."), Math.max(0, signedInAt + EDITOR_SESSION_LIMIT - Date.now()));
    }
    const whoEmail = $("#who-name");
    const whoRole = $("#who-role");
    const whoAvatar = $("#who-avatar");
    const navUsers = $("#nav-users");
    if (whoEmail) whoEmail.textContent = currentSession.full_name || currentSession.email;
    if (whoRole) whoRole.textContent = isMain ? "Super Admin" : "Editor";
    if (whoAvatar) whoAvatar.textContent = (currentSession.full_name || currentSession.email).slice(0, 2).toUpperCase();
    const storageStatus = $("#storage-status-text");
    const systemStatus = $("#system-status-pill .status-label");
    if (storageStatus) storageStatus.textContent = sb ? "Supabase data + database audit log" : "Local browser demo data";
    if (systemStatus) systemStatus.textContent = sb ? "Connected" : "Demo mode";
    if (navUsers) navUsers.hidden = !isMain;

    // Sign out
    $("#logout")?.addEventListener("click", async () => {
      clearSession();
      if (sb) {
        clearAdminCache();
        try {
          const { error } = await sb.auth.signOut();
          if (error) throw error;
        } catch (error) {
          console.error("Sign out failed.", error);
          toast("Could not complete server sign out. Close this browser after leaving.", "error");
        }
      }
      toast("Signed out.");
      setTimeout(() => { location.replace("login.html"); }, 300);
    });

    // Mobile Navigation Menu Toggle
    const menuBtn = $("#menu-btn");
    const nav = $("#dash-nav");
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", () => {
        const open = !nav.classList.contains("is-open");
        nav.classList.toggle("is-open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
      });
    }

    /* ---------- Format helpers ---------- */
    const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently");

    function heading(title, sub) {
      return [
        h("h1", { text: title }),
        sub ? h("p", { class: "sub", text: sub }) : null
      ].filter(Boolean);
    }

    function statusBadge(val) {
      const isLive = val === "published" || val === "active";
      return h("span", { class: "badge " + (isLive ? "live" : "draft"), text: val });
    }

    function dataTable(cols, rows) {
      return h("div", { class: "table-wrap" },
        h("table", { class: "data-table" },
          h("thead", null, h("tr", null, cols.map((c) => h("th", { scope: "col", text: c })))),
          h("tbody", null, rows.length ? rows : [h("tr", null, h("td", { colspan: cols.length, class: "empty-state", text: "No records found." }))])
        )
      );
    }

    /* =====================================================================
       ROUTE: OVERVIEW
       ===================================================================== */
    function renderOverview() {
      const news = getLocal("news");
      const ann = getLocal("announcements");
      const gallery = getLocal("gallery");
      const act = getLocal("activities");
      const audit = getLocal("audit");

      const pubNews = news.filter((x) => x.status === "published").length;
      const actAnn = ann.filter((x) => x.status === "active").length;

      const statCards = h("div", { class: "stat-grid" },
        h("div", { class: "stat" },
          h("strong", { text: "3,520" }),
          h("span", { text: "Total Enrolled Students" }),
          h("span", { class: "stat-trend", text: "↑ +4.8% Academic Intake" })
        ),
        h("div", { class: "stat" },
          h("strong", { text: "182" }),
          h("span", { text: "Qualified Academic Faculty" }),
          h("span", { class: "stat-trend", text: "100% Certified Teachers" })
        ),
        h("div", { class: "stat" },
          h("strong", { text: String(pubNews) + " / " + String(news.length) }),
          h("span", { text: "Published News Stories" }),
          h("span", { class: "stat-trend", text: pubNews + " Active on Homepage" })
        ),
        h("div", { class: "stat" },
          h("strong", { text: String(gallery.length) }),
          h("span", { text: "Media & Gallery Assets" }),
          h("span", { class: "stat-trend", text: "6 Filter Albums" })
        )
      );

      const quickActions = h("div", { class: "quick-action-strip" },
        h("button", { class: "btn-action-tile", type: "button", text: "➕ Post New Article", onclick: () => { location.hash = "#news"; } }),
        h("button", { class: "btn-action-tile", type: "button", text: "📢 Urgent Notice Alert", onclick: () => { location.hash = "#announcements"; } }),
        h("button", { class: "btn-action-tile", type: "button", text: "🖼️ Add Photo to Gallery", onclick: () => { location.hash = "#gallery"; } }),
        h("button", { class: "btn-action-tile", type: "button", text: "🌐 Open Live Public Site", onclick: () => { window.open("../index.html", "_blank"); } })
      );

      const recentAudit = h("div", { class: "panel" },
        h("h2", { text: "Administrative Activity Feed" }),
        h("ul", { class: "changes" }, audit.slice(0, 6).map((a) => {
          return h("li", null,
            h("div", null,
              h("strong", { text: a.user_email }),
              h("span", { text: " " + a.action + " " + a.table_name + (a.title ? ": " + a.title : "") })
            ),
            h("time", { text: fmt(a.created_at) })
          );
        }))
      );

      view.replaceChildren(
        ...heading("Executive Dashboard", "System overview, student statistics, and site content manager."),
        quickActions,
        statCards,
        recentAudit
      );
    }

    /* =====================================================================
       ROUTE: NEWS MANAGER
       ===================================================================== */
    function renderNews() {
      const formHost = h("div");
      const listHost = h("div");

      function load() {
        const items = getLocal("news");
        const rows = items.map((row) => {
          return h("tr", null,
            h("td", null, h("strong", { text: row.title })),
            h("td", null, statusBadge(row.status)),
            h("td", { text: fmt(row.updated_at) }),
            h("td", null, h("div", { class: "row-actions" },
              h("button", { class: "btn btn-ghost btn-sm", type: "button", text: "Edit", onclick: () => openForm(row) }),
              h("button", { class: "btn btn-ghost btn-sm", type: "button", text: row.status === "published" ? "Unpublish" : "Publish",
                onclick: async () => {
                  row.status = row.status === "published" ? "draft" : "published";
                  row.updated_at = new Date().toISOString();
                  row.published_at = row.status === "published" ? new Date().toISOString() : null;
                  if (!await saveChange("news", items, row.status, row.title)) return;
                  toast("Status changed to " + row.status);
                  load();
                }
              }),
              isMain ? h("button", { class: "btn btn-danger btn-sm", type: "button", text: "Delete",
                onclick: async () => {
                  if (confirm("Delete article '" + row.title + "'?")) {
                    const next = items.filter((x) => x.id !== row.id);
                    if (!await saveChange("news", next, "deleted", row.title)) return;
                    toast("Article deleted");
                    load();
                  }
                }
              }) : null
            ))
          );
        });

        listHost.replaceChildren(dataTable(["Headline", "Status", "Last Modified", "Actions"], rows));
      }

      function openForm(row) {
        const titleInput = h("input", { id: "n-title", type: "text", required: true, maxlength: "200", value: row ? row.title : "", placeholder: "e.g. Annual Sports Championship 2026" });
        const summaryInput = h("textarea", { id: "n-sum", rows: 3, required: true, maxlength: "500", value: row ? row.summary : "", placeholder: "Short 2-line summary shown on the homepage news cards..." });
        const bodyInput = h("textarea", { id: "n-body", rows: 6, maxlength: "20000", value: row ? row.body : "", placeholder: "Full narrative or press release..." });
        const statusSelect = h("select", { id: "n-status" },
          h("option", { value: "published", text: "Published (Live on Website)" }),
          h("option", { value: "draft", text: "Draft (Internal Only)" })
        );
        if (row) statusSelect.value = row.status;

        const form = h("form", { class: "panel" },
          h("h2", { text: row ? "Edit News Story" : "Compose News Story" }),
          h("div", { class: "field" }, h("label", { for: "n-title", text: "Article Headline" }), titleInput),
          h("div", { class: "field" }, h("label", { for: "n-sum", text: "Homepage Card Summary" }), summaryInput),
          h("div", { class: "field" }, h("label", { for: "n-body", text: "Full Story / Details" }), bodyInput),
          h("div", { class: "field" }, h("label", { for: "n-status", text: "Publication Status" }), statusSelect),
          h("div", { class: "form-actions" },
            h("button", { class: "btn btn-primary", type: "submit", text: "Save Story" }),
            h("button", { class: "btn btn-ghost", type: "button", text: "Cancel", onclick: () => formHost.replaceChildren() })
          )
        );

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const items = getLocal("news");
          if (row) {
            const target = items.find((item) => item.id === row.id);
            if (!target) {
              toast("This story no longer exists. Reload the section and try again.", "error");
              return;
            }
            target.title = titleInput.value.trim();
            target.summary = summaryInput.value.trim();
            target.body = bodyInput.value.trim();
            target.status = statusSelect.value;
            target.published_at = target.status === "published" ? (target.published_at || new Date().toISOString()) : null;
            target.updated_at = new Date().toISOString();
          } else {
            const newItem = {
              id: "news-" + Date.now(),
              title: titleInput.value.trim(),
              summary: summaryInput.value.trim(),
              body: bodyInput.value.trim(),
              status: statusSelect.value,
              published_at: statusSelect.value === "published" ? new Date().toISOString() : null,
              updated_at: new Date().toISOString()
            };
            items.unshift(newItem);
          }
          if (!await saveChange("news", items, row ? "updated" : "created", titleInput.value.trim())) return;
          toast("News story saved successfully.");
          formHost.replaceChildren();
          load();
        });

        formHost.replaceChildren(form);
        titleInput.focus();
      }

      view.replaceChildren(
        ...heading("News & Announcements", "Publish stories and achievements. Published news automatically appears on the public website."),
        h("div", { class: "toolbar" },
          h("button", { class: "btn btn-primary", type: "button", text: "➕ Create News Story", onclick: () => openForm(null) })
        ),
        formHost,
        listHost
      );
      load();
    }

    /* =====================================================================
       ROUTE: ANNOUNCEMENTS / URGENT NOTICES
       ===================================================================== */
    function renderAnnouncements() {
      const formHost = h("div");
      const listHost = h("div");

      function load() {
        const items = getLocal("announcements");
        const rows = items.map((row) => {
          return h("tr", null,
            h("td", null, h("strong", { text: row.title })),
            h("td", null, h("span", { class: "badge " + (row.priority === "Important" ? "draft" : "live"), text: row.priority || "Notice" })),
            h("td", null, statusBadge(row.status)),
            h("td", { text: fmt(row.updated_at) }),
            h("td", null, h("div", { class: "row-actions" },
              h("button", { class: "btn btn-ghost btn-sm", type: "button", text: "Edit", onclick: () => openForm(row) }),
              h("button", { class: "btn btn-ghost btn-sm", type: "button", text: row.status === "active" ? "Archive" : "Activate Banner",
                onclick: async () => {
                  row.status = row.status === "active" ? "archived" : "active";
                  row.updated_at = new Date().toISOString();
                  if (row.status === "active") {
                    items.forEach((announcement) => {
                      if (announcement.id !== row.id) {
                        announcement.status = "archived";
                        announcement.updated_at = new Date().toISOString();
                      }
                    });
                  }
                  if (!await saveChange("announcements", items, row.status, row.title)) return;
                  toast("Banner " + (row.status === "active" ? "activated on website" : "archived"));
                  load();
                }
              }),
              isMain ? h("button", { class: "btn btn-danger btn-sm", type: "button", text: "Delete",
                onclick: async () => {
                  if (confirm("Delete announcement?")) {
                    const next = items.filter((x) => x.id !== row.id);
                    if (!await saveChange("announcements", next, "deleted", row.title)) return;
                    toast("Announcement removed");
                    load();
                  }
                }
              }) : null
            ))
          );
        });

        listHost.replaceChildren(dataTable(["Title", "Level", "Status", "Last Modified", "Actions"], rows));
      }

      function openForm(row) {
        const title = h("input", { id: "a-title", type: "text", required: true, maxlength: "200", value: row ? row.title : "", placeholder: "e.g. Admissions Open for Grade 6" });
        const body = h("textarea", { id: "a-body", rows: 3, maxlength: "5000", value: row ? row.body : "", placeholder: "Details or instructions..." });
        const prio = h("select", { id: "a-prio" },
          h("option", { value: "Notice", text: "Notice (General)" }),
          h("option", { value: "Important", text: "Important (High Visibility)" }),
          h("option", { value: "Urgent", text: "Urgent Alert" })
        );
        if (row) prio.value = row.priority || "Notice";

        const form = h("form", { class: "panel" },
          h("h2", { text: row ? "Edit Announcement" : "Add Urgent Announcement" }),
          h("div", { class: "field" }, h("label", { for: "a-title", text: "Banner Title" }), title),
          h("div", { class: "field" }, h("label", { for: "a-body", text: "Banner Message Text" }), body),
          h("div", { class: "field" }, h("label", { for: "a-prio", text: "Priority Tag" }), prio),
          h("div", { class: "form-actions" },
            h("button", { class: "btn btn-primary", type: "submit", text: "Publish to Website Banner" }),
            h("button", { class: "btn btn-ghost", type: "button", text: "Cancel", onclick: () => formHost.replaceChildren() })
          )
        );

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const items = getLocal("announcements");
          const now = new Date().toISOString();
          let entry;
          if (row) {
            entry = items.find((item) => item.id === row.id);
            if (!entry) {
              toast("This announcement no longer exists. Reload the section and try again.", "error");
              return;
            }
            Object.assign(entry, { title: title.value.trim(), body: body.value.trim(), priority: prio.value, updated_at: now });
          } else {
            items.forEach((item) => { item.status = "archived"; item.updated_at = now; });
            entry = {
              id: "ann-" + Date.now(),
              title: title.value.trim(),
              body: body.value.trim(),
              priority: prio.value,
              status: "active",
              created_at: now,
              updated_at: now
            };
            items.unshift(entry);
          }
          if (!await saveChange("announcements", items, row ? "updated" : "created", entry.title)) return;
          toast(row ? "Announcement updated." : "Announcement banner published live on website!");
          formHost.replaceChildren();
          load();
        });

        formHost.replaceChildren(form);
        title.focus();
      }

      view.replaceChildren(
        ...heading("Site Announcements & Top Banners", "Active banners immediately appear at the top of the public website for parents and students."),
        h("div", { class: "toolbar" },
          h("button", { class: "btn btn-primary", type: "button", text: "➕ New Announcement", onclick: () => openForm(null) })
        ),
        formHost,
        listHost
      );
      load();
    }

    /* =====================================================================
       ROUTE: GALLERY MANAGER
       ===================================================================== */
    function renderGallery() {
      const formHost = h("div");
      const listHost = h("div");

      function load() {
        const items = getLocal("gallery");
        if (!items.length) {
          listHost.replaceChildren(h("p", { class: "empty-state", text: "No gallery items yet. Click '+ Add Photo' to add one." }));
          return;
        }

        const tiles = items.map((it, i) => {
          return h("article", { class: "admin-tile" },
            h("div", { class: "thumb" },
              it.media_type === "video"
                ? h("iframe", { src: it.video_url, title: it.caption || "College video", loading: "lazy", allowfullscreen: true })
                : h("img", { src: it.image_url, alt: it.caption || "College photo", loading: "lazy" })
            ),
            h("div", { class: "meta" },
              h("strong", { text: it.caption || "(No caption)" }),
              h("small", { text: "📁 " + (it.category || "General") + " · Pos " + (i + 1) })
            ),
            h("div", { class: "row-actions" },
              h("button", { class: "btn btn-ghost btn-sm", type: "button", text: "▲ Up", disabled: i === 0,
                onclick: async () => {
                  const arr = items.slice();
                  [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                  arr.forEach((item, index) => { item.sort_order = index; });
                  if (!await saveChange("gallery", arr, "reordered", it.caption)) return;
                  toast("Order updated");
                  load();
                }
              }),
              h("button", { class: "btn btn-ghost btn-sm", type: "button", text: "▼ Down", disabled: i === items.length - 1,
                onclick: async () => {
                  const arr = items.slice();
                  [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                  arr.forEach((item, index) => { item.sort_order = index; });
                  if (!await saveChange("gallery", arr, "reordered", it.caption)) return;
                  toast("Order updated");
                  load();
                }
              }),
              h("button", { class: "btn btn-danger btn-sm", type: "button", text: "Delete",
                onclick: async () => {
                  if (confirm("Delete this gallery image?")) {
                    const next = items.filter((x) => x.id !== it.id);
                      next.forEach((item, index) => { item.sort_order = index; });
                    if (!await saveChange("gallery", next, "deleted", it.caption)) return;
                    toast("Gallery photo removed");
                    load();
                  }
                }
              })
            )
          );
        });

        listHost.replaceChildren(h("div", { class: "admin-gallery" }, tiles));
      }

      function openAddForm() {
        const cat = h("input", { id: "g-cat", type: "text", required: true, maxlength: "60", value: "Sports", placeholder: "e.g. Sports, Events, Cadets" });
        const cap = h("input", { id: "g-cap", type: "text", required: true, maxlength: "300", placeholder: "e.g. Cricket Team Victory Celebration 2026" });
        const preset = h("select", { id: "g-preset" },
          h("option", { value: "../images/gallery/gallery-1.jpg", text: "Sample School Photo 1" }),
          h("option", { value: "../images/gallery/gallery-2.jpg", text: "Sample School Photo 2" }),
          h("option", { value: "../images/gallery/gallery-3.jpg", text: "Sample School Photo 3" }),
          h("option", { value: "../images/gallery/gallery-4.jpg", text: "Sample School Photo 4" }),
          h("option", { value: "../images/school/main-hall.jpg", text: "Main Assembly Hall" }),
          h("option", { value: "custom", text: "Custom Image URL..." })
        );
        const urlInput = h("input", { id: "g-url", type: "url", placeholder: "https://example.com/photo.jpg" });
        urlInput.hidden = true;

        preset.addEventListener("change", () => {
          urlInput.hidden = preset.value !== "custom";
          urlInput.required = preset.value === "custom";
        });

        const form = h("form", { class: "panel" },
          h("h2", { text: "Add Photo to Gallery" }),
          h("div", { class: "field" }, h("label", { for: "g-cat", text: "Album / Category" }), cat),
          h("div", { class: "field" }, h("label", { for: "g-cap", text: "Photo Caption" }), cap),
          h("div", { class: "field" }, h("label", { for: "g-preset", text: "Photo Source" }), preset),
          h("div", { class: "field" }, urlInput),
          h("div", { class: "form-actions" },
            h("button", { class: "btn btn-primary", type: "submit", text: "Add Photo to Gallery" }),
            h("button", { class: "btn btn-ghost", type: "button", text: "Cancel", onclick: () => formHost.replaceChildren() })
          )
        );

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const items = getLocal("gallery");
          const finalUrl = preset.value === "custom" ? urlInput.value.trim() : preset.value;
          if (preset.value === "custom" && !/^https:\/\//i.test(finalUrl)) {
            toast("Custom gallery images must use a secure https:// URL.", "error");
            urlInput.focus();
            return;
          }
          const newItem = {
            id: "gal-" + Date.now(),
            category: cat.value.trim() || "General",
            caption: cap.value.trim(),
            media_type: "image",
            image_url: finalUrl,
            sort_order: items.length,
            updated_at: new Date().toISOString()
          };
          items.push(newItem);
          if (!await saveChange("gallery", items, "added", newItem.caption)) return;
          toast("Photo added to gallery");
          formHost.replaceChildren();
          load();
        });

        formHost.replaceChildren(form);
        cap.focus();
      }

      view.replaceChildren(
        ...heading("Media & Gallery Assets", "Manage high-resolution photography, categorized albums, and campus life media."),
        h("div", { class: "toolbar" },
          h("button", { class: "btn btn-primary", type: "button", text: "➕ Add Photo to Gallery", onclick: openAddForm })
        ),
        formHost,
        listHost
      );
      load();
    }

    /* =====================================================================
       ROUTE: ACTIVITIES & SPORTS
       ===================================================================== */
    function renderActivities() {
      const formHost = h("div");
      const listHost = h("div");
      const categories = ["Sports", "Clubs", "Societies", "Events", "Extra-curricular"];

      function load() {
        const items = getLocal("activities");
        const rows = items.map((row) => h("tr", null,
          h("td", null, h("strong", { text: row.title })),
          h("td", null, h("span", { class: "badge draft", text: row.category })),
          h("td", null, statusBadge(row.status)),
          h("td", { text: row.description }),
          h("td", null, h("div", { class: "row-actions" },
            h("button", { class: "btn btn-ghost btn-sm", type: "button", text: "Edit", onclick: () => openForm(row) }),
            h("button", { class: "btn btn-ghost btn-sm", type: "button", text: row.status === "published" ? "Unpublish" : "Publish",
              onclick: async () => {
                row.status = row.status === "published" ? "draft" : "published";
                row.updated_at = new Date().toISOString();
                if (!await saveChange("activities", items, row.status, row.title)) return;
                toast("Activity status changed.");
                load();
              }
            }),
            isMain ? h("button", { class: "btn btn-danger btn-sm", type: "button", text: "Delete",
              onclick: async () => {
                if (confirm("Delete activity '" + row.title + "'?")) {
                  const next = items.filter((x) => x.id !== row.id);
                  if (!await saveChange("activities", next, "deleted", row.title)) return;
                  toast("Activity deleted.");
                  load();
                }
              }
            }) : null
          ))
        ));
        listHost.replaceChildren(dataTable(["Activity Name", "Category", "Status", "Description", "Actions"], rows));
      }

      function openForm(row) {
        const title = h("input", { id: "act-title", type: "text", required: true, maxlength: "200", value: row ? row.title : "", placeholder: "e.g. First XI Cricket Team" });
        const category = h("select", { id: "act-category" }, categories.map((item) => h("option", { value: item, text: item })));
        const description = h("textarea", { id: "act-description", rows: 4, maxlength: "5000", value: row ? row.description : "", placeholder: "Describe this sport, club, or society." });
        const status = h("select", { id: "act-status" },
          h("option", { value: "published", text: "Published" }),
          h("option", { value: "draft", text: "Draft" })
        );
        if (row) {
          category.value = categories.includes(row.category) ? row.category : "Events";
          status.value = row.status;
        }
        const form = h("form", { class: "panel" },
          h("h2", { text: row ? "Edit Activity" : "Add Activity" }),
          h("div", { class: "field" }, h("label", { for: "act-title", text: "Activity Name" }), title),
          h("div", { class: "field" }, h("label", { for: "act-category", text: "Category" }), category),
          h("div", { class: "field" }, h("label", { for: "act-description", text: "Description" }), description),
          h("div", { class: "field" }, h("label", { for: "act-status", text: "Status" }), status),
          h("div", { class: "form-actions" },
            h("button", { class: "btn btn-primary", type: "submit", text: row ? "Save Activity" : "Add Activity" }),
            h("button", { class: "btn btn-ghost", type: "button", text: "Cancel", onclick: () => formHost.replaceChildren() })
          )
        );
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const records = getLocal("activities");
          const now = new Date().toISOString();
          let entry;
          if (row) {
            entry = records.find((item) => item.id === row.id);
            if (!entry) {
              toast("This activity no longer exists. Reload the section and try again.", "error");
              return;
            }
            Object.assign(entry, { title: title.value.trim(), category: category.value, description: description.value.trim(), status: status.value, updated_at: now });
          } else {
            entry = { id: "act-" + Date.now(), title: title.value.trim(), category: category.value, description: description.value.trim(), status: status.value, updated_at: now };
            records.unshift(entry);
          }
          if (!await saveChange("activities", records, row ? "updated" : "created", entry.title)) return;
          toast("Activity saved.");
          formHost.replaceChildren();
          load();
        });
        formHost.replaceChildren(form);
        title.focus();
      }
      view.replaceChildren(
        ...heading("Sports, Clubs & Extra-Curriculars", "Manage active student societies, national sporting teams, and cadeting battalions."),
        h("div", { class: "toolbar" }, h("button", { class: "btn btn-primary", type: "button", text: "Add Activity", onclick: () => openForm(null) })),
        formHost,
        listHost
      );
      load();
    }

    /* =====================================================================
       ROUTE: PAGE CONTENT
       ===================================================================== */
    function renderContent() {
      const saved = getLocal("page_content");
      const readValue = (key, fallback) => {
        const record = saved.find((item) => item.key === key);
        return record ? record.value : fallback;
      };
      const motto = h("input", { id: "c-motto", type: "text", maxlength: "20000", value: readValue("about.identity", "Sunath • Dhareth • Charatha") });
      const prinMsg = h("textarea", { id: "c-prin", rows: 5, maxlength: "20000", value: readValue("about.principal_message", "Guided by our founding vision, D.S. Senanayake Central College remains dedicated to fostering leaders who combine intellectual brilliance with unwavering patriotism, discipline, and moral character.") });
      const hist = h("textarea", { id: "c-hist", rows: 4, maxlength: "20000", value: readValue("about.history", "Established in 1947 in Mirigama, our college stands proud as a monument to national education named after the Father of the Nation, Rt. Hon. D. S. Senanayake.") });

      const form = h("form", { class: "panel" },
        h("h2", { text: "College Identity & Academic Text" }),
        h("div", { class: "field" }, h("label", { for: "c-motto", text: "Sacred College Motto" }), motto),
        h("div", { class: "field" }, h("label", { for: "c-prin", text: "Principal's Welcome Address" }), prinMsg),
        h("div", { class: "field" }, h("label", { for: "c-hist", text: "College Heritage Statement" }), hist),
        h("div", { class: "form-actions" },
          h("button", { class: "btn btn-primary", type: "submit", text: "Save Content Updates" })
        )
      );

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const values = {
          "about.identity": { page: "about", label: "School identity", value: motto.value.trim() },
          "about.principal_message": { page: "about", label: "Principal's message", value: prinMsg.value.trim() },
          "about.history": { page: "about", label: "School history", value: hist.value.trim() }
        };
        const records = getLocal("page_content").filter((item) => !Object.hasOwn(values, item.key));
        Object.entries(values).forEach(([key, fields]) => {
          records.push({ key, ...fields, updated_at: new Date().toISOString() });
        });
        if (!await saveChange("page_content", records, "updated", "School content")) return;
        toast("Content updates saved.");
      });

      view.replaceChildren(
        ...heading("Approved College Content", "Update verified institutional messages, vision statements, and heritage summaries."),
        form
      );
    }

    /* =====================================================================
       ROUTE: CONTACT DETAILS
       ===================================================================== */
    function renderContact() {
      const saved = getLocal("page_content");
      const readValue = (key, fallback) => {
        const record = saved.find((item) => item.key === key);
        return record ? record.value : fallback;
      };
      const addr = h("input", { id: "co-addr", type: "text", maxlength: "20000", value: readValue("contact.address", "Negombo - Kurunegala Road, Mirigama 11200, Western Province, Sri Lanka") });
      const phone = h("input", { id: "co-phone", type: "text", maxlength: "20000", value: readValue("contact.phone", "+94 33 227 3254 / +94 33 227 3420") });
      const email = h("input", { id: "co-email", type: "email", maxlength: "20000", value: readValue("contact.email", "info@dssenanayake.sch.lk") });

      const form = h("form", { class: "panel" },
        h("h2", { text: "Official Public Channels" }),
        h("div", { class: "field" }, h("label", { for: "co-addr", text: "College Physical Address" }), addr),
        h("div", { class: "field" }, h("label", { for: "co-phone", text: "Administrative Phone Lines" }), phone),
        h("div", { class: "field" }, h("label", { for: "co-email", text: "Official Inquiries Email" }), email),
        h("div", { class: "form-actions" },
          h("button", { class: "btn btn-primary", type: "submit", text: "Update Contact Channels" })
        )
      );

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const values = {
          "contact.address": { page: "contact", label: "Address", value: addr.value.trim() },
          "contact.phone": { page: "contact", label: "Phone", value: phone.value.trim() },
          "contact.email": { page: "contact", label: "Email", value: email.value.trim() }
        };
        const records = getLocal("page_content").filter((item) => !Object.hasOwn(values, item.key));
        Object.entries(values).forEach(([key, fields]) => {
          records.push({ key, ...fields, updated_at: new Date().toISOString() });
        });
        if (!await saveChange("page_content", records, "updated", "Contact details")) return;
        toast("Contact channels saved.");
      });

      view.replaceChildren(
        ...heading("Contact Details & Secretariat", "These details appear in the footer and contact pages."),
        form
      );
    }

    /* =====================================================================
       ROUTE: ADMIN USERS
       ===================================================================== */
    function renderUsers() {
      const users = getLocal("users");
      const rows = users.map((u) => {
        const isSelf = u.id === currentSession.id || u.email === currentSession.email;
        return h("tr", null,
          h("td", null, h("strong", { text: u.email + (isSelf ? " (You)" : "") })),
          h("td", { text: u.full_name }),
          h("td", null, h("span", { class: "badge " + (u.role === "main_admin" ? "live" : "draft"), text: u.role === "main_admin" ? "Super Admin" : "Editor" })),
          h("td", null, h("span", { class: "badge live", text: u.active ? "Active" : "Disabled" })),
          h("td", null, isSelf ? null : h("div", { class: "row-actions" },
            h("button", { class: "btn btn-ghost btn-sm", type: "button", text: "Toggle Role",
              onclick: async () => {
                u.role = u.role === "main_admin" ? "editor" : "main_admin";
                if (!await saveChange("users", users, "updated", u.email)) return;
                toast("User role updated.");
                renderUsers();
              }
            }),
            h("button", { class: "btn btn-ghost btn-sm", type: "button", text: u.active ? "Deactivate" : "Activate",
              onclick: async () => {
                u.active = !u.active;
                if (!await saveChange("users", users, u.active ? "activated" : "deactivated", u.email)) return;
                toast("User access " + (u.active ? "activated." : "deactivated."));
                renderUsers();
              }
            })
          ))
        );
      });

      view.replaceChildren(
        ...heading("Staff Administrators & Editors", "Manage account roles and access. Invite new staff through Supabase Authentication."),
        dataTable(["Email Address", "Staff Member", "Assigned Role", "Status", "Actions"], rows)
      );
    }

    /* =====================================================================
       ROUTER
       ===================================================================== */
    const routes = {
      overview: renderOverview,
      news: renderNews,
      announcements: renderAnnouncements,
      gallery: renderGallery,
      activities: renderActivities,
      content: renderContent,
      contact: renderContact,
      users: () => (isMain ? renderUsers() : renderOverview())
    };

    function route() {
      const hash = (location.hash || "#overview").slice(1);
      const target = routes[hash] ? hash : "overview";

      $$("#dash-nav a").forEach((a) => {
        if (a.getAttribute("data-route") === target) {
          a.setAttribute("aria-current", "page");
        } else {
          a.removeAttribute("aria-current");
        }
      });

      if (nav) nav.classList.remove("is-open");
      try {
        routes[target]();
      } catch (err) {
        console.error(err);
        view.replaceChildren(h("p", { class: "form-msg error", text: "An error occurred loading section." }));
      }
      view.focus({ preventScroll: true });
    }

    window.addEventListener("hashchange", route);
    route();
  }
})();