const KONFIGURASI = {
    WEATHER_URL: 'https://api.open-meteo.com/v1/forecast',
    GEO_URL: 'https://geocoding-api.open-meteo.com/v1/search',
    
    INTERVAL_UPDATE: 5 * 60 * 1000,
    
    KOTA_DEFAULT: {
        nama: 'Jakarta',
        lat: -6.2088,
        lon: 106.8456,
        negara: 'Indonesia'
    },
    
    BATAS_AUTOCOMPLETE: 8,
    
    STORAGE_KEYS: {
        TEMA: 'weatherDashboard_tema',
        SATUAN: 'weatherDashboard_satuan',
        FAVORIT: 'weatherDashboard_favorit',
        KOTA_TERAKHIR: 'weatherDashboard_kotaTerakhir'
    }
};

let stateAplikasi = {
    kotaSaatIni: KONFIGURASI.KOTA_DEFAULT,
    dataCuacaSaatIni: null,
    dataPrakiraan: null,
    satuanSuhu: 'celsius',
    tema: 'light',
    kotaFavorit: [],
    sedangMemuat: false,
    intervalUpdate: null,
    indexAutoComplete: -1
};

const KODE_CUACA = {
    0: { deskripsi: 'Cerah', icon: '01d' },
    1: { deskripsi: 'Sebagian Cerah', icon: '02d' },
    2: { deskripsi: 'Berawan Sebagian', icon: '03d' },
    3: { deskripsi: 'Mendung', icon: '04d' },
    45: { deskripsi: 'Berkabut', icon: '50d' },
    48: { deskripsi: 'Kabut Beku', icon: '50d' },
    51: { deskripsi: 'Gerimis Ringan', icon: '09d' },
    53: { deskripsi: 'Gerimis Sedang', icon: '09d' },
    55: { deskripsi: 'Gerimis Lebat', icon: '09d' },
    56: { deskripsi: 'Gerimis Beku Ringan', icon: '09d' },
    57: { deskripsi: 'Gerimis Beku Lebat', icon: '09d' },
    61: { deskripsi: 'Hujan Ringan', icon: '10d' },
    63: { deskripsi: 'Hujan Sedang', icon: '10d' },
    65: { deskripsi: 'Hujan Lebat', icon: '10d' },
    66: { deskripsi: 'Hujan Beku Ringan', icon: '13d' },
    67: { deskripsi: 'Hujan Beku Lebat', icon: '13d' },
    71: { deskripsi: 'Salju Ringan', icon: '13d' },
    73: { deskripsi: 'Salju Sedang', icon: '13d' },
    75: { deskripsi: 'Salju Lebat', icon: '13d' },
    77: { deskripsi: 'Butiran Salju', icon: '13d' },
    80: { deskripsi: 'Hujan Lokal Ringan', icon: '09d' },
    81: { deskripsi: 'Hujan Lokal Sedang', icon: '09d' },
    82: { deskripsi: 'Hujan Lokal Lebat', icon: '09d' },
    85: { deskripsi: 'Hujan Salju Ringan', icon: '13d' },
    86: { deskripsi: 'Hujan Salju Lebat', icon: '13d' },
    95: { deskripsi: 'Badai Petir', icon: '11d' },
    96: { deskripsi: 'Badai Petir + Hujan Es Ringan', icon: '11d' },
    99: { deskripsi: 'Badai Petir + Hujan Es Lebat', icon: '11d' }
};

/**
 * @param {number}
 * @param {boolean}
 * @returns {Object}
 */

function getInfoCuaca(kode, isMalam = false) {
    const info = KODE_CUACA[kode] || { deskripsi: 'Tidak Diketahui', icon: '01d' };
    let icon = info.icon;
    
    if (isMalam) {
        icon = icon.replace('d', 'n');
    }
    
    return {
        deskripsi: info.deskripsi,
        icon: icon
    };
}

/**
 * @param {string}
 * @param {string}
 * @param {string}
 * @returns {boolean}
 */

