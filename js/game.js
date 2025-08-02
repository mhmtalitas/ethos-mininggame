// Oyun JavaScript dosyası

// Oyun değişkenleri
let gameCanvas, gameCtx;
let particleCanvas, particleCtx;
let rock;
let hitCount = 0;
let maxHits = 10;
let gameState = 'playing'; // 'playing', 'exploding', 'finished'
let particles = [];
let rockImage = null;

// Oyun nesneleri
const gameObjects = {
    rock: {
        x: 400,
        y: 300,
        width: 300, // Daha büyük
        height: 300, // Daha büyük
        crackLevel: 0,
        maxCracks: 5,
        cracks: [] // Çatlakları saklayacağız
    }
};

// Sayfa yüklendiğinde oyunu başlat
document.addEventListener('DOMContentLoaded', function() {
    initGame();
    setupEventListeners();
});

// Oyunu başlat
function initGame() {
    // Canvas'ları al
    gameCanvas = document.getElementById('gameCanvas');
    gameCtx = gameCanvas.getContext('2d');
    particleCanvas = document.getElementById('particleCanvas');
    particleCtx = particleCanvas.getContext('2d');
    
    // Canvas boyutlarını ayarla
    resizeCanvas();
    
    // Oyun değişkenlerini sıfırla
    resetGame();
    
    // Kaya görselini yükle
    loadRockImage();
    
    // Animasyon döngüsünü başlat
    animate();
}

// Oyunu sıfırla
function resetGame() {
    hitCount = 0;
    gameState = 'playing';
    particles = [];
    gameObjects.rock.crackLevel = 0;
    gameObjects.rock.cracks = [];
    
    // Kaya boyutunu sıfırla ki yeniden hesaplansın
    gameObjects.rock.width = 0;
    gameObjects.rock.height = 0;
    
    updateHitCounter();
}

// Kaya görselini yükle
function loadRockImage() {
    const rockFormats = ['rock.png', 'rock.jpg', 'rock.jpeg', 'rock.webp', 'kaya.png', 'kaya.jpg'];
    let currentFormatIndex = 0;
    
    function tryNextFormat() {
        if (currentFormatIndex >= rockFormats.length) {
            console.log('No rock image found, using default drawing');
            drawRock();
            return;
        }
        
        rockImage = new Image();
        rockImage.onload = function() {
            console.log(`Rock image successfully loaded: ${rockFormats[currentFormatIndex]}`);
            drawRock();
        };
        rockImage.onerror = function() {
            console.log(`${rockFormats[currentFormatIndex]} bulunamadı, sonrakini deniyorum...`);
            currentFormatIndex++;
            tryNextFormat();
        };
        
        rockImage.src = `assets/${rockFormats[currentFormatIndex]}`;
    }
    
    tryNextFormat();
}

// Canvas boyutlarını FULL VIEWPORT için ayarla
function resizeCanvas() {
    // Tam viewport boyutlarını al
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Canvas boyutlarını tam ekran yap
    const canvasWidth = vw;
    const canvasHeight = vh;
    
    gameCanvas.width = canvasWidth;
    gameCanvas.height = canvasHeight;
    particleCanvas.width = canvasWidth;
    particleCanvas.height = canvasHeight;
    
    // Kaya pozisyonunu merkeze al
    gameObjects.rock.x = canvasWidth / 2;
    gameObjects.rock.y = canvasHeight / 2;
    
    // Kaya boyutunu SABİT yapalım - responsive ama değişmeyen
    let rockSize;
    if (canvasWidth <= 768) { // Mobil
        rockSize = 220; // Mobil için daha büyük sabit boyut
    } else { // Desktop
        rockSize = 320; // Desktop için daha büyük sabit boyut
    }
    
    // Sadece ilk yüklemede veya boyut sıfırlandığında ayarla
    if (!gameObjects.rock.width || gameObjects.rock.width === 0) {
        gameObjects.rock.width = rockSize;
        gameObjects.rock.height = rockSize;
    }
    

}

