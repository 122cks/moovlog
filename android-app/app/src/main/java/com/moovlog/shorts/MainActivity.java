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
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

// v2.74: 스플래시, 다중선택 파일chooser, 뒤로가기 다이얼로그,
//         Toast 네이티브 브릿지, 권한거부→설정창, 캐시정리, 다크모드
public class MainActivity extends Activity {

    private static final String APP_URL =
        "https://122cks.github.io/moovlog/shorts-creator/";
    private static final int PERMISSION_REQUEST = 1001;
    private static final int FILE_CHOOSER_REQUEST = 1002;
    private static final int SETTINGS_REQUEST     = 1003;

    private static final String PREFS_NAME           = "MoovlogPrefs";
    private static final String PREF_LAST_CACHE_CLEAR = "lastCacheClear";

    private WebView webView;
    private View    splashView;
    private boolean splashHidden = false;
    private ValueCallback<Uri[]> fileUploadCallback;

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
        if (splashHidden || splashView == null) return;
        splashHidden = true;
        if (splashView.getVisibility() != View.VISIBLE) return;
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
        public String getAppVersion() { return "2.75"; }

        @JavascriptInterface
        public boolean isNativeApp() { return true; }

        // #92 영상 공유 — Instagram / YouTube / TikTok
        @JavascriptInterface
        public void shareVideo(String filePath, String platform) {
            new Handler(Looper.getMainLooper()).post(() -> {
                File file = new File(filePath);
                if (!file.exists()) {
                    Toast.makeText(MainActivity.this, "파일 없음: " + filePath, Toast.LENGTH_SHORT).show();
                    return;
                }
                Uri uri = androidx.core.content.FileProvider.getUriForFile(
                    MainActivity.this,
                    getPackageName() + ".provider",
                    file
                );
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("video/mp4");
                shareIntent.putExtra(Intent.EXTRA_STREAM, uri);
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                if ("instagram".equals(platform)) shareIntent.setPackage("com.instagram.android");
                else if ("youtube".equals(platform)) shareIntent.setPackage("com.google.android.youtube");
                else if ("tiktok".equals(platform)) shareIntent.setPackage("com.ss.android.ugc.trill");
                try {
                    startActivity(Intent.createChooser(shareIntent, "공유하기"));
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "공유 앱을 찾을 수 없습니다.", Toast.LENGTH_SHORT).show();
                }
            });
        }

        // #93 햅틱 피드백 — light(50ms) / heavy(200ms)
        @SuppressWarnings("deprecation")
        @JavascriptInterface
        public void haptic(String type) {
            new Handler(Looper.getMainLooper()).post(() -> {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v == null) return;
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
            android.view.WindowInsetsController c =
                getWindow().getInsetsController();
            if (c != null) {
                c.hide(android.view.WindowInsets.Type.statusBars()
                       | android.view.WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(
                    android.view.WindowInsetsController
                        .BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
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
                Manifest.permission.RECORD_AUDIO,
            };
        } else {
            perms = new String[]{
                Manifest.permission.CAMERA,
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE,
                Manifest.permission.RECORD_AUDIO,
            };
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
        if (requestCode != PERMISSION_REQUEST) return;

        boolean permanentlyDenied = false;
        for (int i = 0; i < permissions.length; i++) {
            if (grantResults.length > i &&
                    grantResults[i] != PackageManager.PERMISSION_GRANTED) {
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

    // ── 뒤로가기: WebView 히스토리 → 종료 다이얼로그 (#5) ───────────────
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            new AlertDialog.Builder(this)
                .setTitle("앱 종료")
                .setMessage("무브먼트 Shorts Creator를 종료하시겠습니까?")
                .setPositiveButton("종료", (d, w) -> finish())
                .setNegativeButton("취소", null)
                .show();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
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