function isMalamHari(waktuSaatIni, sunrise, sunset) {
    if (!sunrise || !sunset) return false;
    
    const sekarang = new Date(waktuSaatIni);
    const jamSekarang = sekarang.getHours();
    
    const jamTerbit = parseInt(sunrise.split(':')[0]);
    const jamTerbenam = parseInt(sunset.split(':')[0]);
    
    return jamSekarang < jamTerbit || jamSekarang >= jamTerbenam;
}

/**
 * @param {Date|string}
 * @returns {string}
 */

function formatTanggal(tanggal) {
    const opsi = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return new Date(tanggal).toLocaleDateString('id-ID', opsi);
}

/**
 * @param {string}
 * @returns {string}
 */

function formatWaktu(waktu) {
    if (!waktu) return '--:--';
    
    if (waktu.includes(':') && !waktu.includes('T')) {
        return waktu;
    }
    
    return new Date(waktu).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * @param {number}
 * @returns {number}
 */

function konversiSuhu(celsius) {
    if (stateAplikasi.satuanSuhu === 'fahrenheit') {
        return Math.round(celsius * 9/5 + 32);
    }
    return Math.round(celsius);
}

/**
 * @returns {string}
 */
function getSimbolSuhu() {
    return stateAplikasi.satuanSuhu === 'celsius' ? '°C' : '°F';
}

/**
 * @param {Date|string}
 * @returns {string}
 */

function getNamaHari(tanggal) {
    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return hari[new Date(tanggal).getDay()];
}

/**
 * @param {number}
 * @returns {string}
 */

function getArahAngin(derajat) {
    if (derajat === undefined || derajat === null) return '--';
    const arah = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
    const index = Math.round(derajat / 45) % 8;
    return arah[index];
}

/**
 * @param {string}
 * @returns {Promise}
 */

async function requestAPI(url) {
    try {
        console.log('📡 Request ke:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Response:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Error pada request API:', error);
        throw error;
    }
}

/**
 * @param {number}
 * @param {number}
 * @returns {Promise}
 */
async function ambilDataCuaca(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'is_day',
            'precipitation',
            'rain',
            'weather_code',
            'cloud_cover',
            'pressure_msl',
            'surface_pressure',
            'wind_speed_10m',
            'wind_direction_10m'
        ].join(','),
        daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'apparent_temperature_max',
            'apparent_temperature_min',
            'sunrise',
            'sunset',
            'precipitation_sum',
            'rain_sum',
            'precipitation_probability_max',
            'wind_speed_10m_max'
        ].join(','),
        timezone: 'Asia/Jakarta',
        forecast_days: 6
    });
    
    const url = `${KONFIGURASI.WEATHER_URL}?${params.toString()}`;
    return await requestAPI(url);
}

/**
 * @param {string}
 * @returns {Promise}
 */

async function cariKota(query) {
    if (query.length < 2) return [];
    
    const params = new URLSearchParams({
        name: query,
        count: KONFIGURASI.BATAS_AUTOCOMPLETE,
        language: 'id',
        format: 'json'
    });
    
    const url = `${KONFIGURASI.GEO_URL}?${params.toString()}`;
    
    try {
        const data = await requestAPI(url);
        
        if (!data.results) return [];
        
        const hasil = data.results.sort((a, b) => {
            if (a.country === 'Indonesia' && b.country !== 'Indonesia') return -1;
            if (a.country !== 'Indonesia' && b.country === 'Indonesia') return 1;
            return 0;
        });
        
        return hasil;
    } catch (error) {
        console.error('Error mencari kota:', error);
        return [];
    }
}

/**
 * @param {boolean} 
 * @param {string}
 */

function tampilkanLoading(tampilkan, pesan = 'Memuat data cuaca...') {
    const overlay = document.getElementById('loadingOverlay');
    const teksLoading = document.getElementById('loadingText');
    
    if (tampilkan) {
        teksLoading.textContent = pesan;
        overlay.classList.remove('hidden');
        stateAplikasi.sedangMemuat = true;
    } else {
        overlay.classList.add('hidden');
        stateAplikasi.sedangMemuat = false;
    }
}

