const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/engine-core-CD1WNmk6.js","assets/engine-gemini-iNdzkyyX.js","assets/vendor-DKjQ1qLu.js","assets/vendor-react-CvBl8VdO.js","assets/engine-script-BjHjxfdR.js","assets/vendor-firebase-CmLdJ1V2.js"])))=>i.map(i=>d[i]);
import { j as jsxRuntimeExports, r as reactExports, c as client, R as React } from './vendor-react-CvBl8VdO.js';
import { u as useVideoStore, c as setGeminiKey, f as TEMPLATE_NAMES, h as RESTAURANT_TYPES, T as TEMPLATE_HINTS, _ as __vitePreload, i as generateBlogPost } from './engine-gemini-iNdzkyyX.js';
import { c as clearToken, s as saveToken, l as loadToken, a as searchMarketingKits, b as getMarketingKits, d as setTypeCastKeys, e as startMake, f as getAudioCtx, p as preprocessNarration, h as hasTypeCastKeys, i as fetchTypeCastTTS, r as rotateTypeCastKey, j as fetchTTSWithRetry, k as formatDuration, m as downloadBlob, n as sanitizeName, o as extractThumbnail, q as renderCinematicFinish, t as renderVideoWithFFmpeg, u as firebaseUploadVideo, v as deleteMarketingKit, w as saveBlogPost, x as saveSNSTags, y as searchBlogPosts, z as getRecentBlogPosts, A as initFirebase } from './engine-core-CD1WNmk6.js';
import { M as Muxer, x as Muxer$1, y as Mp4Muxer, W as WebmMuxer } from './vendor-DKjQ1qLu.js';
import './engine-script-BjHjxfdR.js';
import './vendor-firebase-CmLdJ1V2.js';

true&&(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
}());

function Header({ activeTab, onTabChange, tabs }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "app-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "header-inner", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "header-logo", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "logo-play", children: "▶" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "logo-text", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "logo-title", children: "MOOVLOG" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "logo-sub", children: activeTab === "blog" ? "Blog Writer" : "Shorts Creator" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "header-version", children: "v2.49" })
      ] }),
      tabs && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "app-tab-nav", children: tabs.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `app-tab-btn ${activeTab === t.id ? "active" : ""}`,
          onClick: () => onTabChange(t.id),
          children: t.label
        },
        t.id
      )) })
    ] }),
    activeTab === "shorts" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "feature-tags", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-wand-magic-sparkles" }),
        " AI 자동 스타일"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-instagram" }),
        " 릴스 최적화"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-tiktok" }),
        " 틱톡 트렌드"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-robot" }),
        " 남성 AI 보이스"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-eye" }),
        " POV 모드"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-bolt" }),
        " 0.5초 훅"
      ] })
    ] }),
    activeTab === "blog" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "feature-tags", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-pen-nib" }),
        " AI 블로그 작성"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-neos" }),
        " 네이버 최적화"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-instagram" }),
        " 인스타 캡션"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-youtube" }),
        " 유튜브 태그"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ftag", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-hashtag" }),
        " SNS 태그 자동생성"
      ] })
    ] }),
    activeTab === "shorts" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step-indicator", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StepItem, { n: 1, label: "업로드" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "si-line" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StepItem, { n: 2, label: "AI 생성" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "si-line" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StepItem, { n: 3, label: "결과" })
    ] })
  ] });
}
function StepItem({ n, label }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "si-item", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "si-num", children: n }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "si-label", children: label })
  ] });
}

const API_KEY = undefined                                    || undefined                                      || "";
function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = resolve;
    document.body.appendChild(s);
  });
}
function DrivePicker({ addFiles: addFilesProp }) {
  const [ready, setReady] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(false);
  const tokenClientRef = reactExports.useRef(null);
  const clientIdRef = reactExports.useRef("");
  const { addFilesAsync: storeAddFilesAsync, addToast } = useVideoStore();
  const addFiles = addFilesProp || storeAddFilesAsync;
  reactExports.useEffect(() => {
    (async () => {
      await Promise.all([
        loadScript("https://apis.google.com/js/api.js").then(
          () => new Promise((r) => window.gapi.load("picker", r))
        ),
        loadScript("https://accounts.google.com/gsi/client")
      ]);
      setReady(true);
    })();
  }, []);
  const getClientId = () => {
    const envId = undefined                                      || "";
    if (envId) return envId.trim();
    let id = localStorage.getItem("moovlog_google_client_id") || "";
    if (!id) {
      id = prompt(
        "Google OAuth 클라이언트 ID를 입력하세요.\n(GCP 콘솔 > 사용자 인증 정보 > OAuth 클라이언트 ID)\n예: 123456789-abc.apps.googleusercontent.com",
        ""
      ) || "";
      if (id) localStorage.setItem("moovlog_google_client_id", id.trim());
    }
    return id.trim();
  };
  const openPicker = (accessToken, clientId) => {
    const appId = clientId.split("-")[0];
    const myView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    myView.setMimeTypes("image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/x-m4v");
    const sharedView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    sharedView.setMimeTypes("image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/x-m4v");
    sharedView.setOwnedByMe(false);
    new window.google.picker.PickerBuilder().addView(myView).addView(sharedView).enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED).setOAuthToken(accessToken).setDeveloperKey(API_KEY).setAppId(appId).setCallback((data) => pickerCallback(data, accessToken)).build().setVisible(true);
  };
  const requestNewToken = (clientId) => {
    if (!tokenClientRef.current || clientIdRef.current !== clientId) {
      clientIdRef.current = clientId;
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: (resp) => {
          if (resp.error) {
            clearToken();
            if (resp.error === "redirect_uri_mismatch" || resp.error === "idpiframe_initialization_failed") {
              addToast(
                'GCP 콘솔 "Authorized JavaScript origins"에 https://122cks.github.io 를 추가하세요.',
                "err"
              );
            } else if (resp.error !== "popup_closed_by_user" && resp.error !== "access_denied") {
              addToast("Google 로그인 실패: " + resp.error, "err");
            }
            return;
          }
          saveToken(resp.access_token);
          openPicker(resp.access_token, clientId);
        }
      });
      tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
    } else {
      tokenClientRef.current.requestAccessToken({ prompt: "" });
    }
  };
  const handleClick = () => {
    if (!ready) {
      addToast("Google API 로딩 중...", "inf");
      return;
    }
    if (!API_KEY) {
      addToast("Google API 키가 설정되지 않았습니다.", "err");
      return;
    }
    const clientId = getClientId();
    if (!clientId) {
      addToast("클라이언트 ID가 필요합니다.", "err");
      return;
    }
    const validToken = loadToken();
    if (validToken) {
      openPicker(validToken, clientId);
      return;
    }
    requestNewToken(clientId);
  };
  const pickerCallback = async (data, accessToken) => {
    if (data.action !== window.google.picker.Action.PICKED) return;
    const docs = data.docs || [];
    if (!docs.length) return;
    setLoading(true);
    addToast(`${docs.length}개 파일 다운로드 중...`, "inf");
    try {
      const files = await Promise.all(docs.map(async (doc) => {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(doc.id)}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (res.status === 401) {
          clearToken();
          tokenClientRef.current = null;
          throw new Error("인증이 만료되었습니다. 다시 버튼을 눌러 로그인해주세요.");
        }
        if (!res.ok) throw new Error(`'${doc.name}' 다운로드 실패 (${res.status})`);
        const blob = await res.blob();
        if (!blob.size) throw new Error(`'${doc.name}' 파일을 읽을 수 없습니다. Drive 공유 권한을 확인하세요.`);
        return new File([blob], doc.name, { type: doc.mimeType || blob.type });
      }));
      addFiles(files);
      addToast(`${files.length}개 파일을 드라이브에서 추가했습니다!`, "ok");
    } catch (err) {
      console.error("[DrivePicker]", err);
      addToast(err.message || "파일 다운로드 중 오류 발생", "err");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      onClick: handleClick,
      disabled: loading,
      className: "drive-import-btn",
      title: "Google Drive에서 사진/영상 불러오기",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "18", height: "15", viewBox: "0 0 87.3 78", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z", fill: "#0066da" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z", fill: "#00ac47" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z", fill: "#ea4335" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z", fill: "#00832d" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z", fill: "#2684fc" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z", fill: "#ffba00" })
        ] }),
        loading ? "다운로드 중..." : "드라이브에서 가져오기"
      ]
    }
  );
}

function PromptInput() {
  const { userPrompt, setUserPrompt } = useVideoStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "14px", width: "100%" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "block", marginBottom: "8px", fontWeight: "700", color: "#aaa", fontSize: "0.82rem" }, children: [
      "✨ AI에게 특별히 부탁할 점 ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#555", fontWeight: "400" }, children: "(선택)" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        value: userPrompt,
        onChange: (e) => setUserPrompt(e.target.value),
        placeholder: "예: 조금 더 감성적인 톤으로 써줘, 가게 인테리어를 강조해줘, 자막에 이모지를 많이 써줘 등",
        rows: 3,
        style: {
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          backgroundColor: "#0f0f1a",
          border: "1px solid #333",
          borderRadius: "10px",
          color: "#e2e2e2",
          fontSize: "0.88rem",
          fontFamily: "inherit",
          resize: "none",
          outline: "none",
          transition: "border-color 0.2s",
          lineHeight: "1.5"
        },
        onFocus: (e) => e.target.style.borderColor = "#8E2DE2",
        onBlur: (e) => e.target.style.borderColor = "#333"
      }
    )
  ] });
}

function UploadSection() {
  const {
    files,
    addFiles,
    removeFile,
    restaurantName,
    setRestaurantName,
    selectedTemplate,
    setTemplate,
    aspectRatio,
    setAspectRatio,
    restaurantType,
    setRestaurantType,
    addToast
  } = useVideoStore();
  const fileInputRef = reactExports.useRef();
  const dropRef = reactExports.useRef();
  const [kitHistory, setKitHistory] = reactExports.useState([]);
  const [kitSearch, setKitSearch] = reactExports.useState("");
  const [kitLoading, setKitLoading] = reactExports.useState(false);
  const loadKits = reactExports.useCallback(async (kw = "") => {
    setKitLoading(true);
    try {
      const r = kw.trim() ? await searchMarketingKits(kw.trim()) : await getMarketingKits(20);
      setKitHistory(r);
    } catch {
    } finally {
      setKitLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    loadKits();
  }, [loadKits]);
  const onDragOver = reactExports.useCallback((e) => {
    e.preventDefault();
    dropRef.current?.classList.add("over");
  }, []);
  const onDragLeave = reactExports.useCallback(() => dropRef.current?.classList.remove("over"), []);
  const onDrop = reactExports.useCallback((e) => {
    e.preventDefault();
    dropRef.current?.classList.remove("over");
    addFiles([...e.dataTransfer.files]);
  }, [addFiles]);
  const onFileChange = reactExports.useCallback((e) => {
    addFiles([...e.target.files]);
    e.target.value = "";
  }, [addFiles]);
  const handleSetKey = reactExports.useCallback(() => {
    const key = prompt(
      "Gemini API 키를 입력하세요:",
      localStorage.getItem("moovlog_gemini_key") || ""
    );
    if (key !== null) {
      localStorage.setItem("moovlog_gemini_key", key);
      setGeminiKey(key);
      addToast("Gemini API 키 저장 완료", "ok");
    }
    const existingKeys = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => localStorage.getItem(`moovlog_typecast_key${n > 1 ? n : ""}`) || "").join("\n");
    const tcInput = prompt(
      "TypeCast API 키를 입력하세요 (한 줄에 하나씩, 여러 줄 또는 콤마 구분 가능, 최대 8개):",
      existingKeys
    );
    if (tcInput !== null) {
      const parsed = tcInput.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
      parsed.forEach((k, i) => {
        const lsName = `moovlog_typecast_key${i > 0 ? i + 1 : ""}`;
        localStorage.setItem(lsName, k);
      });
      for (let i = parsed.length + 1; i <= 8; i++) {
        localStorage.removeItem(`moovlog_typecast_key${i > 1 ? i : ""}`);
      }
      setTypeCastKeys(parsed);
      addToast(`TypeCast 키 ${parsed.length}개 로테이션 설정 완료 ✅`, "ok");
    }
  }, [addToast]);
  const RATIOS = [
    { value: "9:16", icon: "fa-mobile-alt", label: "9:16 쇼츠" },
    { value: "1:1", icon: "fa-instagram", label: "1:1 피드", fab: true },
    { value: "16:9", icon: "fa-tv", label: "16:9 유튜브" }
  ];
  const TEMPLATES = Object.entries(TEMPLATE_NAMES).filter(([k]) => k !== "auto");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "app-main", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ratio-row", children: RATIOS.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: `ratio-btn ${aspectRatio === r.value ? "active" : ""}`,
        onClick: () => setAspectRatio(r.value),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `${r.fab ? "fab" : "fas"} ${r.icon}` }),
          " ",
          r.label
        ]
      },
      r.value
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "card", id: "secUpload", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-label", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "num", children: "01" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "이미지 · 영상 업로드" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "사진와 영상 클립을 올려주세요 (업로드 최다 30개를 모두 사용함)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          ref: dropRef,
          className: "drop-area",
          onDragOver,
          onDragLeave,
          onDrop,
          onClick: () => fileInputRef.current?.click(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drop-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-cloud-upload-alt" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drop-text", children: "여기에 끌어다 놓거나" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "pick-btn", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-folder-open" }),
              " 파일 선택"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                accept: "image/*,video/*",
                multiple: true,
                hidden: true,
                onChange: onFileChange
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drop-hint", children: "JPG · PNG · MP4 · MOV · 최다 30개" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drive-row", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DrivePicker, {}) }),
      files.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "thumb-grid", children: files.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ti", children: [
        m.type === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: m.url, alt: "" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: m.url, muted: true, playsInline: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ti-badge", children: i + 1 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "ti-remove",
            onClick: (e) => {
              e.stopPropagation();
              removeFile(i);
            },
            children: "✕"
          }
        )
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "name-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "name-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-store name-icon" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            className: "name-input",
            placeholder: "음식점 이름 입력 (예: 을지로 돈부리집)",
            maxLength: 40,
            value: restaurantName,
            onChange: (e) => setRestaurantName(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "key-btn", onClick: handleSetKey, title: "API 키 설정", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-key" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "ai-auto-hint", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-sparkles" }),
        " AI가 이미지를 분석해 최적의 스타일 · 훅 · 템플릿을 자동 선택합니다"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", style: { padding: "14px 16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "0.78rem", fontWeight: 700, color: "#a78bfa", letterSpacing: "0.08em", textTransform: "uppercase" }, children: "🏪 업체 유형 선택" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "0.7rem", color: "var(--text-sub)" }, children: "— 유형별 최신 숫싼/릴스 스타일로 자동 설계" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 7 }, children: Object.entries(RESTAURANT_TYPES).map(([key, info]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `tpl-chip ${restaurantType === key ? "active" : ""}`,
          onClick: () => setRestaurantType(key),
          title: info.hint || "",
          children: info.label
        },
        key
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tpl-picker", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `tpl-chip ${selectedTemplate === "auto" ? "active" : ""}`,
          onClick: () => setTemplate("auto"),
          children: "🤖 AI 자동"
        }
      ),
      TEMPLATES.map(([key, name]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `tpl-chip ${selectedTemplate === key ? "active" : ""}`,
          onClick: () => setTemplate(key),
          title: TEMPLATE_HINTS[key] || "",
          children: name
        },
        key
      ))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PromptInput, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "make-btn",
        onClick: startMake,
        disabled: !files.length || !restaurantName.trim(),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "make-glow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-wand-magic-sparkles" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "AI 숏폼 자동 생성" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "make-hint", children: "이미지 분석 → 스타일 자동 선택 → 스크립트 → 나레이션 → 영상 완성" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "card", style: { marginTop: 16 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "#ccc" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-history", style: { marginRight: 6, color: "#a78bfa" } }),
          "이전 마케팅 키트"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => loadKits(kitSearch),
            disabled: kitLoading,
            style: { background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: "0.8rem" },
            children: kitLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-sync-alt" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "name-input",
            style: { flex: 1, fontSize: "0.82rem", padding: "7px 12px" },
            placeholder: "음식점 이름으로 검색...",
            value: kitSearch,
            onChange: (e) => setKitSearch(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && loadKits(kitSearch)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "re-btn", style: { minWidth: 40 }, onClick: () => loadKits(kitSearch), disabled: kitLoading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-search" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }, children: [
        kitHistory.length === 0 && !kitLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--text-sub)", textAlign: "center", padding: "10px 0", fontSize: "0.78rem" }, children: "저장된 마케팅 키트가 없습니다" }),
        kitHistory.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              setRestaurantName(item.restaurant || "");
              addToast(`「${item.restaurant}」 불러오기 완료`, "ok");
            },
            style: {
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: 10,
              padding: "9px 14px",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 700, fontSize: "0.85rem", color: "#eee" }, children: item.restaurant || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "0.68rem", color: "var(--text-sub)", marginLeft: 8, whiteSpace: "nowrap" }, children: item.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || "" })
            ]
          },
          item.id
        ))
      ] })
    ] })
  ] });
}

