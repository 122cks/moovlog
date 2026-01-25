# 무브먼트(moovlog) 링크 페이지

인포크 스타일의 개인 링크 페이지입니다.

## 🚀 배포 방법

### 방법 1: GitHub Pages (무료, 추천)

1. **GitHub 계정 만들기** (없는 경우)
   - https://github.com 에서 회원가입

2. **새 저장소 만들기**
   - GitHub에서 "New repository" 클릭
   - 저장소 이름: `moovlog` (또는 원하는 이름)
   - Public 선택
   - "Create repository" 클릭

3. **파일 업로드**
   ```bash
   # 터미널에서 실행
   cd "c:\Users\7tpwz\OneDrive\문서\무브먼트(moovlog) 페이지"
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/moovlog.git
   git push -u origin main
   ```

4. **GitHub Pages 활성화**
   - 저장소 Settings → Pages
   - Source: "main" 브랜치 선택
   - Save 클릭
   - 배포 URL: `https://YOUR_USERNAME.github.io/moovlog/`

### 방법 2: Netlify (무료, 더 쉬움)

1. **Netlify 계정 만들기**
   - https://www.netlify.com 에서 회원가입

2. **새 사이트 배포**
   - "Add new site" → "Deploy manually" 클릭
   - 폴더 전체를 드래그 앤 드롭
   - 자동으로 배포 URL 생성: `https://random-name.netlify.app`

3. **커스텀 도메인 설정** (선택사항)
   - Site settings → Domain management
   - 원하는 도메인 연결 가능

### 방법 3: Vercel (무료)

1. **Vercel 계정 만들기**
   - https://vercel.com 에서 회원가입

2. **새 프로젝트 배포**
   - "Add New" → "Project" 클릭
   - GitHub 연동 또는 폴더 업로드
   - 자동 배포: `https://moovlog.vercel.app`

## ✏️ 수정 방법

### 1. SNS 링크 수정
`index.html` 파일에서 다음 부분을 수정하세요:

```html
<!-- 유튜브 -->
<a href="YOUR_YOUTUBE_LINK" target="_blank" class="social-icon youtube">

<!-- 인스타그램 -->
<a href="YOUR_INSTAGRAM_LINK" target="_blank" class="social-icon instagram">

<!-- 틱톡 -->
<a href="YOUR_TIKTOK_LINK" target="_blank" class="social-icon tiktok">

<!-- 네이버 블로그 -->
<a href="YOUR_BLOG_LINK" target="_blank" class="social-icon naver-blog">

<!-- 페이스북 -->
<a href="YOUR_FACEBOOK_LINK" target="_blank" class="social-icon facebook">

<!-- 이메일 -->
<a href="mailto:YOUR_EMAIL" class="social-icon email">

<!-- 전화번호 -->
<a href="tel:YOUR_PHONE" class="social-icon phone">
```

### 2. 네이버 클립 링크 수정
```html
<a href="YOUR_NAVER_CLIP_LINK" target="_blank" class="link-button naver-clip">
```

### 3. 쿠팡 파트너스 링크 추가

각 제품 카드에서 다음 부분을 수정:
```html
<a href="YOUR_COUPANG_LINK_1" target="_blank" class="action-icon shopping">
```

### 4. 프로필 이미지 변경

1. 원하는 이미지를 폴더에 `profile.jpg`로 저장
2. `index.html`에서 수정:
```html
<img src="profile.jpg" alt="무브먼트 프로필">
```

### 5. 제품 이미지 변경

1. 제품 이미지를 폴더에 저장 (예: `product1.jpg`)
2. `index.html`에서 수정:
```html
<img src="product1.jpg" alt="제품명">
```

### 6. 제품 추가/삭제

제품 카드 전체를 복사하여 추가하거나 삭제:
```html
<div class="product-card">
    <div class="product-badge">링크</div>
    <div class="product-image">
        <img src="제품이미지.jpg" alt="제품명">
    </div>
    <div class="product-info">
        <h3>제품명과 설명</h3>
        <div class="product-meta">
            <span><i class="far fa-heart"></i> 오늘 0</span>
            <span><i class="fas fa-chart-line"></i> 총 0</span>
        </div>
    </div>
    <div class="product-actions">
        <a href="쿠팡링크" target="_blank" class="action-icon shopping">
            <i class="fas fa-shopping-cart"></i>
        </a>
        <a href="인스타그램링크" target="_blank" class="action-icon instagram">
            <i class="fab fa-instagram"></i>
        </a>
    </div>
    <div class="product-toggle">
        <label class="switch">
            <input type="checkbox" checked>
            <span class="slider"></span>
        </label>
    </div>
</div>
```

## 📱 기능

- ✅ 모바일 최적화 (반응형 디자인)
- ✅ PC에서도 완벽하게 작동
- ✅ SNS 링크 연동 (유튜브, 인스타그램, 틱톡, 페이스북, 네이버블로그, 네이버클립)
- ✅ 쿠팡 파트너스 링크
- ✅ 제품 on/off 토글 기능
- ✅ 클릭 추적 기능
- ✅ 공유 기능
- ✅ 부드러운 애니메이션

## 🎨 커스터마이징

### 배경색 변경
`style.css` 파일의 다음 부분 수정:
```css
.profile-card {
    background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #03A9F4 100%);
}
```

### 프로필 카드 색상 변경
원하는 색상 코드로 변경 가능:
- 파란색: #4FC3F7
- 분홍색: #FF6B9D
- 초록색: #4CAF50
- 보라색: #9C27B0

## 📞 문의

비즈니스 제안: [이메일 주소]

## 📝 라이선스

개인 용도로 자유롭게 사용하세요!