/**
 * @param {string}
 * @param {string}
 * @param {number}
 */

function tampilkanToast(pesan, tipe = 'info', durasi = 3000) {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipe}`;
    
    const icons = {
        success: 'fas fa-check-circle text-green-500',
        error: 'fas fa-times-circle text-red-500',
        warning: 'fas fa-exclamation-triangle text-yellow-500',
        info: 'fas fa-info-circle text-blue-500'
    };
    
    toast.innerHTML = `
        <i class="${icons[tipe]} text-xl"></i>
        <span class="flex-1 text-gray-800 dark:text-white">${pesan}</span>
        <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, durasi);
}

/**
 * @param {Object}
 * @param {Object}
 */
function updateTampilanCuacaSaatIni(data, kotaInfo) {
    if (!data || !data.current) return;
    
    const current = data.current;
    const daily = data.daily;
    
    stateAplikasi.dataCuacaSaatIni = data;
    
    const isMalam = current.is_day === 0;
    const infoCuaca = getInfoCuaca(current.weather_code, isMalam);
    
    document.getElementById('namaKota').textContent = `${kotaInfo.nama}, ${kotaInfo.negara || 'Indonesia'}`;
    
    document.getElementById('tanggalHariIni').textContent = formatTanggal(new Date());
    
    document.getElementById('iconCuacaUtama').src = `https://openweathermap.org/img/wn/${infoCuaca.icon}@4x.png`;
    document.getElementById('iconCuacaUtama').alt = infoCuaca.deskripsi;
    
    document.getElementById('deskripsiCuaca').textContent = infoCuaca.deskripsi;
    
    const suhu = konversiSuhu(current.temperature_2m);
    document.getElementById('suhuUtama').innerHTML = `${suhu}<span class="text-3xl">${getSimbolSuhu()}</span>`;
    
    const rasaSuhu = konversiSuhu(current.apparent_temperature);
    document.getElementById('rasaSuhu').textContent = `Terasa seperti: ${rasaSuhu}${getSimbolSuhu()}`;
    
    document.getElementById('kelembaban').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('kecepatanAngin').textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById('visibilitas').textContent = `${current.cloud_cover}%`;
    document.getElementById('tekanan').textContent = `${Math.round(current.pressure_msl)} hPa`;
    
    if (daily && daily.sunrise && daily.sunset) {
        document.getElementById('matahariTerbit').textContent = formatWaktu(daily.sunrise[0]);
        document.getElementById('matahariTerbenam').textContent = formatWaktu(daily.sunset[0]);
    }
    
    document.getElementById('tutupanAwan').textContent = `${current.cloud_cover}%`;
    document.getElementById('arahAngin').textContent = `${current.wind_direction_10m}° (${getArahAngin(current.wind_direction_10m)})`;
    
    const waktuSekarang = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('waktuUpdate').innerHTML = `<i class="fas fa-clock mr-1"></i>${waktuSekarang}`;
}

/**
 * @param {Object}
 */

function updateTampilanPrakiraan(data) {
    if (!data || !data.daily) return;
    
    const daily = data.daily;
    
    stateAplikasi.dataPrakiraan = data;

    const container = document.getElementById('containerPrakiraan');
    container.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const tanggal = new Date(daily.time[i]);
        const infoCuaca = getInfoCuaca(daily.weather_code[i]);
        const suhuMax = konversiSuhu(daily.temperature_2m_max[i]);
        const suhuMin = konversiSuhu(daily.temperature_2m_min[i]);
        
        const kartu = document.createElement('div');
        kartu.className = 'forecast-card animate-fade-in-up';
        kartu.style.animationDelay = `${i * 100}ms`;
        
        kartu.innerHTML = `
            <p class="text-blue-100 dark:text-gray-400 text-sm font-medium mb-2">
                ${i === 0 ? 'Hari Ini' : getNamaHari(tanggal)}
            </p>
            <img 
                src="https://openweathermap.org/img/wn/${infoCuaca.icon}@2x.png" 
                alt="${infoCuaca.deskripsi}"
                class="w-16 h-16 mx-auto weather-icon"
            >
            <p class="text-white font-bold text-lg">
                ${suhuMax}${getSimbolSuhu()}
            </p>
            <p class="text-blue-200 dark:text-gray-400 text-sm">
                ${suhuMin}${getSimbolSuhu()}
            </p>
            <p class="text-blue-100 dark:text-gray-400 text-xs mt-2">
                ${infoCuaca.deskripsi}
            </p>
        `;
        
        container.appendChild(kartu);
    }
}