// Event listener'ları kur
function setupEventListeners() {
    // Kazma cursor'ı mouse ile takip et
    gameCanvas.addEventListener('mousemove', function(e) {
        const rect = gameCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cursor = document.getElementById('pickaxeCursor');
        cursor.style.left = (rect.left + x) + 'px';
        cursor.style.top = (rect.top + y) + 'px';
    });
    
    // Kayaya tıklama
    gameCanvas.addEventListener('click', function(e) {
        if (gameState !== 'playing') return;
        
        const rect = gameCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Kaya sınırları içinde mi kontrol et
        if (isPointInRock(x, y)) {
            hitRock(x, y);
        }
    });
    
    // Pencere boyutu değiştiğinde
    window.addEventListener('resize', resizeCanvas);
    
    // ESC tuşu ile ana sayfaya dön
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const confirmExit = confirm('Ana sayfaya dönmek istediğinizden emin misiniz?');
            if (confirmExit) {
                goBack();
            }
        }
    });
    
    // Oyun butonları
    setupGameButtons();
}

// Oyun butonlarını kur
function setupGameButtons() {
    const homeBtn = document.getElementById('homeBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    
    if (homeBtn) {
        console.log('Home butonu bulundu');
        homeBtn.addEventListener('click', function() {
            console.log('Home butonuna tıklandı');
            goBack();
        });
    }
    
    if (playAgainBtn) {
        console.log('Play Again butonu bulundu');
        playAgainBtn.addEventListener('click', function() {
            if (!playAgainBtn.disabled) {
                console.log('Play Again butonuna tıklandı');
                restartGame();
            } else {
                console.log('Play Again butonu devre dışı');
            }
        });
        
        // Başlangıçta Play Again butonunu devre dışı bırak
        playAgainBtn.disabled = true;
        console.log('Play Again butonu devre dışı bırakıldı');
    }
}

// Nokta kaya içinde mi kontrol et
function isPointInRock(x, y) {
    const rock = gameObjects.rock;
    const centerX = rock.x;
    const centerY = rock.y;
    const radius = Math.min(rock.width, rock.height) / 2;
    
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    return distance <= radius;
}

// Kayaya vur
function hitRock(x, y) {
    hitCount++;
    updateHitCounter();
    
    // Kazma animasyonu
    animatePickaxe();
    
    // Hit efekti
    createHitEffect(x, y);
    
    // Kaya animasyonu
    animateRockHit();
    
    // Yeni çatlak ekle (daha az sıklıkla)
    if (hitCount === 3 || hitCount === 5 || hitCount === 7 || hitCount === 9) {
        addRandomCrack(x, y);
        gameObjects.rock.crackLevel++;
    }
    
    // Maksimum vurusa ulaştı mı?
    if (hitCount >= maxHits) {
        explodeRock();
    }
}

// Kazma animasyonu
function animatePickaxe() {
    const cursor = document.getElementById('pickaxeCursor');
    gsap.to(cursor, {
        scale: 1.3,
        rotation: 45,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
    });
}

// Hit efekti oluştur
function createHitEffect(x, y) {
    // Parçacıklar oluştur
    for (let i = 0; i < 10; i++) {
        particles.push(new HitParticle(x, y));
    }
    
    // Ekran sallanması
    gsap.to(gameCanvas, {
        x: Math.random() * 10 - 5,
        y: Math.random() * 10 - 5,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: function() {
            gsap.set(gameCanvas, {x: 0, y: 0});
        }
    });
}

// Kaya hit animasyonu - BOYUT SABİT KALSIN
function animateRockHit() {
    const rock = gameObjects.rock;
    
    // Sadece canvas sallanması - boyut değişmesin
    gsap.to(gameCanvas, {
        x: Math.random() * 4 - 2,
        y: Math.random() * 4 - 2,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: function() {
            gsap.set(gameCanvas, {x: 0, y: 0});
        }
    });
}

// Kayayı patlat
function explodeRock() {
    gameState = 'exploding';
    
    // Büyük patlama efekti
    createExplosion();
    
    // Kaya fade out
    gsap.to(gameObjects.rock, {
        opacity: 0,
        scale: 1.5,
        duration: 1,
        ease: "power2.out",
        onComplete: function() {
            revealEthereumLogo();
        }
    });
}

// Patlama efekti
function createExplosion() {
    const rock = gameObjects.rock;
    
    // Büyük parçacık patlaması
    for (let i = 0; i < 50; i++) {
        particles.push(new ExplosionParticle(rock.x, rock.y));
    }
    
    // Duman efekti
    for (let i = 0; i < 30; i++) {
        particles.push(new SmokeParticle(rock.x, rock.y));
    }
}

// Ethereum logosu reveal - LOGO DROP SİSTEMİ
function revealEthereumLogo() {
    gameState = 'finished';
    
    // Logo drop chance hesapla - %5 Golden, %95 Normal
    const randomChance = Math.random();
    const isGoldenDrop = randomChance < 0.05; // %5 şans (RARE!)
    
    console.log(`Logo drop: ${isGoldenDrop ? 'GOLDEN (rare!)' : 'Normal'} - Chance: ${randomChance.toFixed(3)}`);
    
    // Logo container'ı oluştur
    const logoContainer = document.createElement('div');
    
    if (isGoldenDrop) {
        // 🏆 GOLDEN LOGO (RARE!) - Kendi hazırladığın logo
        logoContainer.className = 'eth-logo golden-logo';
        logoContainer.innerHTML = `
            <div class="golden-aura"></div>
            <div class="logo-container">
                <img src="assets/goldenethoslogo.png?v=1234" alt="Golden Ethos Logo" 
                     style="width: 200px; height: auto; filter: drop-shadow(0 0 30px #FFD700);"
                     onload="this.style.display='block';"
                     onerror="this.style.display='none'; this.parentElement.querySelector('.fallback-logo').style.display='block';">
                <div class="fallback-logo" style="display: none; width: 200px; height: 200px; background: linear-gradient(45deg, #FFD700, #FFF8DC); border-radius: 15px; position: relative; box-shadow: 0 0 40px rgba(255,215,0,0.6);">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 4rem;">🏆</div>
                </div>
            </div>
            <h2 style="color: #FFD700; margin-top: 1rem; font-size: 2.2rem; text-shadow: 0 0 20px #FFD700; text-align: center; margin-left: auto; margin-right: auto;">🏆 GOLDEN ETHEREUM OS 🏆</h2>
            <p style="color: #FFF8DC; margin-top: 0.5rem; font-weight: bold; font-size: 1.1rem; text-align: center; margin-left: auto; margin-right: auto;">🌟 RARE FIND! Golden version discovered! ✨</p>
        `;
        
        // Golden sparkle efekti ekle
        setTimeout(() => {
            createGoldenSparkles();
        }, 500);
        
    } else {
        // 🔵 NORMAL LOGO (Standard) - Kendi hazırladığın logo
        logoContainer.className = 'eth-logo normal-logo';
        logoContainer.innerHTML = `
            <div class="logo-container">
                <img src="assets/ethoslogo.png" alt="Ethos Logo" 
                     style="width: 200px; height: auto; filter: drop-shadow(0 0 20px #667eea);"
                     onload="this.style.display='block';"
                     onerror="this.style.display='none'; this.parentElement.querySelector('.fallback-logo').style.display='block';">
                <div class="fallback-logo" style="display: none; width: 200px; height: 200px; background: linear-gradient(45deg, #667eea, #9bb5ff); border-radius: 15px; position: relative; box-shadow: 0 0 30px rgba(102,126,234,0.6);">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 4rem;">💎</div>
                </div>
            </div>
            <h2 style="color: white; margin-top: 1rem; font-size: 2rem; text-shadow: 0 0 10px #667eea; text-align: center; margin-left: auto; margin-right: auto;">💎 Ethereum OS</h2>
            <p style="color: #ccc; margin-top: 0.5rem; text-align: center; margin-left: auto; margin-right: auto;">Successfully discovered!</p>
        `;
    }
    
    // Logo'yu body'ye ekle ki position: fixed düzgün çalışsın
    document.body.appendChild(logoContainer);
    
    // Logo reveal animasyonu
    const animationDuration = isGoldenDrop ? 3 : 2; // Golden logo daha uzun
    
    gsap.fromTo(logoContainer, 
        { 
            scale: 0, 
            opacity: 0, 
            rotation: isGoldenDrop ? 360 : 180,
            filter: "blur(20px)"
        },
        { 
            scale: isGoldenDrop ? 1.1 : 1, 
            opacity: 1, 
            rotation: 0,
            filter: "blur(0px)",
            duration: animationDuration,
            ease: isGoldenDrop ? "elastic.out(1, 0.3)" : "elastic.out(1, 0.5)",
            onComplete: function() {
                // Animasyon bittiğinde Play Again butonunu aktif et
                enablePlayAgainButton();
            }
        }
    );
    
    // Tebrik efekti
    setTimeout(() => {
        if (isGoldenDrop) {
            createGoldenCelebration(); // Özel golden kutlama
        } else {
            createCelebrationEffect(); // Normal kutlama
        }
    }, 1000);
}

// Normal kutlama efekti
function createCelebrationEffect() {
    for (let i = 0; i < 100; i++) {
        particles.push(new CelebrationParticle());
    }
}

// 🏆 GOLDEN KUTLAMA EFEKTİ (RARE DROP!)
function createGoldenCelebration() {
    console.log('🏆 GOLDEN CELEBRATION started!');
    
    // Normal kutlamadan 3x fazla parçacık
    for (let i = 0; i < 300; i++) {
        particles.push(new GoldenCelebrationParticle());
    }
    
    // Golden sparkle waves
    for (let wave = 0; wave < 5; wave++) {
        setTimeout(() => {
            for (let i = 0; i < 50; i++) {
                particles.push(new GoldenSparkleParticle());
            }
        }, wave * 400);
    }
}

// Golden sparkles sürekli efekt
function createGoldenSparkles() {
    const logoElement = document.querySelector('.golden-logo .logo-container');
    if (!logoElement) {
        return;
    }
    
    const sparkleInterval = setInterval(() => {
        // Eğer golden logo artık yoksa interval'ı durdur
        if (!document.querySelector('.golden-logo')) {
            clearInterval(sparkleInterval);
            return;
        }
        
        // Logo etrafında sparkle
        for (let i = 0; i < 10; i++) {
            particles.push(new GoldenSparkleParticle());
        }
    }, 1000); // Her saniye sparkle
}

// Hit parçacığı sınıfı
class HitParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.05;
        this.size = Math.random() * 3 + 1;
        this.color = `hsl(${Math.random() * 60 + 20}, 70%, 60%)`;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // gravity
        this.life -= this.decay;
        return this.life > 0;
    }
    
    draw() {
        particleCtx.save();
        particleCtx.globalAlpha = this.life;
        particleCtx.fillStyle = this.color;
        particleCtx.beginPath();
        particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        particleCtx.fill();
        particleCtx.restore();
    }
}

