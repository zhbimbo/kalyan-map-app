document.addEventListener('DOMContentLoaded', function() {
    let map;
    let placemarks = [];
    let selectedPlacemark = null;

    // Проверка мобильного устройства
    const isMobile = () => 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Инициализация BottomSheet
    class BottomSheet {
        constructor(element) {
            this.element = element;
            this.handle = element.querySelector('.swipe-handle');
            this.state = 'hidden';
            this.collapsedHeight = window.innerHeight * 0.15;
            this.expandedHeight = window.innerHeight * 0.85;
            this.minTranslateY = -this.expandedHeight + this.collapsedHeight;
            this.init();
        }

        init() {
            this.setupEventListeners();
            window.addEventListener('resize', this.handleResize.bind(this));
        }

        setupEventListeners() {
            this.handle.addEventListener('touchstart', this.startDrag.bind(this));
            document.addEventListener('touchmove', this.moveDrag.bind(this));
            document.addEventListener('touchend', this.endDrag.bind(this));
            this.handle.addEventListener('mousedown', this.startDrag.bind(this));
            document.addEventListener('mousemove', this.moveDrag.bind(this));
            document.addEventListener('mouseup', this.endDrag.bind(this));
            this.element.querySelector('.close-balloon').addEventListener('click', this.hide.bind(this));
        }

        startDrag(e) {
            this.startY = e.clientY || e.touches[0].clientY;
            this.startTranslateY = this.getCurrentTranslateY();
            this.isDragging = true;
            this.element.style.transition = 'none';
            this.lastY = this.startY;
            this.lastTime = Date.now();
        }

        moveDrag(e) {
            if (!this.isDragging) return;
            e.preventDefault();
            const currentY = e.clientY || e.touches[0].clientY;
            const diff = currentY - this.startY;
            let newTranslateY = this.startTranslateY + diff;
            newTranslateY = Math.min(Math.max(newTranslateY, this.minTranslateY), 0);
            this.element.style.transform = `translateY(${newTranslateY}px)`;
        }

        endDrag() {
            const currentY = this.getCurrentTranslateY();
            if (currentY < -this.collapsedHeight * 0.5) {
                this.expand();
            } else {
                this.collapse();
            }
        }

        show() {
            this.element.style.transform = `translateY(${this.collapsedHeight}px)`;
            this.element.classList.add('visible');
            this.state = 'collapsed';
        }

        hide() {
            this.element.style.transform = 'translateY(100vh)';
            setTimeout(() => {
                this.element.classList.remove('visible');
                this.state = 'hidden';
            }, 300);
        }

        expand() {
            this.element.style.transform = 'translateY(0)';
            this.state = 'expanded';
        }

        collapse() {
            this.element.style.transform = `translateY(${this.collapsedHeight}px)`;
            this.state = 'collapsed';
        }

        getCurrentTranslateY() {
            const transform = window.getComputedStyle(this.element).transform;
            return transform ? parseFloat(transform.split(',')[5]) : 0;
        }

        handleResize() {
            this.collapsedHeight = window.innerHeight * 0.15;
            this.expandedHeight = window.innerHeight * 0.85;
            this.minTranslateY = -this.expandedHeight + this.collapsedHeight;
        }
    }

    const mobileSheetElement = document.getElementById('mobile-bottom-sheet');
    const bottomSheet = mobileSheetElement ? new BottomSheet(mobileSheetElement) : null;

    // Функция геолокации
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (map) {
                        map.setCenter([position.coords.latitude, position.coords.longitude], 14);
                    }
                },
                () => alert("Ошибка геолокации")
            );
        }
    }

    // Инициализация карты
    ymaps.ready(() => {
        map = new ymaps.Map('map', {
            center: [55.7558, 37.6173],
            zoom: 12,
            controls: []
        });

        // Загрузка данных
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                data.forEach(place => {
                    const placemark = createPlacemark(place);
                    placemarks.push(placemark);
                    map.geoObjects.add(placemark);
                });
                document.getElementById('count').textContent = data.length;
            })
            .catch(error => console.error('Ошибка:', error));
    });

    // Маркеры
    const getIconByRating = (rating) => {
        if (rating >= 4) return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png';
        if (rating >= 3) return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png';
        return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
    };

    const createPlacemark = (place) => {
        const rating = parseFloat(place.description.match(/\d\.\d|\d/)[0]);
        const placemark = new ymaps.Placemark(
            place.coordinates,
            {
                customData: place
            },
            {
                iconLayout: 'default#image',
                iconImageHref: getIconByRating(rating),
                iconImageSize: [30, 30]
            }
        );
        placemark.events.add('click', (e) => {
            const placeData = e.get('target').properties.get('customData');
            if (isMobile()) {
                openMobilePanel(placeData);
            } else {
                openDesktopSidebar(placeData);
            }
            e.preventDefault();
        });
        return placemark;
    };

    // Открытие мобильной панели
    const openMobilePanel = (placeData) => {
        document.querySelector('.balloon-title').textContent = placeData.name;
        document.querySelector('.balloon-image').src = placeData.photo;
        document.querySelector('.balloon-address').textContent = placeData.address;
        document.querySelector('.balloon-phone').textContent = placeData.phone;
        document.querySelector('.balloon-hours').textContent = placeData.hours;
        document.querySelector('.balloon-rating').textContent = placeData.description;
        document.querySelector('.balloon-review-link').href = placeData.reviewLink;
        bottomSheet.show();
    };

    // Открытие десктопной панели
    const openDesktopSidebar = (placeData) => {
        document.getElementById('sidebar-title').textContent = placeData.name;
        document.getElementById('sidebar-image').src = placeData.photo;
        document.getElementById('sidebar-address').textContent = placeData.address;
        document.getElementById('sidebar-phone').textContent = placeData.phone;
        document.getElementById('sidebar-hours').textContent = placeData.hours;
        document.getElementById('sidebar-rating').textContent = placeData.description;
        document.getElementById('sidebar-review-link').href = placeData.reviewLink;
        document.getElementById('desktop-sidebar').classList.remove('hidden');
        document.getElementById('desktop-sidebar').classList.add('visible');
    };

    // Фильтры
    const filterPlacemarks = () => {
        const ratingFilter = document.getElementById('ratingFilter').value;
        const districtFilter = document.getElementById('districtFilter').value;
        const hoursFilter = document.getElementById('hoursFilter').value;
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();

        placemarks.forEach(placemark => {
            const data = placemark.properties.get('customData');
            const rating = parseFloat(data.description.match(/\d\.\d|\d/)[0]);
            const show = 
                (ratingFilter === 'all' || rating >= parseFloat(ratingFilter)) &&
                (districtFilter === 'all' || data.district === districtFilter) &&
                (hoursFilter === 'all' || data.hours === hoursFilter) &&
                data.name.toLowerCase().includes(searchQuery);

            placemark.options.set('visible', show);
        });
    };

    // Обработчики
    document.getElementById('toggleFilters').addEventListener('click', (e) => {
        e.stopPropagation();
        const filtersPanel = document.getElementById('filters-panel');
        if (filtersPanel) {
            filtersPanel.classList.toggle('visible');
        }
    });

    document.getElementById('toggleLocation').addEventListener('click', getLocation);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#filters-panel') && !e.target.closest('#toggleFilters')) {
            const filtersPanel = document.getElementById('filters-panel');
            if (filtersPanel) {
                filtersPanel.classList.remove('visible');
            }
        }
    });

    document.getElementById('ratingFilter').addEventListener('change', filterPlacemarks);
    document.getElementById('districtFilter').addEventListener('change', filterPlacemarks);
    document.getElementById('hoursFilter').addEventListener('change', filterPlacemarks);
    document.getElementById('searchInput').addEventListener('input', filterPlacemarks);

    // Закрытие панелей
    document.getElementById('close-sidebar').addEventListener('click', () => {
        document.getElementById('desktop-sidebar').classList.remove('visible');
        document.getElementById('desktop-sidebar').classList.add('hidden');
    });

    // Проверка инициализации карты
    if (!map) {
        console.error("Карта не загружена. Убедитесь, что API-ключ верный.");
    }
});

// Функция применения фильтров
function applyFilters() {
    filterPlacemarks(); // Обновление фильтров
}
