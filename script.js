document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const courseCards = document.querySelectorAll('.course-card');

    let currentFilters = {
        category1: 'all', // 선택 과목군
        category2: 'all', // 교과
        category3: 'all'  // 이수 구분
    };

    // --- 새로운 UI 요소들 ---
    const mainContainer = document.querySelector('main');
    const detailPanel = document.querySelector('.detail-panel');
    const detailImage = document.getElementById('detailImage');
    const closeDetailPanelButton = document.querySelector('.close-detail-panel');

    // 이미지 확대/축소/이동 관련 변수 (detailImage에 적용)
    let currentScale = 1;
    const scaleStep = 0.1;
    let isDragging = false;
    let startX, startY;
    let currentX = 0, currentY = 0;
    let lastX = 0, lastY = 0;

    // --- 필터링 관련 로직 (기존과 동일) ---
    function applyFilters() {
        courseCards.forEach(card => {
            const cardCategory1s = card.dataset.category1 ? card.dataset.category1.split(',') : [];
            const cardCategory2s = card.dataset.category2 ? card.dataset.category2.split(',') : [];
            const cardCategory3s = card.dataset.category3 ? card.dataset.category3.split(',') : [];

            const matchesCategory1 = (currentFilters.category1 === 'all' || cardCategory1s.includes(currentFilters.category1));
            const matchesCategory2 = (currentFilters.category2 === 'all' || cardCategory2s.includes(currentFilters.category2));
            const matchesCategory3 = (currentFilters.category3 === 'all' || cardCategory3s.includes(currentFilters.category3));

            if (matchesCategory1 && matchesCategory2 && matchesCategory3) {
                card.classList.remove('display-none');
                requestAnimationFrame(() => {
                    card.classList.remove('hidden');
                });
            } else {
                card.classList.add('hidden');
                if (card.timeoutId) {
                    clearTimeout(card.timeoutId);
                }
                card.timeoutId = setTimeout(() => {
                    card.classList.add('display-none');
                    card.timeoutId = null;
                }, 400);
            }
        });
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterType = button.dataset.filterType;
            const filterValue = button.dataset.filterValue;

            const groupButtons = document.querySelectorAll(`.filter-btn[data-filter-type="${filterType}"]`);
            groupButtons.forEach(btn => btn.classList.remove('active'));

            button.classList.add('active');
            currentFilters[filterType] = filterValue;

            courseCards.forEach(card => {
                if (card.timeoutId) {
                    clearTimeout(card.timeoutId);
                    card.timeoutId = null;
                }
            });
            applyFilters();
        });
    });

    document.querySelectorAll('.filter-btn[data-filter-value="all"]').forEach(button => {
        button.classList.add('active');
    });

    applyFilters(); // 초기 로드 시 필터 적용

    // --- 상세 패널 열기/닫기 로직 ---

    // 과목 카드 클릭 시 상세 패널 열기
    courseCards.forEach(card => {
        card.addEventListener('click', function() {
            // 모든 과목 카드의 'selected' 클래스 제거
            courseCards.forEach(c => c.classList.remove('selected'));
            // 현재 클릭된 카드에 'selected' 클래스 추가
            this.classList.add('selected');

            const popupImgSrc = this.dataset.popupImg;
            
            // 상세 이미지 로드
            if (popupImgSrc) {
                detailImage.src = popupImgSrc;
                detailImage.onload = () => {
                    currentScale = 1;
                    currentX = 0;
                    currentY = 0; // 항상 상단에 위치하도록 초기화
                    lastX = 0;
                    lastY = 0;
                    // 이미지를 뷰어의 상단에 맞추기 위해 transform-origin을 변경
                    detailImage.style.transform = `scale(${currentScale}) translate(${currentX}px, ${currentY}px)`;
                    detailImage.style.transformOrigin = 'top center'; // 상단 중앙으로 변경
                };
            } else {
                detailImage.src = '';
            }

            // 상세 패널 활성화 (main 요소에 'detail-active' 클래스 추가)
            mainContainer.classList.add('detail-active');

            if (window.innerWidth <= 1024) {
                detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 상세 패널 닫기 버튼 클릭 시
    closeDetailPanelButton.addEventListener('click', () => {
        // 상세 패널 비활성화 (main 요소에서 'detail-active' 클래스 제거)
        mainContainer.classList.remove('detail-active');
        courseCards.forEach(c => c.classList.remove('selected'));
        detailImage.src = '';
    });

    // --- 이미지 확대/축소/이동 기능 (detailImage에 적용) ---

    detailImage.addEventListener('wheel', (event) => {
        event.preventDefault();

        // 스케일 변경
        if (event.deltaY < 0) {
            currentScale += scaleStep;
        } else {
            currentScale -= scaleStep;
        }

        // 스케일 제한 및 초기화
        if (currentScale < 1) {
            currentScale = 1;
            currentX = 0;
            currentY = 0; // 스케일 1일 때는 항상 (0,0)으로 초기화
            lastX = 0;
            lastY = 0;
            detailImage.style.transformOrigin = 'top center'; // 다시 상단 중앙으로
        }
        if (currentScale > 5) {
            currentScale = 5;
        }

        applyTransformWithBounds();
    });

    detailImage.addEventListener('mousedown', (event) => {
        if (event.button === 0 && currentScale > 1) {
            isDragging = true;
            startX = event.clientX;
            startY = event.clientY;
            lastX = currentX;
            lastY = currentY;
            detailImage.style.cursor = 'grabbing';
            event.preventDefault();
        }
    });

    detailPanel.addEventListener('mousemove', (event) => {
        if (!isDragging) return;

        const dx = (event.clientX - startX);
        const dy = (event.clientY - startY);

        currentX = lastX + dx;
        currentY = lastY + dy;

        applyTransformWithBounds();
    });

    detailPanel.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            detailImage.style.cursor = 'grab';
        }
    });

    detailPanel.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            detailImage.style.cursor = 'grab';
        }
    });

    detailImage.style.cursor = 'grab';

    // --- 이미지 위치 제한 및 변환 적용 함수 ---
    function applyTransformWithBounds() {
        const viewerRect = detailImage.parentElement.getBoundingClientRect();
        // 이미지의 실제 크기 (스케일 미적용)를 가져옴
        const imageNaturalWidth = detailImage.naturalWidth;
        const imageNaturalHeight = detailImage.naturalHeight;

        // 현재 스케일이 적용된 이미지의 렌더링된 크기
        const imageRenderedWidth = imageNaturalWidth * currentScale;
        const imageRenderedHeight = imageNaturalHeight * currentScale;

        const viewerWidth = viewerRect.width;
        const viewerHeight = viewerRect.height;

        let transformX = currentX;
        let transformY = currentY;

        // X축 (가로) 제한: 이미지가 뷰어보다 크면 중앙 정렬을 유지하며 이동, 아니면 0 (중앙)
        if (imageRenderedWidth > viewerWidth) {
            const maxX = (imageRenderedWidth - viewerWidth) / 2;
            transformX = Math.max(-maxX, Math.min(transformX, maxX));
        } else {
            transformX = 0; // 뷰어보다 작으면 가로 중앙
        }

        // Y축 (세로) 제한: 상단 정렬을 유지하면서 스크롤 가능하게
        if (imageRenderedHeight > viewerHeight) {
            // 이미지 높이가 뷰어 높이보다 크면, 위쪽에서 시작하고 아래로만 스크롤 가능
            // currentY가 0보다 커지는 것을 막고, -maxY보다 작아지는 것을 막음
            const maxY = imageRenderedHeight - viewerHeight;
            transformY = Math.max(-maxY, Math.min(transformY, 0)); // 위쪽(0)부터 시작하여 아래(-maxY)까지 이동
        } else {
            transformY = 0; // 뷰어보다 작으면 세로 상단 (0)
        }
        
        detailImage.style.transform = `scale(${currentScale}) translate(${transformX}px, ${transformY}px)`;
        // transformOrigin은 onload 시에 이미 'top center'로 설정했으므로 여기서 다시 설정할 필요 없음
    }
});