const STEPS = [
  { icon: "fa-search", label: "식당 실시간 정보 조사" },
  { icon: "fa-utensils", label: "업체 유형 분류" },
  { icon: "fa-eye", label: "시각 분석 + 스타일 선택" },
  { icon: "fa-film", label: "스토리보드 설계" },
  { icon: "fa-link", label: "영상 컷 삽입 + 자막 매칭 검증" },
  { icon: "fa-microphone-alt", label: "AI 음성 합성" },
  { icon: "fa-video", label: "렌더링 준비 + 품질 검수" }
];
function LoadingOverlay() {
  const { pipeline } = useVideoStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "loading-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ai-loader", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ai-ring" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ai-ico", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-robot" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "load-title", children: pipeline.title || "AI가 작업 중입니다..." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "load-sub", children: pipeline.sub || "잠시만 기다려주세요" }),
    pipeline.autoStyleName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auto-style-badge", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "asb-label", children: "AI 추천 스타일" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "asb-value", children: pipeline.autoStyleName })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "load-pipeline", children: STEPS.map((step, i) => {
      const isActive = i === pipeline.step - 1;
      const isDone = pipeline.done[i];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `lp-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lp-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${step.icon}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lp-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-name", children: step.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-status", children: isDone ? "완료" : isActive ? "진행중..." : "대기중" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `lp-check ${isDone ? "visible" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-check" }) })
      ] }, i);
    }) })
  ] }) });
}

const renderFormattedText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#FF2D55", fontWeight: 900 }, children: p.slice(2, -2) }, i);
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: p }, i);
  });
};
function VideoPlayer({ isExporting = false }) {
  const videoRef = reactExports.useRef(null);
  const audioRef = reactExports.useRef(null);
  const [safeZone, setSafeZone] = reactExports.useState(false);
  const {
    script,
    files,
    playing,
    muted,
    scene,
    audioBuffers,
    restaurantName,
    setPlaying,
    setScene,
    setSubAnimProg
  } = useVideoStore();
  const currentScene = script?.scenes[scene];
  const fileIdx = currentScene?.media_idx ?? scene;
  const currentFile = files?.[fileIdx];
  const isImage = currentFile?.type === "image";
  const effectClass = currentScene?.effect ? `effect-${currentScene.effect}` : "";
  const vibeColor = script?.vibe_color || null;
  const audioSceneIdx = (() => {
    if (currentScene?.blockIdx !== void 0 && script?.scenes) {
      const idx = script.scenes.findIndex((s) => s.blockIdx === currentScene.blockIdx);
      return idx >= 0 ? idx : scene;
    }
    return scene;
  })();
  const currentAudioKey = currentScene?.blockIdx ?? scene;
  reactExports.useEffect(() => {
    if (!isImage && videoRef.current) {
      const video = videoRef.current;
      const onMetadata = () => {
        if (video.duration && isFinite(video.duration)) {
          const startPct = currentScene?.best_start_pct || 0;
          if (startPct > 0 && startPct < 0.95) {
            video.currentTime = startPct * video.duration;
          }
          if (currentScene?.duration) {
            const avail = video.duration - video.currentTime;
            video.playbackRate = Math.max(0.6, Math.min(1, Math.max(0.01, avail) / currentScene.duration));
          }
        }
      };
      video.addEventListener("loadedmetadata", onMetadata);
      video.currentTime = 0;
      video.play().catch(() => {
      });
      return () => video.removeEventListener("loadedmetadata", onMetadata);
    }
  }, [scene, isImage, currentScene?.duration, currentScene?.best_start_pct]);
  reactExports.useEffect(() => {
    if (!playing) return;
    if (!isImage && videoRef.current) {
      const hasAudio = !!audioBuffers?.[audioSceneIdx];
      videoRef.current.volume = hasAudio ? 0.15 : 1;
      videoRef.current.muted = hasAudio || muted;
    }
    if (!muted) {
      const ac = getAudioCtx();
      if (ac && ac.state === "running") {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const filt = ac.createBiquadFilter();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1500, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 0.25);
        filt.type = "lowpass";
        filt.frequency.value = 2e3;
        gain.gain.setValueAtTime(0, ac.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ac.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.25);
        osc.connect(filt);
        filt.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.25);
      }
    }
  }, [scene, playing, isImage, audioBuffers, muted]);
  reactExports.useEffect(() => {
    if (!playing || !script) return;
    const sc = script.scenes[scene];
    if (!sc) return;
    const dur = (sc.duration > 0 && isFinite(sc.duration) ? sc.duration : 3) * 1e3;
    const timer = setTimeout(() => {
      const st = useVideoStore.getState();
      if (!st.playing) return;
      const nextSi = st.scene + 1;
      if (nextSi < (st.script?.scenes?.length ?? 0)) {
        setScene(nextSi);
        setSubAnimProg(0);
      } else {
        setPlaying(false);
        document.getElementById("repeatOverlayReact")?.removeAttribute("hidden");
      }
    }, dur);
    return () => clearTimeout(timer);
  }, [playing, scene, script]);
  reactExports.useEffect(() => {
    if (!playing || !script) return;
    const sc = script.scenes[scene];
    if (!sc) return;
    const dur = (sc.duration > 0 && isFinite(sc.duration) ? sc.duration : 3) * 1e3;
    const total = script.scenes.reduce((a, s) => a + (s.duration > 0 && isFinite(s.duration) ? s.duration : 3), 0);
    const done = script.scenes.slice(0, scene).reduce((a, s) => a + (s.duration > 0 && isFinite(s.duration) ? s.duration : 3), 0);
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const el = Math.min((now - start) / 1e3, dur / 1e3);
      const pct = Math.min((done + el) / total * 100, 100);
      const bar = document.getElementById("vProgReact");
      if (bar) bar.style.width = pct + "%";
      setSubAnimProg(Math.min(el / (dur / 1e3), 1));
      if (el < dur / 1e3) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, scene, script]);
  reactExports.useEffect(() => {
    if (!playing || muted) return;
    const buf = audioBuffers?.[audioSceneIdx];
    if (!buf) return;
    const ac = getAudioCtx();
    if (!ac) return;
    let cancelled = false;
    const playAudio = () => {
      if (cancelled) return;
      try {
        audioRef.current?.stop();
      } catch (_) {
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.connect(ac.destination);
      src.start(0);
      audioRef.current = src;
    };
    if (ac.state === "suspended") {
      ac.resume().then(playAudio).catch(() => {
      });
    } else {
      playAudio();
    }
    return () => {
      cancelled = true;
      try {
        audioRef.current?.stop();
      } catch (_) {
      }
    };
  }, [playing, muted, currentAudioKey, audioBuffers]);
  const togglePlay = reactExports.useCallback(() => {
    const ac = getAudioCtx();
    if (ac?.state === "suspended") ac.resume().catch(() => {
    });
    if (playing) {
      try {
        audioRef.current?.stop();
      } catch (_) {
      }
    }
    setPlaying(!playing);
  }, [playing, setPlaying]);
  const doReplay = reactExports.useCallback(() => {
    try {
      audioRef.current?.stop();
    } catch (_) {
    }
    setPlaying(false);
    setScene(0);
    setSubAnimProg(0);
    document.getElementById("repeatOverlayReact")?.setAttribute("hidden", "");
    setTimeout(() => setPlaying(true), 80);
  }, [setPlaying, setScene, setSubAnimProg]);
  if (!script || !files?.length) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "phone", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-notch" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-screen", style: { background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#444", fontSize: "0.85rem" }, children: "스크립트 생성 후 미리보기" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-bar" })
  ] }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "phone-wrap", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "phone", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-notch" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "phone-screen", onClick: togglePlay, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#111" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vignette-overlay", style: { zIndex: 10 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            position: "absolute",
            inset: 0,
            zIndex: 13,
            pointerEvents: "none",
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
            opacity: 0.12,
            mixBlendMode: "overlay"
          } }),
          currentFile && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            isImage && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: currentFile.url,
                style: {
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "blur(30px) brightness(0.4)",
                  transform: "scale(1.2)"
                },
                alt: "bg-blur"
              }
            ),
            isImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: currentFile.url,
                alt: "scene",
                className: `video-media-content ${effectClass}`,
                style: {
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  zIndex: 5,
                  "--dur": `${currentScene?.duration ?? 3}s`,
                  animationDuration: `${currentScene?.duration ?? 3}s`
                }
              },
              `img-${scene}`
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "video",
              {
                ref: videoRef,
                src: currentFile.url,
                className: "video-media-content",
                style: {
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  zIndex: 5,
                  "--dur": `${currentScene?.duration ?? 3}s`
                },
                autoPlay: true,
                muted: audioBuffers?.[audioSceneIdx] ? true : !!muted,
                playsInline: true,
                loop: false
              },
              `vid-${scene}-${fileIdx}`
            )
          ] })
        ] }),
        currentScene && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              position: "absolute",
              bottom: "15%",
              left: 0,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              zIndex: 50,
              pointerEvents: "none"
            },
            children: [
              currentScene.caption1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-subtitle-pop dynamic-subtitle", style: {
                backgroundColor: "rgba(0,0,0,0.75)",
                color: "#FFFFFF",
                padding: "10px 22px",
                borderRadius: "50px",
                fontSize: "2.2rem",
                fontWeight: "900",
                letterSpacing: "-1px",
                textAlign: "center",
                maxWidth: "85%",
                boxShadow: vibeColor ? `0 4px 15px rgba(0,0,0,0.3), 0 0 24px ${vibeColor}66` : "0 4px 15px rgba(0,0,0,0.3)",
                textShadow: vibeColor ? `0 0 18px ${vibeColor}99` : void 0,
                wordBreak: "keep-all",
                lineHeight: "1.2"
              }, children: renderFormattedText(currentScene.caption1) }),
              currentScene.caption2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-subtitle-drop dynamic-subtitle", style: {
                backgroundColor: vibeColor ? vibeColor : "rgba(255,234,0,0.92)",
                color: "#000000",
                padding: "6px 16px",
                borderRadius: "8px",
                fontSize: "1.3rem",
                fontWeight: "700",
                textAlign: "center",
                maxWidth: "80%",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                wordBreak: "keep-all"
              }, children: currentScene.caption2 })
            ]
          },
          `sub-${scene}`
        ),
        safeZone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "safe-zone-overlay", style: { position: "absolute", inset: 0, zIndex: 60, pointerEvents: "none" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: 0, left: 0, right: 0, height: "14%", background: "rgba(255,0,0,0.15)", borderBottom: "1px dashed rgba(255,100,100,0.7)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { position: "absolute", bottom: 4, left: 8, fontSize: "0.5rem", color: "rgba(255,150,150,0.9)", fontWeight: 700 }, children: "⚠ 상단 UI 영역" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "rgba(255,165,0,0.10)", borderTop: "1px dashed rgba(255,165,0,0.7)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { position: "absolute", top: 4, left: 8, fontSize: "0.5rem", color: "rgba(255,180,80,0.9)", fontWeight: 700 }, children: "⚠ 하단 버튼 영역" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "14%", left: 0, right: 0, height: "26%", border: "1px solid rgba(0,255,0,0.6)", background: "rgba(0,255,0,0.05)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { position: "absolute", top: 4, left: 8, fontSize: "0.5rem", color: "rgba(100,255,100,0.9)", fontWeight: 700 }, children: "✅ 자막 세이프 존" }) })
        ] }),
        restaurantName && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "10px 14px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.70), transparent)",
          color: "#fff",
          fontSize: "0.9rem",
          fontWeight: 700
        }, children: restaurantName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(YtInfoOverlay, { script }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yt-progress-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yt-progress-fill", id: "vProgReact", style: { width: "0%" } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { id: "repeatOverlayReact", className: "repeat-overlay", hidden: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "repeat-box", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "repeat-question", children: "계속 반복하시겠습니까?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "repeat-btns", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "repeat-btn repeat-yes", onClick: (e) => {
              e.stopPropagation();
              doReplay();
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-redo" }),
              " 네, 다시 보기"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "repeat-btn repeat-no", onClick: (e) => {
              e.stopPropagation();
              document.getElementById("repeatOverlayReact")?.setAttribute("hidden", "");
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-times" }),
              " 아니요"
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "phone-bar" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-side yt-side", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yt-avatar-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yt-avatar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "M" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yt-sub-plus", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus" }) })
      ] }),
      [
        { icon: "fa-thumbs-up", label: "1.2만" },
        { icon: "fa-thumbs-down", label: "싫어요" },
        { icon: "fa-comment-dots", label: "48" },
        { icon: "fa-share", label: "공유" },
        { icon: "fa-ellipsis-vertical", label: "더보기" }
      ].map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yt-btn-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rsb", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${b.icon}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yt-btn-label", children: b.label })
      ] }, i))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "v-controls-outer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vprog-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vprog-rail", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vprog-bar", id: "vProgReact2" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "v-controls", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "vcb", onClick: doReplay, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-rotate-left" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "vcb vcb-play", onClick: togglePlay, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${playing ? "fa-pause" : "fa-play"}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "vcb", onClick: () => useVideoStore.getState().setMuted(!muted), children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${muted ? "fa-volume-mute" : "fa-volume-up"}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: `vcb${safeZone ? " vcb-active" : ""}`,
            onClick: () => setSafeZone((v) => !v),
            title: "인스타 세이프 존 가이드",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-th" })
          }
        )
      ] })
    ] })
  ] });
}
function YtInfoOverlay({ script }) {
  if (!script) return null;
  const { audioBuffers, restaurantName } = useVideoStore();
  const hasAudio = audioBuffers?.some((b) => b);
  const name = restaurantName || "MOOVLOG";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yt-info", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yt-info-title", children: script.title || name }),
    hasAudio && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yt-music-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-music yt-music-icon" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yt-music-ticker", children: [
        "Original Sound · ",
        name
      ] })
    ] })
  ] });
}
function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function drawMedia(ctx, media, effect, prog, CW, CH, SCALE, isExporting = false) {
  if (!media) {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, CW, CH);
    return;
  }
  if (media.type === "video") {
    const vid = media.src;
    if (vid._loadFailed || vid.readyState < 2) {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, CW, CH);
      return;
    }
    if (!isExporting && vid.paused) vid.play().catch(() => {
    });
  }
  const e = ease(prog);
  let sc = 1, ox = 0, oy = 0;
  switch (effect) {
    case "zoom-in":
      sc = 1 + e * 0.25;
      break;
    case "zoom-in-slow":
      sc = 1 + e * 0.1;
      break;
    case "zoom-out":
      sc = 1.25 - e * 0.25;
      break;
    case "pan-left":
      sc = 1.15;
      ox = (1 - e) * CW * 0.15;
      break;
    case "pan-right":
      sc = 1.15;
      ox = -(1 - e) * CW * 0.15;
      break;
    case "float-up":
      sc = 1.1;
      oy = (1 - e) * CH * 0.08;
      break;
    case "pan-up":
      sc = 1.12;
      oy = (1 - e) * CH * 0.1;
      break;
    case "drift":
      sc = 1.08;
      ox = Math.sin(e * Math.PI) * CW * 0.06;
      break;
    default:
      sc = 1.06 + e * 0.08;
  }
  const el = media.src;
  const sw = media.type === "video" ? el.videoWidth || CW : el.naturalWidth;
  const sh = media.type === "video" ? el.videoHeight || CH : el.naturalHeight;
  const r = Math.max(CW / sw, CH / sh), dw = sw * r, dh = sh * r;
  ctx.save();
  ctx.translate(CW / 2 + ox, CH / 2 + oy);
  ctx.scale(sc, sc);
  try {
    ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
  } catch {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
  }
  ctx.restore();
}
function drawVignetteGrad(ctx, CW, CH) {
  const g = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.18, CW / 2, CH / 2, CH * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}
