# ============================================================
# setup-android-env.ps1
# 무브먼트 Shorts Creator — Android 빌드 환경 자동 설정
# 실행: .\setup-android-env.ps1
# ============================================================

Write-Host "`n🔧 Android 빌드 환경 자동 설정 시작..." -ForegroundColor Cyan

# ─── 1. JAVA_HOME 탐지 ────────────────────────────────────────────────────
function Find-JavaHome {
    # 1) 이미 환경 변수가 있으면 검증 후 사용
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
        return $env:JAVA_HOME
    }

    # 2) 일반적인 설치 경로 순서대로 탐색
    $candidates = @(
        "$env:ProgramFiles\Java",
        "$env:ProgramFiles\Eclipse Adoptium",
        "$env:ProgramFiles\Microsoft",
        "$env:ProgramFiles\Android\Android Studio\jbr",
        "$env:ProgramFiles\Android\Android Studio\jre",
        "${env:ProgramFiles(x86)}\Java",
        "C:\Program Files\Java",
        "C:\openjdk*",
        (Split-Path (Split-Path $PSScriptRoot) -Parent) + "\openJdk-25"
    )

    foreach ($base in $candidates) {
        if (-not $base) { continue }
        # 글로브 패턴 지원
        $dirs = Get-Item -Path $base -ErrorAction SilentlyContinue
        foreach ($d in $dirs) {
            if (Test-Path "$d\bin\java.exe") { return $d.FullName }
            # 자식 디렉터리 탐색 (jdk-17, jdk-21 등)
            $sub = Get-ChildItem -Path $d -Directory -ErrorAction SilentlyContinue |
                   Where-Object { $_.Name -match 'jdk' } |
                   Sort-Object Name -Descending |
                   Select-Object -First 1
            if ($sub -and (Test-Path "$($sub.FullName)\bin\java.exe")) {
                return $sub.FullName
            }
        }
    }

    # 3) PATH에서 java.exe 위치로 역추적
    $javaExe = Get-Command java -ErrorAction SilentlyContinue
    if ($javaExe) {
        return Split-Path (Split-Path $javaExe.Source)
    }

    return $null
}

# ─── 2. ANDROID_HOME 탐지 ─────────────────────────────────────────────────
function Find-AndroidHome {
    # 1) 이미 환경 변수가 있으면 검증 후 사용
    $existing = $env:ANDROID_HOME, $env:ANDROID_SDK_ROOT | Where-Object { $_ }
    foreach ($p in $existing) {
        if (Test-Path "$p\platform-tools") { return $p }
    }

    # 2) 일반 설치 경로
    $candidates = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk",
        "$env:ProgramFiles\Android\Sdk",
        "C:\Android\Sdk",
        "C:\android-sdk"
    )
    foreach ($p in $candidates) {
        if (Test-Path "$p\platform-tools") { return $p }
    }

    # 3) Android Studio local.properties에서 읽기
    $localProps = Join-Path $PSScriptRoot "android-app\local.properties"
    if (Test-Path $localProps) {
        $line = Get-Content $localProps | Where-Object { $_ -match '^sdk\.dir=' }
        if ($line) {
            $sdkDir = ($line -replace '^sdk\.dir=', '').Trim().Replace('\:', ':').Replace('/', '\')
            if (Test-Path "$sdkDir\platform-tools") { return $sdkDir }
        }
    }

    return $null
}

# ─── 3. 탐지 실행 ─────────────────────────────────────────────────────────
$javaHome    = Find-JavaHome
$androidHome = Find-AndroidHome

Write-Host ""

# JAVA_HOME 결과
if ($javaHome) {
    Write-Host "✅ Java 감지: $javaHome" -ForegroundColor Green
    $javaVer = & "$javaHome\bin\java.exe" -version 2>&1 | Select-String "version"
    Write-Host "   $javaVer" -ForegroundColor Gray
} else {
    Write-Host "❌ Java를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "   👉 https://adoptium.net/ 에서 JDK 17 LTS를 설치하세요." -ForegroundColor Yellow
}

# ANDROID_HOME 결과
if ($androidHome) {
    Write-Host "✅ Android SDK 감지: $androidHome" -ForegroundColor Green
} else {
    Write-Host "❌ Android SDK를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "   👉 Android Studio 설치 후 SDK Manager에서 API 34를 설치하세요." -ForegroundColor Yellow
    Write-Host "   👉 https://developer.android.com/studio" -ForegroundColor Yellow
}