function updateTampilanFavorit() {
    const container = document.getElementById('daftarFavorit');
    
    if (stateAplikasi.kotaFavorit.length === 0) {
        container.innerHTML = '<span class="text-blue-100 dark:text-gray-400 text-sm italic">Belum ada kota favorit</span>';
        return;
    }
    
    container.innerHTML = '';
    
    stateAplikasi.kotaFavorit.forEach((kota, index) => {
        const tag = document.createElement('div');
        tag.className = 'favorite-tag animate-fade-in';
        tag.style.animationDelay = `${index * 50}ms`;
        
        tag.innerHTML = `
            <i class="fas fa-map-marker-alt text-yellow-400"></i>
            <span class="kota-nama">${kota.nama}</span>
            <span class="remove-btn" title="Hapus dari favorit">
                <i class="fas fa-times"></i>
            </span>
        `;
        
        tag.querySelector('.kota-nama').addEventListener('click', () => {
            muatDataCuaca(kota);
        });

        tag.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            hapusDariFavorit(kota.nama);
        });
        
        container.appendChild(tag);
    });
}

function posisikanAutoComplete() {
    const searchInput = document.getElementById('searchInput');
    const container = document.getElementById('autoCompleteList');
    
    if (!searchInput || !container) return;
    
    const rect = searchInput.getBoundingClientRect();
    
    container.style.position = 'fixed';
    container.style.top = (rect.bottom + 8) + 'px';
    container.style.left = rect.left + 'px';
    container.style.width = rect.width + 'px';
}

/**
 * @param {Array}
 */