// Patlama parçacığı sınıfı
class ExplosionParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1;
        this.decay = 0.02;
        this.size = Math.random() * 5 + 2;
        this.color = `hsl(${Math.random() * 40 + 10}, 80%, 60%)`;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.vy += 0.1;
        this.life -= this.decay;
        return this.life > 0;
    }
    
    draw() {
        particleCtx.save();
        particleCtx.globalAlpha = this.life;
        particleCtx.fillStyle = this.color;
        particleCtx.beginPath();
        particleCtx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        particleCtx.fill();
        particleCtx.restore();
    }
}

// Duman parçacığı sınıfı
class SmokeParticle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 40;
        this.y = y + (Math.random() - 0.5) * 40;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -Math.random() * 3 - 1;
        this.life = 1;
        this.decay = 0.01;
        this.size = Math.random() * 20 + 10;
        this.gray = Math.random() * 50 + 100;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.size += 0.5;
        this.life -= this.decay;
        return this.life > 0;
    }
    
    draw() {
        particleCtx.save();
        particleCtx.globalAlpha = this.life * 0.3;
        particleCtx.fillStyle = `rgb(${this.gray}, ${this.gray}, ${this.gray})`;
        particleCtx.beginPath();
        particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        particleCtx.fill();
        particleCtx.restore();
    }
}

