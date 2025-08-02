// Main page JavaScript file

// Functions to run when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded!');
    initParticles();
    initAnimations();
    
    // Butonu bağla
    const enterButton = document.getElementById('enterButton');
    if (enterButton) {
        console.log('Button found, adding event listener...');
        
        // Birden fazla yöntemle event listener ekle
        enterButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Button clicked!');
            enterApp();
        });
        
        // Touchstart da ekle (mobil için)
        enterButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            console.log('Button touched!');
            enterApp();
        });
        
        // Onclick attribute da ekle (yedek)
        enterButton.onclick = function() {
            console.log('Onclick çalıştı!');
            enterApp();
        };
        
    } else {
        console.error('enterButton bulunamadı!');
    }
});

// Uygulama giriş fonksiyonu  
function enterApp() {
    console.log('enterApp fonksiyonu çalıştı!');
    console.log('Oyun sayfasına yönlendiriliyor...');
    
    try {
        // Direkt sayfa geçişi yap
        window.location.href = 'game.html';
    } catch (error) {
        console.error('Sayfa geçişi hatası:', error);
        // Alternatif yöntem
        window.location = 'game.html';
    }
}

// Parçacık efektleri için canvas setup
function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 50;
    
    // Parçacık sınıfı
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.radius = Math.random() * 3 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            // Sınırları kontrol et
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            
            // Yavaş yavaş solma efekti
            this.opacity += (Math.random() - 0.5) * 0.02;
            this.opacity = Math.max(0.1, Math.min(0.7, this.opacity));
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Parçacıkları oluştur
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Animasyon döngüsü
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Parçacıklar arası çizgiler
        drawConnections();
        
        requestAnimationFrame(animate);
    }
    
    // Yakın parçacıklar arasında çizgi çek
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.save();
                    ctx.globalAlpha = (100 - distance) / 100 * 0.3;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }
    
    animate();
    
    // Pencere boyutu değiştiğinde canvas'ı güncelle
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Sayfa animasyonlarını başlat
function initAnimations() {
    // GSAP varsa animasyonları çalıştır
    if (typeof gsap !== 'undefined') {
        // Logo animasyonu
        gsap.fromTo('.logo-img', 
            { opacity: 0, y: -50, rotation: -10 },
            { opacity: 1, y: 0, rotation: 0, duration: 1, ease: "bounce.out" }
        );
        
        // Mouse takip efekti
        document.addEventListener('mousemove', function(e) {
            const cursor = document.querySelector('.hero-content');
            if (cursor) {
                const x = (e.clientX / window.innerWidth - 0.5) * 20;
                const y = (e.clientY / window.innerHeight - 0.5) * 20;
                
                gsap.to(cursor, {
                    x: x,
                    y: y,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });
    } else {
        console.log('GSAP yüklenmedi, CSS animasyonları kullanılıyor');
    }
}

// Sayfa geçiş efekti
window.addEventListener('beforeunload', function() {
    document.body.style.opacity = '0';
});