function tampilkanAutoComplete(hasil) {
    const container = document.getElementById('autoCompleteList');
    
    if (!hasil || hasil.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.innerHTML = '';
    
    posisikanAutoComplete();
    
    container.classList.remove('hidden');
    
    hasil.forEach((kota, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item flex items-center gap-4';
        item.dataset.index = index;
        
        const isIndonesia = kota.country === 'Indonesia';
        const flagIcon = isIndonesia ? '🇮🇩' : '🌍';
        
        item.innerHTML = `
            <span class="text-2xl flex-shrink-0">${flagIcon}</span>
            <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 dark:text-white truncate">${kota.name}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                    ${kota.admin1 ? kota.admin1 + ', ' : ''}${kota.country}
                </p>
            </div>
            ${isIndonesia ? '<span class="flex-shrink-0 text-xs bg-red-500 text-white px-2 py-1 rounded-full font-bold">ID</span>' : ''}
        `;
        
        item.addEventListener('click', () => {
            const kotaInfo = {
                nama: kota.name,
                lat: kota.latitude,
                lon: kota.longitude,
                negara: kota.country,
                provinsi: kota.admin1
            };
            
            document.getElementById('searchInput').value = kota.name;
            container.classList.add('hidden');
            muatDataCuaca(kotaInfo);
        });
        
        container.appendChild(item);
    });
    
    stateAplikasi.indexAutoComplete = -1;
}

/**
 * @param {Object}
 */
async function muatDataCuaca(kotaInfo) {
    if (stateAplikasi.sedangMemuat) return;
    
    tampilkanLoading(true, `Memuat cuaca untuk ${kotaInfo.nama}...`);
    
    try {
        const data = await ambilDataCuaca(kotaInfo.lat, kotaInfo.lon);
        
        stateAplikasi.kotaSaatIni = kotaInfo;
        
        updateTampilanCuacaSaatIni(data, kotaInfo);
        updateTampilanPrakiraan(data);
        
        localStorage.setItem(KONFIGURASI.STORAGE_KEYS.KOTA_TERAKHIR, JSON.stringify(kotaInfo));
        
        tampilkanToast(`Berhasil memuat cuaca untuk ${kotaInfo.nama}`, 'success');
        
    } catch (error) {
        console.error('Error memuat data cuaca:', error);
        tampilkanToast('Gagal memuat data cuaca. Periksa koneksi internet.', 'error');
    } finally {
        tampilkanLoading(false);
    }
}

function tambahKeFavorit() {
    const kotaInfo = stateAplikasi.kotaSaatIni;
    
    if (!kotaInfo || !kotaInfo.nama) {
        tampilkanToast('Pilih kota terlebih dahulu', 'warning');
        return;
    }
    
    if (stateAplikasi.kotaFavorit.some(k => k.nama === kotaInfo.nama)) {
        tampilkanToast(`${kotaInfo.nama} sudah ada di daftar favorit`, 'warning');
        return;
    }

    if (stateAplikasi.kotaFavorit.length >= 10) {
        tampilkanToast('Maksimal 10 kota favorit', 'warning');
        return;
    }
    
    stateAplikasi.kotaFavorit.push(kotaInfo);
    simpanFavoritKeStorage();
    updateTampilanFavorit();
    tampilkanToast(`${kotaInfo.nama} ditambahkan ke favorit`, 'success');
}

/**
 * @param {string}
 */

function hapusDariFavorit(namaKota) {
    const index = stateAplikasi.kotaFavorit.findIndex(k => k.nama === namaKota);
    if (index > -1) {
        stateAplikasi.kotaFavorit.splice(index, 1);
        simpanFavoritKeStorage();
        updateTampilanFavorit();
        tampilkanToast(`${namaKota} dihapus dari favorit`, 'info');
    }
}

function simpanFavoritKeStorage() {
    localStorage.setItem(
        KONFIGURASI.STORAGE_KEYS.FAVORIT, 
        JSON.stringify(stateAplikasi.kotaFavorit)
    );
}

function muatFavoritDariStorage() {
    const data = localStorage.getItem(KONFIGURASI.STORAGE_KEYS.FAVORIT);
    if (data) {
        try {
            stateAplikasi.kotaFavorit = JSON.parse(data);
        } catch (e) {
            stateAplikasi.kotaFavorit = [];
        }
    }
    updateTampilanFavorit();
}

/**
 * @param {string}
 */

function toggleSatuanSuhu(satuan) {
    stateAplikasi.satuanSuhu = satuan;
    
    // Update tampilan tombol
    const btnCelsius = document.getElementById('btnCelsius');
    const btnFahrenheit = document.getElementById('btnFahrenheit');
    
    if (satuan === 'celsius') {
        btnCelsius.classList.add('bg-blue-500', 'text-white');
        btnCelsius.classList.remove('text-gray-600', 'dark:text-gray-300');
        btnFahrenheit.classList.remove('bg-blue-500', 'text-white');
        btnFahrenheit.classList.add('text-gray-600', 'dark:text-gray-300');
    } else {
        btnFahrenheit.classList.add('bg-blue-500', 'text-white');
        btnFahrenheit.classList.remove('text-gray-600', 'dark:text-gray-300');
        btnCelsius.classList.remove('bg-blue-500', 'text-white');
        btnCelsius.classList.add('text-gray-600', 'dark:text-gray-300');
    }
    
    localStorage.setItem(KONFIGURASI.STORAGE_KEYS.SATUAN, satuan);
    
    if (stateAplikasi.dataCuacaSaatIni) {
        updateTampilanCuacaSaatIni(stateAplikasi.dataCuacaSaatIni, stateAplikasi.kotaSaatIni);
        updateTampilanPrakiraan(stateAplikasi.dataCuacaSaatIni);
    }
}

function toggleTema() {
    const html = document.documentElement;
    
    if (stateAplikasi.tema === 'light') {
        html.classList.add('dark');
        stateAplikasi.tema = 'dark';
    } else {
        html.classList.remove('dark');
        stateAplikasi.tema = 'light';
    }

    localStorage.setItem(KONFIGURASI.STORAGE_KEYS.TEMA, stateAplikasi.tema);
    
    tampilkanToast(`Tema diubah ke ${stateAplikasi.tema === 'dark' ? 'Gelap' : 'Terang'}`, 'info');
}

function muatPengaturan() {
    const temaTersimpan = localStorage.getItem(KONFIGURASI.STORAGE_KEYS.TEMA);
    if (temaTersimpan) {
        stateAplikasi.tema = temaTersimpan;
        if (temaTersimpan === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }

    const satuanTersimpan = localStorage.getItem(KONFIGURASI.STORAGE_KEYS.SATUAN);
    if (satuanTersimpan) {
        toggleSatuanSuhu(satuanTersimpan);
    }

    muatFavoritDariStorage();
}

async function refreshData() {
    const btnRefresh = document.getElementById('btnRefresh');

    btnRefresh.classList.add('btn-spinning');
    
    await muatDataCuaca(stateAplikasi.kotaSaatIni);

    setTimeout(() => {
        btnRefresh.classList.remove('btn-spinning');
    }, 1000);
}

function setupAutoUpdate() {
    if (stateAplikasi.intervalUpdate) {
        clearInterval(stateAplikasi.intervalUpdate);
    }
    
    // Set interval baru
    stateAplikasi.intervalUpdate = setInterval(() => {
        console.log('🔄 Auto-update cuaca...');
        muatDataCuaca(stateAplikasi.kotaSaatIni);
    }, KONFIGURASI.INTERVAL_UPDATE);
    
    console.log(`⏰ Auto-update diaktifkan: setiap ${KONFIGURASI.INTERVAL_UPDATE / 60000} menit`);
}

/**
 * @param {KeyboardEvent}
 */

function handleAutoCompleteKeyboard(event) {
    const container = document.getElementById('autoCompleteList');
    const items = container.querySelectorAll('.autocomplete-item');
    
    if (container.classList.contains('hidden') || items.length === 0) return;
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            stateAplikasi.indexAutoComplete = Math.min(
                stateAplikasi.indexAutoComplete + 1, 
                items.length - 1
            );
            updateAutoCompleteSelection(items);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            stateAplikasi.indexAutoComplete = Math.max(
                stateAplikasi.indexAutoComplete - 1, 
                0
            );
            updateAutoCompleteSelection(items);
            break;
            
        case 'Enter':
            if (stateAplikasi.indexAutoComplete >= 0) {
                event.preventDefault();
                items[stateAplikasi.indexAutoComplete].click();
            }
            break;
            
        case 'Escape':
            container.classList.add('hidden');
            stateAplikasi.indexAutoComplete = -1;
            break;
    }
}

/**
 * @param {NodeList}
 */

function updateAutoCompleteSelection(items) {
    items.forEach((item, index) => {
        if (index === stateAplikasi.indexAutoComplete) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function setupEventListeners() {
    let debounceTimer;
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', async (e) => {
        clearTimeout(debounceTimer);
        
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            document.getElementById('autoCompleteList').classList.add('hidden');
            return;
        }
        
        debounceTimer = setTimeout(async () => {
            const hasil = await cariKota(query);
            tampilkanAutoComplete(hasil);
        }, 300);
    });

    searchInput.addEventListener('keydown', handleAutoCompleteKeyboard);

    document.getElementById('btnCariCuaca').addEventListener('click', async () => {
        const kota = searchInput.value.trim();
        if (kota) {
            document.getElementById('autoCompleteList').classList.add('hidden');

            tampilkanLoading(true, 'Mencari kota...');
            const hasil = await cariKota(kota);
            
            if (hasil && hasil.length > 0) {
                const kotaInfo = {
                    nama: hasil[0].name,
                    lat: hasil[0].latitude,
                    lon: hasil[0].longitude,
                    negara: hasil[0].country,
                    provinsi: hasil[0].admin1
                };
                tampilkanLoading(false);
                muatDataCuaca(kotaInfo);
            } else {
                tampilkanLoading(false);
                tampilkanToast(`Kota "${kota}" tidak ditemukan`, 'error');
            }
        }
    });

    searchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const container = document.getElementById('autoCompleteList');
            if (container.classList.contains('hidden') || stateAplikasi.indexAutoComplete < 0) {
                const kota = searchInput.value.trim();
                if (kota) {
                    container.classList.add('hidden');
  
                    tampilkanLoading(true, 'Mencari kota...');
                    const hasil = await cariKota(kota);
                    
                    if (hasil && hasil.length > 0) {
                        const kotaInfo = {
                            nama: hasil[0].name,
                            lat: hasil[0].latitude,
                            lon: hasil[0].longitude,
                            negara: hasil[0].country,
                            provinsi: hasil[0].admin1
                        };
                        tampilkanLoading(false);
                        muatDataCuaca(kotaInfo);
                    } else {
                        tampilkanLoading(false);
                        tampilkanToast(`Kota "${kota}" tidak ditemukan`, 'error');
                    }
                }
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#searchInput') && !e.target.closest('#autoCompleteList')) {
            document.getElementById('autoCompleteList').classList.add('hidden');
        }
    });

    window.addEventListener('scroll', () => {
        const container = document.getElementById('autoCompleteList');
        if (!container.classList.contains('hidden')) {
            posisikanAutoComplete();
        }
    });
    
    window.addEventListener('resize', () => {
        const container = document.getElementById('autoCompleteList');
        if (!container.classList.contains('hidden')) {
            posisikanAutoComplete();
        }
    });

    document.getElementById('btnCelsius').addEventListener('click', () => {
        toggleSatuanSuhu('celsius');
    });

    document.getElementById('btnFahrenheit').addEventListener('click', () => {
        toggleSatuanSuhu('fahrenheit');
    });

    document.getElementById('btnToggleTheme').addEventListener('click', toggleTema);

    document.getElementById('btnRefresh').addEventListener('click', refreshData);

    document.getElementById('btnTambahFavorit').addEventListener('click', tambahKeFavorit);

    window.addEventListener('online', () => {
        document.getElementById('statusKoneksi').innerHTML = 
            '<i class="fas fa-circle text-xs"></i> Online';
        document.getElementById('statusKoneksi').className = 'text-green-400';
        tampilkanToast('Koneksi internet kembali aktif', 'success');
    });
    
    window.addEventListener('offline', () => {
        document.getElementById('statusKoneksi').innerHTML = 
            '<i class="fas fa-circle text-xs"></i> Offline';
        document.getElementById('statusKoneksi').className = 'text-red-400';
        tampilkanToast('Koneksi internet terputus', 'error');
    });
}

async function inisialisasiAplikasi() {
    console.log('🌤️ Weather Dashboard - Memulai aplikasi...');
    console.log('📡 Menggunakan Open-Meteo API (GRATIS, TANPA API KEY)');

    setupEventListeners();

    muatPengaturan();

    let kotaTerakhir = KONFIGURASI.KOTA_DEFAULT;
    
    const kotaTersimpan = localStorage.getItem(KONFIGURASI.STORAGE_KEYS.KOTA_TERAKHIR);
    if (kotaTersimpan) {
        try {
            kotaTerakhir = JSON.parse(kotaTersimpan);
        } catch (e) {
            kotaTerakhir = KONFIGURASI.KOTA_DEFAULT;
        }
    }

    await muatDataCuaca(kotaTerakhir);
    
    setupAutoUpdate();
    
    console.log('✅ Aplikasi berhasil diinisialisasi!');
}

document.addEventListener('DOMContentLoaded', inisialisasiAplikasi);

window.WeatherDashboard = {
    state: stateAplikasi,
    config: KONFIGURASI,
    muatDataCuaca,
    tambahKeFavorit,
    hapusDariFavorit,
    toggleSatuanSuhu,
    toggleTema,
    refreshData
};
