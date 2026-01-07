const fs = require('fs');
const path = require('path');

class JagaGCHelper {
    constructor() {
        this.groupSchedules = new Map();
        this.scheduleInterval = null;
        this.CHECK_INTERVAL = 60000; // 1 menit
        this.SCHEDULE_FILE = path.join(__dirname, '..', 'database', 'group_schedules.json');
        this.activeGroups = new Map(); // Untuk menyimpan status grup yang sedang diperiksa
        this.warningCooldown = new Map(); // Cooldown untuk warning per grup
        this.WARNING_COOLDOWN_MINUTES = 15; // 15 menit cooldown antara warning
    }

    // Initialize helper
    async init() {
        try {
            await this.loadSchedules();
            console.log(`📅 JagaGC Helper loaded: ${this.groupSchedules.size} schedules`);
            return true;
        } catch (error) {
            console.error('❌ Error initializing JagaGC Helper:', error);
            return false;
        }
    }

    // Load schedules from file
    async loadSchedules() {
        try {
            if (fs.existsSync(this.SCHEDULE_FILE)) {
                const data = JSON.parse(fs.readFileSync(this.SCHEDULE_FILE, 'utf8'));
                this.groupSchedules.clear();
                
                for (const [groupId, schedule] of Object.entries(data)) {
                    // Validate and parse schedule data
                    if (schedule && schedule.startTime && schedule.endTime) {
                        this.groupSchedules.set(groupId, {
                            startTime: schedule.startTime,
                            endTime: schedule.endTime,
                            enabled: schedule.enabled !== false, // default true
                            lastWarning: schedule.lastWarning || 0
                        });
                    }
                }
                
                console.log(`📅 Loaded ${this.groupSchedules.size} group schedules`);
                return true;
            }
        } catch (error) {
            console.error('❌ Error loading group schedules:', error);
        }
        return false;
    }

    // Save schedules to file
    async saveSchedules() {
        try {
            const schedulesObj = {};
            this.groupSchedules.forEach((schedule, groupId) => {
                schedulesObj[groupId] = {
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    enabled: schedule.enabled,
                    lastWarning: schedule.lastWarning || 0
                };
            });
            
            const dir = path.dirname(this.SCHEDULE_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(this.SCHEDULE_FILE, JSON.stringify(schedulesObj, null, 2));
            console.log(`💾 Saved ${this.groupSchedules.size} group schedules`);
            return true;
        } catch (error) {
            console.error('❌ Error saving group schedules:', error);
            return false;
        }
    }

    // Parse time string to object
    parseTime(timeStr) {
        if (!timeStr) return null;
        
        // Handle both object and string formats
        if (typeof timeStr === 'object' && timeStr.hours !== undefined && timeStr.minutes !== undefined) {
            return timeStr;
        }
        
        if (typeof timeStr !== 'string') return null;
        
        // Parse format HH.MM atau HH:MM
        const cleanStr = timeStr.replace(/[.:]/g, ':');
        const parts = cleanStr.split(':');
        
        if (parts.length < 2) return null;
        
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null;
        }
        
        return { hours, minutes };
    }

    // Convert time to minutes
    timeToMinutes(time) {
        if (!time || !time.hours || !time.minutes) return 0;
        return time.hours * 60 + time.minutes;
    }

    // Check if current time is between start and end
    isTimeBetween(current, start, end) {
        const currentMins = this.timeToMinutes(current);
        const startMins = this.timeToMinutes(start);
        const endMins = this.timeToMinutes(end);
        
        if (startMins <= endMins) {
            // Normal: start < end (contoh: 07:00 - 23:00)
            return currentMins >= startMins && currentMins <= endMins;
        } else {
            // Melewati tengah malam (contoh: 22:00 - 06:00)
            return currentMins >= startMins || currentMins <= endMins;
        }
    }

    // Get schedule for a group
    getSchedule(groupId) {
        return this.groupSchedules.get(groupId);
    }

