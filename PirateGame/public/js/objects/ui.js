export default class UI {
    constructor(scene) { //singleton class constructs UI elements 
        

        this.scene = scene;
        this.debugMenuVisible = false;

        // Map dimensions
        let minimapScale = 0.2; //minimap scale

        // Top message text 
        this.messageText = scene.add.text(
            scene.cameras.main.width / 2,
            20,
            "",
            {
                fontSize: "18px",
                fill: "#ffffff",
                backgroundColor: "#00000088"
            }
        )
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(1000)
        .setVisible(false);

        // HTML minimap
        this.minimapContainer = document.getElementById("minimap-container");
        this.minimapCanvas = document.getElementById("minimap-marker-canvas");
        this.minimapCtx = this.minimapCanvas.getContext("2d");

        //HTML LeaderBoard

        //sets canvas resolotiom to display size
        this.minimapCanvas.width = this.minimapContainer.offsetWidth;
        this.minimapCanvas.height = this.minimapContainer.offsetHeight;

        this.createDebugControls();

        // Interaction prompt
        this.promptEl = document.getElementById("interaction-prompt");
    }

    initializeMarker(spawnX, spawnY, mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;

        // Show minimap now that the scene has started
        if (this.minimapContainer) {
            this.minimapContainer.style.display = "block";
        }

        this.updatePlayerMarker(spawnX, spawnY, mapWidth, mapHeight);
    }


    updatePlayerMarker(playerX, playerY, mapWidth, mapHeight) {//Scale player position to minimap coordinates
        const canvas = this.minimapCanvas;
        const ctx = this.minimapCtx;

        if (canvas.width !== this.minimapContainer.offsetWidth) { //resises canvas if container changes
            canvas.width = this.minimapContainer.offsetWidth;
            canvas.height = this.minimapContainer.offsetHeight;
        }

        //clear previous marker
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        //calculated marker position
        const markerX = (playerX / mapWidth) * canvas.width;
        const markerY = (playerY / mapHeight) * canvas.height;

        // Draw red dot marker
        ctx.beginPath();
        ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ff0000";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }


    //connects keyboard button (X) to HTML logic
    createDebugControls() {
        this.debugMenu = document.getElementById("debug-menu");
        this.printStatsButton = document.getElementById("printStatsButton");
        this.statsOverlay = document.getElementById("stats-overlay");
        this.statsContent = document.getElementById("stats-content");
        this.statsVisible = false;

        if (this.printStatsButton) {
            this.printStatsButton.addEventListener("click", async () => {
                const stats = await this.fetchShipStats();
                if (stats) {
                    console.log("=== SHIP STATS ===", stats);
                    this.toggleStatsOverlay(stats);
                }
            });
        }

        //onclick 
        window.setComponent = async (componentType, variant) => {
            try {
                await fetch("/api/component", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ componentType, variant })
                });

                //highlight the active button
                const sections = this.debugMenu.querySelectorAll(".debug-section");
                sections.forEach(section => {
                    const label = section.querySelector(".debug-label");
                    if (label && label.textContent.toLowerCase().replace(/\s/g, "") === componentType.toLowerCase().replace(/\s/g, "")) {
                        section.querySelectorAll("button").forEach(btn => {
                            btn.classList.toggle("active", btn.textContent.toLowerCase() === variant.toLowerCase());
                        });
                    }
                });

                //if stats are visible, refresh
                if (this.statsVisible) {
                    const stats = await this.fetchShipStats();
                    if (stats) {
                        console.log("=== SHIP STATS (updated) ===", stats); //logs stats
                        this.updateStatsOverlay(stats);
                    }
                }
            } catch (e) {
                console.error("Failed to set component:", e);
            }
        };

        // X key toggles debug menu
        this.debugKey = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.X
        );

        this.debugKey.on("down", () => this.toggleDebugMenu());

        this.scene.events.once("shutdown", () => {
            this.debugKey?.off("down");
            this.debugKey = null;
        });
    }


    showPrompt(text) {
        if (this.promptEl) {
            this.promptEl.textContent = text;
            this.promptEl.style.display = "block";
        }
    }

    hidePrompt() {
        if (this.promptEl) {
            this.promptEl.style.display = "none";
        }
    }

    // Called every frame to reset transient UI state
    clear() {
        this.hidePrompt();
    }

    setGold(amount) {
        // placeholder for future gold display
    }

    toggleDebugMenu() {
        this.debugMenuVisible = !this.debugMenuVisible;
        if (this.debugMenu) {
            this.debugMenu.style.display = this.debugMenuVisible ? "block" : "none";
        }
    }

    toggleStatsOverlay(stats) {
        if (!this.statsOverlay) return;

        if (this.statsVisible) {
            this.statsOverlay.style.display = "none";
            this.statsVisible = false;
            return;
        }

        this.updateStatsOverlay(stats);
        this.statsOverlay.style.display = "block";
        this.statsVisible = true;
    }

    updateStatsOverlay(stats) {
        const statLabels = {
            maxHealth:"Max Health",
            crewCapacity:"Crew Capacity",
            acceleration:"Acceleration",
            maxSpeed:"Max Speed",
            cannonDamage:"Cannon Damage",
            cannonRange:"Cannon Range",
            cannonCount:"Cannon Count",
            rammingPower:"Ramming Power",
            minimapRange:"Minimap Range",
            visionRange:"Vision Range",
            stopPower:"Stop Power",
            deployTime:"Deploy Time",
            retrieveTime:"Retrieve Time",
            turnSpeed: "Turn Speed",
            responseTime:"Response Time",
            fireRate: "Fire Rate",
            accuracy:"Accuracy",
            weight:"Weight"
        };

        this.statsContent.innerHTML = Object.entries(statLabels)
            .map(([key, label]) => `
                <div class="stat-row">
                    <span class="stat-label">${label}</span>
                    <span class="stat-value">${stats[key] ?? "N/A"}</span>
                </div>`)
            .join("");
    }




    //API
    async fetchShipStats() {
        try {
            const res = await fetch("/api/stats");
            if (!res.ok) throw new Error(res.status);
            return await res.json();
        } catch (e) {
            console.error("Failed to fetch ship stats:", e);
            return null;
        }
    }


    
}