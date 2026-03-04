import pathlib

YML = """\
name: Build Android APK

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-apk:
    name: Build APK (Gradle)
    runs-on: ubuntu-latest
    steps:

      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: temurin

      - name: Build Android project
        run: |
          set -e
          mkdir -p apk/app/src/main/res/values
          mkdir -p apk/app/src/main/res/xml
          mkdir -p apk/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}
          mkdir -p apk/app/src/main/java/com/moovlog/shorts
          mkdir -p apk/gradle/wrapper

          # settings.gradle
          cat > apk/settings.gradle << 'SEOF'
          pluginManagement {
            repositories { google(); mavenCentral(); gradlePluginPortal() }
          }
          dependencyResolutionManagement {
            repositories { google(); mavenCentral() }
          }
          rootProject.name = "MoovlogShorts"
          include ":app"
          SEOF

          # root build.gradle
          echo 'plugins { id "com.android.application" version "8.2.2" apply false }' > apk/build.gradle

          # app/build.gradle
          cat > apk/app/build.gradle << 'BEOF'
          plugins { id "com.android.application" }
          android {
            namespace "com.moovlog.shorts"
            compileSdk 34
            defaultConfig {
              applicationId "com.moovlog.shorts"
              minSdk 24
              targetSdk 34
              versionCode 1
              versionName "1.0"
            }
            signingConfigs {
              release {
                storeFile     file("../moovlog.keystore")
                storePassword "moovlog2024"
                keyAlias      "moovlog"
                keyPassword   "moovlog2024"
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
            implementation "androidx.browser:browser:1.7.0"
            implementation "androidx.appcompat:appcompat:1.6.1"
          }
          BEOF

          # gradle wrapper
          echo 'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip' \\
            > apk/gradle/wrapper/gradle-wrapper.properties

          # AndroidManifest.xml
          cat > apk/app/src/main/AndroidManifest.xml << 'XEOF'
          <?xml version="1.0" encoding="utf-8"?>
          <manifest xmlns:android="http://schemas.android.com/apk/res/android">
            <uses-permission android:name="android.permission.INTERNET"/>
            <application android:label="무브먼트"
              android:icon="@mipmap/ic_launcher"
              android:theme="@style/T"
              android:allowBackup="false"
              android:networkSecurityConfig="@xml/nsc">
              <activity android:name=".Main" android:exported="true"
                android:screenOrientation="portrait">
                <intent-filter>
                  <action android:name="android.intent.action.MAIN"/>
                  <category android:name="android.intent.category.LAUNCHER"/>
                </intent-filter>
              </activity>
            </application>
          </manifest>
          XEOF

          # network security config
          cat > apk/app/src/main/res/xml/nsc.xml << 'NEOF'
          <?xml version="1.0" encoding="utf-8"?>
          <network-security-config>
            <domain-config cleartextTrafficPermitted="false">
              <domain includeSubdomains="true">122cks.github.io</domain>
            </domain-config>
          </network-security-config>
          NEOF

          # styles
          cat > apk/app/src/main/res/values/styles.xml << 'VEOF'
          <?xml version="1.0" encoding="utf-8"?>
          <resources>
            <style name="T" parent="android:Theme.Material.NoTitleBar.Fullscreen">
              <item name="android:windowBackground">#0d0d0d</item>
            </style>
          </resources>
          VEOF

          # LauncherActivity
          cat > apk/app/src/main/java/com/moovlog/shorts/Main.java << 'JEOF'
          package com.moovlog.shorts;
          import android.app.Activity;
          import android.net.Uri;
          import android.os.Bundle;
          import androidx.browser.customtabs.CustomTabsIntent;
          public class Main extends Activity {
            protected void onCreate(Bundle b) {
              super.onCreate(b);
              new CustomTabsIntent.Builder().build()
                .launchUrl(this, Uri.parse(
                  "https://122cks.github.io/moovlog/shorts-creator/"));
              finish();
            }
          }
          JEOF

          # icons
          sudo apt-get install -y librsvg2-bin 2>/dev/null || true
          declare -A SIZES=([mdpi]=48 [hdpi]=72 [xhdpi]=96 [xxhdpi]=144 [xxxhdpi]=192)
          for dpi in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
            s=${SIZES[$dpi]}
            rsvg-convert -w $s -h $s shorts-creator/icon-192.svg \\
              -o apk/app/src/main/res/mipmap-${dpi}/ic_launcher.png 2>/dev/null || \\
            python3 - << PYEOF
          import struct, zlib
          w = h = $s
          def chunk(name, data):
              crc = zlib.crc32(name + data) & 0xffffffff
              return struct.pack('>I', len(data)) + name + data + struct.pack('>I', crc)
          raw = b'\\x00' + bytes([26, 26, 26, 255]) * w
          png = (b'\\x89PNG\\r\\n\\x1a\\n'
              + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
              + chunk(b'IDAT', zlib.compress(raw * h))
              + chunk(b'IEND', b''))
          with open('apk/app/src/main/res/mipmap-${dpi}/ic_launcher.png', 'wb') as f:
              f.write(png)
          PYEOF
          done

      - name: Generate keystore
        working-directory: apk
        run: |
          keytool -genkey -v \\
            -keystore moovlog.keystore -alias moovlog \\
            -keyalg RSA -keysize 2048 -validity 36500 \\
            -storepass moovlog2024 -keypass moovlog2024 \\
            -dname "CN=Moovlog,OU=App,O=Moovlog,L=Seoul,S=Seoul,C=KR"

      - name: Build release APK
        working-directory: apk
        run: gradle assembleRelease --no-daemon -Dorg.gradle.jvmargs=-Xmx2g

      - name: Copy APK
        run: |
          APK=$(find apk -name "*.apk" | tail -1)
          echo "APK: $APK"
          cp "$APK" moovlog-shorts-creator.apk

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: moovlog-shorts-creator
          path: moovlog-shorts-creator.apk
          retention-days: 90

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: apk-latest
          name: "무브먼트 Shorts Creator APK"
          body: |
            ## 설치 방법
            1. **moovlog-shorts-creator.apk** 다운로드
            2. 안드로이드 설정 → 보안 → 알 수 없는 앱 허용
            3. APK 탭 → 설치

            웹 버전: https://122cks.github.io/moovlog/shorts-creator/
            Build #${{ github.run_number }}
          files: moovlog-shorts-creator.apk
          make_latest: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
"""

pathlib.Path(".github/workflows/build-apk.yml").write_text(YML, encoding="utf-8")
print("OK:", len(YML), "chars")
