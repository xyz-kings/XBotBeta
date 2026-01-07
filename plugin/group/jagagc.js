const config = require('../../config.json');

module.exports = {
    command: ['jagagc'],
    description: 'Atur jadwal aktif grup - Sistem Jaga Grup',
    category: 'group',
    ownerOnly: false,
    adminOnly: true,
    groupOnly: true,
    
    async execute(bot, m, args) {
        // Import JagaGC Helper
        const jagaGCHelper = require('../lib/helperjagagc');
        
        try {
            // Track group activity
            jagaGCHelper.trackGroupActivity(m.key.remoteJid);
            
            // Delegate to helper
            await jagaGCHelper.handleJagaGCCommand(bot, m, args);
            
        } catch (error) {
            console.error('❌ Error in jagagc plugin:', error);
            
            await bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Terjadi kesalahan saat memproses command!\n' +
                      'Pastikan bot adalah admin grup dan format command benar.'
            }, { quoted: m });
        }
    }
};

// Additional exports for backward compatibility
module.exports.startGroupScheduleChecker = function(bot) {
    const jagaGCHelper = require('../lib/helperjagagc');
    return jagaGCHelper.startGroupScheduleChecker(bot);
};

module.exports.stopGroupScheduleChecker = function() {
    const jagaGCHelper = require('../lib/helperjagagc');
    return jagaGCHelper.stopGroupScheduleChecker();
};