# ─── 4. 환경 변수 등록 (현재 세션 + 사용자 영구) ──────────────────────────
$registered = $false

if ($javaHome -and $javaHome -ne $env:JAVA_HOME) {
    Write-Host "`n📌 JAVA_HOME 등록 중..." -ForegroundColor Cyan
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
    $env:JAVA_HOME = $javaHome
    $env:PATH = "$javaHome\bin;" + ($env:PATH -replace [regex]::Escape("$env:JAVA_HOME\bin;"), "")
    Write-Host "   JAVA_HOME = $javaHome" -ForegroundColor Green
    $registered = $true
}

if ($androidHome -and $androidHome -ne $env:ANDROID_HOME) {
    Write-Host "📌 ANDROID_HOME 등록 중..." -ForegroundColor Cyan
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "User")
    [System.Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidHome, "User")
    $env:ANDROID_HOME = $androidHome
    $env:ANDROID_SDK_ROOT = $androidHome

    $platformTools = "$androidHome\platform-tools"
    $tools = "$androidHome\tools"
    if ($env:PATH -notlike "*$platformTools*") {
        $env:PATH = "$platformTools;$tools;" + $env:PATH
        $currentPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentPath -notlike "*$platformTools*") {
            [System.Environment]::SetEnvironmentVariable("PATH", "$platformTools;$tools;$currentPath", "User")
        }
    }
    Write-Host "   ANDROID_HOME = $androidHome" -ForegroundColor Green
    $registered = $true
}

# ─── 5. local.properties 생성 ─────────────────────────────────────────────
$localPropsPath = Join-Path $PSScriptRoot "android-app\local.properties"

if ($androidHome) {
    # Windows 경로를 Java 스타일로 변환 (백슬래시 → 슬래시)
    $sdkDirForProps = $androidHome.Replace('\', '/')
    $propsContent = @"
# 자동 생성: setup-android-env.ps1 ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))
# 이 파일은 Git에 커밋하지 마세요 (.gitignore에 포함 확인)
sdk.dir=$sdkDirForProps
"@
    $propsContent | Set-Content -Path $localPropsPath -Encoding UTF8
    Write-Host "`n✅ local.properties 생성 완료" -ForegroundColor Green
    Write-Host "   경로: $localPropsPath" -ForegroundColor Gray
} else {
    # Android SDK가 없어도 템플릿 생성
    if (-not (Test-Path $localPropsPath)) {
        @"
# Android SDK 경로를 여기에 입력하세요
# 예: sdk.dir=C:/Users/사용자이름/AppData/Local/Android/Sdk
sdk.dir=
"@ | Set-Content -Path $localPropsPath -Encoding UTF8
        Write-Host "`n⚠️  local.properties 템플릿 생성 (sdk.dir 수동 입력 필요)" -ForegroundColor Yellow
    }
}

# ─── 6. gradlew 실행 테스트 ────────────────────────────────────────────────
Write-Host "`n🔍 Android 빌드 가능 여부 테스트..." -ForegroundColor Cyan

$gradlew = Join-Path $PSScriptRoot "android-app\gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Host "❌ gradlew.bat을 찾을 수 없습니다: $gradlew" -ForegroundColor Red
} elseif (-not $androidHome) {
    Write-Host "⚠️  Android SDK 없음 — gradlew 실행 불가" -ForegroundColor Yellow
} elseif (-not $javaHome) {
    Write-Host "⚠️  Java 없음 — gradlew 실행 불가" -ForegroundColor Yellow
} else {
    Write-Host "   gradlew 버전 확인 중..."
    Push-Location (Join-Path $PSScriptRoot "android-app")
    try {
        $result = & .\gradlew.bat --version 2>&1 | Select-String -Pattern "Gradle"
        if ($result) {
            Write-Host "✅ $result" -ForegroundColor Green
        } else {
            Write-Host "⚠️  gradlew 실행됐지만 버전 확인 불가" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ gradlew 실행 오류: $_" -ForegroundColor Red
    } finally {
        Pop-Location
    }
}

# ─── 7. 다음 단계 안내 ────────────────────────────────────────────────────
Write-Host @"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 APK 빌드 명령어
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  cd android-app
  .\gradlew.bat assembleRelease

📁 출력 경로
  android-app\app\build\outputs\apk\release\Moovlog_Shorts_v2.74.apk

💡 VS Code 터미널 재시작 후 환경 변수가 적용됩니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Cyan