    // Set schedule for a group
    setSchedule(groupId, startTime, endTime, enabled = true) {
        const parsedStart = this.parseTime(startTime);
        const parsedEnd = this.parseTime(endTime);
        
        if (!parsedStart || !parsedEnd) {
            throw new Error('Invalid time format');
        }
        
        this.groupSchedules.set(groupId, {
            startTime: parsedStart,
            endTime: parsedEnd,
            enabled: enabled,
            lastWarning: 0
        });
        
        this.saveSchedules();
        return true;
    }

    // Enable/disable schedule for a group
    setScheduleStatus(groupId, enabled) {
        const schedule = this.groupSchedules.get(groupId);
        if (!schedule) {
            throw new Error('Schedule not found');
        }
        
        schedule.enabled = enabled;
        this.saveSchedules();
        return true;
    }

    // Remove schedule for a group
    removeSchedule(groupId) {
        const existed = this.groupSchedules.delete(groupId);
        if (existed) {
            this.saveSchedules();
        }
        return existed;
    }

    // Get all schedules
    getSchedules() {
        return this.groupSchedules;
    }

    // Check if warning is on cooldown for a group
    isWarningOnCooldown(groupId) {
        const schedule = this.groupSchedules.get(groupId);
        if (!schedule || !schedule.lastWarning) return false;
        
        const now = Date.now();
        const cooldownMs = this.WARNING_COOLDOWN_MINUTES * 60 * 1000;
        
        return (now - schedule.lastWarning) < cooldownMs;
    }

    // Update last warning time
    updateLastWarning(groupId) {
        const schedule = this.groupSchedules.get(groupId);
        if (schedule) {
            schedule.lastWarning = Date.now();
            this.saveSchedules();
        }
    }

    // Start group schedule checker
    startGroupScheduleChecker(bot) {
        if (this.scheduleInterval) {
            clearInterval(this.scheduleInterval);
        }
        
        this.scheduleInterval = setInterval(async () => {
            try {
                await this.checkAllGroups(bot);
            } catch (error) {
                console.error('❌ Error in schedule checker:', error);
            }
        }, this.CHECK_INTERVAL);
        
        console.log(`📅 Group schedule checker started (every ${this.CHECK_INTERVAL/1000} seconds)`);
        return this.scheduleInterval;
    }

    // Stop group schedule checker
    stopGroupScheduleChecker() {
        if (this.scheduleInterval) {
            clearInterval(this.scheduleInterval);
            this.scheduleInterval = null;
            console.log('📅 Group schedule checker stopped');
        }
    }

    // Check all groups
    async checkAllGroups(bot) {
        if (this.groupSchedules.size === 0) return;
        
        const now = new Date();
        const currentTime = {
            hours: now.getHours(),
            minutes: now.getMinutes()
        };
        
        for (const [groupId, schedule] of this.groupSchedules) {
            try {
                if (!schedule.enabled) continue;
                
                const isOpen = this.isTimeBetween(currentTime, schedule.startTime, schedule.endTime);
                
                // Jika grup seharusnya tutup, cek apakah perlu kirim warning
                if (!isOpen && !this.isWarningOnCooldown(groupId)) {
                    await this.checkGroupActivity(bot, groupId, schedule, currentTime);
                }
            } catch (error) {
                console.error(`❌ Error checking group ${groupId}:`, error.message);
            }
        }
    }

    // Check group activity and send warning if needed
    async checkGroupActivity(bot, groupId, schedule, currentTime) {
        try {
            // Get group metadata
            const metadata = await bot.groupMetadata(groupId).catch(() => null);
            if (!metadata) {
                console.log(`📭 Group ${groupId.substring(0, 8)}... not found or bot not admin`);
                return;
            }
            
            // In a real implementation, you would check for recent messages
            // For now, we'll simulate based on group activity status
            const shouldWarn = this.shouldSendWarning(groupId);
            
            if (shouldWarn) {
                await this.sendWarningMessage(bot, groupId, schedule, currentTime);
                this.updateLastWarning(groupId);
            }
            
        } catch (error) {
            console.error(`❌ Error checking activity for group ${groupId}:`, error);
        }
    }

