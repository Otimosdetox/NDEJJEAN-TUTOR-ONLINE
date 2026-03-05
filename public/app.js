// Ndejjean Tutor - Pure Client-Side Logic (No Node.js required)

document.addEventListener('DOMContentLoaded', () => {
    // State
    let user = JSON.parse(localStorage.getItem('currentUser')) || null;
    let isLoginMode = true;
    let messages = [];
    let isTyping = false;

    // Elements
    const landingPage = document.getElementById('landing-page');
    const homeSection = document.getElementById('home-section');
    const aboutSection = document.getElementById('about-section');
    const contactsSection = document.getElementById('contacts-section');
    const authSection = document.getElementById('auth-section');
    const authCard = document.getElementById('auth-card');
    const chatSection = document.getElementById('chat-section');
    
    const navLinks = document.querySelectorAll('.nav-link');

    const goToSignup = document.getElementById('go-to-signup');
    const goToLoginFromSignup = document.getElementById('go-to-login-from-signup');
    const goToRetrieval = document.getElementById('go-to-retrieval');
    const goToLoginFromRetrieval = document.getElementById('go-to-login-from-retrieval');
    const formWrapper = document.getElementById('form-wrapper');
    
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginRemember = document.getElementById('login-remember');
    const loginError = document.getElementById('login-error');
    
    const signupForm = document.getElementById('signup-form');
    const signupName = document.getElementById('signup-name');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupError = document.getElementById('signup-error');

    const retrievalForm = document.getElementById('retrieval-form');
    const retrievalName = document.getElementById('retrieval-name');
    const retrievalEmail = document.getElementById('retrieval-email');
    const retrievalNewPassword = document.getElementById('retrieval-new-password');
    const retrievalConfirmPassword = document.getElementById('retrieval-confirm-password');
    const retrievalError = document.getElementById('retrieval-error');
    const retrievalSuccess = document.getElementById('retrieval-success');

    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameDisplay = document.getElementById('user-name');
    const userEmailDisplay = document.getElementById('user-email');
    const userAvatar = document.getElementById('user-avatar');

    const showChatbaseBtn = document.getElementById('show-chatbase');
    const chatbaseContainer = document.getElementById('chatbase-container');

    const LOGO_URL = "https://tse4.mm.bing.net/th/id/OIP.i-XbmSfabFUiwwnIu4uCKgAAAA?rs=1&pid=ImgDetMain&o=7&rm=3";

    // Card Toggle Logic
    window.toggleCard = (type) => {
        const card = document.getElementById(`card-${type}`);
        const isExpanded = card.classList.contains('card-expanded');
        
        // Close all cards first
        document.querySelectorAll('.glass-effect').forEach(c => {
            c.classList.remove('card-expanded');
        });

        if (!isExpanded) {
            card.classList.add('card-expanded');
        }
    };

    // YouTube Seamless Loop Logic
    let player;
    window.onYouTubeIframeAPIReady = () => {
        player = new YT.Player('player', {
            videoId: 'wjGXg8rDT6U',
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'mute': 1,
                'loop': 1,
                'playlist': 'wjGXg8rDT6U',
                'modestbranding': 1,
                'showinfo': 0,
                'rel': 0,
                'iv_load_policy': 3,
                'enablejsapi': 1
            },
            events: {
                'onReady': (event) => {
                    event.target.playVideo();
                },
                'onStateChange': (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        player.playVideo();
                    }
                }
            }
        });
    };

    // Navigation Logic
    window.showSection = (sectionId) => {
        // Hide everything first
        landingPage.classList.add('hidden');
        homeSection.classList.add('hidden');
        aboutSection.classList.add('hidden');
        contactsSection.classList.add('hidden');
        authSection.classList.add('hidden');
        chatSection.classList.add('hidden');

        // Reset nav links
        navLinks.forEach(link => link.classList.replace('text-white', 'text-white/50'));

        if (sectionId === 'home') {
            landingPage.classList.remove('hidden');
            homeSection.classList.remove('hidden');
            updateNavLink('Home');
        } else if (sectionId === 'about') {
            landingPage.classList.remove('hidden');
            aboutSection.classList.remove('hidden');
            updateNavLink('About');
        } else if (sectionId === 'contacts') {
            landingPage.classList.remove('hidden');
            contactsSection.classList.remove('hidden');
            updateNavLink('Contacts');
        } else if (sectionId === 'auth') {
            if (user) {
                chatSection.classList.remove('hidden');
            } else {
                authSection.classList.remove('hidden');
            }
            updateNavLink('Sign In');
        }
    };

    const updateNavLink = (text) => {
        navLinks.forEach(link => {
            if (link.textContent === text) {
                link.classList.replace('text-white/50', 'text-white');
            }
        });
    };

    // Initialize UI
    const updateUI = () => {
        if (user) {
            landingPage.classList.add('hidden');
            authSection.classList.add('hidden');
            chatSection.classList.remove('hidden');
            userNameDisplay.textContent = user.name;
            userEmailDisplay.textContent = user.email;
            userAvatar.textContent = user.name[0].toUpperCase();
        } else {
            // Default to home if not logged in
            showSection('home');
        }
    };

    updateUI();

    // Password Toggle Logic
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Toggle icon
            const svg = btn.querySelector('svg');
            if (type === 'text') {
                svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
            } else {
                svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
            }
        });
    });

    // Inline Validation Logic
    const validateID = (id) => {
        return id.trim().length >= 4; // Simple validation for ID
    };

    const setupValidation = (inputId, errorId, validator) => {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        input.addEventListener('input', () => {
            if (validator(input.value)) {
                input.classList.remove('border-red-500/50');
            } else {
                input.classList.add('border-red-500/50');
            }
        });
    };

    setupValidation('login-email', null, validateID);
    setupValidation('login-password', null, (val) => val.length > 0);
    setupValidation('signup-email', null, validateID);
    setupValidation('signup-name', null, (val) => val.trim().length > 0);
    setupValidation('signup-password', null, (val) => val.length >= 6);
    setupValidation('retrieval-email', null, validateID);

    // Remember Me Logic
    loginEmail.addEventListener('input', () => {
        const remembered = JSON.parse(localStorage.getItem('rememberedUser'));
        if (remembered && remembered.email === loginEmail.value) {
            loginPassword.value = remembered.password;
            loginRemember.checked = true;
        }
    });

    // Auth Switching Logic
    const setAuthMode = (mode) => {
        if (mode === 'login') {
            formWrapper.style.transform = 'translateX(0%)';
        } else if (mode === 'signup') {
            formWrapper.style.transform = 'translateX(-33.333%)';
        } else if (mode === 'retrieval') {
            formWrapper.style.transform = 'translateX(-66.666%)';
        }
        loginError.classList.add('hidden');
        signupError.classList.add('hidden');
        retrievalError.classList.add('hidden');
        retrievalSuccess.classList.add('hidden');
    };

    goToSignup.addEventListener('click', () => setAuthMode('signup'));
    goToLoginFromSignup.addEventListener('click', () => setAuthMode('login'));
    goToRetrieval.addEventListener('click', () => setAuthMode('retrieval'));
    goToLoginFromRetrieval.addEventListener('click', () => setAuthMode('login'));

    // Shake effect for errors
    const triggerError = (errorEl) => {
        authCard.classList.remove('animate-shake');
        void authCard.offsetWidth; // Trigger reflow
        authCard.classList.add('animate-shake');
        errorEl.classList.remove('hidden');
    };

    // Login Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        
        const email = loginEmail.value; // Student ID
        const password = loginPassword.value;
        const users = JSON.parse(localStorage.getItem('users')) || [];

        const foundUser = users.find(u => u.email === email && u.password === password);
        if (foundUser) {
            user = foundUser;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            if (loginRemember.checked) {
                localStorage.setItem('rememberedUser', JSON.stringify({ email, password }));
            } else {
                localStorage.removeItem('rememberedUser');
            }
            
            updateUI();
        } else {
            loginError.textContent = "Invalid Student ID or password";
            triggerError(loginError);
        }
    });

    // Signup Submit
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        signupError.classList.add('hidden');
        
        const name = signupName.value;
        const email = signupEmail.value; // Student ID
        const password = signupPassword.value;
        const users = JSON.parse(localStorage.getItem('users')) || [];

        if (users.find(u => u.email === email)) {
            signupError.textContent = "Student ID already exists";
            triggerError(signupError);
            return;
        }

        const newUser = { email, password, name };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        user = newUser;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUI();
    });

    // Password Retrieval Submit
    retrievalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        retrievalError.classList.add('hidden');
        retrievalSuccess.classList.add('hidden');

        const name = retrievalName.value;
        const email = retrievalEmail.value; // Student ID
        const newPass = retrievalNewPassword.value;
        const confirmPass = retrievalConfirmPassword.value;

        if (newPass !== confirmPass) {
            retrievalError.textContent = "Passwords do not match";
            triggerError(retrievalError);
            return;
        }

        if (newPass.length < 6) {
            retrievalError.textContent = "Password must be at least 6 characters";
            triggerError(retrievalError);
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.email === email && u.name.toLowerCase() === name.toLowerCase());

        if (userIndex === -1) {
            retrievalError.textContent = "User not found with these details";
            triggerError(retrievalError);
            return;
        }

        users[userIndex].password = newPass;
        localStorage.setItem('users', JSON.stringify(users));
        
        retrievalSuccess.textContent = "Password updated successfully! You can now sign in.";
        retrievalSuccess.classList.remove('hidden');
        retrievalForm.reset();
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        user = null;
        localStorage.removeItem('currentUser');
        updateUI();
    });

    // Sidebar Toggle
    openSidebarBtn.addEventListener('click', () => sidebar.classList.remove('-translate-x-full'));
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.add('-translate-x-full'));

    showChatbaseBtn.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full'); // Close sidebar on mobile
    });
});
