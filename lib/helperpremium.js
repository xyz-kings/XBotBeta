const fs = require('fs');
const path = require('path');

class PremiumHandler {
    constructor() {
        this.premiumPath = path.join(__dirname, '../DataDase/users_premium.json');
        this.configPath = path.join(__dirname, '../config.json');
        this.premiumPlugins = new Map();
        this.loadConfig();
    }

    // Load config
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } else {
                this.config = {};
            }
        } catch (error) {
            console.error('❌ Error loading config:', error);
            this.config = {};
        }
    }

    // Load premium plugins dari folder premium/ (terpisah)
    loadPremiumPlugins() {
        try {
            const premiumDir = path.join(__dirname, '../premium');
            
            // Cek apakah folder premium ada
            if (!fs.existsSync(premiumDir)) {
                fs.mkdirSync(premiumDir, { recursive: true });
                console.log('📁 Created premium folder');
                return { success: true, loaded: 0, categories: [] };
            }
            
            // Scan subfolders di premium/
            const subFolders = fs.readdirSync(premiumDir).filter(f => 
                fs.statSync(path.join(premiumDir, f)).isDirectory()
            );
            
            let totalPlugins = 0;
            this.premiumPlugins.clear();
            
            for (const subFolder of subFolders) {
                const subFolderPath = path.join(premiumDir, subFolder);
                const pluginFiles = fs.readdirSync(subFolderPath).filter(f => f.endsWith('.js'));
                
                this.premiumPlugins.set(subFolder.toLowerCase(), []);
                
                for (const file of pluginFiles) {
                    try {
                        const pluginPath = path.join(subFolderPath, file);
                        delete require.cache[require.resolve(pluginPath)];
                        const plugin = require(pluginPath);
                        
                        if (plugin.command && plugin.execute) {
                            // Tandai sebagai premium (kalo belum ada)
                            if (!plugin.premiumOnly) {
                                plugin.premiumOnly = true;
                            }
                            
                            this.premiumPlugins.get(subFolder.toLowerCase()).push(plugin);
                            totalPlugins++;
                            console.log(`💎 Premium: ${subFolder}/${file}`);
                        }
                    } catch (error) {
                        console.error(`❌ Error loading premium plugin ${subFolder}/${file}:`, error);
                    }
                }
            }
            
            console.log(`💎 Premium plugins loaded: ${totalPlugins} from ${subFolders.length} categories`);
            return { 
                success: true, 
                loaded: totalPlugins, 
                categories: subFolders.length,
                subFolders: subFolders 
            };
            
        } catch (error) {
            console.error('❌ Error loading premium plugins:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all premium categories (subfolders)
    getPremiumCategories() {
        try {
            const premiumDir = path.join(__dirname, '../premium');
            if (!fs.existsSync(premiumDir)) return [];
            
            return fs.readdirSync(premiumDir).filter(f => 
                fs.statSync(path.join(premiumDir, f)).isDirectory()
            ).sort();
        } catch (error) {
            console.error('❌ Error getting premium categories:', error);
            return [];
        }
    }

    // Get plugins by category
    getPluginsByCategory(category) {
        const lowerCategory = category.toLowerCase();
        return this.premiumPlugins.get(lowerCategory) || [];
    }

    // Get all premium plugins
    getAllPremiumPlugins() {
        const allPlugins = [];
        for (const [category, plugins] of this.premiumPlugins) {
            allPlugins.push(...plugins.map(p => ({
                ...p,
                category: category
            })));
        }
        return allPlugins;
    }

    // Cek apakah user premium (SIMPLE CHECK)
    isPremium(userId, m = null) {
        try {
            // 1. Cek apakah ini BOT sendiri (always premium)
            if (m && m.key && m.key.fromMe) {
                return { isPremium: true, isOwner: true, isBot: true };
            }

            // 2. Cek apakah ini OWNER dari config
            const isOwner = this.config.ownerNumber && 
                           Array.isArray(this.config.ownerNumber) && 
                           this.config.ownerNumber.includes(userId);
            
            if (isOwner) {
                return { isPremium: true, isOwner: true, isBot: false };
            }

            // 3. Cek di database premium
            if (!fs.existsSync(this.premiumPath)) {
                return { isPremium: false, isOwner: false, isBot: false };
            }

            const premiumData = JSON.parse(fs.readFileSync(this.premiumPath, 'utf8'));
            const userData = premiumData[userId];

            if (!userData || !userData.isPremium) {
                return { isPremium: false, isOwner: false, isBot: false };
            }

            // 4. Cek expiry date
            if (userData.expiryDate) {
                const expiry = new Date(userData.expiryDate);
                const now = new Date();
                
                if (expiry > now) {
                    const timeDiff = expiry - now;
                    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                    
                    return { 
                        isPremium: true, 
                        isOwner: false, 
                        isBot: false,
                        expiryDate: userData.expiryDate,
                        daysLeft: days,
                        hoursLeft: hours,
                        minutesLeft: minutes,
                        userData: userData
                    };
                } else {
                    // Premium expired
                    return { isPremium: false, isOwner: false, isBot: false, expired: true };
                }
            }

            // 5. Premium tanpa expiry (permanent)
            return { isPremium: true, isOwner: false, isBot: false, permanent: true };

        } catch (error) {
            console.error('❌ Error checking premium:', error);
            return { isPremium: false, isOwner: false, isBot: false, error: error.message };
        }
    }

    // Get premium role untuk display
    getRole(userId, isOwnerFromHandler = false) {
        const status = this.isPremium(userId);
        
        if (status.isBot || status.isOwner || isOwnerFromHandler) {
            // Owner/Bot
            if (status.isPremium) {
                const days = status.daysLeft || 0;
                const hours = status.hoursLeft || 0;
                const minutes = status.minutesLeft || 0;
                if (days > 0 || hours > 0 || minutes > 0) {
                    return `VVIP + Dark VVIP ${days}d ${hours}h ${minutes}m`;
                }
                return "VVIP + Dark VVIP";
            }
            return "VVIP";
        }
        
        if (status.isPremium) {
            const days = status.daysLeft || 0;
            const hours = status.hoursLeft || 0;
            const minutes = status.minutesLeft || 0;
            if (days > 0 || hours > 0 || minutes > 0) {
                return `Dark VVIP ${days}d ${hours}h ${minutes}m`;
            }
            return "Dark VVIP";
        }
        
        return "Free";
    }

    // Cleanup expired premium
    cleanup() {
        try {
            if (!fs.existsSync(this.premiumPath)) {
                return { cleaned: 0 };
            }

            const premiumData = JSON.parse(fs.readFileSync(this.premiumPath, 'utf8'));
            const now = new Date();
            let cleaned = 0;

            for (const [userId, userData] of Object.entries(premiumData)) {
                if (userData.isPremium && userData.expiryDate) {
                    const expiry = new Date(userData.expiryDate);
                    if (expiry <= now) {
                        delete premiumData[userId];
                        cleaned++;
                    }
                }
            }

            if (cleaned > 0) {
                fs.writeFileSync(this.premiumPath, JSON.stringify(premiumData, null, 2));
            }

            return { cleaned };
            
        } catch (error) {
            console.error('❌ Error cleaning premium:', error);
            return { cleaned: 0, error: error.message };
        }
    }

    // Execute premium plugin
    async executePremiumPlugin(bot, m, command, args) {
        try {
            const userId = m.key.participant || m.key.remoteJid;
            
            // Cek premium status
            const premiumStatus = this.isPremium(userId, m);
            if (!premiumStatus.isPremium && !premiumStatus.isOwner && !premiumStatus.isBot) {
                return { 
                    success: false, 
                    error: 'NOT_PREMIUM',
                    message: 'User is not premium' 
                };
            }

            // Cari plugin premium
            for (const [category, plugins] of this.premiumPlugins) {
                for (const plugin of plugins) {
                    const cmdNames = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
                    
                    if (cmdNames.some(cmd => cmd.toLowerCase() === command.toLowerCase())) {
                        try {
                            // Eksekusi plugin
                            await plugin.execute(bot, m, args);
                            return { 
                                success: true, 
                                plugin: plugin,
                                category: category 
                            };
                        } catch (error) {
                            console.error(`❌ Error executing premium plugin ${command}:`, error);
                            return { 
                                success: false, 
                                error: 'EXECUTION_ERROR',
                                message: error.message 
                            };
                        }
                    }
                }
            }
            
            return { 
                success: false, 
                error: 'NOT_FOUND',
                message: 'Premium command not found' 
            };
            
        } catch (error) {
            console.error('❌ Error in executePremiumPlugin:', error);
            return { 
                success: false, 
                error: 'SYSTEM_ERROR',
                message: error.message 
            };
        }
    }
}

// Export instance
module.exports = new PremiumHandler();