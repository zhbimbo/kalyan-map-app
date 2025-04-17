document.addEventListener('DOMContentLoaded', function() {
    let map;
    let placemarks = [];
    const isMobile = window.innerWidth <= 767;

    // 1. Проверка загрузки API Яндекс.Карт
    if (!window.ymaps) {
        console.error('Yandex Maps API не загружен');
        return;
    }

    // 2. Инициализация карты с обработкой ошибок
ymaps.ready(function() {
    try {
        map = new ymaps.Map('map', {
            center: [55.7558, 37.6173],
            zoom: 12,
            controls: []
        });

        // Блокируем клики на фоне карты и посторонних элементах
        map.events.add('click', function(e) {
            if (!e.get('target') || !e.get('target').properties.get('customData')) {
                e.preventDefault();
                return false;
            }
        });

        // Настройки поведения для разных устройств
        if (isMobile) {
            // Для мобильных: включаем только мультитач
            map.behaviors.enable('multiTouch');
            map.behaviors.disable([
                'drag', // Можно включить, если нужен драг
                'rightMouseButtonMagnifier'
            ]);
        } else {
            // Для десктопа: оставляем колесико и правую кнопку
            map.behaviors.enable([
                'scrollZoom',
                'rightMouseButtonMagnifier'
            ]);
        }

        // Отключаем POI (точки интереса Яндекса)
        map.options.set('yandexMapDisablePoiInteractivity', true);

    } catch (e) {
        console.error('Ошибка инициализации карты:', e);
    }
});

            // 4. Загрузка данных
            loadPlacesData();

        } catch (e) {
            console.error('Ошибка инициализации карты:', e);
            alert('Произошла ошибка при загрузке карты');
        }
    });

    function loadPlacesData() {
        fetch('data.json')
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки данных');
                return response.json();
            })
            .then(data => {
                data.forEach(place => {
                    const placemark = createPlacemark(place);
                    placemarks.push(placemark);
                    map.geoObjects.add(placemark);
                });
                document.getElementById('count').textContent = data.length;
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Не удалось загрузить данные о местах');
            });
    }
    // 2. Функция для получения иконки
    function getIconByRating(rating) {
        if (rating >= 4) return 'icons/star-green.png';
        if (rating >= 3) return 'icons/star-yellow.png';
        return 'icons/star-red.png';
    }

    // 3. Создание метки (упрощенная версия)
