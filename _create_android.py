import pathlib, os

BASE = pathlib.Path("android-app")

def w(p, content):
    full = BASE / p
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(content, encoding="utf-8")
    print("  +", p)

print("Creating Android project files...")

# ── settings.gradle ──────────────────────────────────────────
w("settings.gradle", """\
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "MoovlogShorts"
include ':app'
""")

# ── build.gradle (root) ──────────────────────────────────────
w("build.gradle", """\
plugins {
    id 'com.android.application' version '8.2.2' apply false
}
""")

# ── gradle/wrapper/gradle-wrapper.properties ─────────────────
w("gradle/wrapper/gradle-wrapper.properties", """\
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
""")

# ── app/build.gradle ─────────────────────────────────────────
w("app/build.gradle", """\
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.moovlog.shorts'
    compileSdk 34

    defaultConfig {
        applicationId "com.moovlog.shorts"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    signingConfigs {
        release {
            storeFile     file(System.getenv("KEYSTORE_PATH") ?: "moovlog.keystore")
            storePassword System.getenv("STORE_PASS") ?: "moovlog2024"
            keyAlias      System.getenv("KEY_ALIAS")  ?: "moovlog"
            keyPassword   System.getenv("KEY_PASS")   ?: "moovlog2024"
        }
    }

    buildTypes {
        release {
            signingConfig  signingConfigs.release
            minifyEnabled  false
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.browser:browser:1.7.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
""")

# ── AndroidManifest.xml ───────────────────────────────────────
w("app/src/main/AndroidManifest.xml", """\
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:label="무브먼트"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme"
        android:allowBackup="false"
        android:networkSecurityConfig="@xml/nsc">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|keyboardHidden|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
""")

# ── network_security_config.xml ───────────────────────────────
w("app/src/main/res/xml/nsc.xml", """\
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">122cks.github.io</domain>
    </domain-config>
</network-security-config>
""")

# ── styles.xml ────────────────────────────────────────────────
w("app/src/main/res/values/styles.xml", """\
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.Material.NoTitleBar.Fullscreen">
        <item name="android:windowBackground">#0d0d0d</item>
        <item name="android:statusBarColor">#0d0d0d</item>
        <item name="android:navigationBarColor">#0d0d0d</item>
    </style>
</resources>
""")

# ── strings.xml ───────────────────────────────────────────────
w("app/src/main/res/values/strings.xml", """\
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">무브먼트</string>
</resources>
""")

# ── MainActivity.java ─────────────────────────────────────────
w("app/src/main/java/com/moovlog/shorts/MainActivity.java", """\
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
""")

# ── 아이콘 placeholder (PNG 생성) ─────────────────────────────
import struct, zlib

def make_png(size):
    w = h = size
    def chunk(name, data):
        crc = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', crc)
    raw = b'\x00' + bytes([26, 26, 26, 255]) * w
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw * h))
            + chunk(b'IEND', b''))

DPI_SIZES = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for dpi, size in DPI_SIZES.items():
    p = BASE / f"app/src/main/res/mipmap-{dpi}/ic_launcher.png"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(make_png(size))
    print(f"  + mipmap-{dpi}/ic_launcher.png ({size}px)")

print("\nAll files created!")
print("Files:", sum(1 for _ in BASE.rglob('*') if _.is_file()))