// Normal kutlama parçacığı sınıfı
class CelebrationParticle {
    constructor() {
        this.x = Math.random() * particleCanvas.width;
        this.y = particleCanvas.height + 10;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -Math.random() * 8 - 5;
        this.life = 1;
        this.decay = 0.01;
        this.size = Math.random() * 6 + 2;
        this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.life -= this.decay;
        return this.life > 0 && this.y < particleCanvas.height + 50;
    }
    
    draw() {
        particleCtx.save();
        particleCtx.globalAlpha = this.life;
        particleCtx.fillStyle = this.color;
        particleCtx.beginPath();
        particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        particleCtx.fill();
        particleCtx.restore();
    }
}

// 🏆 GOLDEN KUTLAMA PARÇACIĞI (RARE!)
class GoldenCelebrationParticle {
    constructor() {
        this.x = Math.random() * particleCanvas.width;
        this.y = particleCanvas.height + 10;
        this.vx = (Math.random() - 0.5) * 6; // Daha hızlı
        this.vy = -Math.random() * 12 - 8; // Daha yüksek
        this.life = 1;
        this.decay = 0.008; // Daha uzun yaşar
        this.size = Math.random() * 8 + 3; // Daha büyük
        // Altın tonlarda renk
        const goldHues = [45, 50, 55, 60]; // Sarı-altın tonları
        this.color = `hsl(${goldHues[Math.floor(Math.random() * goldHues.length)]}, 85%, 65%)`;
        this.sparkle = Math.random() > 0.7; // %30 sparkle şansı
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // Hafif gravity
        this.life -= this.decay;
        return this.life > 0 && this.y < particleCanvas.height + 50;
    }
    