function drawSubtitle(ctx, sc, animProg, CW, CH, SCALE) {
  if (!sc) return;
  const cap1 = sc.caption1 || sc.subtitle || "";
  const cap2 = sc.caption2 || "";
  if (!cap1 && !cap2) return;
  const pos = sc.subtitle_position || "lower";
  const style = sc.subtitle_style || "detail";
  const baseY = pos === "upper" ? CH * 0.16 : pos === "center" ? CH * 0.44 : CH * 0.7;
  const showCap2 = !!(cap2 && animProg > 0.6);
  const appear = showCap2 ? Math.min((animProg - 0.6) * 10, 1) : Math.min(animProg * 5, 1);
  const oy = (1 - ease(appear)) * 18 * SCALE;
  const popScale = appear < 0.45 ? 0.8 + appear / 0.45 * 0.32 : 1.12 - (appear - 0.45) / 0.55 * 0.12;
  ctx.save();
  ctx.globalAlpha = appear;
  ctx.translate(0, oy);
  ctx.translate(CW / 2, baseY);
  ctx.scale(popScale, popScale);
  ctx.translate(-CW / 2, -baseY);
  const SM = {
    hook: { main: "#FFFFFF", hl: "#FF2D55", sz: 54, bg: "gradient" },
    hero: { main: "#FFE340", hl: "#FF9F0A", sz: 50, bg: "gradient" },
    cta: { main: "#CCFF00", hl: "#FF3B30", sz: 48, bg: "gradient" },
    detail: { main: "#FFFFFF", hl: "#FFFFFF", sz: 44, bg: "simple" },
    bold_drop: { main: "#FFFFFF", hl: "#FFD60A", sz: 56, bg: "bold" },
    minimal: { main: "#FFFFFF", hl: "#FFFFFFA0", sz: 40, bg: "none" },
    elegant: { main: "#FFE8C0", hl: "#FFC87A", sz: 44, bg: "elegant" }
  };
  const S = SM[style] || SM.detail;
  const fs = Math.round(S.sz * SCALE);
  ctx.font = `500 ${fs}px 'Noto Sans KR', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const text = showCap2 ? cap2 : cap1;
  if (!text) {
    ctx.restore();
    return;
  }
  const cleanText = text.replace(/\*\*/g, "");
  const hasKwHl = cleanText !== text;
  const tw = ctx.measureText(hasKwHl ? cleanText : text).width;
  const padX = Math.round(30 * SCALE);
  const padY = Math.round(14 * SCALE);
  const bw = Math.min(tw + padX * 2, CW * 0.92);
  const bh = fs + padY * 2;
  if (S.bg === "gradient" || S.bg === "bold") {
    const bgGrad = ctx.createLinearGradient(CW / 2 - bw / 2, 0, CW / 2 + bw / 2, 0);
    if (S.bg === "bold") {
      bgGrad.addColorStop(0, "rgba(0,0,0,0.88)");
      bgGrad.addColorStop(0.5, "rgba(20,20,20,0.80)");
      bgGrad.addColorStop(1, "rgba(0,0,0,0.88)");
    } else {
      bgGrad.addColorStop(0, "rgba(0,0,0,0.80)");
      bgGrad.addColorStop(0.5, "rgba(0,0,0,0.65)");
      bgGrad.addColorStop(1, "rgba(0,0,0,0.80)");
    }
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(CW / 2 - bw / 2, baseY - bh / 2, bw, bh, Math.round(bh * 0.35));
    ctx.fill();
    const accentH = bh - Math.round(14 * SCALE);
    ctx.fillStyle = S.hl;
    ctx.beginPath();
    ctx.roundRect(CW / 2 - bw / 2, baseY - accentH / 2, Math.round(5 * SCALE), accentH, Math.round(3 * SCALE));
    ctx.fill();
    if (S.bg === "bold") {
      ctx.fillStyle = S.hl;
      ctx.beginPath();
      ctx.roundRect(
        CW / 2 - bw / 2,
        baseY + bh / 2 - Math.round(5 * SCALE),
        bw,
        Math.round(5 * SCALE),
        [0, 0, Math.round(bh * 0.35), Math.round(bh * 0.35)]
      );
      ctx.fill();
    }
  } else if (S.bg === "elegant") {
    ctx.fillStyle = "rgba(0,0,0,0.60)";
    ctx.beginPath();
    ctx.roundRect(CW / 2 - bw / 2, baseY - bh / 2, bw, bh, Math.round(10 * SCALE));
    ctx.fill();
    ctx.fillStyle = S.hl;
    ctx.fillRect(CW / 2 - bw / 2, baseY - bh / 2 + Math.round(8 * SCALE), Math.round(4 * SCALE), bh - Math.round(16 * SCALE));
  } else if (S.bg === "simple") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.roundRect(CW / 2 - bw / 2, baseY - bh / 2, bw, bh, Math.round(12 * SCALE));
    ctx.fill();
  }
  const strokeW = S.bg === "minimal" ? Math.round(9 * SCALE) : Math.round(7 * SCALE);
  ctx.lineWidth = strokeW;
  ctx.lineJoin = "round";
  if (hasKwHl) {
    const segs = text.split(/(\*\*.*?\*\*)/g).filter(Boolean).map((w) => {
      const isHl = w.startsWith("**") && w.endsWith("**");
      const str = isHl ? w.slice(2, -2) : w;
      ctx.font = isHl ? `900 ${Math.round(fs * 1.12)}px 'Noto Sans KR', sans-serif` : `500 ${fs}px 'Noto Sans KR', sans-serif`;
      return { str, isHl, width: ctx.measureText(str).width };
    });
    const totalW = segs.reduce((a, s) => a + s.width, 0);
    let curX = CW / 2 - totalW / 2;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    segs.forEach((seg) => {
      ctx.font = seg.isHl ? `900 ${Math.round(fs * 1.12)}px 'Noto Sans KR', sans-serif` : `500 ${fs}px 'Noto Sans KR', sans-serif`;
      if (seg.isHl) {
        ctx.fillStyle = "#FF2D55";
        ctx.fillRect(curX, baseY + fs * 0.06, seg.width, fs * 0.36);
        ctx.fillStyle = "#FFFFFF";
      } else {
        ctx.fillStyle = showCap2 ? S.main : style !== "detail" && style !== "minimal" && style !== "elegant" ? S.hl : S.main;
      }
      ctx.strokeStyle = "rgba(0,0,0,0.9)";
      ctx.strokeText(seg.str, curX, baseY);
      ctx.fillText(seg.str, curX, baseY);
      curX += seg.width;
    });
  } else {
    ctx.strokeStyle = "rgba(0,0,0,0.95)";
    ctx.strokeText(text, CW / 2, baseY);
    ctx.fillStyle = showCap2 ? S.main : style !== "detail" && style !== "minimal" && style !== "elegant" ? S.hl : S.main;
    ctx.fillText(text, CW / 2, baseY);
    if (style === "bold_drop" || style === "hook") {
      const words = text.split(" ");
      if (words.length > 1) {
        const firstWord = words[0];
        const rest = " " + words.slice(1).join(" ");
        const fw = ctx.measureText(firstWord).width;
        const rw = ctx.measureText(rest).width;
        const startX = CW / 2 - (fw + rw) / 2;
        ctx.font = `600 ${fs}px 'Noto Sans KR', sans-serif`;
        ctx.strokeText(firstWord, startX + fw / 2, baseY);
        ctx.fillStyle = S.hl;
        ctx.fillText(firstWord, startX + fw / 2, baseY);
        ctx.strokeText(rest, startX + fw + rw / 2, baseY);
        ctx.fillStyle = S.main;
        ctx.fillText(rest, startX + fw + rw / 2, baseY);
      }
    }
  }
  ctx.restore();
}
function drawChannelTop(ctx, name, CW, CH, SCALE) {
  if (!name) return;
  ctx.save();
  const topH = Math.round(CH * 0.13);
  const grad = ctx.createLinearGradient(0, 0, 0, topH);
  grad.addColorStop(0, "rgba(0,0,0,0.80)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, topH);
  const PAD = Math.round(18 * SCALE);
  const CY = Math.round(CH * 0.048);
  const AV = Math.round(24 * SCALE);
  ctx.fillStyle = "#7c3aed";
  ctx.beginPath();
  ctx.arc(PAD + AV, CY, AV, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = Math.round(2.5 * SCALE);
  ctx.stroke();
  ctx.font = `700 ${Math.round(14 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name[0]?.toUpperCase() || "M", PAD + AV, CY);
  const nameX = PAD + AV * 2 + Math.round(10 * SCALE);
  const nameFontSize = Math.round(28 * SCALE);
  ctx.font = `800 ${nameFontSize}px 'Black Han Sans', 'Noto Sans KR', sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = Math.round(8 * SCALE);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(2 * SCALE);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(name.slice(0, 16), nameX, CY - Math.round(7 * SCALE));
  ctx.shadowBlur = Math.round(4 * SCALE);
  ctx.shadowOffsetY = 0;
  ctx.font = `500 ${Math.round(14 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("@" + name.replace(/\s+/g, "").slice(0, 14), nameX, CY + Math.round(16 * SCALE));
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  const followX = CW - Math.round(96 * SCALE);
  const followW = Math.round(76 * SCALE);
  const followH = Math.round(32 * SCALE);
  const followY = CY - followH / 2;
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = Math.round(1.5 * SCALE);
  ctx.beginPath();
  ctx.roundRect(followX, followY, followW, followH, Math.round(followH / 2));
  ctx.fill();
  ctx.stroke();
  ctx.font = `600 ${Math.round(13 * SCALE)}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("팔로우", followX + followW / 2, CY);
  ctx.restore();
}
const ASPECT_MAP_EX = {
  "9:16": { CW: 1080, CH: 1920 },
  "1:1": { CW: 1080, CH: 1080 },
  "16:9": { CW: 1920, CH: 1080 }
};
function renderFrameToCtx(ctx, { script, loaded, aspectRatio, restaurantName }, si, prog, subAnim, isExporting = false) {
  const { CW, CH } = ASPECT_MAP_EX[aspectRatio] || ASPECT_MAP_EX["9:16"];
  const SCALE = Math.min(CW, CH) / 720;
  const sc = script?.scenes?.[si];
  if (!sc) return;
  const mediaIdx = sc.media_idx !== void 0 ? sc.media_idx : sc.idx ?? si;
  const media = loaded?.[mediaIdx % Math.max(loaded?.length || 1, 1)] || null;
  ctx.clearRect(0, 0, CW, CH);
  drawMedia(ctx, media, sc.effect, prog, CW, CH, SCALE, isExporting);
  drawVignetteGrad(ctx, CW, CH);
  drawChannelTop(ctx, restaurantName, CW, CH, SCALE);
  drawSubtitle(ctx, sc, subAnim, CW, CH, SCALE);
  if (prog < 0.1) {
    const flashT = 1 - prog / 0.1;
    ctx.fillStyle = `rgba(255,255,255,${flashT * 0.45})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}

function SceneEditor({ sceneIdx, onClose }) {
  const { script, updateScene, audioBuffers, updateAudioBuffer, addToast } = useVideoStore();
  const sc = script?.scenes?.[sceneIdx];
  if (!sc) return null;
  const [caption, setCaption] = reactExports.useState(sc.caption1 || sc.subtitle || "");
  const [narration, setNarration] = reactExports.useState(sc.narration || "");
  const [duration, setDuration] = reactExports.useState(sc.duration > 0 ? sc.duration : 3);
  const [loading, setLoading] = reactExports.useState(false);
  const [statusMsg, setStatusMsg] = reactExports.useState("");
  const handleSave = async () => {
    setLoading(true);
    try {
      updateScene(sceneIdx, { caption1: caption, subtitle: caption, duration });
      if (narration.trim() && narration !== sc.narration) {
        setStatusMsg("음성 재합성 중...");
        const text = preprocessNarration(narration);
        let newBuf = null;
        if (hasTypeCastKeys()) {
          const { _typeCastKeys } = await __vitePreload(async () => { const { _typeCastKeys } = await import('./engine-core-CD1WNmk6.js').then(n => n.B);return { _typeCastKeys }},true?__vite__mapDeps([0,1,2,3,4,5]):void 0).then((m) => ({ _typeCastKeys: [] }));
          let tcErr = null;
          for (let attempt = 0; attempt < 7; attempt++) {
            try {
              newBuf = await fetchTypeCastTTS(text);
              break;
            } catch (e) {
              tcErr = e;
              rotateTypeCastKey();
            }
          }
          if (!newBuf) throw tcErr || new Error("Typecast 모든 키 소진");
        } else {
          newBuf = await fetchTTSWithRetry(text, sceneIdx);
        }
        updateAudioBuffer(sceneIdx, newBuf);
        if (newBuf?.duration > 0) {
          const newDur = Math.max(2, Math.round((newBuf.duration + 0.4) * 10) / 10);
          updateScene(sceneIdx, { narration, duration: newDur });
          setDuration(newDur);
        }
        addToast(`SCENE ${sceneIdx + 1} 음성 재합성 완료!`, "ok");
      } else {
        updateScene(sceneIdx, { narration });
        addToast(`SCENE ${sceneIdx + 1} 수정 완료`, "ok");
      }
      onClose();
    } catch (e) {
      addToast(`음성 재생성 실패: ${e.message}`, "err");
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-backdrop", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-box", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-head", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "modal-title", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }),
        " ",
        statusMsg
      ] }) : `SCENE ${sceneIdx + 1} 편집` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "modal-close", onClick: onClose, children: "✕" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "modal-label", children: "캡션 (자막)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        className: "modal-input",
        type: "text",
        value: caption,
        onChange: (e) => setCaption(e.target.value),
        placeholder: "자막 텍스트"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "modal-label", children: "씬 재생 길이 (초)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        className: "modal-input",
        type: "number",
        step: "0.1",
        min: "0.5",
        max: "15",
        value: duration,
        onChange: (e) => setDuration(parseFloat(e.target.value))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "modal-label", children: "나레이션" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        className: "modal-textarea",
        rows: 4,
        value: narration,
        onChange: (e) => setNarration(e.target.value),
        placeholder: "나레이션 텍스트"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-btns", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "modal-btn-cancel", onClick: onClose, children: "취소" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "modal-btn-save", onClick: handleSave, disabled: loading, children: loading ? "처리 중..." : "저장" })
    ] })
  ] }) });
}

