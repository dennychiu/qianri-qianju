(() => {
  "use strict";
  const client = typeof supabaseClient !== "undefined" ? supabaseClient : null;
  if (!client) {
    console.error("Supabase client 尚未載入");
    return;
  }
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(new Date());
  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text || "";
    return node;
  };
  const addLink = (parent, label, rawUrl) => {
    if (!rawUrl) return;
    try {
      const url = new URL(rawUrl, window.location.href);
      if (!["https:", "http:"].includes(url.protocol)) return;
      const a = make("a", label);
      a.href = url.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      parent.appendChild(a);
    } catch (_) {}
  };
  const addCard = (parent, title, body, extra) => {
    const card = make("article", "", "section");
    card.style.marginTop = "12px";
    card.appendChild(make("h3", title));
    if (body) card.appendChild(make("p", body));
    if (extra) extra(card);
    parent.appendChild(card);
  };
  async function loadDaily() {
    const section = document.getElementById("about");
    if (!section) return;
    const { data, error } = await client.from("fast_days")
      .select("event_date,title,message,practice,image_url")
      .eq("published", true).lte("event_date", today)
      .order("event_date", { ascending: false }).limit(1).maybeSingle();
    if (error || !data) return;
    const card = make("section", "", "section");
    card.id = "daily-content";
    card.appendChild(make("h2", "🪷 今日善念"));
    card.appendChild(make("p", data.title));
    if (data.message) card.appendChild(make("p", data.message));
    if (data.practice) card.appendChild(make("p", "今日實踐：" + data.practice));
    if (data.image_url) {
      const img = document.createElement("img");
      img.src = data.image_url;
      img.alt = data.title || "每日內容圖片";
      img.loading = "lazy";
      img.style.maxWidth = "100%";
      img.style.borderRadius = "12px";
      card.appendChild(img);
    }
    section.parentNode.insertBefore(card, section);
  }
  async function loadAnnouncements() {
    const { data, error } = await client.from("announcements")
      .select("title,message,image_url,created_at")
      .eq("published", true).order("created_at", { ascending: false }).limit(5);
    if (error || !data || !data.length) return;
    const host = document.querySelector("main.container");
    const section = make("section", "", "section");
    section.id = "announcements";
    section.appendChild(make("h2", "📢 最新公告"));
    data.forEach(item => {
      const block = make("div");
      block.appendChild(make("h3", item.title));
      if (item.message) block.appendChild(make("p", item.message));
      if (item.image_url) {
        const img = document.createElement("img");
        img.src = item.image_url;
        img.alt = item.title || "公告圖片";
        img.loading = "lazy";
        img.style.maxWidth = "100%";
        block.appendChild(img);
      }
      section.appendChild(block);
    });
    host.insertBefore(section, host.querySelector("footer"));
    if (!host.querySelector("footer")) host.appendChild(section);
  }
  async function loadFaq() {
    const section = document.getElementById("faq");
    if (!section) return;
    const { data, error } = await client.from("faq")
      .select("question,answer,sort_order")
      .eq("is_published", true).order("sort_order", { ascending: true }).limit(30);
    if (error || !data || !data.length) return;
    const list = make("div");
    data.forEach(item => {
      const block = make("div");
      block.style.marginTop = "14px";
      block.appendChild(make("h3", item.question));
      block.appendChild(make("p", item.answer));
      list.appendChild(block);
    });
    section.appendChild(list);
  }
  async function loadVideos() {
    const section = document.getElementById("video");
    if (!section) return;
    const { data, error } = await client.from("videos")
      .select("title,description,video_url,application_url,sort_order")
      .eq("is_published", true).order("sort_order", { ascending: true }).limit(20);
    if (error || !data || !data.length) return;
    data.forEach(item => {
      addCard(section, item.title, item.description, card => {
        addLink(card, "觀看影片", item.video_url);
        addLink(card, "前往申請", item.application_url);
      });
    });
  }
  Promise.allSettled([loadDaily(), loadAnnouncements(), loadFaq(), loadVideos()]);
})();