function createPlacemark(place) {
    const rating = parseFloat(place.description.split('/')[0]);
    const placemark = new ymaps.Placemark(
        place.coordinates,
        {
            customData: place,
            // Отключаем стандартные балуны
            balloonContentHeader: '',
            balloonContentBody: '',
            balloonContentFooter: ''
        },
        {
            iconLayout: 'default#imageWithContent',
            iconImageHref: getIconByRating(rating),
            iconImageSize: [40, 40],
            iconImageOffset: [-20, -40],
            // Критически важные настройки:
            interactivityModel: 'default#layer',
            hideIconOnBalloonOpen: false,
            balloonInteractivityModel: 'default#opaque',
            // Добавляем свой класс для анимации
            preset: 'islands#circleIcon'
        }
    );

    // Обработчик клика с анимацией через CSS
    placemark.events.add('click', function(e) {
        e.preventDefault();
        const target = e.get('target');
        
        // 1. Добавляем класс для анимации
        target.options.set('preset', 'islands#circleDotIcon');
        
        // 2. Открываем панель
        const placeData = target.properties.get('customData');
        if (isMobile) {
            openMobilePanel(placeData);
        } else {
            openDesktopSidebar(placeData);
        }
        
        // 3. Через 1 секунду убираем анимацию
        setTimeout(() => {
            target.options.set('preset', 'islands#circleIcon');
        }, 1000);
        
        return false;
    });

    return placemark;
}
    // Используем ваши иконки
    function getIconByRating(rating) {
        if (rating >= 4) return 'icons/star-green.png';
        if (rating >= 3) return 'icons/star-yellow.png';
        return 'icons/star-red.png';
    }

    function openMobilePanel(placeData) {
        const rating = parseFloat(placeData.description.split('/')[0]);
        
        // Добавляем проверку на существование элементов
        const mobileSheet = document.getElementById('mobile-bottom-sheet');
        if (!mobileSheet) return;
        
        document.querySelector('.balloon-title').textContent = placeData.name;
        document.querySelector('.balloon-image').src = placeData.photo;
        document.querySelector('.balloon-address').textContent = placeData.address;
        document.querySelector('.balloon-phone').textContent = placeData.phone;
        document.querySelector('.balloon-hours').textContent = placeData.hours;
        document.querySelector('.balloon-district').textContent = placeData.district;
        document.querySelector('.balloon-review-link').href = placeData.reviewLink;
        document.querySelector('.balloon-rating-badge').textContent = rating.toFixed(1);
        
        mobileSheet.classList.remove('hidden');
        setTimeout(() => {
            mobileSheet.classList.add('visible');
        }, 10);
    }

    function openDesktopSidebar(placeData) {
        const rating = parseFloat(placeData.description.split('/')[0]);
        
        // Добавляем проверку на существование элементов
        const sidebar = document.getElementById('desktop-sidebar');
        if (!sidebar) return;
        
        document.getElementById('sidebar-title').textContent = placeData.name;
        document.getElementById('sidebar-image').src = placeData.photo;
        document.getElementById('sidebar-address').textContent = placeData.address;
        document.getElementById('sidebar-phone').textContent = placeData.phone;
        document.getElementById('sidebar-hours').textContent = placeData.hours;
        document.getElementById('sidebar-district').textContent = placeData.district;
        document.getElementById('sidebar-review-link').href = placeData.reviewLink;
        document.getElementById('sidebar-rating-badge').textContent = rating.toFixed(1);
        
        sidebar.classList.remove('hidden');
        setTimeout(() => {
            sidebar.classList.add('visible');
        }, 10);
    }

    // Фильтрация заведений
    function filterPlacemarks() {
        const ratingFilter = document.getElementById('ratingFilter').value;
        const districtFilter = document.getElementById('districtFilter').value;
        const hoursFilter = document.getElementById('hoursFilter').value;
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();

        let visibleCount = 0;

        placemarks.forEach(placemark => {
            const data = placemark.properties.get('customData');
            const rating = parseFloat(data.description.split('/')[0]);
            
            const matchesRating = ratingFilter === 'all' || rating >= parseFloat(ratingFilter);
            const matchesDistrict = districtFilter === 'all' || data.district === districtFilter;
            const matchesHours = hoursFilter === 'all' || data.hours === hoursFilter;
            const matchesSearch = data.name.toLowerCase().includes(searchQuery);

            if (matchesRating && matchesDistrict && matchesHours && matchesSearch) {
                placemark.options.set('visible', true);
                visibleCount++;
            } else {
                placemark.options.set('visible', false);
            }
        });

        document.getElementById('count').textContent = visibleCount;
    }

    // Обработчики событий
    document.getElementById('toggleFilters').addEventListener('click', function(e) {
        e.stopPropagation();
        const filtersPanel = document.getElementById('filters-panel');
        filtersPanel.classList.toggle('hidden');
        filtersPanel.classList.toggle('visible');
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('#filters-panel') && !e.target.closest('#toggleFilters')) {
            document.getElementById('filters-panel').classList.add('hidden');
            document.getElementById('filters-panel').classList.remove('visible');
        }
    });

    // Закрытие панелей
    document.querySelector('.close-balloon')?.addEventListener('click', function() {
        const mobileSheet = document.getElementById('mobile-bottom-sheet');
        mobileSheet.classList.remove('visible');
        setTimeout(() => {
            mobileSheet.classList.add('hidden');
        }, 400);
    });

    document.getElementById('close-sidebar')?.addEventListener('click', function() {
        const sidebar = document.getElementById('desktop-sidebar');
        sidebar.classList.remove('visible');
        setTimeout(() => {
            sidebar.classList.add('hidden');
        }, 500);
    });

    // Фильтры
    document.getElementById('ratingFilter').addEventListener('change', filterPlacemarks);
    document.getElementById('districtFilter').addEventListener('change', filterPlacemarks);
    document.getElementById('hoursFilter').addEventListener('change', filterPlacemarks);
    document.getElementById('searchInput').addEventListener('input', filterPlacemarks);

    // Геолокация
    document.getElementById('toggleLocation').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    map.setCenter([position.coords.latitude, position.coords.longitude], 14);
                    
                    // Добавляем анимированную метку текущего местоположения
                    new ymaps.Placemark(
                        [position.coords.latitude, position.coords.longitude],
                        {},
                        {
                            iconLayout: 'default#image',
                            iconImageHref: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
                            iconImageSize: [32, 32],
                            iconImageOffset: [-16, -16]
                        }
                    ).then(placemark => {
                        map.geoObjects.add(placemark);
                        setTimeout(() => {
                            map.geoObjects.remove(placemark);
                        }, 5000);
                    });
                },
                function() {
                    alert("Не удалось определить ваше местоположение");
                }
            );
        } else {
            alert("Геолокация не поддерживается вашим браузером");
        }
    });

    // Обработка свайпа для мобильной панели
    let startY = 0;
    const swipeHandle = document.querySelector('.swipe-handle');
    
    swipeHandle.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
    }, { passive: true });
    
    swipeHandle.addEventListener('touchmove', function(e) {
        const currentY = e.touches[0].clientY;
        const diff = startY - currentY;
        
        if (diff < 0) { // Свайп вниз
            const panel = document.getElementById('mobile-bottom-sheet');
            const newPosition = Math.max(-diff, 0);
            panel.style.transform = `translateY(${newPosition}px)`;
            
            if (newPosition > 100) {
                panel.classList.remove('visible');
                setTimeout(() => {
                    panel.classList.add('hidden');
                    panel.style.transform = '';
                }, 300);
            }
        }
    }, { passive: true });
    
    swipeHandle.addEventListener('touchend', function(e) {
        const panel = document.getElementById('mobile-bottom-sheet');
        panel.style.transform = '';
    }, { passive: true });
});
