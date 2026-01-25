// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeSocialLinks();
    initializeProductCards();
    initializeRollingBanner();
    initializeProductSearch();
});

// 애니메이션 초기화
function initializeAnimations() {
    // 스크롤 애니메이션
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.product-card').forEach(card => {
        observer.observe(card);
    });
}

// SNS 링크 기능
function initializeSocialLinks() {
    const shareIcon = document.querySelector('.share-icon');
    const notificationIcon = document.querySelector('.notification-icon');

    if (shareIcon) {
        shareIcon.addEventListener('click', function() {
            if (navigator.share) {
                navigator.share({
                    title: '무브먼트 - moovlog',
                    text: '@이동 블로그 - 맛집·여행·투자·리뷰',
                    url: window.location.href
                }).catch(err => console.log('공유 실패:', err));
            } else {
                copyToClipboard(window.location.href);
                showNotification('링크가 클립보드에 복사되었습니다!');
            }
        });
    }

    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            showNotification('알림 설정이 곧 추가될 예정입니다!');
        });
    }
}

// 제품 카드 기능
function initializeProductCards() {
    // 토글 스위치
    const toggles = document.querySelectorAll('.switch input');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const card = this.closest('.product-card');
            if (this.checked) {
                card.style.opacity = '1';
            } else {
                card.style.opacity = '0.5';
            }
        });
    });

    // 제품 카드 클릭 추적
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // 토글이나 액션 아이콘 클릭이 아닌 경우에만
            if (!e.target.closest('.product-toggle') && !e.target.closest('.product-actions')) {
                const productName = this.querySelector('h3').textContent;
                console.log('제품 카드 클릭:', productName);
                // 여기에 분석 코드 추가 가능
            }
        });
    });
}

// 클립보드에 복사
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// 알림 표시
function showNotification(message) {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-size: 14px;
        z-index: 10000;
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3초 후 제거
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 제품 링크 클릭 추적
document.querySelectorAll('.action-icon.shopping').forEach(link => {
    link.addEventListener('click', function(e) {
        const productCard = this.closest('.product-card');
        const productName = productCard.querySelector('h3').textContent;
        console.log('쿠팡 링크 클릭:', productName);
        
        // 클릭 수 업데이트 (실제로는 서버와 통신 필요)
        const todayCount = productCard.querySelector('.product-meta span:first-child');
        if (todayCount) {
            const currentCount = parseInt(todayCount.textContent.match(/\d+/)[0]);
            todayCount.innerHTML = `<i class="far fa-heart"></i> 오늘 ${currentCount + 1}`;
        }
    });
});

// 스크롤 시 플로팅 버튼 효과
let lastScrollTop = 0;
const floatingButton = document.querySelector('.floating-add-button');

window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop) {
        // 스크롤 다운
        if (floatingButton) {
            floatingButton.style.transform = 'scale(0.9)';
        }
    } else {
        // 스크롤 업
        if (floatingButton) {
            floatingButton.style.transform = 'scale(1)';
        }
    }
    
    lastScrollTop = scrollTop;
}, false);

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// 제품 추가 기능 (예시)
function addNewProduct(productData) {
    const productsSection = document.querySelector('.products-section');
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
        <div class="product-badge">링크</div>
        <div class="product-image">
            <img src="${productData.image}" alt="${productData.name}">
        </div>
        <div class="product-info">
            <h3>${productData.name}</h3>
            <div class="product-meta">
                <span><i class="far fa-heart"></i> 오늘 0</span>
                <span><i class="fas fa-chart-line"></i> 총 0</span>
            </div>
        </div>
        <div class="product-actions">
            <a href="${productData.link}" target="_blank" class="action-icon shopping">
                <i class="fas fa-shopping-cart"></i>
            </a>
            <a href="${productData.instagram}" target="_blank" class="action-icon instagram">
                <i class="fab fa-instagram"></i>
            </a>
        </div>
        <div class="product-toggle">
            <label class="switch">
                <input type="checkbox" checked>
                <span class="slider"></span>
            </label>
        </div>
    `;
    
    productsSection.appendChild(productCard);
    showNotification('새 제품이 추가되었습니다!');
}

// 비즈니스 제안 버튼 클릭 추적
document.querySelector('.business-button')?.addEventListener('click', function() {
    console.log('비즈니스 제안 버튼 클릭');
});

// 인포크 브랜딩 클릭
document.querySelector('.inpock-branding')?.addEventListener('click', function() {
    window.open('https://inpock.co.kr', '_blank');
});

// 롤링 배너 초기화
function initializeRollingBanner() {
    const rollingBanner = document.querySelector('.rolling-banner');
    if (!rollingBanner) return;
    
    // 배너 아이템 클릭 추적
    const bannerItems = document.querySelectorAll('.banner-item');
    bannerItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const title = this.getAttribute('title');
            console.log('SNS 배너 클릭:', title);
        });
    });
    
    // 터치/마우스 드래그로 스크롤 제어
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    
    rollingBanner.addEventListener('mousedown', dragStart);
    rollingBanner.addEventListener('touchstart', dragStart);
    rollingBanner.addEventListener('mouseup', dragEnd);
    rollingBanner.addEventListener('touchend', dragEnd);
    rollingBanner.addEventListener('mousemove', drag);
    rollingBanner.addEventListener('touchmove', drag);
    rollingBanner.addEventListener('mouseleave', dragEnd);
    
    function dragStart(e) {
        isDragging = true;
        startPos = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        rollingBanner.style.cursor = 'grabbing';
        rollingBanner.style.animationPlayState = 'paused';
    }
    
    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        currentTranslate = prevTranslate + currentPosition - startPos;
    }
    
    function dragEnd() {
        isDragging = false;
        prevTranslate = currentTranslate;
        rollingBanner.style.cursor = 'grab';
        rollingBanner.style.animationPlayState = 'running';
    }
}

// 상품 검색 기능
function initializeProductSearch() {
    const searchInput = document.getElementById('productSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const productItems = document.querySelectorAll('.product-item');
        
        productItems.forEach(item => {
            const productName = item.getAttribute('data-name').toLowerCase();
            
            if (productName.includes(searchTerm)) {
                item.classList.remove('hidden');
                // 애니메이션 효과
                item.style.animation = 'fadeInUp 0.3s ease';
            } else {
                item.classList.add('hidden');
            }
        });
        
        // 검색 결과가 없을 때
        const visibleProducts = document.querySelectorAll('.product-item:not(.hidden)');
        const productsGrid = document.querySelector('.products-grid');
        
        if (visibleProducts.length === 0 && searchTerm !== '') {
            if (!document.querySelector('.no-results')) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.innerHTML = '<p><i class="fas fa-search"></i> 검색 결과가 없습니다.</p>';
                noResults.style.cssText = 'text-align: center; padding: 40px; color: #999; grid-column: 1 / -1;';
                productsGrid.appendChild(noResults);
            }
        } else {
            const noResults = document.querySelector('.no-results');
            if (noResults) {
                noResults.remove();
            }
        }
    });
}