function SceneList() {
  const { script, scene: currentScene } = useVideoStore();
  const [editIdx, setEditIdx] = reactExports.useState(null);
  if (!script?.scenes?.length) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "scenes-details", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-list-ul" }),
        " 생성된 장면 스크립트"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scene-list", children: script.scenes.map((sc, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `scard ${i === currentScene ? "active" : ""}`,
          id: `sc${i}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "scard-num", children: [
              "SCENE ",
              i + 1,
              " · ",
              formatDuration(Math.round(sc.duration || 0)),
              " · ",
              sc.subtitle_style || "detail",
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "scard-edit-btn", onClick: () => setEditIdx(i), children: "수정" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "scard-sub", children: [
              sc.caption1,
              sc.caption2 ? ` / ${sc.caption2}` : ""
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scard-nar", children: sc.narration })
          ]
        },
        i
      )) })
    ] }),
    editIdx !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(SceneEditor, { sceneIdx: editIdx, onClose: () => setEditIdx(null) })
  ] });
}

function ExportPanel() {
  const { script, audioBuffers, restaurantName, addToast, setExporting, exporting, pipelineSessionId: pipelineSessionId2, files } = useVideoStore();
  const [btnText, setBtnText] = reactExports.useState("영상 저장하기");
  const [ffmpegText, setFfmpegText] = reactExports.useState("📦 FFmpeg 내보내기 (시네마틱)");
  const [ffmpegBusy, setFfmpegBusy] = reactExports.useState(false);
  const [ffmpegPct, setFfmpegPct] = reactExports.useState(0);
  const [thumbBusy, setThumbBusy] = reactExports.useState(false);
  const [hybridBusy, setHybridBusy] = reactExports.useState(false);
  const doExport = async () => {
    if (exporting) return;
    if (!script?.scenes?.length) {
      addToast("먼저 영상을 생성해주세요", "err");
      return;
    }
    setExporting(true);
    setBtnText("준비 중...");
    const ac = getAudioCtx();
    if (ac?.state === "suspended") await ac.resume();
    try {
      const hasWebCodecs = typeof VideoEncoder !== "undefined" && typeof AudioEncoder !== "undefined" && typeof VideoEncoder.isConfigSupported === "function" && (typeof Muxer !== "undefined" || typeof Muxer$1 !== "undefined");
      if (hasWebCodecs) {
        await doExportWebCodecs(script, audioBuffers, restaurantName, setBtnText, addToast);
      } else {
        addToast("WebCodecs 미지원 브라우저 — Chrome을 이용해주세요", "err");
      }
    } catch (err) {
      addToast("저장 오류: " + (err?.message || String(err)), "err");
      setBtnText("영상 저장하기");
    } finally {
      setExporting(false);
    }
  };
  const doExportAudio = async () => {
    if (!audioBuffers?.some((b) => b)) {
      addToast("AI 음성이 없습니다", "err");
      return;
    }
    addToast("음성 WAV 저장 중...", "inf");
    try {
      const ac = getAudioCtx();
      const totalDur = script.scenes.reduce((a, s) => a + (s.duration > 0 && isFinite(s.duration) ? s.duration : 3), 0);
      const SR = 44100;
      const totalSamples = Math.ceil(SR * totalDur);
      const mixed = new Float32Array(totalSamples);
      let offset = 0;
      for (let i = 0; i < script.scenes.length; i++) {
        const dur = script.scenes[i].duration > 0 && isFinite(script.scenes[i].duration) ? script.scenes[i].duration : 3;
        const buf = audioBuffers[i];
        if (buf) {
          const ch = buf.getChannelData(0);
          for (let j = 0; j < Math.min(ch.length, totalSamples - offset); j++) mixed[offset + j] = ch[j];
        }
        offset += Math.round(dur * SR);
      }
      const wavBlob = new Blob([encodeWav(mixed, SR)], { type: "audio/wav" });
      downloadBlob(wavBlob, `moovlog_${sanitizeName(restaurantName)}.wav`);
      addToast("음성 WAV 저장 완료!", "ok");
    } catch (e) {
      addToast("음성 저장 오류: " + e.message, "err");
    }
  };
  const ensureIsolation = () => {
    if (crossOriginIsolated) return true;
    addToast("격리 모드가 아니어서 FFmpeg가 느리거나 실패할 수 있습니다. 우선 시도합니다.", "inf");
    return true;
  };
  const doExportThumbnail = async () => {
    if (thumbBusy) return;
    if (!script?.scenes?.length || !files?.length) {
      addToast("시작 전 영상을 만들어주세요", "err");
      return;
    }
    setThumbBusy(true);
    try {
      const blob = await extractThumbnail(script.scenes, files, script, (msg) => addToast(msg, "inf"));
      downloadBlob(blob, `moovlog_thumb_${sanitizeName(restaurantName)}.jpg`);
      addToast("썸네일 저장 완료! 최고등급 씨 추출 ✨", "ok");
    } catch (e) {
      addToast("썸네일 오류: " + e.message, "err");
    } finally {
      setThumbBusy(false);
    }
  };
  const doExportHybrid = async () => {
    if (hybridBusy || exporting) return;
    if (!script?.scenes?.length) {
      addToast("먼저 영상을 생성해주세요", "err");
      return;
    }
    ensureIsolation();
    setHybridBusy(true);
    setExporting(true);
    try {
      addToast("하이브리드: WebCodecs 로 빠르게 렌더링 후 FFmpeg LUT 마감 중...", "inf");
      const rawBlob = await new Promise((resolve, reject) => {
        doExportWebCodecs(script, audioBuffers, restaurantName, (t) => {
        }, addToast).then(resolve).catch(reject);
      });
      if (files?.length) {
        const cinematic = await renderCinematicFinish(
          rawBlob || new Blob(),
          script.theme,
          (msg, pct) => addToast(msg, "inf")
        );
        downloadBlob(cinematic, `moovlog_hybrid_${sanitizeName(restaurantName)}.mp4`);
        addToast("하이브리드 렌더링 완료! 🎬", "ok");
      }
    } catch (e) {
      try {
        const blob = await renderVideoWithFFmpeg(script.scenes, files, script, (msg, pct) => {
          if (typeof pct === "number") addToast(`하이브리드 폴백: ${msg}`, "inf");
        });
        downloadBlob(blob, `moovlog_hybrid_${sanitizeName(restaurantName)}.mp4`);
        addToast("하이브리드(FFmpeg 대체) 완료!", "ok");
      } catch (e2) {
        addToast("하이브리드 오류: " + e2.message, "err");
      }
    } finally {
      setHybridBusy(false);
      setExporting(false);
    }
  };
  const doExportFFmpeg = async () => {
    if (ffmpegBusy) return;
    if (!script?.scenes?.length) {
      addToast("먼저 영상을 생성해주세요", "err");
      return;
    }
    if (!files?.length) {
      addToast("미디어 파일이 없습니다", "err");
      return;
    }
    ensureIsolation();
    setFfmpegBusy(true);
    setFfmpegPct(0);
    try {
      const blob = await renderVideoWithFFmpeg(
        script.scenes,
        files,
        script,
        (msg, pct) => {
          setFfmpegText(`🎬 ${msg}`);
          if (typeof pct === "number") setFfmpegPct(pct);
        }
      );
      downloadBlob(blob, `moovlog_ffmpeg_${sanitizeName(restaurantName)}.mp4`);
      addToast("FFmpeg 렌더링 완료!", "ok");
      setFfmpegText("📦 FFmpeg 내보내기 (시네마틱)");
      setFfmpegPct(0);
    } catch (err) {
      const msg = err?.message || String(err);
      addToast("FFmpeg 오류: " + msg, "err");
      if (/sharedarraybuffer|crossoriginisolated|coop|coep|security|worker/i.test(msg)) {
        addToast("FFmpeg 격리 오류로 기본 저장으로 자동 전환합니다.", "inf");
        await doExport().catch(() => {
        });
      }
      setFfmpegText("📦 FFmpeg 내보내기 (시네마틱)");
      setFfmpegPct(0);
    } finally {
      setFfmpegBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dl-box", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "dl-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-download" }),
      " 영상 저장"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "dl-desc", children: [
      "나레이션 음성이 자동으로 합성됩니다.",
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      "버튼을 누르면 ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "음성 포함 MP4 영상" }),
      "이 저장됩니다."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "dl-btn", onClick: doExport, disabled: exporting, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${exporting ? "fa-spinner fa-spin" : "fa-download"}` }),
      " ",
      btnText
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "dl-audio-btn", onClick: doExportAudio, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-music" }),
      " 음성만 저장 (WAV)"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "dl-audio-btn",
        onClick: doExportFFmpeg,
        disabled: ffmpegBusy,
        style: { marginTop: "8px" },
        title: "FFmpeg WASM 시네마틱 렌더링 (LUT·Ken Burns·자막)",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${ffmpegBusy ? "fa-spinner fa-spin" : "fa-film"}` }),
          " ",
          ffmpegText
        ]
      }
    ),
    "      ",
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "dl-audio-btn",
        onClick: doExportThumbnail,
        disabled: thumbBusy,
        style: { marginTop: "6px" },
        title: "최고화질 썸네일 추출",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${thumbBusy ? "fa-spinner fa-spin" : "fa-image"}` }),
          " ",
          thumbBusy ? "썸네일 추출 중..." : "베스트 썸네일 저장"
        ]
      }
    ),
    "      ",
    ffmpegBusy && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { margin: "6px 0 2px", background: "rgba(255,255,255,0.08)", borderRadius: "6px", overflow: "hidden", height: "6px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      height: "100%",
      background: "linear-gradient(90deg,#7c3aed,#a855f7)",
      width: `${ffmpegPct}%`,
      transition: "width 0.4s ease",
      borderRadius: "6px"
    } }) }),
    ffmpegBusy && ffmpegPct > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: "0.68rem", color: "#a855f7", textAlign: "right", margin: "2px 0 0" }, children: [
      ffmpegPct,
      "%"
    ] })
  ] });
}
function encodeWav(f32, SR) {
  const N = f32.length, bps = 16, ch = 1, blockAlign = ch * bps / 8;
  const dataSize = N * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const ws = (off, s) => s.split("").forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)));
  ws(0, "RIFF");
  v.setUint32(4, 36 + dataSize, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, SR, true);
  v.setUint32(28, SR * blockAlign, true);
  v.setUint16(32, blockAlign, true);
  v.setUint16(34, bps, true);
  ws(36, "data");
  v.setUint32(40, dataSize, true);
  for (let i = 0; i < N; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true);
  }
  return buf;
}
async function doExportWebCodecs(script, audioBuffers, restaurantName, setBtnText, addToast) {
  const { loaded, aspectRatio } = useVideoStore.getState();
  const { CW, CH } = ASPECT_MAP_EX[aspectRatio] || ASPECT_MAP_EX["9:16"];
  const FPS = 60;
  const sceneDurs = script.scenes.map((s) => s.duration > 0 && isFinite(s.duration) ? s.duration : 3);
  const totalDur = sceneDurs.reduce((a, b) => a + b, 0);
  const nFrames = Math.ceil(totalDur * FPS);
  const VBR = 2e7;
  const ABR = 192e3;
  setBtnText("코덱 확인 중...");
  let fmt = null;
  if (typeof Muxer !== "undefined") {
    for (const vc of [
      { enc: "avc1.640033", mux: "avc" },
      { enc: "avc1.4d0033", mux: "avc" },
      { enc: "avc1.42001f", mux: "avc" }
    ]) {
      try {
        const s = await VideoEncoder.isConfigSupported({ codec: vc.enc, width: CW, height: CH, bitrate: VBR, framerate: FPS });
        if (s.supported) {
          fmt = { vc, MuxLib: Mp4Muxer, ext: "mp4", mime: "video/mp4", ac: { enc: "mp4a.40.2", mux: "aac" } };
          break;
        }
      } catch {
      }
    }
  }
  if (!fmt && typeof Muxer$1 !== "undefined") {
    for (const vc of [{ enc: "vp09.00.41.08", mux: "V_VP9" }, { enc: "vp08.00.41.08", mux: "V_VP8" }]) {
      try {
        const s = await VideoEncoder.isConfigSupported({ codec: vc.enc, width: CW, height: CH, bitrate: VBR, framerate: FPS });
        if (s.supported) {
          fmt = { vc, MuxLib: WebmMuxer, ext: "webm", mime: "video/webm", ac: { enc: "opus", mux: "A_OPUS" } };
          break;
        }
      } catch {
      }
    }
  }
  if (!fmt) throw new Error("지원하는 코덱 없음 — Chrome을 이용해주세요");
  let pcm = null;
  if (audioBuffers?.some((b) => b)) {
    setBtnText("음성 처리 중... 3%");
    try {
      const SR = 48e3;
      const totalSamples = Math.ceil(SR * totalDur);
      const mixed = new Float32Array(totalSamples);
      let offset = 0;
      for (let i = 0; i < script.scenes.length; i++) {
        const dur = script.scenes[i].duration > 0 && isFinite(script.scenes[i].duration) ? script.scenes[i].duration : 3;
        const buf = audioBuffers[i];
        if (buf) {
          const ch = buf.getChannelData(0);
          const ac = getAudioCtx();
          let resampled = ch;
          if (buf.sampleRate !== SR) {
            const offCtx = new OfflineAudioContext(1, Math.ceil(buf.length * SR / buf.sampleRate), SR);
            const src = offCtx.createBufferSource();
            src.buffer = buf;
            src.connect(offCtx.destination);
            src.start(0);
            const rendered = await offCtx.startRendering();
            resampled = rendered.getChannelData(0);
          }
          for (let j = 0; j < Math.min(resampled.length, totalSamples - offset); j++) {
            mixed[offset + j] = resampled[j];
          }
        }
        offset += Math.round(dur * SR);
      }
      pcm = mixed;
    } catch (e) {
      console.warn("[Export] 오디오 렌더 실패:", e.message);
    }
  }
  const { Muxer: Muxer$2, ArrayBufferTarget } = fmt.MuxLib;
  const muxTarget = new ArrayBufferTarget();
  const muxer = new Muxer$2({
    target: muxTarget,
    video: { codec: fmt.vc.mux, width: CW, height: CH, frameRate: FPS },
    ...pcm ? { audio: { codec: fmt.ac.mux, numberOfChannels: 1, sampleRate: 48e3 } } : {},
    firstTimestampBehavior: "offset",
    ...fmt.ext === "mp4" ? { fastStart: "in-memory" } : {}
  });
  const videoEnc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (err) => {
      throw new Error(err?.message || String(err) || "VideoEncoder 오류");
    }
  });
  videoEnc.configure({ codec: fmt.vc.enc, width: CW, height: CH, bitrate: VBR, framerate: FPS, latencyMode: "quality", bitrateMode: "variable" });
  const snapCanvas = new OffscreenCanvas(CW, CH);
  const snapCtx = snapCanvas.getContext("2d", { willReadFrequently: true });
  const renderCtx = { script, loaded, aspectRatio, restaurantName };
  let globalFrame = 0;
  for (let si = 0; si < script.scenes.length; si++) {
    const dur = sceneDurs[si];
    const nSceneFrames = Math.ceil(dur * FPS);
    const media = loaded?.[(script.scenes[si].idx ?? 0) % Math.max(loaded?.length || 1, 1)] || null;
    if (media?.type === "video" && media.src && !media.src._loadFailed) {
      media.src.pause();
      media.src.currentTime = 0;
      await new Promise((r) => {
        media.src.onseeked = r;
        setTimeout(r, 200);
      });
    }
    for (let f = 0; f < nSceneFrames; f++) {
      const prog = nSceneFrames > 1 ? f / (nSceneFrames - 1) : 0;
      if (media?.type === "video" && media.src && !media.src._loadFailed) {
        const vDur = media.src.duration;
        const targetTime = vDur && isFinite(vDur) ? Math.min(prog * vDur, vDur - 0.1) : prog * dur;
        if (Math.abs(media.src.currentTime - targetTime) > 0.08) {
          await new Promise((r) => {
            media.src.currentTime = targetTime;
            media.src.onseeked = r;
            setTimeout(r, 150);
          });
        }
      }
      renderFrameToCtx(snapCtx, renderCtx, si, prog, Math.min(prog, 1), true);
      const vf = new VideoFrame(snapCanvas, {
        timestamp: Math.round(globalFrame * 1e6 / FPS),
        duration: Math.round(1e6 / FPS)
      });
      if (videoEnc.encodeQueueSize > 30) {
        await new Promise((resolve) => {
          const checkQ = () => videoEnc.encodeQueueSize <= 10 ? resolve() : setTimeout(checkQ, 10);
          checkQ();
        });
      }
      videoEnc.encode(vf, { keyFrame: globalFrame % FPS === 0 });
      vf.close();
      if (globalFrame % 15 === 0) {
        const pct = Math.round(globalFrame / nFrames * (pcm ? 65 : 90));
        setBtnText(`인코딩 중... ${pct}%`);
        await new Promise((r) => setTimeout(r, 0));
      }
      globalFrame++;
    }
  }
  await videoEnc.flush();
  videoEnc.close();
  if (pcm) {
    setBtnText("음성 인코딩 중... 70%");
    const audioEnc = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (err) => {
        throw new Error(err?.message || String(err) || "AudioEncoder 오류");
      }
    });
    audioEnc.configure({ codec: fmt.ac.enc, sampleRate: 48e3, numberOfChannels: 1, bitrate: ABR });
    const CHUNK = 1920;
    for (let i = 0; i < pcm.length; i += CHUNK) {
      const slice = pcm.slice(i, Math.min(i + CHUNK, pcm.length));
      const ad = new AudioData({ format: "f32", sampleRate: 48e3, numberOfFrames: slice.length, numberOfChannels: 1, timestamp: Math.round(i * 1e6 / 48e3), data: slice.buffer });
      audioEnc.encode(ad);
      ad.close();
      if (i % (CHUNK * 30) === 0) await new Promise((r) => setTimeout(r, 0));
    }
    await audioEnc.flush();
    audioEnc.close();
  }
  setBtnText("파일 생성 중... 98%");
  await new Promise((r) => setTimeout(r, 80));
  muxer.finalize();
  const { buffer } = muxTarget;
  if (!buffer || buffer.byteLength < 1e3) throw new Error("영상 데이터 생성 실패");
  const blob = new Blob([buffer], { type: fmt.mime });
  downloadBlob(blob, `moovlog_${sanitizeName(restaurantName)}.${fmt.ext}`);
  setBtnText("다시 저장하기");
  addToast(pcm ? `✓ AI 음성 포함 ${fmt.ext.toUpperCase()} 저장 완료!` : `✓ ${fmt.ext.toUpperCase()} 저장 완료!`, "ok");
  firebaseUploadVideo(blob, fmt.ext, restaurantName, pipelineSessionId).catch(() => {
  });
}

