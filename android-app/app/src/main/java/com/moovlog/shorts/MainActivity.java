package com.moovlog.shorts;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import androidx.browser.customtabs.CustomTabsIntent;

public class MainActivity extends Activity {
    private static final String APP_URL =
        "https://122cks.github.io/moovlog/shorts-creator/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        CustomTabsIntent intent = new CustomTabsIntent.Builder()
            .setShowTitle(false)
            .build();
        intent.launchUrl(this, Uri.parse(APP_URL));
        finish();
    }
}