    draw() {
        particleCtx.save();
        particleCtx.globalAlpha = this.life;
        
        if (this.sparkle) {
            // Sparkle efekti
            particleCtx.shadowColor = '#FFD700';
            particleCtx.shadowBlur = 10;
            particleCtx.fillStyle = '#FFD700';
        } else {
            particleCtx.fillStyle = this.color;
        }
        
        particleCtx.beginPath();
        particleCtx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        particleCtx.fill();
        particleCtx.restore();
    }
}

// ✨ GOLDEN SPARKLE PARÇACIĞI
class GoldenSparkleParticle {
    constructor() {
        // Logo merkezi etrafında spawn
        const centerX = particleCanvas.width / 2;
        const centerY = particleCanvas.height / 2;
        const radius = Math.random() * 100 + 50;
        const angle = Math.random() * Math.PI * 2;
        
        this.x = centerX + Math.cos(angle) * radius;
        this.y = centerY + Math.sin(angle) * radius;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 1;
        this.decay = 0.02;
        this.size = Math.random() * 4 + 1;
        this.twinkle = Math.random() * Math.PI * 2; // Twinkle animasyonu
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98; // Yavaşla
        this.vy *= 0.98;
        this.life -= this.decay;
        this.twinkle += 0.2;
        return this.life > 0;
    }
    
    draw() {
        particleCtx.save();
        
        // Twinkle efekti
        const alpha = this.life * (0.5 + 0.5 * Math.sin(this.twinkle));
        particleCtx.globalAlpha = alpha;
        
        // Golden glow
        particleCtx.shadowColor = '#FFD700';
        particleCtx.shadowBlur = 15;
        particleCtx.fillStyle = '#FFD700';
        
        // Yıldız şekli
        const spikes = 4;
        const outerRadius = this.size;
        const innerRadius = this.size * 0.4;
        
        particleCtx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius;
            
            if (i === 0) particleCtx.moveTo(x, y);
            else particleCtx.lineTo(x, y);
        }
        particleCtx.closePath();
        particleCtx.fill();
        