function processNaver(text) {
  const raw = text || "";
  const t = raw.startsWith("#협찬") ? raw : "#협찬 " + raw;
  if (t.length <= 300) return t;
  const cut = t.slice(0, 300);
  const sp = cut.lastIndexOf(" ");
  return sp > 0 ? cut.slice(0, sp) : cut;
}
function processYoutube(text) {
  const raw = text || "";
  if (raw.length <= 100) return raw;
  const cut = raw.slice(0, 100);
  const sp = cut.lastIndexOf(" ");
  return sp > 85 ? cut.slice(0, sp) : cut;
}
function processTikTok(text) {
  const tags = (text || "").match(/#[^\s#]+/g) || [];
  return tags.slice(0, 5).join(" ");
}
function processInsta(caption) {
  if (!caption) return "";
  const sep = caption.indexOf("\n\n");
  if (sep !== -1) {
    const desc = caption.slice(0, sep);
    const tags2 = (caption.slice(sep + 2).match(/#[^\s#]+/g) || []).slice(0, 5);
    return desc + "\n\n" + tags2.join(" ");
  }
  const tags = (caption.match(/#[^\s#]+/g) || []).slice(0, 5);
  return tags.length ? tags.join(" ") : caption;
}
function SNSTags({ script }) {
  if (!script) return null;
  const { addToast } = useVideoStore();
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("클립보드 복사 완료!", "ok");
    } catch {
      addToast("복사 실패", "err");
    }
  };
  const tags = [
    { badge: "naver", label: "N 클립", limit: "300자 (#협찬 포함)", text: processNaver(script.naver_clip_tags) },
    { badge: "youtube", label: "▶ 쇼츠", limit: "100자 이내", text: processYoutube(script.youtube_shorts_tags) },
    { badge: "insta", label: "◎ 릴스", limit: "캡션 + 5개 태그", text: processInsta(script.instagram_caption) },
    { badge: "tiktok", label: "♪ 틱톡", limit: "5개만", text: processTikTok(script.tiktok_tags) }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-wrap", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "sns-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-hashtag" }),
      " SNS 플랫폼별 태그"
    ] }),
    tags.map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-card-head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `sns-badge ${t.badge}`, children: t.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sns-limit", children: t.limit }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "sns-copy-btn", onClick: () => copy(t.text), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
          " 복사"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sns-text", children: t.text })
    ] }, i))
  ] });
}