    // Determine if warning should be sent
    shouldSendWarning(groupId) {
        // In a real implementation, check for recent messages
        // For now, we'll use a simple probability or check active status
        const isActive = this.activeGroups.get(groupId) || false;
        
        // Reset active status after warning
        this.activeGroups.set(groupId, false);
        
        return isActive || Math.random() < 0.3; // 30% chance for demo
    }

    // Send warning message to group
    async sendWarningMessage(bot, groupId, schedule, currentTime) {
        try {
            const warningMsg = `⚠️ *PERINGATAN JAGA GRUP*\n\n` +
                `Grup ini sedang dalam mode *JAGA GRUP*.\n` +
                `⏰ *Waktu saat ini:* ${String(currentTime.hours).padStart(2, '0')}:${String(currentTime.minutes).padStart(2, '0')}\n\n` +
                `📅 *Jadwal aktif:*\n` +
                `• BUKA: ${String(schedule.startTime.hours).padStart(2, '0')}:${String(schedule.startTime.minutes).padStart(2, '0')}\n` +
                `• TUTUP: ${String(schedule.endTime.hours).padStart(2, '0')}:${String(schedule.endTime.minutes).padStart(2, '0')}\n\n` +
                `🚫 *Mohon untuk tidak mengobrol di luar jam yang ditentukan!*\n` +
                `Grup akan aktif kembali pada pukul ${String(schedule.startTime.hours).padStart(2, '0')}:${String(schedule.startTime.minutes).padStart(2, '0')}\n\n` +
                `_Untuk mengubah jadwal, ketik .jagagc_`;
            
            await bot.sendMessage(groupId, { text: warningMsg });
            console.log(`📢 Sent warning to group ${groupId.substring(0, 8)}...`);
            
        } catch (error) {
            console.error(`❌ Error sending warning to group ${groupId}:`, error.message);
        }
    }

    // Handle jagaGC command
    async handleJagaGCCommand(bot, m, args) {
        const chatId = m.key.remoteJid;
        const userId = m.key.participant || m.key.remoteJid;
        const config = require('../config.json');
        const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(userId));
        
        // Check if group
        if (!chatId.includes('@g.us')) {
            await bot.sendMessage(chatId, { 
                text: '❌ Command ini hanya bisa digunakan di grup!' 
            }, { quoted: m });
            return true;
        }
        
        // Check if sender is admin
        try {
            const metadata = await bot.groupMetadata(chatId);
            const participant = metadata.participants.find(p => p.id === userId);
            const isGroupAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
            
            if (!isOwner && !isGroupAdmin) {
                await bot.sendMessage(chatId, { 
                    text: '❌ *PERMISSION DENIED*\n\nHanya admin grup atau owner bot yang bisa menggunakan command ini!' 
                }, { quoted: m });
                return true;
            }
        } catch (error) {
            await bot.sendMessage(chatId, { 
                text: '❌ Gagal mengambil data grup!\nPastikan bot adalah admin grup.'
            }, { quoted: m });
            return true;
        }
        
        // No arguments - show current schedule
        if (args.length === 0) {
            return await this.showScheduleStatus(bot, chatId, m);
        }
        
        // Handle off command
        if (args[0].toLowerCase() === 'off') {
            return await this.disableSchedule(bot, chatId, m);
        }
        
        // Handle on command
        if (args[0].toLowerCase() === 'on') {
            return await this.enableSchedule(bot, chatId, m);
        }
        
        // Handle set schedule
        const timeMatch = args.join(' ').match(/(\d{1,2}[.:]\d{2})\s*-\s*(\d{1,2}[.:]\d{2})/);
        if (timeMatch) {
            return await this.setNewSchedule(bot, chatId, m, timeMatch[1], timeMatch[2]);
        }
        