        particleCtx.restore();
    }
}

// Kayayı çiz
function drawRock() {
    if (gameState === 'exploding' || gameState === 'finished') return;
    
    const rock = gameObjects.rock;
    
    // Eğer kaya boyutu sıfırsa, boyutları ayarla
    if (!rock.width || rock.width === 0) {
        const canvasWidth = gameCanvas.width || window.innerWidth;
        if (canvasWidth <= 768) {
            rock.width = 220;  // Mobil için daha büyük
            rock.height = 220;
        } else {
            rock.width = 320;  // Desktop için daha büyük
            rock.height = 320;
        }
        console.log('Rock size set:', rock.width, 'x', rock.height);
    }
    
    // Eğer kaya pozisyonu sıfırsa, merkeze al
    if (!rock.x || rock.x === 0) {
        rock.x = (gameCanvas.width || window.innerWidth) / 2;
        rock.y = (gameCanvas.height || window.innerHeight) / 2;
        console.log('Kaya pozisyonu ayarlandı:', rock.x, rock.y);
    }
    
    gameCtx.save();
    
    if (rockImage && rockImage.complete) {
        // Kullanıcının kaya görselini kullan
        // Aspect ratio'yu koruyarak boyutlandır
        const aspectRatio = rockImage.width / rockImage.height;
        let drawWidth = rock.width;
        let drawHeight = rock.height;
        
        if (aspectRatio > 1) {
            // Görsel enine ise
            drawHeight = drawWidth / aspectRatio;
        } else {
            // Görsel dikine ise
            drawWidth = drawHeight * aspectRatio;
        }
        
        const imageX = rock.x - drawWidth / 2;
        const imageY = rock.y - drawHeight / 2;
        
        // Gölge efekti kaldırıldı - temiz görünüm için
        // gameCtx.globalAlpha = 0.4;
        // gameCtx.fillStyle = '#000000';
        // gameCtx.beginPath();
        // gameCtx.ellipse(rock.x + 8, rock.y + 8, drawWidth/2, drawHeight/2, 0, 0, Math.PI * 2);
        // gameCtx.fill();
        
        // Ana kaya görseli
        gameCtx.globalAlpha = 1.0;
        gameCtx.drawImage(rockImage, imageX, imageY, drawWidth, drawHeight);
        
    } else {
        // Varsayılan kaya çizimi (görsel yüklenmediyse)
        drawDefaultRock();
    }
    
    // Çatlakları çiz
    drawCracks();
    
    gameCtx.restore();
}