function AutoRecovery({ scenes, audioBuffers, addToast }) {
  const { updateAudioBuffer, updateScene } = useVideoStore();
  const [recovering, setRecovering] = reactExports.useState({});
  const failedScenes = (scenes || []).map((sc, i) => ({ sc, i })).filter(({ sc, i }) => sc.narration?.trim() && !audioBuffers?.[i]);
  if (!failedScenes.length) return null;
  const handleResynth = async (sc, i) => {
    if (recovering[i]) return;
    setRecovering((r) => ({ ...r, [i]: true }));
    addToast(`씬 ${i + 1} 음성 재합성 중...`, "inf");
    try {
      const ac = getAudioCtx();
      if (ac?.state === "suspended") await ac.resume();
      const text = preprocessNarration(sc.narration);
      const buf = await fetchTTSWithRetry(text, i, sc.energy_level ?? 3);
      updateAudioBuffer(i, buf);
      const newDur = Math.max(2, Math.round((buf.duration + 0.4) * 10) / 10);
      updateScene(i, { duration: newDur });
      addToast(`씬 ${i + 1} 음성 복구 완료 ✅`, "ok");
    } catch (e) {
      addToast(`씬 ${i + 1} 재합성 실패: ${e.message}`, "err");
    } finally {
      setRecovering((r) => ({ ...r, [i]: false }));
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-assets-box", style: { border: "1px solid rgba(255,80,80,0.4)", background: "rgba(255,50,50,0.07)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "marketing-title", style: { color: "#ff6b6b" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-exclamation-triangle" }),
      " ",
      failedScenes.length,
      "개 씬 음성 누락 — 자동 복구"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }, children: failedScenes.map(({ sc, i }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "8px 12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { flex: 1, fontSize: "0.8rem", color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
        "씬 ",
        i + 1,
        ": ",
        sc.caption1 || sc.narration?.substring(0, 20) || "(내용 없음)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => handleResynth(sc, i),
          disabled: !!recovering[i],
          style: {
            padding: "6px 14px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            background: recovering[i] ? "#555" : "#e74c3c",
            color: "#fff",
            fontSize: "0.8rem",
            fontWeight: 700,
            whiteSpace: "nowrap"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${recovering[i] ? "fa-spinner fa-spin" : "fa-redo"}` }),
            recovering[i] ? " 합성 중..." : " 음성 복구"
          ]
        }
      )
    ] }, i)) })
  ] });
}
function PlatformOptimizer({ target, setTarget, addToast }) {
  const PLATFORMS = [
    { id: "reels", label: "◎ 릴스", color: "#E1306C", desc: "9:16 세이프존 적용" },
    { id: "shorts", label: "▶ 쇼츠", color: "#FF0000", desc: "YT UI 하단 회피" },
    { id: "tiktok", label: "♪ 틱톡", color: "#6FC2F5", desc: "하단 버튼 영역 확보" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-assets-box", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "marketing-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-layer-group" }),
      " 플랫폼 최적화 (세이프 존)"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginTop: "10px" }, children: PLATFORMS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => {
          setTarget(p.id);
          addToast(`${p.label} 세이프존 모드 적용됨`, "ok");
        },
        style: {
          flex: 1,
          padding: "10px 6px",
          borderRadius: "12px",
          border: `1.5px solid ${target === p.id ? p.color : "#333"}`,
          background: target === p.id ? `${p.color}22` : "#1a1a1a",
          color: target === p.id ? p.color : "#aaa",
          fontSize: "0.8rem",
          fontWeight: target === p.id ? 800 : 500,
          cursor: "pointer",
          transition: "all 0.18s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: p.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "0.65rem", opacity: 0.7 }, children: p.desc })
        ]
      },
      p.id
    )) })
  ] });
}
function ThumbnailMaker({ scenes, files, script, addToast }) {
  const [loading, setLoading] = reactExports.useState(false);
  const [thumbUrl, setThumbUrl] = reactExports.useState(null);
  const handleCreate = async () => {
    if (loading) return;
    setLoading(true);
    addToast("AI가 가장 식욕 자극 프레임을 찾는 중...", "inf");
    try {
      const blob = await extractThumbnail(scenes, files, script, (msg) => console.log("[Thumb]", msg));
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
      setThumbUrl(URL.createObjectURL(blob));
      addToast("바이럴 썸네일 생성 완료! ✨", "ok");
    } catch (err) {
      addToast("썸네일 생성 실패: " + err.message, "err");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-assets-box", style: { marginTop: "12px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "marketing-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-camera-retro" }),
      " AI 썸네일 팩토리"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "make-btn",
        onClick: handleCreate,
        disabled: loading,
        style: { marginTop: "10px", height: "44px", fontSize: "0.88rem", opacity: loading ? 0.7 : 1 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: loading ? "fas fa-spinner fa-spin" : "fas fa-magic" }),
          loading ? " 베스트 프레임 분석 중..." : " 고대비 바이럴 썸네일 추출"
        ]
      }
    ),
    thumbUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "14px", display: "flex", alignItems: "center", gap: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: thumbUrl, alt: "썸네일", style: { width: "80px", height: "142px", objectFit: "cover", borderRadius: "8px", border: "2px solid #FF2D55" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#aaa", fontSize: "0.75rem", margin: 0 }, children: "저장 후 릴스 표지로 직접 업로드하세요!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: thumbUrl,
            download: "moovlog_thumb.jpg",
            style: {
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#FF2D55",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              textAlign: "center"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-download" }),
              " 이미지 저장"
            ]
          }
        )
      ] })
    ] })
  ] });
}
function HookPicker({ variations, script, setScript, addToast }) {
  const { updateAudioBuffer } = useVideoStore();
  const [loading, setLoading] = reactExports.useState(false);
  if (!variations?.length) return null;
  const LABELS = { shock: "🔥 충격형", info: "ℹ️ 정보형", pov: "👤 1인칭" };
  const handleSelect = async (h) => {
    if (loading) return;
    setLoading(true);
    addToast(`${LABELS[h.type] || h.type} 스타일로 변경 중...`, "inf");
    try {
      const ac = getAudioCtx();
      if (ac?.state === "suspended") await ac.resume();
      const processedText = preprocessNarration(h.narration);
      const newBuffer = await fetchTTSWithRetry(processedText, 0);
      const newScenes = script.scenes ? [...script.scenes] : [];
      if (newScenes.length > 0) {
        newScenes[0] = {
          ...newScenes[0],
          caption1: h.caption1,
          caption2: h.caption2,
          narration: h.narration,
          duration: Math.max(2, Math.round((newBuffer.duration + 0.4) * 10) / 10)
        };
      }
      updateAudioBuffer(0, newBuffer);
      setScript({ ...script, scenes: newScenes });
      addToast(`${LABELS[h.type] || h.type} 훅 & 음성 교체 완료! ✨`, "ok");
    } catch (err) {
      console.error("[HookPicker] 재합성 실패:", err);
      addToast("음성 재합성 실패: 자막만 교체합니다.", "err");
      const newScenes = script.scenes ? [...script.scenes] : [];
      if (newScenes.length > 0) {
        newScenes[0] = { ...newScenes[0], caption1: h.caption1, caption2: h.caption2, narration: h.narration };
      }
      setScript({ ...script, scenes: newScenes });
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hook-picker-wrap", style: { opacity: loading ? 0.7 : 1 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "marketing-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${loading ? "fa-spinner fa-spin" : "fa-fish"}` }),
      loading ? " AI가 목소리 만드는 중..." : " AI PD의 3종 훅 전략"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hook-grid", children: variations.map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `hook-card${loading ? " disabled" : ""}`, onClick: () => handleSelect(h), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hook-type", children: LABELS[h.type] || h.type }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "hook-cap", children: h.caption1 })
    ] }, i)) })
  ] });
}
function MarketingAssets({ marketing, addToast }) {
  if (!marketing) return null;
  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} 복사 완료! ✨`, "ok");
    } catch {
      addToast("복사 실패 — 직접 선택해서 복사해주세요", "err");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-assets-box", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "marketing-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-rocket" }),
      " 릴스 떡상 마케팅 키트"
    ] }),
    marketing.hook_title && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", children: "🎣 훅 제목" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "marketing-copy-btn", onClick: () => copy(marketing.hook_title, "훅 제목"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
        " 복사"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-text", children: marketing.hook_title })
    ] }),
    marketing.caption && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", children: "✍️ 인스타 캡션" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "marketing-copy-btn", onClick: () => copy(marketing.caption, "인스타 캡션"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
        " 복사"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-text", style: { whiteSpace: "pre-line", fontSize: "0.75rem" }, children: marketing.caption })
    ] }),
    marketing.hashtags_30 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", children: "🏷️ 해시태그 30개" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "marketing-copy-btn", onClick: () => copy(marketing.hashtags_30, "해시태그 30개"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
        " 한번에 복사"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-text", style: { fontSize: "0.68rem", lineHeight: 1.8, color: "#a855f7" }, children: marketing.hashtags_30 })
    ] }),
    marketing.receipt_review && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", children: "🧢 네이버 영수증 리뷰" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "marketing-copy-btn", onClick: () => copy(marketing.receipt_review, "영수증 리뷰"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
        " 복사"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-text", children: marketing.receipt_review })
    ] })
  ] });
}
function ResultScreen() {
  const {
    script,
    audioBuffers,
    files,
    targetPlatform,
    setTargetPlatform,
    reset,
    setShowResult,
    addToast,
    setScript
  } = useVideoStore();
  const totalSec = script?.scenes?.reduce((a, s) => a + (s.duration || 0), 0) || 0;
  const hasAudio = audioBuffers?.some((b) => b);
  const [kitHistory, setKitHistory] = reactExports.useState([]);
  const [kitSearch, setKitSearch] = reactExports.useState("");
  const [showKitHistory, setShowKitHistory] = reactExports.useState(false);
  const [kitLoading, setKitLoading] = reactExports.useState(false);
  const [loadedKit, setLoadedKit] = reactExports.useState(null);
  const [kitDeleting, setKitDeleting] = reactExports.useState(false);
  const kitPanelRef = reactExports.useRef(null);
  const loadKitHistory = async (kw = "") => {
    setKitLoading(true);
    try {
      const results = kw.trim() ? await searchMarketingKits(kw.trim()) : await getMarketingKits(20);
      setKitHistory(results);
    } catch (e) {
      addToast("이력 로드 실패: " + e.message, "err");
    } finally {
      setKitLoading(false);
    }
  };
  const loadKitFromHistory = (item) => {
    setScript({
      ...script,
      marketing: {
        hook_title: item.hookTitle || "",
        caption: item.caption || "",
        hashtags_30: item.hashtags30 || "",
        receipt_review: item.receiptReview || ""
      },
      hook_variations: item.hookVariations || [],
      naver_clip_tags: item.naverClipTags || "",
      youtube_shorts_tags: item.youtubeShortsTags || "",
      instagram_caption: item.instagramCaption || "",
      tiktok_tags: item.tiktokTags || "",
      hashtags: item.hashtags || ""
    });
    setShowKitHistory(false);
    setLoadedKit(item);
    addToast(`"${item.restaurant}" 마케팅 키트 로드 완료 ✓`, "ok");
    setTimeout(() => kitPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };
  const deleteKit = async (id, restaurantName, e) => {
    e?.stopPropagation();
    if (!id || kitDeleting) return;
    if (!confirm(`"${restaurantName}" 키트를 삭제할까요?`)) return;
    setKitDeleting(true);
    try {
      await deleteMarketingKit(id);
      setKitHistory((h) => h.filter((x) => x.id !== id));
      if (loadedKit?.id === id) setLoadedKit(null);
      addToast("마케팅 키트 삭제 완료", "ok");
    } catch (err) {
      addToast("삭제 실패: " + err.message, "err");
    } finally {
      setKitDeleting(false);
    }
  };
  const goBack = () => {
    setShowResult(false);
  };
  const doReset = () => {
    reset();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "result-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "result-inner", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "result-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "result-back-btn", onClick: goBack, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-arrow-left" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "result-title-box", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "result-label", children: "생성 완료" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "result-sub", children: [
          script?.scenes?.length || 0,
          "개 씬 · ",
          totalSec.toFixed(1),
          "초"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "badge-group", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `audio-badge ${hasAudio ? "" : "muted"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${hasAudio ? "fa-microphone-alt" : "fa-volume-mute"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: hasAudio ? "AI 보이스" : "무음" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(VideoPlayer, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AutoRecovery, { scenes: script?.scenes, audioBuffers, addToast }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PlatformOptimizer, { target: targetPlatform, setTarget: setTargetPlatform, addToast }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbnailMaker, { scenes: script?.scenes || [], files, script, addToast }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SceneList, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ExportPanel, {}),
    (script?.marketing || script?.hook_title || script?.caption) && /* @__PURE__ */ jsxRuntimeExports.jsx(
      MarketingAssets,
      {
        marketing: script.marketing || {
          hook_title: script.hook_title || "",
          caption: script.caption || "",
          hashtags_30: script.hashtags_30 || "",
          receipt_review: script.receipt_review || ""
        },
        addToast
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: kitPanelRef, className: "marketing-assets-box", style: { marginTop: 8, ...loadedKit ? { border: "1.5px solid #7c3aed66", background: "rgba(124,58,237,0.07)" } : {} }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-title", style: { margin: 0 }, children: loadedKit ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-check-circle", style: { color: "#7c3aed" } }),
          " ",
          loadedKit.restaurant
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-history" }),
          " 이전 마케팅 키트"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 6, alignItems: "center" }, children: [
          loadedKit && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  setLoadedKit(null);
                  setShowKitHistory(true);
                },
                style: { background: "none", color: "#aaa", border: "1px solid #444", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: "0.73rem" },
                children: "← 목록"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: (e) => deleteKit(loadedKit.id, loadedKit.restaurant, e),
                disabled: kitDeleting,
                style: { background: "none", color: "#ff6b6b", border: "1px solid #ff6b6b55", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: "0.73rem" },
                children: kitDeleting ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) : "🗑️ 삭제"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setLoadedKit(null), style: { background: "none", color: "#666", border: "none", cursor: "pointer", fontSize: "0.8rem" }, children: "✕" })
          ] }),
          !loadedKit && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setShowKitHistory((p) => !p);
                if (!showKitHistory && !kitHistory.length) loadKitHistory();
              },
              style: { background: "none", color: "#aaa", border: "none", cursor: "pointer", fontSize: "0.8rem" },
              children: showKitHistory ? "닫기" : "불러오기"
            }
          )
        ] })
      ] }),
      !loadedKit && showKitHistory && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, margin: "10px 0" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              className: "name-input",
              style: { flex: 1, fontSize: "0.85rem", padding: "8px 12px" },
              placeholder: "음식점 이름으로 검색...",
              value: kitSearch,
              onChange: (e) => setKitSearch(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && loadKitHistory(kitSearch)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "re-btn", style: { minWidth: 44 }, onClick: () => loadKitHistory(kitSearch), disabled: kitLoading, children: kitLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-search" }) })
        ] }),
        kitHistory.length === 0 && !kitLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--text-sub)", textAlign: "center", padding: "12px 0", fontSize: "0.8rem" }, children: "저장된 이력이 없습니다" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }, children: kitHistory.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 10,
              padding: "10px 12px",
              cursor: "pointer",
              position: "relative",
              transition: "border-color 0.15s"
            },
            onMouseEnter: (e) => e.currentTarget.style.borderColor = "#7c3aed55",
            onMouseLeave: (e) => e.currentTarget.style.borderColor = "#2a2a2a",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: (e) => deleteKit(item.id, item.restaurant, e),
                  disabled: kitDeleting,
                  style: {
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "rgba(255,107,107,0.12)",
                    color: "#ff6b6b",
                    border: "none",
                    borderRadius: 6,
                    padding: "2px 6px",
                    cursor: "pointer",
                    fontSize: "0.65rem",
                    lineHeight: "1.4"
                  },
                  title: "삭제",
                  children: "🗑️"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => loadKitFromHistory(item), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontWeight: 800, fontSize: "0.85rem", margin: "0 20px 4px 0", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: item.restaurant || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: "0.65rem", color: "#666", margin: "0 0 6px" }, children: item.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || "" }),
                item.hookTitle && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: "0.7rem", color: "#888", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
                  "🎣 ",
                  item.hookTitle
                ] })
              ] })
            ]
          },
          item.id
        )) })
      ] }),
      loadedKit && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 12 }, children: [
        [
          { label: "🎣 훅 제목", val: loadedKit.hookTitle },
          { label: "✍️ 인스타 캡션", val: loadedKit.caption },
          { label: "🏷️ 해시태그 30개", val: loadedKit.hashtags30 },
          { label: "🧾 네이버 영수증 리뷰", val: loadedKit.receiptReview },
          { label: "📎 네이버 클립 태그", val: loadedKit.naverClipTags },
          { label: "◎ 릴스 캡션", val: loadedKit.instagramCaption },
          { label: "▶ 유튜브 쇼츠 태그", val: loadedKit.youtubeShortsTags },
          { label: "♪ 틱톡 태그", val: loadedKit.tiktokTags }
        ].map(({ label, val }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", style: { marginBottom: 12 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", style: { margin: 0 }, children: label }),
            val && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "marketing-copy-btn", onClick: async () => {
              try {
                await navigator.clipboard.writeText(val);
                addToast(`${label} 복사 완료!`, "ok");
              } catch {
                addToast("복사 실패", "err");
              }
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
              " 복사"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "marketing-text", style: {
            whiteSpace: "pre-line",
            fontSize: "0.78rem",
            margin: 0,
            color: val ? label.includes("태그") || label.includes("해시태그") ? "#a855f7" : "#ddd" : "#666",
            background: "rgba(0,0,0,0.3)",
            borderRadius: 8,
            padding: "8px 12px",
            fontStyle: val ? "normal" : "italic"
          }, children: val || "(저장된 데이터 없음)" })
        ] }, label)),
        loadedKit.hookVariations?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "marketing-row", style: { marginBottom: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "marketing-label", children: "🎣 3종 훅 베리에이션" }),
          loadedKit.hookVariations.map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 12px", marginTop: 6, fontSize: "0.75rem" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#a855f7", fontWeight: 700 }, children: h.type }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#fff", marginLeft: 8 }, children: h.caption1 }),
            h.caption2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#aaa", marginLeft: 6 }, children: [
              "/ ",
              h.caption2
            ] }),
            h.narration && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#888", marginTop: 4, margin: "4px 0 0", fontStyle: "italic" }, children: h.narration })
          ] }, i))
        ] })
      ] })
    ] }),
    script?.hook_variations?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(HookPicker, { variations: script.hook_variations, script, setScript, addToast }),
    script && /* @__PURE__ */ jsxRuntimeExports.jsx(SNSTags, { script }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "re-btn", onClick: doReset, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-redo" }),
      " 다시 만들기"
    ] })
  ] }) });
}