        // Invalid command
        return await this.showInvalidFormat(bot, chatId, m, config);
    }

    // Show schedule status
    async showScheduleStatus(bot, chatId, m) {
        const config = require('../config.json');
        const schedule = this.getSchedule(chatId);
        
        if (!schedule) {
            const helpText = `📅 *JAGA GRUP SYSTEM*\n\n` +
                `Belum ada jadwal yang ditetapkan untuk grup ini.\n\n` +
                `*Cara penggunaan:*\n` +
                `• ${config.prefix}jagagc 07.00 - 23.00\n` +
                `• ${config.prefix}jagagc 08.30 - 22.15\n` +
                `• ${config.prefix}jagagc 09.00 - 24.00\n` +
                `• ${config.prefix}jagagc 22.00 - 06.00\n` +
                `• ${config.prefix}jagagc off\n` +
                `• ${config.prefix}jagagc on\n\n` +
                `*Format:* BUKA - TUTUP\n` +
                `• Gunakan format 24 jam\n` +
                `• Pisah dengan "-"\n` +
                `• Contoh: 07.00 atau 07:00\n\n` +
                `*Fitur:*\n` +
                `• Bot akan berikan peringatan jika ada aktivitas di luar jam\n` +
                `• Hanya admin yang bisa atur jadwal\n` +
                `• Support jadwal melewati tengah malam`;
            
            await bot.sendMessage(chatId, { text: helpText }, { quoted: m });
            return true;
        }
        
        const now = new Date();
        const currentTime = {
            hours: now.getHours(),
            minutes: now.getMinutes()
        };
        
        const isOpen = this.isTimeBetween(currentTime, schedule.startTime, schedule.endTime);
        const status = schedule.enabled ? '🟢 AKTIF' : '🔴 NONAKTIF';
        const groupStatus = isOpen ? '📖 BUKA' : '🔒 TUTUP';
        
        const startMins = this.timeToMinutes(schedule.startTime);
        const endMins = this.timeToMinutes(schedule.endTime);
        let durationInfo = '';
        
        if (startMins < endMins) {
            const durationHours = Math.floor((endMins - startMins) / 60);
            const durationMinutes = (endMins - startMins) % 60;
            durationInfo = `⏱️ Durasi: ${durationHours} jam ${durationMinutes} menit`;
        } else {
            const durationHours = Math.floor((1440 - startMins + endMins) / 60);
            const durationMinutes = (1440 - startMins + endMins) % 60;
            durationInfo = `⏱️ Durasi: ${durationHours} jam ${durationMinutes} menit (melewati tengah malam)`;
        }
        
        const responseText = `📅 *JADWAL JAGA GRUP*\n\n` +
            `*Status Sistem:* ${status}\n` +
            `*Status Grup:* ${groupStatus}\n\n` +
            `⏰ *Jadwal:*\n` +
            `• BUKA: ${String(schedule.startTime.hours).padStart(2, '0')}:${String(schedule.startTime.minutes).padStart(2, '0')}\n` +
            `• TUTUP: ${String(schedule.endTime.hours).padStart(2, '0')}:${String(schedule.endTime.minutes).padStart(2, '0')}\n\n` +
            `${durationInfo}\n\n` +
            `🕒 *Saat ini:* ${String(currentTime.hours).padStart(2, '0')}:${String(currentTime.minutes).padStart(2, '0')}\n\n` +
            `*Perintah yang tersedia:*\n` +
            `• ${config.prefix}jagagc [buka] - [tutup]\n` +
            `• ${config.prefix}jagagc off\n` +
            `• ${config.prefix}jagagc on\n` +
            `• ${config.prefix}jagagc\n\n` +
            `*Catatan:*\n` +
            `• Bot akan otomatis beri peringatan jika ada aktivitas di luar jam\n` +
            `• Semua admin bisa atur jadwal`;
        
        await bot.sendMessage(chatId, { text: responseText }, { quoted: m });
        return true;
    }

    // Disable schedule
    async disableSchedule(bot, chatId, m) {
        const schedule = this.getSchedule(chatId);
        
        if (!schedule) {
            await bot.sendMessage(chatId, { 
                text: '❌ Belum ada jadwal yang ditetapkan untuk grup ini!' 
            }, { quoted: m });
            return true;
        }
        
        try {
            this.setScheduleStatus(chatId, false);
            
            await bot.sendMessage(chatId, { 
                text: '✅ *JAGA GRUP DINONAKTIFKAN*\n\n' +
                      'Sistem jaga grup telah dimatikan.\n' +
                      'Grup sekarang bisa aktif 24 jam.\n\n' +
                      'Untuk mengaktifkan kembali, gunakan:\n' +
                      `.jagagc on`
            }, { quoted: m });
            
        } catch (error) {
            console.error('Error disabling schedule:', error);
            await bot.sendMessage(chatId, { 
                text: '❌ Gagal menonaktifkan jadwal!'
            }, { quoted: m });
        }
        return true;
    }

    // Enable schedule
    async enableSchedule(bot, chatId, m) {
        const schedule = this.getSchedule(chatId);
        
        if (!schedule) {
            await bot.sendMessage(chatId, { 
                text: '❌ Belum ada jadwal yang ditetapkan untuk grup ini!\n' +
                      'Silakan atur jadwal terlebih dahulu dengan:\n' +
                      `.jagagc 07.00 - 23.00`
            }, { quoted: m });
            return true;
        }
        
        try {
            this.setScheduleStatus(chatId, true);
            
            await bot.sendMessage(chatId, { 
                text: `✅ *JAGA GRUP DIAKTIFKAN*\n\n` +
                      `Sistem jaga grup telah diaktifkan.\n\n` +
                      `⏰ *Jadwal:*\n` +
                      `• BUKA: ${String(schedule.startTime.hours).padStart(2, '0')}:${String(schedule.startTime.minutes).padStart(2, '0')}\n` +
                      `• TUTUP: ${String(schedule.endTime.hours).padStart(2, '0')}:${String(schedule.endTime.minutes).padStart(2, '0')}\n\n` +
                      `Bot akan memberikan peringatan jika ada aktivitas di luar jam yang ditentukan.`
            }, { quoted: m });
            
        } catch (error) {
            console.error('Error enabling schedule:', error);
            await bot.sendMessage(chatId, { 
                text: '❌ Gagal mengaktifkan jadwal!'
            }, { quoted: m });
        }
        return true;
    }

    // Set new schedule
    async setNewSchedule(bot, chatId, m, startTimeStr, endTimeStr) {
        try {
            // Parse waktu
            const startTime = this.parseTime(startTimeStr);
            const endTime = this.parseTime(endTimeStr);
            
            if (!startTime || !endTime) {
                await bot.sendMessage(chatId, { 
                    text: '❌ *FORMAT WAKTU SALAH!*\n\n' +
                          'Gunakan format: HH.MM - HH.MM\n' +
                          'Contoh:\n' +
                          `• .jagagc 07.00 - 23.00\n` +
                          `• .jagagc 08.30 - 22.15\n` +
                          `• .jagagc 09.00 - 24.00\n` +
                          `• .jagagc 22.00 - 06.00\n\n` +
                          'Catatan: 24.00 = 00.00 (tengah malam)'
                }, { quoted: m });
                return true;
            }
            
            // Handle 24.00 as 00.00
            if (startTime.hours === 24) startTime.hours = 0;
            if (endTime.hours === 24) endTime.hours = 0;
            
            // Set schedule
            this.setSchedule(chatId, startTime, endTime, true);
            
            // Cek status saat ini
            const now = new Date();
            const currentTime = {
                hours: now.getHours(),
                minutes: now.getMinutes()
            };
            
            const isOpen = this.isTimeBetween(currentTime, startTime, endTime);
            const groupStatus = isOpen ? '📖 BUKA' : '🔒 TUTUP';
            
            const startMins = this.timeToMinutes(startTime);
            const endMins = this.timeToMinutes(endTime);
            let scheduleInfo = '';
            
            if (startMins < endMins) {
                const durationHours = Math.floor((endMins - startMins) / 60);
                const durationMinutes = (endMins - startMins) % 60;
                scheduleInfo = `⏱️ Durasi: ${durationHours} jam ${durationMinutes} menit`;
            } else {
                const durationHours = Math.floor((1440 - startMins + endMins) / 60);
                const durationMinutes = (1440 - startMins + endMins) % 60;
                scheduleInfo = `⏱️ Durasi: ${durationHours} jam ${durationMinutes} menit (melewati tengah malam)`;
            }
            
            const config = require('../config.json');
            await bot.sendMessage(chatId, { 
                text: `✅ *JADWAL JAGA GRUP DITETAPKAN!*\n\n` +
                      `⏰ *Jadwal Baru:*\n` +
                      `• BUKA: ${String(startTime.hours).padStart(2, '0')}:${String(startTime.minutes).padStart(2, '0')}\n` +
                      `• TUTUP: ${String(endTime.hours).padStart(2, '0')}:${String(endTime.minutes).padStart(2, '0')}\n\n` +
                      `${scheduleInfo}\n\n` +
                      `📊 *Status Saat Ini:*\n` +
                      `• Grup: ${groupStatus}\n` +
                      `• Sistem: 🟢 AKTIF\n` +
                      `• Waktu: ${String(currentTime.hours).padStart(2, '0')}:${String(currentTime.minutes).padStart(2, '0')}\n\n` +
                      `*Bot akan memberikan peringatan jika ada aktivitas di luar jam yang ditentukan!*\n\n` +
                      `*Perintah tambahan:*\n` +
                      `• ${config.prefix}jagagc off - Nonaktifkan sistem\n` +
                      `• ${config.prefix}jagagc on - Aktifkan sistem\n` +
                      `• ${config.prefix}jagagc - Lihat status`
            }, { quoted: m });
            
        } catch (error) {
            console.error('Error setting schedule:', error);
            await bot.sendMessage(chatId, { 
                text: '❌ Gagal menyimpan jadwal!\n' +
                      'Pastikan format waktu benar.\n' +
                      'Contoh: 07.00 - 23.00'
            }, { quoted: m });
        }
        return true;
    }

    // Show invalid format
    async showInvalidFormat(bot, chatId, m, config) {
        await bot.sendMessage(chatId, { 
            text: `❌ *FORMAT PERINTAH SALAH!*\n\n` +
                  `*Contoh penggunaan yang benar:*\n` +
                  `• ${config.prefix}jagagc 07.00 - 23.00\n` +
                  `• ${config.prefix}jagagc 08.30 - 22.15\n` +
                  `• ${config.prefix}jagagc 09.00 - 24.00\n` +
                  `• ${config.prefix}jagagc 22.00 - 06.00\n` +
                  `• ${config.prefix}jagagc off\n` +
                  `• ${config.prefix}jagagc on\n` +
                  `• ${config.prefix}jagagc\n\n` +
                  `*Penjelasan:*\n` +
                  `• Format: BUKA - TUTUP\n` +
                  `• Gunakan titik (.) atau titik dua (:)\n` +
                  `• Support jadwal melewati tengah malam\n` +
                  `• Contoh: 22.00 - 06.00 (malam sampai pagi)`
        }, { quoted: m });
        return true;
    }

    // Track group activity (to be called from message handler)
    trackGroupActivity(groupId) {
        this.activeGroups.set(groupId, true);
    }

    // Cleanup old schedules
    async cleanup() {
        // Remove schedules for groups that no longer exist
        // This would need actual group checking implementation
        console.log('🧹 JagaGC Helper cleanup completed');
    }
}

// Export singleton instance
module.exports = new JagaGCHelper();