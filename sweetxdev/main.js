const DISCORD_USER_ID = "815933797556027413";

document.addEventListener("DOMContentLoaded", () => {
    const enterScreen = document.getElementById("enter-screen");
    const mainContent = document.getElementById("main-content");
    const bgVideo = document.getElementById("bg-video");
    const audioToggle = document.getElementById("audio-toggle");
    const viewCounter = document.getElementById("view-counter-el");

    let ws;

    // Enter Screen Logic
    enterScreen.addEventListener("click", () => {
        bgVideo.muted = false;
        bgVideo.play().catch(e => console.log("Video play error:", e));

        enterScreen.style.opacity = "0";
        setTimeout(() => {
            enterScreen.classList.add("hidden");
            
            // Show main elements
            mainContent.classList.remove("hidden");
            audioToggle.classList.remove("hidden");
            viewCounter.classList.remove("hidden");
        }, 500);

        initLanyard();
    });

    // Audio Toggle Logic
    audioToggle.addEventListener("click", () => {
        if (bgVideo.muted || bgVideo.paused) {
            bgVideo.muted = false;
            bgVideo.play();
            audioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            bgVideo.muted = true;
            audioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    });

    // Lanyard Integration
    function initLanyard() {
        ws = new WebSocket("wss://api.lanyard.rest/socket");

        ws.onopen = () => console.log("Lanyard connected.");

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.op === 1) {
                setInterval(() => {
                    ws.send(JSON.stringify({ op: 3 }));
                }, data.d.heartbeat_interval);

                ws.send(JSON.stringify({
                    op: 2,
                    d: { subscribe_to_id: DISCORD_USER_ID }
                }));
            }

            if (data.t === "INIT_STATE" || data.t === "PRESENCE_UPDATE") {
                updateProfile(data.d);
            }
        };

        ws.onclose = () => setTimeout(initLanyard, 5000);
    }

    function updateProfile(userData) {
        if (!userData || !userData.discord_user) {
            document.getElementById("username").innerText = "Error";
            document.getElementById("activity-details").innerText = "Not in Lanyard Server";
            return;
        }

        const discordUser = userData.discord_user;
        const activities = userData.activities || [];
        
        // Use global name or username
        const name = discordUser.global_name || discordUser.username;
        document.getElementById("username").innerText = name;
        document.getElementById("activity-username").innerText = discordUser.username;

        // Avatar
        const avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=512`;
        document.getElementById("avatar").src = avatarUrl;
        document.getElementById("activity-avatar").src = avatarUrl;

        // Dynamic Status
        const discordStatus = userData.discord_status || "offline";
        const statusIndicator = document.getElementById("status-indicator");
        statusIndicator.className = `status ${discordStatus}`;
        
        // Activity Text
        const customStatusActivity = activities.find(a => a.type === 4);
        const gameActivity = activities.find(a => a.type !== 4);
        const detailsEl = document.getElementById("activity-details");

        if (gameActivity) {
            detailsEl.innerText = gameActivity.name;
        } else if (customStatusActivity && customStatusActivity.state) {
            detailsEl.innerText = customStatusActivity.state;
        } else {
            let statusName = discordStatus.charAt(0).toUpperCase() + discordStatus.slice(1);
            if (discordStatus === "dnd") statusName = "Do Not Disturb";
            detailsEl.innerText = statusName;
        }
    }

    // View Counter Logic
    function updateViewCounter() {
        const viewCountEl = document.getElementById("view-count");
        let localViews = parseInt(localStorage.getItem('gunslol_views')) || 473;
        
        fetch("https://api.counterapi.dev/v1/gunslol-sweet-user-815933/views/up")
            .then(response => response.json())
            .then(data => {
                if (data && typeof data.count === 'number') {
                    viewCountEl.innerText = 472 + data.count;
                } else {
                    // Fallback to local storage if API is weird
                    localViews++;
                    localStorage.setItem('gunslol_views', localViews);
                    viewCountEl.innerText = localViews;
                }
            })
            .catch(() => {
                localViews++;
                localStorage.setItem('gunslol_views', localViews);
                viewCountEl.innerText = localViews;
            });
    }

    updateViewCounter();
});