// Varsayılan kaya çizimi
function drawDefaultRock() {
    const rock = gameObjects.rock;
    
    // Kaya temel şekli
    gameCtx.fillStyle = '#8b7355';
    gameCtx.beginPath();
    gameCtx.arc(rock.x, rock.y, rock.width/2, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Gölge efekti
    gameCtx.fillStyle = '#6b5635';
    gameCtx.beginPath();
    gameCtx.arc(rock.x + 5, rock.y + 5, rock.width/2, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Ana kaya
    gameCtx.fillStyle = '#a0916b';
    gameCtx.beginPath();
    gameCtx.arc(rock.x, rock.y, rock.width/2, 0, Math.PI * 2);
    gameCtx.fill();
}

// Rastgele çatlak ekle
function addRandomCrack(hitX, hitY) {
    const rock = gameObjects.rock;
    const centerX = rock.x;
    const centerY = rock.y;
    
    // Vuruş noktasından başlayarak rastgele çatlak oluştur
    const numBranches = Math.random() > 0.7 ? 2 : 1; // Çoğunlukla 1 dal, bazen 2
    
    for (let i = 0; i < numBranches; i++) {
        const crack = {
            segments: [],
            width: Math.random() * 2 + 1 // Daha ince çatlaklar
        };
        
        // İlk segment: vuruş noktasından başla
        let currentX = hitX;
        let currentY = hitY;
        
        // Rastgele yön belirle
        let angle = Math.random() * Math.PI * 2;
        const segmentCount = Math.floor(Math.random() * 3) + 2; // 2-4 segment
        
        for (let j = 0; j < segmentCount; j++) {
            // Segment uzunluğu (kaya boyutuna göre)
            const segmentLength = Math.random() * (rock.width * 0.15) + (rock.width * 0.1);
            
            // Yön biraz değişsin (organik görünüm için)
            angle += (Math.random() - 0.5) * 0.8;
            
            const nextX = currentX + Math.cos(angle) * segmentLength;
            const nextY = currentY + Math.sin(angle) * segmentLength;
            
            // Kaya sınırları içinde kalsın
            const distanceFromCenter = Math.sqrt((nextX - centerX) ** 2 + (nextY - centerY) ** 2);
            if (distanceFromCenter < rock.width / 2 - 10) {
                crack.segments.push({
                    startX: currentX,
                    startY: currentY,
                    endX: nextX,
                    endY: nextY
                });
                
                currentX = nextX;
                currentY = nextY;
            } else {
                break; // Sınır dışına çıktı, bu dalı bitir
            }
        }
        
        if (crack.segments.length > 0) {
            rock.cracks.push(crack);
        }
    }
}

// Çatlakları çiz
function drawCracks() {
    const rock = gameObjects.rock;
    
    if (rock.cracks.length === 0) return;
    
    gameCtx.save();
    
    // Her çatlağı çiz
    rock.cracks.forEach(crack => {
        gameCtx.strokeStyle = '#2a1810';
        gameCtx.lineWidth = crack.width;
        gameCtx.lineCap = 'round';
        gameCtx.lineJoin = 'round';
        
        crack.segments.forEach(segment => {
            gameCtx.beginPath();
            gameCtx.moveTo(segment.startX, segment.startY);
            gameCtx.lineTo(segment.endX, segment.endY);
            gameCtx.stroke();
            
            // İç çatlak (daha açık renk)
            gameCtx.strokeStyle = '#4a3728';
            gameCtx.lineWidth = crack.width * 0.3;
            gameCtx.beginPath();
            gameCtx.moveTo(segment.startX, segment.startY);
            gameCtx.lineTo(segment.endX, segment.endY);
            gameCtx.stroke();
            
            // Geri dış renge dön
            gameCtx.strokeStyle = '#2a1810';
            gameCtx.lineWidth = crack.width;
        });
    });
    
    gameCtx.restore();
}

// Hit counter'ı güncelle (artık UI yok, sadece console log)
function updateHitCounter() {
    console.log(`Vuruş sayısı: ${hitCount}/${maxHits}`);
}

// Ana animasyon döngüsü
function animate() {
    // Particle canvas'ı temizle
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    // Game canvas'ı temizle ve kayayı çiz
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    drawRock();
    
    // Parçacıkları güncelle
    particles = particles.filter(particle => {
        particle.draw();
        return particle.update();
    });
    
    requestAnimationFrame(animate);
}

// Oyunu yeniden başlat
function restartGame() {
    
    // Ethereum logosu varsa kaldır (hem normal hem golden) - body'den ara
    const existingLogos = document.body.querySelectorAll('.eth-logo');
    existingLogos.forEach(logo => {
        logo.remove();
    });
    
    // Oyunu sıfırla
    resetGame();
    
    // Canvas boyutlarını ve kaya boyutunu yeniden ayarla
    resizeCanvas();
    
    // Kayayı yeniden çiz
    loadRockImage();
    
    // Play Again butonunu devre dışı bırak
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
        playAgainBtn.disabled = true;
    }
    
}

// Play Again butonunu aktif hale getir
function enablePlayAgainButton() {
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
        playAgainBtn.disabled = false;
        console.log('Play Again butonu aktif hale getirildi');
    }
}

// Ana sayfaya dön (ESC tuşu ile)
function goBack() {
    window.location.href = 'index.html';
}