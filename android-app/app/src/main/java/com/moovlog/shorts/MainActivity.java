package com.moovlog.shorts;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.View;
import android.view.animation.AlphaAnimation;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.webkit.JavascriptInterface;
import java.io.File;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.text.InputType;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

// v2.74: 스플래시, 다중선택 파일chooser, 뒤로가기 다이얼로그,
//         Toast 네이티브 브릿지, 권한거부→설정창, 캐시정리, 다크모드
public class MainActivity extends Activity {

    private static final String APP_URL
            = "https://122cks.github.io/moovlog/shorts-creator/";
    private static final int PERMISSION_REQUEST = 1001;
    private static final int FILE_CHOOSER_REQUEST = 1002;
    private static final int SETTINGS_REQUEST = 1003;

    private static final String PREFS_NAME = "MoovlogPrefs";
    private static final String PREF_LAST_CACHE_CLEAR = "lastCacheClear";

    private WebView webView;
    private View splashView;
    private boolean splashHidden = false;
    private ValueCallback<Uri[]> fileUploadCallback;
    private long backPressedTime = 0; // #98 연속 2번 뮤로가기 종료
    private static final long BACK_PRESS_INTERVAL = 2000; // ms

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setStatusBarColor();

        // ── 루트 레이아웃: WebView + Splash 오버레이 ────────────────────
        FrameLayout root = new FrameLayout(this);

        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        splashView = buildSplashView();
        root.addView(splashView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        setContentView(root);
        setImmersiveMode();

        // ── WebView 설정 ────────────────────────────────────────────────
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " MoovlogApp/2.74");