const TABS = [
  { id: "blog", label: "📝 블로그 포스팅" },
  { id: "sns", label: "📱 SNS 태그" },
  { id: "guide", label: "🟢 네이버 등록" },
  { id: "search", label: "🔍 검색 기록" }
];
function BlogPage() {
  const { addToast } = useVideoStore();
  const [files, setFiles] = reactExports.useState([]);
  const [name, setName] = reactExports.useState("");
  const [location, setLocation] = reactExports.useState("");
  const [keywords, setKeywords] = reactExports.useState("");
  const [extra, setExtra] = reactExports.useState("");
  const [result, setResult] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const [loadLabel, setLoadLabel] = reactExports.useState("");
  const [activeTab, setActiveTab] = reactExports.useState("blog");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [recentPosts, setRecentPosts] = reactExports.useState([]);
  const [postsLoading, setPostsLoading] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef();
  const dropRef = reactExports.useRef();
  const addFiles = reactExports.useCallback(async (list) => {
    const { preprocessMediaFiles } = await __vitePreload(async () => { const { preprocessMediaFiles } = await import('./engine-core-CD1WNmk6.js').then(n => n.C);return { preprocessMediaFiles }},true?__vite__mapDeps([0,1,2,3,4,5]):void 0);
    const remaining = 20 - files.length;
    if (!remaining) return;
    const arr = [...list].slice(0, remaining);
    const big = arr.some((f) => f.size > 50 * 1024 * 1024);
    if (big) addToast("용량이 큰 영상을 최적화 중...", "inf");
    const results = await preprocessMediaFiles(arr, (msg) => addToast(msg, "inf"));
    const items = results.map(({ file: pf, mediaType }) => ({
      file: pf,
      url: URL.createObjectURL(pf),
      type: mediaType
    }));
    setFiles((prev) => [...prev, ...items]);
  }, [files.length, addToast]);
  const removeFile = reactExports.useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);
  const onDragOver = reactExports.useCallback((e) => {
    e.preventDefault();
    dropRef.current?.classList.add("over");
  }, []);
  const onDragLeave = reactExports.useCallback(() => dropRef.current?.classList.remove("over"), []);
  const onDrop = reactExports.useCallback((e) => {
    e.preventDefault();
    dropRef.current?.classList.remove("over");
    addFiles([...e.dataTransfer.files]);
  }, [addFiles]);
  const onFileChange = reactExports.useCallback((e) => {
    addFiles([...e.target.files]);
    e.target.value = "";
  }, [addFiles]);
  const handleGenerate = async () => {
    if (!name.trim()) {
      addToast("음식점 이름을 입력해주세요", "err");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      setLoadLabel("이미지를 분석 중...");
      const r = await generateBlogPost({
        name: name.trim(),
        location: location.trim(),
        keywords: keywords.trim(),
        extra: extra.trim(),
        imageFiles: files.map((f) => f.file)
      });
      setResult(r);
      setActiveTab("blog");
      addToast("블로그 포스팅 생성 완료 ✓", "ok");
      saveBlogPost({
        restaurant: name.trim(),
        location: location.trim(),
        keywords: keywords.trim() ? keywords.trim().split(/[,\s]+/).filter(Boolean) : [],
        title: r.title || "",
        body: r.body || "",
        naver_clip_tags: r.naver_clip_tags || "",
        youtube_shorts_tags: r.youtube_shorts_tags || "",
        instagram_caption: r.instagram_caption || "",
        tiktok_tags: r.tiktok_tags || ""
      }).catch((e) => console.warn("[Blog] Firebase 저장 실패:", e.message));
      saveSNSTags({
        restaurant: name.trim(),
        naver_clip_tags: r.naver_clip_tags || "",
        youtube_shorts_tags: r.youtube_shorts_tags || "",
        instagram_caption: r.instagram_caption || "",
        tiktok_tags: r.tiktok_tags || "",
        hashtags: r.hashtags || ""
      }).catch((e) => console.warn("[SNS] Firebase 저장 실패:", e.message));
    } catch (err) {
      console.error(err);
      addToast("오류: " + (err.message || "알 수 없는 오류"), "err");
    } finally {
      setLoading(false);
      setLoadLabel("");
    }
  };
  const copyText = async (text, label = "") => {
    try {
      await navigator.clipboard.writeText(text);
      addToast((label || "텍스트") + " 복사 완료 ✓", "ok");
    } catch {
      addToast("복사 실패 — 직접 선택 후 Ctrl+C 하세요", "inf");
    }
  };
  const fullCopy = () => {
    if (!result) return;
    const text = (result.title ? result.title + "\n\n" : "") + (result.body || "");
    copyText(text, "제목 + 본문");
  };
  const loadPosts = reactExports.useCallback(async (kw = "") => {
    setPostsLoading(true);
    try {
      const results = kw.trim() ? await searchBlogPosts(kw.trim()) : await getRecentBlogPosts(30);
      setRecentPosts(results);
    } catch (e) {
      addToast("포스팅 목록 로드 실패: " + e.message, "err");
    } finally {
      setPostsLoading(false);
    }
  }, [addToast]);
  reactExports.useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  const handleTabChange = async (id) => {
    setActiveTab(id);
    if (id === "search") loadPosts(searchQuery);
  };
  const loadFromHistory = (item) => {
    setResult({
      title: item.title || "",
      body: item.body || "",
      naver_clip_tags: item.naverClipTags || "",
      youtube_shorts_tags: item.youtubeTags || "",
      instagram_caption: item.instagramCaption || "",
      tiktok_tags: item.tiktokTags || ""
    });
    setName(item.restaurant || "");
    setLocation(item.location || "");
    setActiveTab("blog");
  };
  const reset = () => {
    setResult(null);
    setActiveTab("blog");
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "blog-loading-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "loading-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ai-loader", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ai-ring" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ai-ico", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-pen-nib" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "load-title", children: loadLabel }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "load-sub", children: "Gemini 2.5 가 글을 쓰고 있습니다..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "load-pipeline", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lp-item active", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lp-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-eye" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-name", children: "시각 자료 분석" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-status", children: "이미지 읽는 중..." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lp-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lp-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-feather-alt" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-name", children: "블로그 본문 작성" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-status", children: "대기 중" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lp-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lp-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-hashtag" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-name", children: "SNS 태그 생성" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lp-status", children: "대기 중" })
          ] })
        ] })
      ] })
    ] }) });
  }
  if (result) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "app-main blog-result-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "re-btn", style: { marginBottom: 16 }, onClick: reset, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-arrow-left" }),
        " 다시 작성"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "blog-tabs", children: TABS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `btab ${activeTab === t.id ? "active" : ""}`,
          onClick: () => handleTabChange(t.id),
          children: t.label
        },
        t.id
      )) }),
      activeTab === "blog" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-pane-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-section-title", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "제목" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "blog-copy-btn", onClick: () => copyText(result.title || "", "제목"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
              " 복사"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "blog-text", children: result.title })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-section-title", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "본문 (네이버 스마트에디터에 붙여넣기)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "blog-copy-btn", onClick: () => copyText(result.body || "", "본문"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
              " 복사"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "blog-info-hint", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-info-circle" }),
            " [사진 N] · [영상 N] 위치에 해당 파일을 에디터에 직접 삽입하세요"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "blog-text blog-body-text", children: result.body })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "make-btn", onClick: fullCopy, style: { marginTop: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "make-glow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
          " 제목 + 본문 전체 복사"
        ] })
      ] }),
      activeTab === "sns" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-pane-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TagSection, { badge: "naver", badgeLabel: "N 클립", hint: "300자", text: result.naver_clip_tags, onCopy: () => copyText(result.naver_clip_tags || "", "네이버 태그") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TagSection, { badge: "youtube", badgeLabel: "▶ 유튜브 쇼츠", hint: "100자", text: result.youtube_shorts_tags, onCopy: () => copyText(result.youtube_shorts_tags || "", "유튜브 태그") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TagSection, { badge: "insta", badgeLabel: "◎ 인스타 릴스", hint: "캡션+태그", text: result.instagram_caption, onCopy: () => copyText(result.instagram_caption || "", "인스타 캡션") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TagSection, { badge: "tiktok", badgeLabel: "♪ 틱톡 태그", hint: "5개", text: result.tiktok_tags, onCopy: () => copyText(result.tiktok_tags || "", "틱톡 태그") })
      ] }),
      activeTab === "guide" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-pane-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "naver-guide-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "naver-guide-title", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-info-circle" }),
            " 네이버 블로그 붙여넣기 방법"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "naver-guide-list", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "아래 버튼으로 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "네이버 블로그 에디터" }),
              "를 엽니다"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "새 글 쓰기" }),
              " → 제목 입력란에 제목 붙여넣기"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "본문 영역 클릭 → ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Ctrl+V (붙여넣기)" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "사진은 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "에디터 사진 아이콘" }),
              "으로 직접 업로드"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "오른쪽 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "태그 입력란" }),
              "에 네이버 클립 태그 붙여넣기"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "발행" }),
              " 버튼 클릭"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: "https://blog.naver.com/PostWriteForm.naver",
              target: "_blank",
              rel: "noreferrer",
              className: "naver-open-btn",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-external-link-alt" }),
                " 네이버 블로그 에디터 열기"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dl-box", style: { marginTop: 14 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "dl-title", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-lightbulb" }),
            " 더 쉽게 하는 방법"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "dl-desc", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "① 전체 복사" }),
            " 후 네이버 블로그 에디터에 ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Ctrl+V" }),
            "로 붙여넣기",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "② 사진" }),
            "은 에디터에서 직접 드래그 앤 드롭으로 추가",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "③ 네이버 태그" }),
            "는 복사 후 태그 입력란에 붙여넣기"
          ] })
        ] })
      ] }),
      activeTab === "search" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-pane-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, marginBottom: 14 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              className: "name-input",
              style: { flex: 1 },
              type: "text",
              placeholder: "음식점 이름으로 검색 (비우면 최근 30개)",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              onKeyDown: (e) => {
                setSearchQuery(e.target.value);
                if (e.key === "Enter") loadPosts(e.target.value);
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "re-btn", onClick: () => loadPosts(searchQuery), disabled: postsLoading, children: postsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-search" }) })
        ] }),
        recentPosts.length === 0 && !postsLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--text-sub)", textAlign: "center", padding: "24px 0" }, children: "저장된 포스팅이 없습니다" }),
        recentPosts.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "sns-card",
            style: { marginBottom: 8, cursor: "pointer" },
            onClick: () => loadFromHistory(item),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-card-head", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 600, fontSize: 13 }, children: item.restaurant || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sns-limit", children: item.location || "" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 11, color: "var(--text-sub)", marginLeft: "auto" }, children: item.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || "" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sns-text", style: { fontSize: 12, marginTop: 4, color: "var(--text-sub)" }, children: item.title || "제목 없음" })
            ]
          },
          item.id
        ))
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "app-main", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "card", style: { marginBottom: 14 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-label", style: { marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "num", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-history" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "이전 포스팅 불러오기" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "음식점 이름 클릭 → 바로 불러오기" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "name-input",
            style: { flex: 1 },
            type: "text",
            placeholder: "음식점 이름으로 검색...",
            value: searchQuery,
            onChange: (e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim()) loadPosts("");
            },
            onKeyDown: (e) => e.key === "Enter" && loadPosts(searchQuery)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "re-btn", onClick: () => loadPosts(searchQuery), disabled: postsLoading, children: postsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-search" }) })
      ] }),
      postsLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { color: "var(--text-sub)", textAlign: "center", padding: "8px 0", fontSize: 12 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }),
        " 불러오는 중..."
      ] }),
      !postsLoading && recentPosts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "var(--text-sub)", textAlign: "center", padding: "8px 0", fontSize: 12 }, children: "저장된 포스팅이 없습니다 (Firebase 미연동 시 비어 있음)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }, children: recentPosts.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => loadFromHistory(item),
          style: {
            background: "#1c1c1e",
            border: "1px solid #333",
            borderRadius: 10,
            padding: "9px 14px",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 700, fontSize: 13, color: "#eee" }, children: item.restaurant || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: 11, color: "var(--text-sub)", flexShrink: 0, marginLeft: 8 }, children: [
              item.location ? `${item.location} · ` : "",
              item.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || ""
            ] })
          ]
        },
        item.id
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-label", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "num", children: "01" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "이미지 · 영상 업로드" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "음식점 사진과 영상을 올려주세요 (최대 20개)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          ref: dropRef,
          className: "drop-area",
          onDragOver,
          onDragLeave,
          onDrop,
          onClick: () => fileInputRef.current?.click(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drop-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-cloud-upload-alt" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drop-text", children: "여기에 끌어다 놓거나" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "pick-btn", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-folder-open" }),
              " 파일 선택"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", accept: "image/*,video/*", multiple: true, hidden: true, onChange: onFileChange }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drop-hint", children: "JPG · PNG · MP4 · MOV" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drive-row", style: { marginTop: 10, marginBottom: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DrivePicker, { addFiles }) }),
      files.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "thumb-grid", style: { marginTop: 14 }, children: files.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ti", children: [
        m.type === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: m.url, alt: "" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: m.url, muted: true, playsInline: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ti-badge", children: i + 1 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "ti-remove", onClick: (e) => {
          e.stopPropagation();
          removeFile(i);
        }, children: "✕" })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-label", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "num", children: "02" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "음식점 정보" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "이름·지역 입력 → AI가 블로그 포스팅 전체를 작성합니다" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-form-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-store name-icon" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "name-input", type: "text", placeholder: "음식점 이름 (예: 을지로 돈부리집)", maxLength: 40, value: name, onChange: (e) => setName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-form-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-map-marker-alt name-icon" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "name-input", type: "text", placeholder: "위치 (예: 서울 중구 을지로)", maxLength: 60, value: location, onChange: (e) => setLocation(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-form-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-key name-icon", style: { color: "var(--accent2)" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "name-input", type: "text", placeholder: "키워드 (예: 인천 맛집, 산곡동 고기집)", maxLength: 120, value: keywords, onChange: (e) => setKeywords(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "blog-form-row", style: { alignItems: "flex-start", paddingTop: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-comment-alt name-icon", style: { marginTop: 4 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: "name-input blog-textarea",
            placeholder: "추가 지시사항 (선택) — 예: 3인 방문, 웨이팅 30분, 직화 구이 강조",
            maxLength: 400,
            rows: 3,
            value: extra,
            onChange: (e) => setExtra(e.target.value)
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "make-btn",
        onClick: handleGenerate,
        disabled: !name.trim(),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "make-glow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-pen-nib" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "AI 블로그 포스팅 생성" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "make-hint", children: "이미지 분석 → 리뷰 본문 · SNS 태그 · 네이버 클립 태그 자동 생성" })
  ] });
}
function TagSection({ badge, badgeLabel, hint, text, onCopy }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-card", style: { marginBottom: 10 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sns-card-head", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `sns-badge ${badge}`, children: badgeLabel }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sns-limit", children: hint }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "sns-copy-btn", onClick: onCopy, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-copy" }),
        " 복사"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sns-text", children: text || "—" })
  ] });
}

function ToastContainer() {
  const { toasts, removeToast } = useVideoStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "toasts", children: toasts.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(Toast, { toast: t, onRemove: () => removeToast(t.id) }, t.id)) });
}
function Toast({ toast, onRemove }) {
  reactExports.useEffect(() => {
    const timer = setTimeout(onRemove, 3500);
    return () => clearTimeout(timer);
  }, []);
  const icons = { ok: "fa-check-circle", err: "fa-exclamation-circle", inf: "fa-info-circle" };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `toast ${toast.type}`, onClick: onRemove, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${icons[toast.type] || icons.inf}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: toast.msg })
  ] });
}

const __vite_import_meta_env__ = {"BASE_URL": "/moovlog/shorts-creator/", "DEV": false, "MODE": "production", "PROD": true, "SSR": false, "VITE_FIREBASE_API_KEY": "", "VITE_FIREBASE_APP_ID": "", "VITE_GEMINI_KEY": "", "VITE_TYPECAST_KEY": "", "VITE_TYPECAST_KEY_2": "", "VITE_TYPECAST_KEY_3": "", "VITE_TYPECAST_KEY_4": "", "VITE_TYPECAST_KEY_5": "", "VITE_TYPECAST_KEY_6": "", "VITE_TYPECAST_KEY_7": ""};
const APP_TABS = [
  { id: "shorts", label: "🎬 숏폼 만들기" },
  { id: "blog", label: "📝 블로그 포스팅" }
];
function App() {
  const { pipeline, showResult } = useVideoStore();
  const [activeTab, setActiveTab] = reactExports.useState("shorts");
  reactExports.useEffect(() => {
    const gKey = localStorage.getItem("moovlog_gemini_key") || "";
    setGeminiKey(gKey);
    const tcKeys = [1, 2, 3, 4, 5, 6, 7, 8].flatMap((n) => {
      const envKey = __vite_import_meta_env__[`VITE_TYPECAST_KEY${n > 1 ? "_" + n : ""}`] || "";
      const lsKey = localStorage.getItem(`moovlog_typecast_key${n > 1 ? n : ""}`) || "";
      const raw = envKey || lsKey;
      return raw ? raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) : [];
    }).slice(0, 8);
    setTypeCastKeys(tcKeys);
    console.log(`[App] TypeCast 키 로드: ${tcKeys.length}개`);
    initFirebase();
    document.title = "무브먼트 Shorts Creator v2";
    if (!window.crossOriginIsolated && navigator.serviceWorker?.controller) {
      const store = useVideoStore.getState();
      if (!store.files.length && !store.script) {
        const attempts = parseInt(sessionStorage.getItem("_coi_attempts") || "0", 10);
        if (attempts < 3) {
          sessionStorage.setItem("_coi_attempts", String(attempts + 1));
          console.log("[App] SW 활성 but !crossOriginIsolated → 재로드 (COI 헤더 확보)");
          location.reload();
        }
      }
    }
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-root", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Header, { activeTab, onTabChange: setActiveTab, tabs: APP_TABS }),
    activeTab === "shorts" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      !showResult && /* @__PURE__ */ jsxRuntimeExports.jsx(UploadSection, {}),
      pipeline.visible && /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingOverlay, {}),
      showResult && /* @__PURE__ */ jsxRuntimeExports.jsx(ResultScreen, {})
    ] }),
    activeTab === "blog" && /* @__PURE__ */ jsxRuntimeExports.jsx(BlogPage, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ToastContainer, {})
  ] });
}

client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);
if (navigator.serviceWorker) {
  window.addEventListener("load", () => {
    const swBase = "/moovlog/shorts-creator/";
    navigator.serviceWorker.register(`${swBase}sw.js`, { scope: swBase }).then((reg) => {
      if (window.crossOriginIsolated) {
        sessionStorage.removeItem("_coi_attempts");
        return;
      }
      const doReload = () => {
        if (window.crossOriginIsolated) return;
        const attempts = parseInt(sessionStorage.getItem("_coi_attempts") || "0", 10);
        if (attempts < 3) {
          sessionStorage.setItem("_coi_attempts", String(attempts + 1));
          location.reload();
        }
      };
      if (reg.active) {
        doReload();
      } else {
        const sw = reg.installing || reg.waiting;
        if (sw) sw.addEventListener("statechange", (e) => {
          if (e.target.state === "activated") doReload();
        });
        navigator.serviceWorker.addEventListener("controllerchange", doReload);
      }
    }).catch(() => {
    });
  });
}