        // 다크모드 강제 적용 (Android 10+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            s.setForceDark(WebSettings.FORCE_DARK_ON);
        }

        // 캐시 주기적 정리 (7일마다)
        clearCacheIfNeeded(s);

        // ── JavaScript 네이티브 브릿지 ──────────────────────────────────
        webView.addJavascriptInterface(new MoovlogBridge(), "MoovlogNative");
        webView.setScrollBarStyle(View.SCROLLBARS_OUTSIDE_OVERLAY);

        // ── WebViewClient: 로딩 완료 시 스플래시 제거 ───────────────────
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                new Handler(Looper.getMainLooper()).postDelayed(
                        MainActivity.this::hideSplash, 800);
            }
        });

        // ── WebChromeClient ─────────────────────────────────────────────
        webView.setWebChromeClient(new WebChromeClient() {

            // ① 파일 선택 — 갤러리 다중 선택 + 카메라 (#3)
            @Override
            public boolean onShowFileChooser(WebView v,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = callback;

                // 갤러리: 영상 다중 선택
                Intent gallery = new Intent(Intent.ACTION_GET_CONTENT);
                gallery.setType("video/*");
                gallery.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                gallery.addCategory(Intent.CATEGORY_OPENABLE);

                // 카메라: 동영상 촬영
                Intent camera = new Intent(
                        android.provider.MediaStore.ACTION_VIDEO_CAPTURE);

                Intent chooser = Intent.createChooser(gallery, "영상 선택");
                chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS,
                        new Intent[]{camera});

                try {
                    startActivityForResult(chooser, FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    fileUploadCallback = null;
                    return false;
                }
                return true;
            }

            // ② 카메라/마이크 WebRTC 권한 자동 승인
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                    GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage msg) {
                return true; // release 빌드에서 JS 콘솔 억제
            }
        });

        requestAppPermissions();
        webView.loadUrl(APP_URL);

        // 스플래시 최대 유지 3초 (네트워크 지연 대비)
        new Handler(Looper.getMainLooper()).postDelayed(
                this::hideSplash, 3000);
    }

    // ── 스플래시 뷰 생성 ─────────────────────────────────────────────────
    private View buildSplashView() {
        FrameLayout splash = new FrameLayout(this);
        splash.setBackgroundColor(0xFF0D0D0D); // 브랜드 배경

        TextView tv = new TextView(this);
        tv.setText("무브먼트\nShorts Creator");
        tv.setTextColor(0xFFFFFFFF);
        tv.setTextSize(28f);
        tv.setGravity(android.view.Gravity.CENTER);
        tv.setTypeface(tv.getTypeface(), android.graphics.Typeface.BOLD);

        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT);
        lp.gravity = android.view.Gravity.CENTER;
        splash.addView(tv, lp);
        return splash;
    }

    private void hideSplash() {
        if (splashHidden || splashView == null) {
            return;
        }
        splashHidden = true;
        if (splashView.getVisibility() != View.VISIBLE) {
            return;
        }
        AlphaAnimation fade = new AlphaAnimation(1f, 0f);
        fade.setDuration(400);
        fade.setFillAfter(true);
        splashView.startAnimation(fade);
        new Handler(Looper.getMainLooper()).postDelayed(
                () -> splashView.setVisibility(View.GONE), 420);
    }

    // ── StatusBar 브랜드 컬러 적용 ──────────────────────────────────────
    private void setStatusBarColor() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(0xFF0D0D0D);
            getWindow().setNavigationBarColor(0xFF0D0D0D);
        }
    }

    // ── 캐시 주기적 삭제 (7일마다) (#9) ────────────────────────────────
    private void clearCacheIfNeeded(WebSettings s) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        long lastClear = prefs.getLong(PREF_LAST_CACHE_CLEAR, 0);
        long sevenDays = 7L * 24 * 60 * 60 * 1000;
        if (System.currentTimeMillis() - lastClear > sevenDays) {
            s.setCacheMode(WebSettings.LOAD_NO_CACHE);
            prefs.edit().putLong(PREF_LAST_CACHE_CLEAR,
                    System.currentTimeMillis()).apply();
        } else {
            s.setCacheMode(WebSettings.LOAD_DEFAULT);
        }
    }

    // ── JavaScript ↔ 네이티브 브릿지 (#4 Toast) ─────────────────────────
    private class MoovlogBridge {

        // 웹에서: MoovlogNative.showToast("추출 완료!")
        @JavascriptInterface
        public void showToast(String message) {
            new Handler(Looper.getMainLooper()).post(
                    () -> Toast.makeText(MainActivity.this,
                            message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void showLongToast(String message) {
            new Handler(Looper.getMainLooper()).post(
                    () -> Toast.makeText(MainActivity.this,
                            message, Toast.LENGTH_LONG).show());
        }

        @JavascriptInterface
        public String getAppVersion() {
            return "2.75";
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }

        // #92 영상 공유 — Instagram / YouTube / TikTok
        // platform: "instagram" | "youtube" | "tiktok" | "" (시스템 공유창)
        @JavascriptInterface
        public void shareVideo(String filePath, String platform) {
            new Handler(Looper.getMainLooper()).post(() -> {
                File file = new File(filePath);
                if (!file.exists()) {
                    Toast.makeText(MainActivity.this,
                            "영상 파일을 찾을 수 없습니다.\n경로: " + filePath, Toast.LENGTH_LONG).show();
                    return;
                }

                Uri uri;
                try {
                    uri = androidx.core.content.FileProvider.getUriForFile(
                            MainActivity.this,
                            getPackageName() + ".provider",
                            file
                    );
                } catch (IllegalArgumentException e) {
                    // FileProvider 경로 매핑 실패 → 사용자에게 안내
                    Toast.makeText(MainActivity.this,
                            "공유 준비 실패: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    return;
                }

                // 공유 준비 중 피드백
                Toast.makeText(MainActivity.this, "공유 준비 중...", Toast.LENGTH_SHORT).show();

                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("video/mp4");
                shareIntent.putExtra(Intent.EXTRA_STREAM, uri);
                // READ 권한 임시 부여 (FLAG_GRANT_READ_URI_PERMISSION)
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                        | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);

                // 플랫폼별 패키지 지정
                switch (platform == null ? "" : platform) {
                    case "instagram":
                        shareIntent.setPackage("com.instagram.android");
                        break;
                    case "youtube":
                        shareIntent.setPackage("com.google.android.youtube");
                        break;
                    case "tiktok":
                        shareIntent.setPackage("com.ss.android.ugc.trill");
                        break;
                    case "reels":
                        // 인스타그램 릴스 전용 인텐트
                        shareIntent.setAction("com.instagram.share.ADD_TO_REEL");
                        shareIntent.setPackage("com.instagram.android");
                        break;
                    default:
                        break; // 시스템 공유창 표시
                }

                try {
                    Intent chooser = Intent.createChooser(shareIntent, "공유하기");
                    // chooser에도 FLAG_GRANT_READ_URI_PERMISSION 전파
                    chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(chooser);
                } catch (android.content.ActivityNotFoundException e) {
                    // 해당 앱이 설치되지 않은 경우 → 시스템 공유창으로 재시도
                    shareIntent.setPackage(null);
                    try {
                        startActivity(Intent.createChooser(shareIntent, "공유하기"));
                    } catch (Exception ex) {
                        Toast.makeText(MainActivity.this,
                                "공유 앱을 찾을 수 없습니다.", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        // #96 파일명 입력 팝업 후 공유 — 공유 전 이름 커스터마이징
        // JS: Android.shareVideoWithNamePicker(filePath, platform)
        @JavascriptInterface
        public void shareVideoWithNamePicker(String filePath, String platform) {
            new Handler(Looper.getMainLooper()).post(() -> {
                File srcFile = new File(filePath);
                if (!srcFile.exists()) {
                    Toast.makeText(MainActivity.this,
                            "영상 파일을 찾을 수 없습니다.\n경로: " + filePath,
                            Toast.LENGTH_LONG).show();
                    return;
                }

                // 현재 파일명에서 확장자 분리
                String origName = srcFile.getName();
                int dotIdx = origName.lastIndexOf('.');
                String baseName = dotIdx > 0 ? origName.substring(0, dotIdx) : origName;
                String ext = dotIdx > 0 ? origName.substring(dotIdx) : ".mp4";

                // 파일명 입력 EditText 생성
                EditText nameInput = new EditText(MainActivity.this);
                nameInput.setText(baseName);
                nameInput.setSelectAllOnFocus(true);
                nameInput.setInputType(InputType.TYPE_CLASS_TEXT
                        | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
                nameInput.setSingleLine(true);
                nameInput.setHint("파일 이름 (확장자 제외)");

                // 여백 추가
                int dp = (int) (16 * getResources().getDisplayMetrics().density);
                LinearLayout container = new LinearLayout(MainActivity.this);
                container.setOrientation(LinearLayout.VERTICAL);
                container.setPadding(dp, dp / 2, dp, 0);
                container.addView(nameInput);

                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("공유할 파일 이름")
                        .setMessage("저장될 파일명을 입력하세요 (확장자 자동 추가)")
                        .setView(container)
                        .setPositiveButton("공유", (dialog, which) -> {
                            String inputName = nameInput.getText().toString().trim();
                            if (inputName.isEmpty()) {
                                inputName = baseName;
                            }

                            // 파일 시스템에서 허용되지 않는 문자 치환
                            inputName = inputName.replaceAll("[\\\\/:*?\"<>|]", "_");

                            // 캐시 디렉터리에 새 이름으로 복사 (원본 보존)
                            File destFile = new File(getCacheDir(),
                                    inputName + ext);
                            try (java.io.FileInputStream in
                                    = new java.io.FileInputStream(srcFile); java.io.FileOutputStream out
                                    = new java.io.FileOutputStream(destFile)) {
                                byte[] buf = new byte[65536];
                                int len;
                                while ((len = in.read(buf)) > 0) {
                                    out.write(buf, 0, len);
                                }
                            } catch (java.io.IOException e) {
                                Toast.makeText(MainActivity.this,
                                        "파일 준비 실패: " + e.getMessage(),
                                        Toast.LENGTH_LONG).show();
                                return;
                            }

                            // 새 경로로 기존 shareVideo 호출
                            shareVideo(destFile.getAbsolutePath(), platform);
                        })
                        .setNegativeButton("취소", null)
                        .show();
            });
        }

        // #93 햅틱 피드백 — light(50ms) / heavy(200ms)
        @SuppressWarnings("deprecation")
        @JavascriptInterface
        public void haptic(String type) {
            new Handler(Looper.getMainLooper()).post(() -> {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v == null) {
                    return;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    long ms = "heavy".equals(type) ? 200L : 50L;
                    v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate("heavy".equals(type) ? 200L : 50L);
                }
            });
        }

        // #94 MediaStore 스캔 — 갤러리에 즉시 노출
        @JavascriptInterface
        public void scanMediaFile(String filePath) {
            MediaScannerConnection.scanFile(
                    MainActivity.this,
                    new String[]{filePath},
                    new String[]{"video/mp4"},
                    null
            );
        }
    }

    // ── 몰입형 모드 ─────────────────────────────────────────────────────
    private void setImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            android.view.WindowInsetsController c
                    = getWindow().getInsetsController();
            if (c != null) {
                c.hide(android.view.WindowInsets.Type.statusBars()
                        | android.view.WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(
                        android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            //noinspection deprecation
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
    }

    // ── 권한 요청 ───────────────────────────────────────────────────────
    private void requestAppPermissions() {
        String[] perms;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms = new String[]{
                Manifest.permission.CAMERA,
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_VIDEO,
                Manifest.permission.READ_MEDIA_AUDIO,
                Manifest.permission.RECORD_AUDIO,};
        } else {
            perms = new String[]{
                Manifest.permission.CAMERA,
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE,
                Manifest.permission.RECORD_AUDIO,};
        }
        boolean needsRequest = false;
        for (String p : perms) {
            if (ContextCompat.checkSelfPermission(this, p)
                    != PackageManager.PERMISSION_GRANTED) {
                needsRequest = true;
                break;
            }
        }
        if (needsRequest) {
            ActivityCompat.requestPermissions(this, perms, PERMISSION_REQUEST);
        }
    }

    // ── 권한 거부 → 설정창 유도 (#8) ────────────────────────────────────
    @Override
    public void onRequestPermissionsResult(int requestCode,
            @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != PERMISSION_REQUEST) {
            return;
        }

        boolean permanentlyDenied = false;
        for (int i = 0; i < permissions.length; i++) {
            if (grantResults.length > i
                    && grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                if (!ActivityCompat.shouldShowRequestPermissionRationale(
                        this, permissions[i])) {
                    permanentlyDenied = true;
                }
            }
        }
        if (permanentlyDenied) {
            new AlertDialog.Builder(this)
                    .setTitle("권한 필요")
                    .setMessage("카메라·미디어 접근 권한이 필요합니다.\n"
                            + "설정 → 앱 → 무브먼트에서 권한을 허용해 주세요.")
                    .setPositiveButton("설정 열기", (d, w) -> {
                        Intent intent = new Intent(
                                Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                        intent.setData(Uri.parse("package:" + getPackageName()));
                        startActivityForResult(intent, SETTINGS_REQUEST);
                    })
                    .setNegativeButton("나중에", null)
                    .show();
        }
    }

    // ── 파일 선택 결과 처리 (다중 선택 지원) ────────────────────────────
    @Override
    protected void onActivityResult(int requestCode, int resultCode,
            Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST && fileUploadCallback != null) {
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    // 다중 선택
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                } else if (data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
            }
            fileUploadCallback.onReceiveValue(results);
            fileUploadCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    // ── 뒤로가기: WebView 히스토리 → 2번 연속 클릭 시 종료 (#98) ───────────────
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        long now = System.currentTimeMillis();
        if (now - backPressedTime < BACK_PRESS_INTERVAL) {
            // 2초 이내 두 번째 누름 → 종료
            super.onBackPressed();
        } else {
            backPressedTime = now;
            Toast.makeText(this,
                    "한 번 더 누르면 종료됩니다",
                    Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
        setImmersiveMode();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
